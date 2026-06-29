const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'hrmtesting461@gmail.com',
    pass: 'jlzimjgbdaniaene',
  },
});

const html = '<h1 style="color:#1d4ed8">HRMPro Enterprise</h1><h2>Company Approved!</h2><p>Your company <strong>Ag Games</strong> has been approved. <a href="http://localhost:3001">Login Now</a></p>';

transporter.sendMail({
  from: '"HRMPro Enterprise" <hrmtesting461@gmail.com>',
  to: 'aghaali426@gmail.com',
  subject: 'Your Company Ag Games is Now Active on HRMPro',
  html: html,
}, (err, info) => {
  if (err) console.error('Error:', err);
  else console.log('Email sent:', info.messageId);
});