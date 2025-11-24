const sgMail = require('@sendgrid/mail');

// SendGrid configuration
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Function to send OTP email using SendGrid
const sendOTPEmail = async (email, otp) => {
  try {
    console.log(`Attempting to send OTP to ${email} via SendGrid...`);
    
    const msg = {
      to: email,
      from: process.env.EMAILID, // Must be verified in SendGrid
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

    const response = await sgMail.send(msg);
    console.log('✅ Email sent successfully via SendGrid');
    return { success: true, messageId: response[0].headers['x-message-id'] };
  } catch (error) {
    console.error('❌ Error sending email via SendGrid:', error.message);
    if (error.response) {
      console.error('SendGrid error details:', error.response.body);
    }
    return { success: false, error: error.message };
  }
};

module.exports = { sendOTPEmail };
