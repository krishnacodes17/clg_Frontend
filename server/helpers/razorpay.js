const Razorpay = require('razorpay');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_SZN8WmepRojC7T', // Use test key
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'ptgQl0YAHINf7PV1ttd68s0b', // Use test secret
});

module.exports = razorpay;