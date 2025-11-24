require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const path = require('path');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const fs = require('fs');

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
const User = require('./models/User');
const OTP = require('./models/OTP');
const Room = require('./models/Room');
const LoginAttempt = require('./models/LoginAttempt');
const Message = require('./models/Message');
// Choose email provider: 'gmail' or 'sendgrid'
const EMAIL_PROVIDER = process.env.EMAIL_PROVIDER || 'gmail';

let sendOTPEmail;
if (EMAIL_PROVIDER === 'sendgrid' && process.env.SENDGRID_API_KEY) {
  console.log('📧 Using SendGrid for emails');
  const emailModule = require('./config/email-sendgrid');
  sendOTPEmail = emailModule.sendOTPEmail;
} else {
  console.log('📧 Using Gmail SMTP for emails');
  const emailModule = require('./config/email');
  sendOTPEmail = emailModule.sendOTPEmail;
}

// Store active users in rooms
const activeUsers = new Map(); // roomId -> Set of userNames

// Generate 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Routes
app.get('/', (req, res) => {
  res.render('register', { error: null, success: null });
});

// Login page
app.get('/login', (req, res) => {
  res.render('login', { error: null, email: '' });
});

// Login route
app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.render('login', { 
        error: 'Please fill in all fields', 
        email: email || '' 
      });
    }

    // Check for lockout
    let loginAttempt = await LoginAttempt.findOne({ email: email.toLowerCase() });
    
    if (loginAttempt && loginAttempt.lockoutUntil) {
      const now = new Date();
      if (now < loginAttempt.lockoutUntil) {
        const remainingSeconds = Math.ceil((loginAttempt.lockoutUntil - now) / 1000);
        return res.render('login', { 
          error: `Too many failed attempts. Please wait ${remainingSeconds} seconds.`, 
          email: email,
          lockout: true,
          remainingSeconds: remainingSeconds
        });
      } else {
        // Lockout expired, reset attempts
        loginAttempt.attempts = 0;
        loginAttempt.lockoutUntil = null;
        await loginAttempt.save();
      }
    }

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      // Increment failed attempts
      if (!loginAttempt) {
        loginAttempt = new LoginAttempt({ email: email.toLowerCase(), attempts: 1 });
      } else {
        loginAttempt.attempts += 1;
        loginAttempt.lastAttempt = new Date();
      }

      // Lock after 5 attempts
      if (loginAttempt.attempts >= 5) {
        loginAttempt.lockoutUntil = new Date(Date.now() + 60 * 1000); // 1 minute lockout
      }
      await loginAttempt.save();

      return res.render('login', { 
        error: 'Invalid email or password', 
        email: email,
        attempts: loginAttempt.attempts,
        lockout: loginAttempt.attempts >= 5
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      // Increment failed attempts
      if (!loginAttempt) {
        loginAttempt = new LoginAttempt({ email: email.toLowerCase(), attempts: 1 });
      } else {
        loginAttempt.attempts += 1;
        loginAttempt.lastAttempt = new Date();
      }

      // Lock after 5 attempts
      if (loginAttempt.attempts >= 5) {
        loginAttempt.lockoutUntil = new Date(Date.now() + 60 * 1000); // 1 minute lockout
      }
      await loginAttempt.save();

      return res.render('login', { 
        error: 'Invalid email or password', 
        email: email,
        attempts: loginAttempt.attempts,
        lockout: loginAttempt.attempts >= 5
      });
    }

    // Successful login - reset attempts
    if (loginAttempt) {
      loginAttempt.attempts = 0;
      loginAttempt.lockoutUntil = null;
      await loginAttempt.save();
    }

    // Redirect to welcome page
    res.redirect(`/welcome?user=${encodeURIComponent(user.name)}&email=${encodeURIComponent(user.email)}`);
  } catch (error) {
    console.error('Error during login:', error);
    res.render('login', { 
      error: 'An error occurred. Please try again.', 
      email: req.body.email || '' 
    });
  }
});

// Welcome page
app.get('/welcome', (req, res) => {
  const { user, email } = req.query;
  if (!user || !email) {
    return res.redirect('/login');
  }
  res.render('welcome', { userName: user, userEmail: email });
});

// Create room page
app.get('/create-room', (req, res) => {
  const { user, email } = req.query;
  if (!user || !email) {
    return res.redirect('/login');
  }
  res.render('create-room', { error: null, userName: user, userEmail: email });
});

// Create room route
app.post('/create-room', async (req, res) => {
  try {
    const { roomId, roomName, password, userName, userEmail } = req.body;

    if (!roomId || !roomName || !password) {
      return res.render('create-room', { 
        error: 'Please fill in all fields', 
        userName: userName,
        userEmail: userEmail,
        roomId: roomId || '',
        roomName: roomName || ''
      });
    }

    // Check if room ID already exists
    const existingRoom = await Room.findOne({ roomId: roomId.toLowerCase().trim() });
    if (existingRoom) {
      return res.render('create-room', { 
        error: 'Room ID already exists. Please choose another one.', 
        userName: userName,
        userEmail: userEmail,
        roomId: roomId,
        roomName: roomName
      });
    }

    // Create room (store password as plain text)
    const room = new Room({
      roomId: roomId.toLowerCase().trim(),
      name: roomName,
      password: password, // Store as plain text
      createdBy: userName
    });
    await room.save();

    // Redirect to chat room
    res.redirect(`/chat?roomId=${encodeURIComponent(roomId.toLowerCase().trim())}&user=${encodeURIComponent(userName)}&email=${encodeURIComponent(userEmail)}`);
  } catch (error) {
    console.error('Error creating room:', error);
    res.render('create-room', { 
      error: 'An error occurred. Please try again.', 
      userName: req.body.userName,
      userEmail: req.body.userEmail,
      roomId: req.body.roomId || '',
      roomName: req.body.roomName || ''
    });
  }
});

// Enter room page
app.get('/enter-room', (req, res) => {
  const { user, email } = req.query;
  if (!user || !email) {
    return res.redirect('/login');
  }
  res.render('enter-room', { error: null, userName: user, userEmail: email });
});

// Enter room route
app.post('/enter-room', async (req, res) => {
  try {
    const { roomId, password, userName, userEmail } = req.body;

    if (!roomId || !password) {
      return res.render('enter-room', { 
        error: 'Please fill in all fields', 
        userName: userName,
        userEmail: userEmail,
        roomId: roomId || ''
      });
    }

    // Find room
    const room = await Room.findOne({ roomId: roomId.toLowerCase().trim() });
    if (!room) {
      return res.render('enter-room', { 
        error: 'Room not found. Please check the Room ID.', 
        userName: userName,
        userEmail: userEmail,
        roomId: roomId
      });
    }

    // Verify password (plain text comparison)
    if (password !== room.password) {
      return res.render('enter-room', { 
        error: 'Incorrect password for this room.', 
        userName: userName,
        userEmail: userEmail,
        roomId: roomId
      });
    }

    // Redirect to chat room
    res.redirect(`/chat?roomId=${encodeURIComponent(roomId.toLowerCase().trim())}&user=${encodeURIComponent(userName)}&email=${encodeURIComponent(userEmail)}`);
  } catch (error) {
    console.error('Error entering room:', error);
    res.render('enter-room', { 
      error: 'An error occurred. Please try again.', 
      userName: req.body.userName,
      userEmail: req.body.userEmail,
      roomId: req.body.roomId || ''
    });
  }
});

// Chat room page
app.get('/chat', async (req, res) => {
  const { roomId, user, email } = req.query;
  if (!roomId || !user || !email) {
    return res.redirect('/login');
  }

  // Get room info
  const room = await Room.findOne({ roomId: roomId.toLowerCase().trim() });
  if (!room) {
    return res.redirect('/welcome?user=' + encodeURIComponent(user) + '&email=' + encodeURIComponent(email));
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
    userEmail: email,
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

// Send OTP
app.post('/send-otp', async (req, res) => {
  try {
    const { name, email } = req.body;

    console.log('📧 OTP request received for:', email);

    if (!name || !email) {
      return res.render('register', { 
        error: 'Please fill in all fields', 
        success: null,
        name: name || '',
        email: email || ''
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.render('register', { 
        error: 'User with this email already exists', 
        success: null,
        name: name,
        email: email
      });
    }

    // Generate OTP
    const otp = generateOTP();
    console.log('🔢 Generated OTP:', otp, 'for', email);

    // Delete any existing OTP for this email
    await OTP.deleteMany({ email: email.toLowerCase() });

    // Save OTP to database
    const otpRecord = new OTP({
      email: email.toLowerCase(),
      otp: otp,
      expiresAt: new Date(Date.now() + 120 * 1000) // 120 seconds (2 minutes)
    });
    await otpRecord.save();
    console.log('💾 OTP saved to database');

    // Send OTP via email
    console.log('📤 Attempting to send email...');
    const emailResult = await sendOTPEmail(email, otp);
    
    if (!emailResult.success) {
      console.error('❌ Email sending failed:', emailResult.error);
      return res.render('register', { 
        error: 'Failed to send OTP. Please check your email address and try again.', 
        success: null,
        name: name,
        email: email
      });
    }

    console.log('✅ OTP email sent successfully to:', email);

    // Store name and email in session (using query params for simplicity)
    res.render('verify-otp', { 
      email: email, 
      name: name,
      error: null 
    });
  } catch (error) {
    console.error('❌ Error in send-otp route:', error);
    res.render('register', { 
      error: 'An error occurred. Please try again.', 
      success: null,
      name: req.body.name || '',
      email: req.body.email || ''
    });
  }
});

// Verify OTP
app.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp, name } = req.body;

    if (!otp) {
      return res.render('verify-otp', { 
        email: email, 
        name: name,
        error: 'Please enter OTP' 
      });
    }

    // Find OTP record
    const otpRecord = await OTP.findOne({ 
      email: email.toLowerCase(),
      otp: otp
    });

    if (!otpRecord) {
      return res.render('verify-otp', { 
        email: email, 
        name: name,
        error: 'Invalid OTP' 
      });
    }

    // Check if OTP is expired
    if (otpRecord.expiresAt < new Date()) {
      await OTP.deleteOne({ _id: otpRecord._id });
      return res.render('verify-otp', { 
        email: email, 
        name: name,
        error: 'OTP has expired. Please request a new one.' 
      });
    }

    // OTP is valid, delete it and proceed to password creation
    await OTP.deleteOne({ _id: otpRecord._id });

    res.render('create-password', { 
      email: email, 
      name: name,
      error: null 
    });
  } catch (error) {
    console.error('Error verifying OTP:', error);
    res.render('verify-otp', { 
      email: req.body.email, 
      name: req.body.name,
      error: 'An error occurred. Please try again.' 
    });
  }
});

// Create password
app.post('/create-password', async (req, res) => {
  try {
    const { email, password, confirmPassword, name } = req.body;

    if (!password || !confirmPassword) {
      return res.render('create-password', { 
        email: email, 
        name: name,
        error: 'Please fill in all fields' 
      });
    }

    if (password.length < 6) {
      return res.render('create-password', { 
        email: email, 
        name: name,
        error: 'Password must be at least 6 characters long' 
      });
    }

    if (password !== confirmPassword) {
      return res.render('create-password', { 
        email: email, 
        name: name,
        error: 'Passwords do not match' 
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.render('create-password', { 
        email: email, 
        name: name,
        error: 'User already exists. Please login instead.' 
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = new User({
      name: name,
      email: email.toLowerCase(),
      password: hashedPassword
    });
    await user.save();

    res.render('success', { 
      name: name,
      email: email 
    });
  } catch (error) {
    console.error('Error creating password:', error);
    res.render('create-password', { 
      email: req.body.email, 
      name: req.body.name,
      error: 'An error occurred. Please try again.' 
    });
  }
});

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
