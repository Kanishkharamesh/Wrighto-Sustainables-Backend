const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [
    {
      product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
      quantity: { type: Number, required: true },
      price: { type: Number, required: true },
    },
  ],
  shippingAddress: {
    fullName: String,
    phone: String,
    addressLine: String,
    city: String,
    state: String,
    pincode: String,
  },
  paymentMethod: { type: String, default: 'COD' },
  paymentStatus: { 
    type: String, 
    enum: ['Pending', 'Paid', 'Failed', 'Refunded'], 
    default: 'Pending' 
  },
  paymentDetails: {
    transactionId: String,
    paymentGateway: String, // e.g., 'Razorpay', 'Stripe'
    paymentTime: Date
  },
  totalAmount: Number,
  gstAmount: Number,
  deliveryCharge: Number,
  grandTotal: Number,
  status: { type: String, default: 'Processing' },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Order', orderSchema);
