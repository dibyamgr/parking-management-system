const nodemailer = require("nodemailer");

const sendEmail = async (options) => {
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: `UniPark <${process.env.EMAIL_USER}>`, // Sender address
    to: options.email, // List of recipients
    subject: options.subject, // Subject line
    html: options.html, // HTML body
  };

  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
