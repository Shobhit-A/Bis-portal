const SibApiV3Sdk = require('@getbrevo/brevo');

const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
apiInstance.setApiKey(SibApiV3Sdk.TransactionalEmailsApiApiKeys.apiKey, process.env.BREVO_API_KEY);

const FROM = { name: 'Absolute Veritas Portal', email: process.env.ADMIN_EMAIL };

async function sendAdminAlert({ clientUsername, companyName, submittedAt }) {
  const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
  sendSmtpEmail.sender = FROM;
  sendSmtpEmail.to = [{ email: process.env.ADMIN_EMAIL }];
  sendSmtpEmail.subject = `New Form Submission — ${companyName || clientUsername}`;
  sendSmtpEmail.htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #1F5C99; padding: 24px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 20px;">Absolute Veritas Portal</h1>
      </div>
      <div style="padding: 32px; background: #f8f9fa;">
        <h2 style="color: #1A1A2E; margin-top: 0;">New Form Submission Received</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 8px 0; color: #666; width: 140px;">Client Username</td><td style="padding: 8px 0; font-weight: bold;">${clientUsername}</td></tr>
          <tr><td style="padding: 8px 0; color: #666;">Submitted At</td><td style="padding: 8px 0;">${new Date(submittedAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST</td></tr>
        </table>
        <div style="margin-top: 24px;">
          <a href="${process.env.CLIENT_URL}/admin" style="background: #1F5C99; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">View in Admin Dashboard →</a>
        </div>
      </div>
      <div style="padding: 16px; background: #e9ecef; text-align: center; font-size: 12px; color: #666;">
        Absolute Veritas — BIS Certification Consultancy
      </div>
    </div>
  `;
  try {
    await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log('Admin alert email sent');
  } catch (err) {
    console.error('Email send failed:', err.message);
  }
}

async function sendRegistrationAlert({ username, email }) {
  const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
  sendSmtpEmail.sender = FROM;
  sendSmtpEmail.to = [{ email: process.env.ADMIN_EMAIL }];
  sendSmtpEmail.subject = `New Account Pending Approval — ${username}`;
  sendSmtpEmail.htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #1F5C99; padding: 24px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 20px;">Absolute Veritas Portal</h1>
      </div>
      <div style="padding: 32px; background: #f8f9fa;">
        <h2 style="color: #1A1A2E; margin-top: 0;">New Client Registration</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 8px 0; color: #666; width: 140px;">Username</td><td style="padding: 8px 0; font-weight: bold;">${username}</td></tr>
          <tr><td style="padding: 8px 0; color: #666;">Email</td><td style="padding: 8px 0;">${email}</td></tr>
        </table>
        <p style="color: #666; margin-top: 16px;">This account is pending approval before the client can log in.</p>
        <div style="margin-top: 24px;">
          <a href="${process.env.CLIENT_URL}/admin" style="background: #1F5C99; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Review in Admin Dashboard →</a>
        </div>
      </div>
      <div style="padding: 16px; background: #e9ecef; text-align: center; font-size: 12px; color: #666;">
        Absolute Veritas — BIS Certification Consultancy
      </div>
    </div>
  `;
  try {
    await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log('Registration alert email sent');
  } catch (err) {
    console.error('Email send failed:', err.message);
  }
}

async function sendActivationEmail({ username, email }) {
  const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
  sendSmtpEmail.sender = FROM;
  sendSmtpEmail.to = [{ email }];
  sendSmtpEmail.subject = 'Your Absolute Veritas Portal Account is Active';
  sendSmtpEmail.htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #1F5C99; padding: 24px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 20px;">Absolute Veritas Portal</h1>
      </div>
      <div style="padding: 32px; background: #f8f9fa;">
        <h2 style="color: #1A1A2E; margin-top: 0;">Account Activated</h2>
        <p style="color: #333;">Hi ${username}, your account has been approved. You can now log in with the username and password you registered with.</p>
        <div style="margin-top: 24px;">
          <a href="${process.env.CLIENT_URL}/login" style="background: #1F5C99; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Log In →</a>
        </div>
      </div>
      <div style="padding: 16px; background: #e9ecef; text-align: center; font-size: 12px; color: #666;">
        Absolute Veritas — BIS Certification Consultancy
      </div>
    </div>
  `;
  try {
    await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log('Activation email sent');
  } catch (err) {
    console.error('Email send failed:', err.message);
  }
}

module.exports = { sendAdminAlert, sendRegistrationAlert, sendActivationEmail };
