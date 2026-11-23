const midtransClient = require('midtrans-client');

const snap = new midtransClient.Snap({
  isProduction: false, // false = mode Sandbox (gratis)
  serverKey: process.env.MIDTRANS_SERVER_KEY,
});

// Contoh endpoint: POST /api/payment/create
app.post('/api/payment/create', async (req, res) => {
  try {
    const { orderId, totalAmount, customerName, customerEmail } = req.body;

    const parameter = {
      transaction_details: {
        order_id: orderId, // Harus unik tiap transaksi, misal: 'ORDER-' + Date.now()
        gross_amount: totalAmount, // Total harga (angka bulat)
      },
      customer_details: {
        first_name: customerName,
        email: customerEmail,
      },
    };

    const transaction = await snap.createTransaction(parameter);
    // Kirim token ke frontend
    res.json({ token: transaction.token });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});