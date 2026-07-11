const nodemailer = require('nodemailer');

let mailTransporter = null;
let lastVerifyFailed = false;

async function getMailTransporter() {
  if (mailTransporter && !lastVerifyFailed) return mailTransporter;

  if (process.env.EMAIL_HOST) {
    try {
      const transport = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: parseInt(process.env.EMAIL_PORT || '587'),
        secure: process.env.EMAIL_PORT === '465',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });
      await transport.verify();
      mailTransporter = transport;
      lastVerifyFailed = false;
      console.log('[Mail] SMTP transporter verified successfully');
    } catch (err) {
      console.error('[Mail] SMTP verify failed:', err.message);
      lastVerifyFailed = true;
      mailTransporter = null;
    }
  }

  return mailTransporter;
}

module.exports = { getMailTransporter };
