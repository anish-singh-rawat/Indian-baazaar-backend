import { sendEmail } from "./emailService.js";

const sendEmailFun=async({sendTo, subject, text, html})=>{
    const result = await sendEmail(sendTo, subject, text, html);
    if (result.success) {
      return { message: 'Email sent successfully', messageId: result.messageId };
    } else {
      return { message: 'Failed to send email', error: result.error };
    }
}


export default sendEmailFun;