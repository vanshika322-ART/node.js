// server.js
const express = require('express');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

// ==========================
// Configuration
// ==========================
const PORT = 3000;
const SECRET_KEY = 'myjwtsecretkey'; // Secret key for signing JWTs

// Hardcoded user credentials (for demo)
const USER = {
  username: 'abhishek',
  password: '12345'
};

// Dummy user balance (in memory)
let balance = 1000;

// ==========================
// Generate JWT on Login
// ==========================
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  // Validate credentials
  if (username === USER.username && password === USER.password) {
    const token = jwt.sign({ username }, SECRET_KEY, { expiresIn: '1h' });
    res.json({ message: 'Login successful ✅', token });
  } else {
    res.status(401).json({ error: 'Invalid username or password ❌' });
  }
});

// ==========================
// JWT Verification Middleware
// ==========================
const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader)
    return res.status(401).json({ error: 'Authorization header missing' });

  const token = authHeader.split(' ')[1];
  if (!token)
    return res.status(401).json({ error: 'Bearer token missing' });

  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    if (err)
      return res.status(403).json({ error: 'Invalid or expired token' });

    req.user = decoded; // store user info from token
    next();
  });
};

// ==========================
// Protected Banking Endpoints
// ==========================

// 1️⃣ Check Account Balance
app.get('/balance', verifyToken, (req, res) => {
  res.json({ username: req.user.username, balance });
});

// 2️⃣ Deposit Money
app.post('/deposit', verifyToken, (req, res) => {
  const { amount } = req.body;
  if (amount <= 0)
    return res.status(400).json({ error: 'Deposit amount must be positive' });

  balance += amount;
  res.json({ message: 'Deposit successful ✅', newBalance: balance });
});

// 3️⃣ Withdraw Money
app.post('/withdraw', verifyToken, (req, res) => {
  const { amount } = req.body;
  if (amount <= 0)
    return res.status(400).json({ error: 'Withdrawal amount must be positive' });

  if (amount > balance)
    return res.status(400).json({ error: 'Insufficient balance ❌' });

  balance -= amount;
  res.json({ message: 'Withdrawal successful ✅', newBalance: balance });
});

// ==========================
// Start Server
// ==========================
app.listen(PORT, () => {
  console.log(`✅ Banking API server running on http://localhost:${PORT}`);
});
