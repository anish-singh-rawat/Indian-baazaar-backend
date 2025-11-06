import http from "http";
import nodemailer from "nodemailer";
import dotenv from 'dotenv';
dotenv.config();

export const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.INDIAN_BAAZAAR_TRANSPORTER_USER_MAIL,
    pass: process.env.INDIAN_BAAZAAR_TRANSPORTER_USER_PASSWORD,
  },
});

async function sendEmail(to, subject, text, html) {
  try {
    const info = await transporter.sendMail({
      from: process.env.INDIAN_BAAZAAR_TRANSPORTER_USER_MAIL,
      to,
      subject,
      text,
      html,
    });
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Error sending email:", error);
    return { success: false, error: error.message };
  }
}

export { sendEmail };
