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

async function sendRegistrationAlert({ username, email, approveLinks }) {
  const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
  sendSmtpEmail.sender = FROM;
  sendSmtpEmail.to = [{ email: process.env.ADMIN_EMAIL }];
  sendSmtpEmail.subject = `New Account Pending Approval — ${username}`;
  const formButtons = [
    ['All Forms', approveLinks.all, '#2e7d32'],
    ['FMCS only', approveLinks.fmcs, '#1F5C99'],
    ['ISI only', approveLinks.isi, '#1F5C99'],
    ['CRS only', approveLinks.crs, '#1F5C99'],
    ['WPC only', approveLinks.wpc, '#1F5C99'],
    ['ISI Renewal only', approveLinks.isiRenewal, '#1F5C99'],
  ].map(([label, url, color]) =>
    `<a href="${url}" style="background: ${color}; color: white; padding: 10px 16px; text-decoration: none; border-radius: 4px; display: inline-block; font-weight: bold; font-size: 13px;">✓ Approve — ${label}</a>`
  ).join(' ');
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
        <p style="color: #666; margin-top: 16px;">Choose which form(s) this client should have access to. Clicking a button approves the account immediately with that access — no login needed.</p>
        <div style="margin-top: 16px; display: flex; flex-wrap: wrap; gap: 10px;">
          ${formButtons}
        </div>
        <div style="margin-top: 20px;">
          <a href="${process.env.CLIENT_URL}/admin" style="color: #1F5C99; font-size: 13px;">Or review in Dashboard →</a>
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

async function sendActivationEmail({ username, email, formsLabel }) {
  const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
  sendSmtpEmail.sender = FROM;
  sendSmtpEmail.to = [{ email }];
  sendSmtpEmail.subject = 'Your Absolute Veritas Portal Account is Active';
  const accessNote = formsLabel
    ? `You now have access to: <strong>${formsLabel}</strong>.`
    : `Your account is active. Contact Absolute Veritas to have a form type enabled for you.`;
  sendSmtpEmail.htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #1F5C99; padding: 24px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 20px;">Absolute Veritas Portal</h1>
      </div>
      <div style="padding: 32px; background: #f8f9fa;">
        <h2 style="color: #1A1A2E; margin-top: 0;">Account Activated</h2>
        <p style="color: #333;">Hi ${username}, your account has been approved. You can now log in with the username and password you registered with.</p>
        <p style="color: #333;">${accessNote}</p>
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

async function sendPasswordResetEmail({ username, email, resetUrl }) {
  const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
  sendSmtpEmail.sender = FROM;
  sendSmtpEmail.to = [{ email }];
  sendSmtpEmail.subject = 'Reset Your Absolute Veritas Portal Password';
  sendSmtpEmail.htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #1F5C99; padding: 24px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 20px;">Absolute Veritas Portal</h1>
      </div>
      <div style="padding: 32px; background: #f8f9fa;">
        <h2 style="color: #1A1A2E; margin-top: 0;">Password Reset Requested</h2>
        <p style="color: #333;">Hi ${username}, we received a request to reset your portal password. This link expires in 1 hour.</p>
        <div style="margin-top: 24px;">
          <a href="${resetUrl}" style="background: #1F5C99; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Reset Password →</a>
        </div>
        <p style="color: #999; font-size: 12px; margin-top: 24px;">If you didn't request this, you can safely ignore this email.</p>
      </div>
      <div style="padding: 16px; background: #e9ecef; text-align: center; font-size: 12px; color: #666;">
        Absolute Veritas — BIS Certification Consultancy
      </div>
    </div>
  `;
  try {
    await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log('Password reset email sent');
  } catch (err) {
    console.error('Email send failed:', err.message);
  }
}

module.exports = { sendAdminAlert, sendRegistrationAlert, sendActivationEmail, sendPasswordResetEmail };
