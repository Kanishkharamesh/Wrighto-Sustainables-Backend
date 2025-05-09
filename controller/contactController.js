const asyncHandler = require('express-async-handler');
const nodemailer = require('nodemailer');
const Contact = require('../models/Contact');

const contactUsCtrl = asyncHandler(async (req, res) => {
    const { name, email, message } = req.body;

    if (!name || !email || !message) {
        res.status(400);
        throw new Error('All fields are required');
    }

    // Save contact form details to the database
    const contactMessage = new Contact({
        name,
        email,
        message,
        userId: req.user ? req.user._id : null // Add the logged-in user's ID, if authenticated
    });

    try {
        await contactMessage.save(); // Save to MongoDB

        const transporter = nodemailer.createTransport({
            host: "smtp.gmail.com",
            port: 587,
            secure: false,
            auth: {
                user: process.env.MAIL_ID,
                pass: process.env.MP
            }
        });
        const mailOptions = {
            from: email,
            to: process.env.CONTACT_EMAIL, // your own business email
            subject: `New Contact Form Message from ${name}`,
            text: message
        };

        await transporter.sendMail(mailOptions);

        res.status(200).json({ success: true, message: 'Message sent successfully!' });
    } catch (error) {
        console.error('Email send error:', error);
        res.status(500);
        throw new Error('Failed to send message. Try again later.');
    }
});

module.exports = { contactUsCtrl };
