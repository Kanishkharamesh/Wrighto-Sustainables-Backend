const nodemailer = require("nodemailer");
const asyncHandler = require("express-async-handler");

const sendEmail = asyncHandler(async (data, req, res) => {
    // Create reusable transporter object
    const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
            user: process.env.MAIL_ID,
            pass: process.env.MP,
        },
    });

    // Mail options
    const mailOptions = {
        from: '"Hey 👻" <abc@gmail.com>', // sender address
        to: data.to, // receiver email from `data`
        subject: data.subject, // email subject
        text: data.text, // plain text
        html: data.html, // html content
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);

    console.log("Message sent: %s", info.messageId);
    res.status(200).json({ message: "Email sent", messageId: info.messageId });
});

module.exports = sendEmail;
