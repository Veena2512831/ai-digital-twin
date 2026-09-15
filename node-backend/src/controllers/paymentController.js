const Razorpay = require('razorpay');
const crypto = require('crypto');
const db = require('../db');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// ============================================================
// CREATE RAZORPAY ORDER
// ============================================================
const createOrder = async (req, res) => {
  try {
    const { student_id } = req.body;

    if (!student_id) {
      return res.status(400).json({
        success: false,
        message: 'student_id is required',
      });
    }

    // Create Razorpay order
    const options = {
      amount: 49900, // ₹499 in paise
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);

    // Save payment/order in database
    await db.query(
      `
      INSERT INTO payments (
        payment_id,
        student_id,
        razorpay_order_id,
        amount,
        currency,
        status
      )
      VALUES (
        gen_random_uuid(),
        $1,
        $2,
        $3,
        $4,
        $5
      )
      `,
      [
        student_id,
        order.id,
        order.amount,
        order.currency,
        'created',
      ]
    );

    res.status(200).json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error('Razorpay order creation error:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to create Razorpay order',
      error: error.message,
    });
  }
};


// ============================================================
// VERIFY RAZORPAY PAYMENT
// ============================================================
const verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    if (
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature
    ) {
      return res.status(400).json({
        success: false,
        message: 'Payment details are required',
      });
    }

    // Generate signature
    const generatedSignature = crypto
      .createHmac(
        'sha256',
        process.env.RAZORPAY_KEY_SECRET
      )
      .update(
        `${razorpay_order_id}|${razorpay_payment_id}`
      )
      .digest('hex');

    // Verify signature
    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: 'Payment verification failed',
      });
    }

    // Update payment in database
    const result = await db.query(
      `
      UPDATE payments
      SET
        razorpay_payment_id = $1,
        razorpay_signature = $2,
        status = $3,
        updated_at = NOW()
      WHERE razorpay_order_id = $4
      RETURNING *
      `,
      [
        razorpay_payment_id,
        razorpay_signature,
        'paid',
        razorpay_order_id,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Payment order not found in database',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Payment verified and saved successfully',
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id,
    });

  } catch (error) {
    console.error('Payment verification error:', error);

    res.status(500).json({
      success: false,
      message: 'Payment verification failed',
      error: error.message,
    });
  }
};


module.exports = {
  createOrder,
  verifyPayment,
};