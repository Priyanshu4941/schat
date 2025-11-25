const nodemailer = require('nodemailer');

// Simple Gmail configuration - last attempt
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAILID,
    pass: process.env.PASSWORD
  },
  pool: true,
  maxConnections: 1,
  rateDelta: 20000,
  rateLimit: 5
});

// Function to send OTP email
const sendOTPEmail = async (email, otp) => {
  try {
    console.log(`📧 Sending OTP to ${email} using Gmail...`);
    
    const mailOptions = {
      from: `"Chat App" <${process.env.EMAILID}>`,
      to: email,
      subject: 'OTP Verification - Chat App',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">OTP Verification</h2>
          <p>Your OTP for verification is:</p>
          <div style="background-color: #f4f4f4; padding: 20px; text-align: center; margin: 20px 0;">
            <h1 style="color: #007bff; font-size: 32px; margin: 0;">${otp}</h1>
          </div>
          <p>This OTP will expire in 2 minutes (120 seconds).</p>
          <p style="color: #666; font-size: 12px;">If you didn't request this OTP, please ignore this email.</p>
        </div>
      `,
      text: `Your OTP for verification is: ${otp}. This OTP will expire in 2 minutes.`
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Gmail error:', error.message);
    return { success: false, error: error.message };
  }
};

module.exports = { sendOTPEmail };
