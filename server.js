require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const path = require('path');
const multer = require('multer');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// MongoDB connection
const MONGODB_URI = process.env.DATABASELINK;
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

// Configure multer to store files in memory (for MongoDB storage)
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  // Allowed file types
  const allowedTypes = /jpeg|jpg|png|gif|mp4|mov|avi|pdf|doc|docx|txt/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images, videos, and documents are allowed.'));
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 16 * 1024 * 1024 // 16MB limit (MongoDB document size limit)
  },
  fileFilter: fileFilter
});

console.log('✅ File storage configured - Files will be stored in MongoDB');

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Set EJS as view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Import models
const Room = require('./models/Room');
const Message = require('./models/Message');

// Store active users in rooms
const activeUsers = new Map(); // roomId -> Set of userNames

// Routes - Main login page
app.get('/', (req, res) => {
  res.render('login', { error: null });
});

// Join/Create room route
app.post('/join-room', async (req, res) => {
  try {
    const { userName, roomId, roomPassword, action } = req.body;

    if (!userName || !roomId || !roomPassword) {
      return res.render('login', { 
        error: 'Please fill in all fields'
      });
    }

    const normalizedRoomId = roomId.toLowerCase().trim();
    
    // Find room
    let room = await Room.findOne({ roomId: normalizedRoomId });
    
    if (action === 'create') {
      // Creating a new room
      if (room) {
        return res.render('login', { 
          error: 'Room ID already exists. Please choose another one or join the existing room.'
        });
      }
      
      // Create new room
      room = new Room({
        roomId: normalizedRoomId,
        name: roomId, // Use roomId as room name
        password: roomPassword,
        createdBy: userName
      });
      await room.save();
      
      // Redirect to chat
      res.redirect(`/chat?roomId=${encodeURIComponent(normalizedRoomId)}&user=${encodeURIComponent(userName)}`);
    } else {
      // Joining existing room
      if (!room) {
        return res.render('login', { 
          error: 'Room not found. Please check the Room ID or create a new room.'
        });
      }
      
      // Verify password
      if (roomPassword !== room.password) {
        return res.render('login', { 
          error: 'Incorrect room password.'
        });
      }
      
      // Redirect to chat
      res.redirect(`/chat?roomId=${encodeURIComponent(normalizedRoomId)}&user=${encodeURIComponent(userName)}`);
    }
  } catch (error) {
    console.error('Error joining/creating room:', error);
    res.render('login', { 
      error: 'An error occurred. Please try again.'
    });
  }
});

// Chat room page
app.get('/chat', async (req, res) => {
  const { roomId, user } = req.query;
  if (!roomId || !user) {
    return res.redirect('/');
  }

  // Get room info
  const room = await Room.findOne({ roomId: roomId.toLowerCase().trim() });
  if (!room) {
    return res.redirect('/');
  }

  // Get recent messages (last 50)
  const messages = await Message.find({ roomId: roomId.toLowerCase().trim() })
    .sort({ createdAt: -1 })
    .limit(50)
    .exec();

  // Get active users in room
  const usersInRoom = activeUsers.get(roomId.toLowerCase().trim()) || new Set();
  
  res.render('chat', { 
    roomId: roomId, 
    roomName: room.name,
    userName: user,
    messages: messages.reverse(),
    activeUsers: Array.from(usersInRoom)
  });
});

// File upload route - Store file in MongoDB as base64
app.post('/upload-file', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    const { roomId, userName } = req.body;
    const normalizedRoomId = roomId.toLowerCase().trim();

    // Determine file type
    let fileType = 'document';
    if (req.file.mimetype.startsWith('image/')) {
      fileType = 'image';
    } else if (req.file.mimetype.startsWith('video/')) {
      fileType = 'video';
    }

    // Convert file buffer to base64 string
    const fileBase64 = req.file.buffer.toString('base64');
    const fileName = req.file.originalname;
    const fileSize = req.file.size;
    const fileMimeType = req.file.mimetype;

    // Save message with file data to database
    const newMessage = new Message({
      roomId: normalizedRoomId,
      userName: userName,
      message: '',
      fileData: fileBase64,
      fileName: fileName,
      fileType: fileType,
      fileMimeType: fileMimeType,
      fileSize: fileSize,
      createdAt: new Date()
    });
    await newMessage.save();

    // Broadcast to all in the room (send file data)
    io.to(normalizedRoomId).emit('receive-message', {
      userName: userName,
      message: '',
      fileData: fileBase64,
      fileName: fileName,
      fileType: fileType,
      fileMimeType: fileMimeType,
      fileSize: fileSize,
      timestamp: newMessage.createdAt
    });

    res.json({ 
      success: true,
      fileData: fileBase64,
      fileName: fileName,
      fileType: fileType,
      fileMimeType: fileMimeType
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ success: false, error: 'Failed to upload file' });
  }
});

// No additional routes needed - simplified flow

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Join room
  socket.on('join-room', async ({ roomId, userName }) => {
    const normalizedRoomId = roomId.toLowerCase().trim();
    socket.join(normalizedRoomId);
    socket.roomId = normalizedRoomId;
    socket.userName = userName;

    // Add user to active users
    if (!activeUsers.has(normalizedRoomId)) {
      activeUsers.set(normalizedRoomId, new Set());
    }
    activeUsers.get(normalizedRoomId).add(userName);

    // Notify others in the room
    socket.to(normalizedRoomId).emit('user-joined', {
      userName: userName,
      message: `${userName} joined the room`,
      timestamp: new Date()
    });

    // Send current active users to the new user
    const users = Array.from(activeUsers.get(normalizedRoomId));
    socket.emit('active-users', users);

    // Broadcast updated user list to all in room
    io.to(normalizedRoomId).emit('active-users', users);

    console.log(`${userName} joined room: ${normalizedRoomId}`);
  });

  // Handle new message
  socket.on('send-message', async ({ roomId, userName, message }) => {
    try {
      const normalizedRoomId = roomId.toLowerCase().trim();

      // Save message to database (plain text)
      const newMessage = new Message({
        roomId: normalizedRoomId,
        userName: userName,
        message: message,
        fileType: 'text',
        createdAt: new Date()
      });
      await newMessage.save();

      // Broadcast to all in the room (real-time)
      io.to(normalizedRoomId).emit('receive-message', {
        userName: userName,
        message: message,
        fileType: 'text',
        timestamp: newMessage.createdAt
      });

      console.log(`Message in ${normalizedRoomId} from ${userName}: ${message}`);
    } catch (error) {
      socket.emit('error', { message: 'Failed to send message' });
      console.error('Error saving message:', error);
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    if (socket.roomId && socket.userName) {
      const normalizedRoomId = socket.roomId;

      // Remove user from active users
      if (activeUsers.has(normalizedRoomId)) {
        activeUsers.get(normalizedRoomId).delete(socket.userName);
        
        // If room is empty, remove it
        if (activeUsers.get(normalizedRoomId).size === 0) {
          activeUsers.delete(normalizedRoomId);
        } else {
          // Broadcast updated user list
          const users = Array.from(activeUsers.get(normalizedRoomId));
          io.to(normalizedRoomId).emit('active-users', users);
        }
      }

      // Notify others in the room
      socket.to(normalizedRoomId).emit('user-left', {
        userName: socket.userName,
        message: `${socket.userName} left the room`,
        timestamp: new Date()
      });

      console.log(`${socket.userName} left room: ${normalizedRoomId}`);
    }
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
