const nodemailer = require('nodemailer');

let mailTransporter = null;

async function getMailTransporter() {
  if (mailTransporter) return mailTransporter;

  if (process.env.EMAIL_HOST) {
    mailTransporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: process.env.EMAIL_PORT === '465',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
    await mailTransporter.verify();
  }

  return mailTransporter;
}

module.exports = { getMailTransporter };
