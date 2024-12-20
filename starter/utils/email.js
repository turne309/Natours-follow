const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  // 1) create a transporter
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST, // Investigate this for greenPallet
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
    // Activate in gmail "less secure app" option 'sendgrid' and 'mailgun'
  });

  // 2) define the email options
  const mailOptions = {
    from: 'Jaydon Turner <hello@jaydon.io',
    to: options.email,
    subject: options.subject,
    text: options.message,
    // html:
  };
  // 3) send the email
  await transporter.sendMail(mailOptions); // returns a promise
};

module.exports = sendEmail;
