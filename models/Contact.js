// models/Contact.js
const mongoose = require('mongoose');

// Define the Contact schema
const contactSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    message: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    
    // Reference to the User model
    userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', // Assuming you have a 'User' model
        required: true 
    },
});

module.exports = mongoose.model('Contact', contactSchema);
