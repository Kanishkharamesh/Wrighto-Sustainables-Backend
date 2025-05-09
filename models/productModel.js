const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({

    name: {
        type: String,
        required: true,
        trim: true
    },

    slug: {
        type: String,
        unique: true,
        lowercase: true
    },
    
    description: {
        type: String
    },

    pricePerPiece: {
        type: Number,
        required: true
    },

    capacity: {
        type: String
    },

    size: {
        type: String
    },

    plasticType: {
        type: String
    },

    shape: {
        type: String
    },

    color: {
        type: [String]
    },

    hasLid: {
        type: Boolean,
        default: false
    },

    usage: {
        type: [String]
    },

    features: {
        type: [String]
    },

    packSize: {
        type: String
    },

    minOrderQty: {
        type: Number
    },

    quantityInStock: {
        type: Number,
        required: true,
        default: 0
    },
    
    productDimensions: {
        length: { type: Number }, // in cm
        width: { type: Number },
        height: { type: Number }
    },

    closureType: {
        type: String
    },

    isDishwasherSafe: {
        type: Boolean,
        default: false
    },

    materialTypeFree: {
        type: [String] // e.g., ["BPA Free", "Non-Toxic"]
    },

    itemWeight: {
        type: Number // in grams
    },

    itemVolume: {
        type: String // can be in ml or kg depending on type
    },

    productCareInstructions: {
        type: [String]
    },

    isMicrowaveable: {
        type: Boolean,
        default: false
    },

    itemForm: {
        type: String // e.g., Box, Cup
    },

    images: {
        type: [String] // Optional - image URLs
    }

}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);
