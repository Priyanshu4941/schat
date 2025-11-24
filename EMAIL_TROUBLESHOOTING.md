# Email/OTP Troubleshooting Guide

## 🚨 Problem: "Failed to send OTP" on Deployed App

If OTP works locally but fails on deployment (Render, Heroku, etc.), follow these steps:

## ✅ Solution Steps

### Step 1: Verify Gmail App Password

Your Gmail password in `.env` should be an **App Password**, not your regular Gmail password.

**How to create Gmail App Password:**

1. Go to https://myaccount.google.com/security
2. Enable **2-Step Verification** (if not already enabled)
3. Go to https://myaccount.google.com/apppasswords
4. Select "Mail" and "Other (Custom name)"
5. Enter "Chat App" as the name
6. Click **Generate**
7. Copy the 16-character password (e.g., `abcd efgh ijkl mnop`)
8. Use this password (without spaces) in your environment variables

**Format:**
```
PASSWORD=abcdefghijklmnop
```

### Step 2: Check Environment Variables on Render

1. Go to your Render dashboard
2. Click on your web service
3. Go to **Environment** tab
4. Verify these variables exist:

```
EMAILID = priyanshumishra412006@gmail.com
PASSWORD = your_16_character_app_password
DATABASELINK = mongodb+srv://admin:admin@cluster0.s5gpr.mongodb.net/chatapp
```

**Important:**
- No quotes around values
- No extra spaces
- Use the App Password, not regular password

### Step 3: Update Environment Variables

If you need to update:

1. In Render dashboard → Environment tab
2. Click **Edit** on PASSWORD variable
3. Paste your new App Password
4. Click **Save Changes**
5. Render will automatically redeploy

### Step 4: Check Render Logs

1. Go to Render dashboard
2. Click on your service
3. Go to **Logs** tab
4. Look for these messages:

**Good signs:**
```
✅ Email server is ready to send messages
Attempting to send OTP to user@email.com...
✅ Email sent successfully: <message-id>
```

**Bad signs:**
```
❌ Email transporter verification failed
❌ Error sending email: Invalid login
❌ Error sending email: Connection timeout
```

### Step 5: Common Error Messages

#### Error: "Invalid login"
**Cause**: Wrong email or password
**Solution**: 
- Verify EMAILID is correct
- Regenerate Gmail App Password
- Update PASSWORD in Render environment variables

#### Error: "Connection timeout"
**Cause**: SMTP port blocked or network issue
**Solution**: 
- Already fixed in updated `config/email.js`
- Redeploy your app
- Check Render's network status

#### Error: "Authentication failed"
**Cause**: Not using App Password
**Solution**:
- Create Gmail App Password (see Step 1)
- Update PASSWORD variable

#### Error: "Too many login attempts"
**Cause**: Gmail security block
**Solution**:
- Wait 15 minutes
- Go to https://accounts.google.com/DisplayUnlockCaptcha
- Click "Continue"
- Try again

### Step 6: Test Email Configuration

Add this test endpoint to your `server.js` (temporary):

```javascript
// Test email endpoint (remove after testing)
app.get('/test-email', async (req, res) => {
  const testEmail = req.query.email || 'test@example.com';
  const testOTP = '123456';
  
  console.log('Testing email with:', {
    EMAILID: process.env.EMAILID,
    PASSWORD: process.env.PASSWORD ? 'Set (hidden)' : 'NOT SET'
  });
  
  const result = await sendOTPEmail(testEmail, testOTP);
  res.json(result);
});
```

Then visit: `https://your-app.onrender.com/test-email?email=your-email@gmail.com`

### Step 7: Alternative - Use Different Email Service

If Gmail continues to fail, consider using:

**Option A: SendGrid (Free tier: 100 emails/day)**
```bash
npm install @sendgrid/mail
```

**Option B: Mailgun (Free tier: 5,000 emails/month)**
```bash
npm install mailgun-js
```

**Option C: Resend (Free tier: 3,000 emails/month)**
```bash
npm install resend
```

Let me know if you want to switch to any of these!

## 🔍 Debugging Checklist

- [ ] Using Gmail App Password (not regular password)
- [ ] 2-Step Verification enabled on Gmail
- [ ] Environment variables set correctly on Render
- [ ] No extra spaces in environment variables
- [ ] Checked Render logs for error messages
- [ ] Tried regenerating App Password
- [ ] Waited 15 minutes if "too many attempts" error
- [ ] Tested with `/test-email` endpoint

## 📞 Quick Fix Commands

### Regenerate App Password
1. https://myaccount.google.com/apppasswords
2. Delete old "Chat App" password
3. Create new one
4. Update on Render

### Update on Render
1. Dashboard → Your Service → Environment
2. Edit PASSWORD variable
3. Paste new App Password (no spaces)
4. Save Changes (auto-redeploys)

### Check Logs
1. Dashboard → Your Service → Logs
2. Look for email-related messages
3. Check for errors

## ✅ Expected Behavior

**When working correctly:**
1. User enters email and clicks "Get OTP"
2. Server logs: "Attempting to send OTP to user@email.com..."
3. Server logs: "✅ Email sent successfully"
4. User receives email within 10-30 seconds
5. OTP page loads

**Current issue:**
1. User clicks "Get OTP"
2. Loading for 2-3 minutes
3. Error: "Failed to send OTP"

**This means:**
- Email sending is timing out
- Likely wrong password or Gmail blocking

## 🚀 After Fixing

1. Update environment variables on Render
2. Wait for auto-redeploy (or manually redeploy)
3. Test registration again
4. Should receive OTP within 10-30 seconds

## 💡 Pro Tip

Keep your App Password secure:
- Don't commit to Git
- Don't share publicly
- Regenerate if compromised
- Use different passwords for different apps

---

**Need more help?** Check the Render logs and share the error message!
