const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  roomId: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    index: true
  },
  userName: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: false,
    trim: true
  },
  // Store file as base64 string in MongoDB
  fileData: {
    type: String,
    required: false
  },
  fileName: {
    type: String,
    required: false
  },
  fileType: {
    type: String,
    required: false,
    enum: ['image', 'video', 'document', 'text']
  },
  fileMimeType: {
    type: String,
    required: false
  },
  fileSize: {
    type: Number,
    required: false
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
});

module.exports = mongoose.model('Message', messageSchema);

