# Cloudinary Setup - Visual Guide

## 🎯 Goal
Get your 3 Cloudinary credentials to make file uploads work in production.

## 📋 What You Need
- Email address
- 5 minutes of time
- That's it!

## 🚀 Step-by-Step Instructions

### Step 1: Go to Cloudinary Website

Open your browser and go to:
```
https://cloudinary.com/users/register_free
```

### Step 2: Sign Up (Free Account)

Fill in the form:
- **Email**: Your email address
- **Password**: Create a strong password
- **Cloud Name**: This will be auto-generated (you can change it)
- Check "I agree to terms"
- Click **"Sign Up"**

**Note**: The free tier includes:
- 25 GB storage
- 25 GB bandwidth/month
- More than enough for most chat apps!

### Step 3: Verify Email

1. Check your email inbox
2. Look for email from Cloudinary
3. Click the verification link
4. You'll be redirected to Cloudinary dashboard

### Step 4: Find Your Credentials

After login, you'll see the **Dashboard** page.

Look for a section that shows:

```
┌─────────────────────────────────────────┐
│  Account Details                        │
├─────────────────────────────────────────┤
│  Cloud name:    dxyz123abc              │
│  API Key:       123456789012345         │
│  API Secret:    ●●●●●●●●●●●●●●●●●●●●●  │
│                 [Show]                   │
└─────────────────────────────────────────┘
```

**Click "Show"** next to API Secret to reveal it.

### Step 5: Copy Your Credentials

You need these 3 values:

1. **Cloud Name**: Example: `dxyz123abc`
2. **API Key**: Example: `123456789012345`
3. **API Secret**: Example: `abcdefghijklmnopqrstuvwxyz123`

**Important**: Keep API Secret private! Don't share it publicly.

### Step 6: Update Your .env File

Open your project's `.env` file and find these lines:

```env
CLOUDINARY_CLOUD_NAME=your_cloud_name_here
CLOUDINARY_API_KEY=your_api_key_here
CLOUDINARY_API_SECRET=your_api_secret_here
```

Replace with your actual values:

```env
CLOUDINARY_CLOUD_NAME=dxyz123abc
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=abcdefghijklmnopqrstuvwxyz123
```

**Save the file!**

### Step 7: Restart Your Server

In your terminal:

```bash
# Stop the server (press Ctrl+C)

# Start it again
npm start
```

You should see:
```
✅ Cloudinary configured - Files will be stored in cloud
Server running on http://localhost:3000
Connected to MongoDB
```

### Step 8: Test Upload

1. Open http://localhost:3000 in your browser
2. Login to your account
3. Create or join a chat room
4. Click the paperclip icon (📎)
5. Select an image or PDF
6. Upload it!

### Step 9: Verify in Cloudinary

1. Go back to Cloudinary dashboard
2. Click **"Media Library"** in the left menu
3. You should see folders:
   - `chat-app/images/` - Your uploaded images
   - `chat-app/videos/` - Your uploaded videos
   - `chat-app/documents/` - Your uploaded PDFs/docs

**If you see your files there, it's working!** 🎉

## 🔍 Troubleshooting

### "Failed to upload file" Error

**Check 1**: Are credentials correct?
```bash
# Open .env file
# Make sure there are no typos
# Make sure there are no extra spaces
```

**Check 2**: Did you restart the server?
```bash
# Stop server (Ctrl+C)
# Start again
npm start
```

**Check 3**: Check server logs
Look for:
```
✅ Cloudinary configured - Files will be stored in cloud
```

If you see:
```
⚠️  WARNING: Using local storage
```
Then Cloudinary is NOT configured correctly.

### Can't Find Credentials

1. Go to https://cloudinary.com/
2. Click **"Login"** (top right)
3. After login, click **"Dashboard"**
4. You'll see your credentials there

### Invalid Credentials Error

- Make sure you copied the entire API Secret (it's long!)
- Check for extra spaces before or after values
- Make sure you're using the correct Cloud Name (not email)

### Files Not Appearing in Cloudinary

1. Check if upload was successful (no error message)
2. Go to Cloudinary → Media Library
3. Look in folders: `chat-app/images/`, `chat-app/videos/`, `chat-app/documents/`
4. Try refreshing the page

## 📱 For Deployment

When deploying to Heroku/Render/Railway:

1. Go to your hosting platform dashboard
2. Find **"Environment Variables"** or **"Config Vars"**
3. Add these 3 variables:
   ```
   CLOUDINARY_CLOUD_NAME = dxyz123abc
   CLOUDINARY_API_KEY = 123456789012345
   CLOUDINARY_API_SECRET = abcdefghijklmnopqrstuvwxyz123
   ```
4. Deploy your app
5. Test file upload on deployed app

## ✅ Success Checklist

- [ ] Created Cloudinary account
- [ ] Verified email
- [ ] Found 3 credentials (Cloud Name, API Key, API Secret)
- [ ] Updated `.env` file with real values
- [ ] Restarted server
- [ ] Saw "✅ Cloudinary configured" message
- [ ] Uploaded a test file
- [ ] File appears in Cloudinary Media Library
- [ ] File appears in chat for all users

## 🎉 You're Done!

Your app now:
- ✅ Stores files in the cloud
- ✅ Works on any hosting platform
- ✅ Files persist forever
- ✅ All users can see uploaded files
- ✅ Ready for production!

## 📚 Additional Resources

- Cloudinary Dashboard: https://cloudinary.com/console
- Cloudinary Docs: https://cloudinary.com/documentation
- Support: https://support.cloudinary.com/

## 💡 Pro Tips

1. **Organize files**: Files are automatically organized in folders by type
2. **Monitor usage**: Check dashboard to see storage and bandwidth usage
3. **Free tier limits**: 25GB storage, 25GB bandwidth/month
4. **Upgrade if needed**: Paid plans start at $89/month (only if you exceed limits)

Need more help? Check `QUICK_START.md` or `DEPLOYMENT_GUIDE.md`!
