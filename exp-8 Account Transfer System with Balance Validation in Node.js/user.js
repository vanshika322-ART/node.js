// server.js
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const User = require('./models/User');

const app = express();
app.use(bodyParser.json());

// ===============================
// 1️⃣ Connect to MongoDB
// ===============================
mongoose.connect('mongodb://127.0.0.1:27017/bankingDB')
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// ===============================
// 2️⃣ Create Sample Accounts (Optional - For Testing)
// ===============================
app.post('/create', async (req, res) => {
  try {
    const { name, balance } = req.body;
    const user = new User({ name, balance });
    await user.save();
    res.json({ message: 'User created successfully ✅', user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===============================
// 3️⃣ Transfer Money Endpoint
// ===============================
app.post('/transfer', async (req, res) => {
  const { senderName, receiverName, amount } = req.body;

  try {
    // Validate request
    if (!senderName || !receiverName || !amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid input data ❌' });
    }

    // Fetch both accounts
    const sender = await User.findOne({ name: senderName });
    const receiver = await User.findOne({ name: receiverName });

    // Check account existence
    if (!sender) return res.status(404).json({ error: 'Sender account not found ❌' });
    if (!receiver) return res.status(404).json({ error: 'Receiver account not found ❌' });

    // Check balance
    if (sender.balance < amount) {
      return res.status(400).json({ error: 'Insufficient balance ❌' });
    }

    // Sequential updates (no DB transaction used)
    sender.balance -= amount;
    receiver.balance += amount;

    await sender.save();
    await receiver.save();

    res.json({
      message: 'Transfer successful ✅',
      from: senderName,
      to: receiverName,
      amount,
      senderNewBalance: sender.balance,
      receiverNewBalance: receiver.balance
    });

  } catch (error) {
    res.status(500).json({ error: 'Transfer failed: ' + error.message });
  }
});

// ===============================
// 4️⃣ Check All Users
// ===============================
app.get('/users', async (req, res) => {
  const users = await User.find();
  res.json(users);
});

// ===============================
// 5️⃣ Start the Server
// ===============================
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
