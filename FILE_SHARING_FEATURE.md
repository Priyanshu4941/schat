# File Sharing Feature

## Overview
Users can now send images, videos, and documents (PDF, DOC, DOCX, TXT) in chat rooms, just like WhatsApp!

## Features Added

### 1. **File Upload Support**
- Images: JPEG, JPG, PNG, GIF
- Videos: MP4, MOV, AVI
- Documents: PDF, DOC, DOCX, TXT
- Maximum file size: 50MB

### 2. **User Interface**
- **Attach Button**: Click the paperclip icon to select files
- **Upload Indicator**: Shows "Uploading file..." while processing
- **File Preview**: 
  - Images display inline with preview
  - Videos show with playback controls
  - Documents show with file icon and size
- **Download Button**: All files can be downloaded

### 3. **Real-time Broadcasting**
- Files are instantly shared with all users in the room
- Socket.IO broadcasts file messages to all connected users
- Files persist in the database for chat history

### 4. **Database Changes**
Updated Message model to include:
- `fileUrl`: Path to uploaded file
- `fileName`: Original filename
- `fileType`: 'image', 'video', 'document', or 'text'
- `fileSize`: File size in bytes

### 5. **File Storage (Cloud-Based)**
- Files are stored in **Cloudinary** (cloud storage)
- Works on any hosting platform (Heroku, Render, Vercel, etc.)
- Files persist permanently and are accessible globally
- Automatic CDN delivery for fast loading worldwide
- Organized in folders: `chat-app/images/`, `chat-app/videos/`, `chat-app/documents/`

## Technical Implementation

### Backend (server.js)
- **Multer**: Handles multipart/form-data file uploads
- **Cloudinary**: Cloud storage for files (replaces local storage)
- **multer-storage-cloudinary**: Integrates Multer with Cloudinary
- **File validation**: Checks file type and size
- **Storage**: Saves files to Cloudinary with unique names
- **API endpoint**: POST `/upload-file`

### Frontend (chat.ejs)
- **File input**: Hidden input triggered by attach button
- **Fetch API**: Uploads files asynchronously
- **Display logic**: Different rendering for images, videos, and documents
- **Helper functions**: Format file size, get file icons

### Database (models/Message.js)
- Added optional fields for file attachments
- Maintains backward compatibility with text-only messages

## Usage

1. **Send a file**:
   - Click the paperclip icon (📎)
   - Select an image, video, or document
   - File uploads automatically and appears in chat

2. **View files**:
   - Images: Display inline with full preview
   - Videos: Play directly in chat
   - Documents: Show file info with download button

3. **Download files**:
   - Click the "Download" button on any file attachment

## File Size Limits
- Maximum: 50MB per file
- Recommended: Keep files under 10MB for faster uploads

## Security Notes
- File type validation on both client and server
- Only allowed file extensions are accepted
- Files are stored with unique names to prevent overwrites
- Cloudinary provides secure HTTPS URLs
- Files are stored in the cloud, not on your server
- Consider adding virus scanning for production use

## Setup Required
**IMPORTANT**: You must configure Cloudinary before file uploads work!

1. Create free account at https://cloudinary.com/
2. Get your credentials (Cloud Name, API Key, API Secret)
3. Add them to your `.env` file
4. See `CLOUDINARY_SETUP.md` for detailed instructions

## Future Enhancements
- Image compression before upload
- Progress bar for large files
- File preview before sending
- Delete uploaded files
- Audio file support
- Multiple file selection
