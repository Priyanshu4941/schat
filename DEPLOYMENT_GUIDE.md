# Deployment Guide

## ✅ Your App is Now Deployment-Ready!

The file upload feature now uses **Cloudinary** (cloud storage), so your app will work perfectly on any hosting platform.

## Why This Matters

### ❌ Before (Local Storage)
```
User uploads file → Saved locally → Lost on deployment/restart
Other users can't see files from different server instances
```

### ✅ After (Cloud Storage)
```
User uploads file → Saved to Cloudinary → URL in MongoDB → Everyone can access
Files persist forever, work on any platform
```

## Pre-Deployment Checklist

### 1. Setup Cloudinary (Required!)
- [ ] Create account at https://cloudinary.com/
- [ ] Get credentials (Cloud Name, API Key, API Secret)
- [ ] Add to `.env` file locally
- [ ] Test file upload works locally

### 2. Prepare Environment Variables
You'll need these on your hosting platform:
```
DATABASELINK=your_mongodb_connection_string
EMAILID=your_gmail_address
PASSWORD=your_gmail_app_password
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
PORT=3000
```

## Deployment Options

### Option 1: Heroku

1. **Install Heroku CLI**
   ```bash
   # Download from https://devcenter.heroku.com/articles/heroku-cli
   ```

2. **Login to Heroku**
   ```bash
   heroku login
   ```

3. **Create Heroku App**
   ```bash
   heroku create your-chat-app-name
   ```

4. **Set Environment Variables**
   ```bash
   heroku config:set DATABASELINK="your_mongodb_uri"
   heroku config:set EMAILID="your_email"
   heroku config:set PASSWORD="your_gmail_app_password"
   heroku config:set CLOUDINARY_CLOUD_NAME="your_cloud_name"
   heroku config:set CLOUDINARY_API_KEY="your_api_key"
   heroku config:set CLOUDINARY_API_SECRET="your_api_secret"
   ```

5. **Deploy**
   ```bash
   git add .
   git commit -m "Deploy chat app with file sharing"
   git push heroku main
   ```

6. **Open App**
   ```bash
   heroku open
   ```

### Option 2: Render

1. **Go to https://render.com/**
2. **Create New Web Service**
3. **Connect GitHub Repository**
4. **Configure:**
   - Build Command: `npm install`
   - Start Command: `npm start`
5. **Add Environment Variables** in Render dashboard:
   - `DATABASELINK`
   - `EMAILID`
   - `PASSWORD`
   - `CLOUDINARY_CLOUD_NAME`
   - `CLOUDINARY_API_KEY`
   - `CLOUDINARY_API_SECRET`
6. **Deploy!**

### Option 3: Railway

1. **Go to https://railway.app/**
2. **New Project → Deploy from GitHub**
3. **Select your repository**
4. **Add Environment Variables** in Railway dashboard
5. **Deploy automatically!**

### Option 4: Vercel (Serverless)

**Note**: Vercel works but requires serverless functions. Socket.IO may need adjustments.

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Deploy**
   ```bash
   vercel
   ```

3. **Add Environment Variables** in Vercel dashboard

## Post-Deployment Testing

### Test Checklist
- [ ] Registration with OTP works
- [ ] Login works
- [ ] Create room works
- [ ] Join room works
- [ ] Send text messages works
- [ ] **Upload image** - Check if it appears for all users
- [ ] **Upload video** - Check if it plays
- [ ] **Upload PDF** - Check if it downloads
- [ ] Check Cloudinary dashboard - files should appear there
- [ ] Restart server - files should still be accessible

## Troubleshooting

### Files not uploading after deployment
1. Check environment variables are set correctly
2. Verify Cloudinary credentials in hosting dashboard
3. Check server logs for errors
4. Test Cloudinary connection:
   ```javascript
   console.log('Cloudinary Config:', {
     cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
     api_key: process.env.CLOUDINARY_API_KEY ? 'Set' : 'Not Set',
     api_secret: process.env.CLOUDINARY_API_SECRET ? 'Set' : 'Not Set'
   });
   ```

### Socket.IO not working
- Make sure your hosting platform supports WebSockets
- Heroku, Render, Railway all support WebSockets
- Vercel may need special configuration

### MongoDB connection issues
- Check if your MongoDB allows connections from all IPs (0.0.0.0/0)
- Verify connection string is correct
- Check MongoDB Atlas network access settings

## File Storage Costs

### Cloudinary Free Tier
- **Storage**: 25 GB
- **Bandwidth**: 25 GB/month
- **Transformations**: 25,000/month
- **More than enough for most chat apps!**

### When to Upgrade
- If you exceed 25GB storage
- If you have 1000+ active users uploading daily
- Cloudinary paid plans start at $89/month

## Security Best Practices

1. **Never commit `.env` file** (already in `.gitignore`)
2. **Use strong MongoDB password**
3. **Enable MongoDB IP whitelist** (or use 0.0.0.0/0 for all IPs)
4. **Keep Cloudinary credentials secret**
5. **Consider adding rate limiting** for file uploads
6. **Add virus scanning** for production (optional)

## Monitoring

### Check File Uploads
- Cloudinary Dashboard → Media Library
- See all uploaded files organized by folder

### Check Database
- MongoDB Atlas → Collections → messages
- Verify `fileUrl` contains Cloudinary URLs

### Check Logs
```bash
# Heroku
heroku logs --tail

# Render
Check logs in Render dashboard

# Railway
Check logs in Railway dashboard
```

## Scaling

Your app is now ready to scale:
- ✅ Files in cloud (Cloudinary)
- ✅ Database in cloud (MongoDB Atlas)
- ✅ Server can be replicated
- ✅ Multiple instances can run simultaneously
- ✅ Users worldwide can access files quickly (CDN)

## Need Help?

- Cloudinary Issues: https://support.cloudinary.com/
- Heroku Issues: https://help.heroku.com/
- MongoDB Issues: https://www.mongodb.com/docs/atlas/
- Socket.IO Issues: https://socket.io/docs/

## Summary

Your chat app now:
1. ✅ Stores files in Cloudinary (cloud storage)
2. ✅ Works on any hosting platform
3. ✅ Files persist permanently
4. ✅ All users can see uploaded files
5. ✅ Fast global delivery via CDN
6. ✅ Ready for production deployment!

Just setup Cloudinary credentials and deploy! 🚀
