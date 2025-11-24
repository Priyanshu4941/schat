# Cloudinary Setup Guide

## Why Cloudinary?
Your files are now stored in the cloud (Cloudinary), not on your server. This means:
- ✅ Files persist even after server restarts
- ✅ Works on any hosting platform (Heroku, Render, Vercel, etc.)
- ✅ All users can see uploaded files regardless of which server instance they're on
- ✅ Free tier: 25GB storage + 25GB bandwidth/month
- ✅ Automatic image optimization and transformations

## Setup Steps

### 1. Create Cloudinary Account
1. Go to https://cloudinary.com/
2. Click "Sign Up for Free"
3. Create your account (free tier is sufficient)

### 2. Get Your Credentials
1. After login, go to Dashboard
2. You'll see:
   - **Cloud Name**: (e.g., "dxyz123abc")
   - **API Key**: (e.g., "123456789012345")
   - **API Secret**: (e.g., "abcdefghijklmnopqrstuvwxyz")

### 3. Update .env File
Replace the placeholder values in your `.env` file:

```env
CLOUDINARY_CLOUD_NAME=your_actual_cloud_name
CLOUDINARY_API_KEY=your_actual_api_key
CLOUDINARY_API_SECRET=your_actual_api_secret
```

**Example:**
```env
CLOUDINARY_CLOUD_NAME=dxyz123abc
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=abcdefghijklmnopqrstuvwxyz123
```

### 4. Test Locally
```bash
npm start
```

Upload a file in your chat room. It should now upload to Cloudinary!

### 5. Verify Upload
1. Go to Cloudinary Dashboard
2. Click "Media Library"
3. You should see your uploaded files in folders:
   - `chat-app/images/` - Images
   - `chat-app/videos/` - Videos
   - `chat-app/documents/` - PDFs, docs, etc.

## How It Works Now

### Before (Local Storage) ❌
```
User uploads file → Saved to public/uploads/ folder → Lost on deployment
```

### After (Cloud Storage) ✅
```
User uploads file → Uploaded to Cloudinary → URL saved in MongoDB → Everyone can access
```

## File Organization
Files are automatically organized in Cloudinary:
- **Images**: `chat-app/images/`
- **Videos**: `chat-app/videos/`
- **Documents**: `chat-app/documents/`

## Benefits

1. **Persistent Storage**: Files never disappear
2. **Global CDN**: Fast file delivery worldwide
3. **Automatic Optimization**: Images are compressed automatically
4. **Scalable**: Handles millions of files
5. **Secure**: HTTPS URLs by default
6. **No Server Storage**: Your server stays lightweight

## Free Tier Limits
- Storage: 25 GB
- Bandwidth: 25 GB/month
- Transformations: 25,000/month
- More than enough for most chat apps!

## Deployment
When deploying to Heroku, Render, or any platform:

1. Add environment variables in your hosting dashboard:
   ```
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   ```

2. Deploy your code - files will automatically upload to Cloudinary!

## Troubleshooting

### Error: "Invalid credentials"
- Check your `.env` file has correct values
- Make sure there are no extra spaces
- Restart your server after updating `.env`

### Files not uploading
- Check Cloudinary dashboard for error logs
- Verify your API key is active
- Check file size (max 50MB)

### Can't see uploaded files
- Check Media Library in Cloudinary dashboard
- Verify the URL in MongoDB is a Cloudinary URL (starts with `https://res.cloudinary.com/`)

## Alternative: AWS S3
If you prefer AWS S3 instead of Cloudinary, let me know and I can help you set that up!

## Support
- Cloudinary Docs: https://cloudinary.com/documentation
- Support: https://support.cloudinary.com/
