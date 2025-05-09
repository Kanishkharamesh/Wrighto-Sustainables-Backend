const express = require('express');
const Contact = require('../models/Contact');
const {
    contactUsCtrl,
} = require('../controller/contactController');
const {authMiddleware} = require('../middlewares/authMiddleware');
const router = express.Router();


router.post('/', authMiddleware, contactUsCtrl);


module.exports = router;
