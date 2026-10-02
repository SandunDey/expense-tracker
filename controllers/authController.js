const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db, seedDemoFinancialData } = require('../database/db');
const { JWT_SECRET } = require('../middleware/auth');

// Default initial category budgets for newly registered users
const DEFAULT_BUDGETS = [
  { category: 'Housing', limit: 1200 },
  { category: 'Food & Dining', limit: 500 },
  { category: 'Transportation', limit: 200 },
  { category: 'Utilities', limit: 150 },
  { category: 'Entertainment', limit: 120 },
  { category: 'Shopping', limit: 250 },
  { category: 'Healthcare', limit: 100 },
  { category: 'Subscriptions', limit: 50 }
];

// Helper to generate JWT
const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// Register user
exports.register = async (req, res) => {
  const { name, email, password, currency = '$' } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Please provide full name, email address, and a password.'
    });
  }

  if (password.length < 6) {
    return res.status(400).json({
      success: false,
      message: 'Password must be at least 6 characters long.'
    });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name.trim())}`;

    const sql = `
      INSERT INTO users (name, email, password, currency, avatar_url)
      VALUES (?, ?, ?, ?, ?)
    `;

    db.run(sql, [name.trim(), email.trim().toLowerCase(), hashedPassword, currency, avatarUrl], function (err) {
      if (err) {
        if (err.message.includes('UNIQUE constraint failed: users.email')) {
          return res.status(400).json({
            success: false,
            message: 'An account with this email address already exists. Please log in.'
          });
        }
        return res.status(500).json({ success: false, error: err.message });
      }

      const userId = this.lastID;

      // Seed default budgets for the new user
      const budgetStmt = db.prepare('INSERT INTO budgets (user_id, category, monthly_limit) VALUES (?, ?, ?)');
      DEFAULT_BUDGETS.forEach(b => budgetStmt.run(userId, b.category, b.limit));
      budgetStmt.finalize();

      const user = {
        id: userId,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        currency,
        avatar_url: avatarUrl
      };

      const token = generateToken(user);

      res.status(201).json({
        success: true,
        message: 'Account registered successfully!',
        token,
        user
      });
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Login user
exports.login = (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Please provide both email and password.'
    });
  }

  const sql = `SELECT * FROM users WHERE email = ?`;
  db.get(sql, [email.trim().toLowerCase()], async (err, user) => {
    if (err) {
      return res.status(500).json({ success: false, error: err.message });
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    const token = generateToken(user);

    res.json({
      success: true,
      message: 'Login successful!',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        currency: user.currency || '$',
        avatar_url: user.avatar_url
      }
    });
  });
};

// Quick Demo Login (for evaluators / seamless testing)
exports.demoLogin = (req, res) => {
  const sql = `SELECT * FROM users WHERE email = 'demo@auspify.com'`;
  db.get(sql, [], (err, user) => {
    if (err) return res.status(500).json({ success: false, error: err.message });

    if (!user) {
      // If demo user somehow does not exist, reseed
      return res.status(404).json({ success: false, message: 'Demo account not initialized.' });
    }

    const token = generateToken(user);

    res.json({
      success: true,
      message: 'Logged in as Demo User (Alex Rivera)',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        currency: user.currency || '$',
        avatar_url: user.avatar_url
      }
    });
  });
};

// Get current user profile
exports.getProfile = (req, res) => {
  const sql = `SELECT id, name, email, currency, avatar_url, created_at FROM users WHERE id = ?`;
  db.get(sql, [req.user.id], (err, user) => {
    if (err) return res.status(500).json({ success: false, error: err.message });
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    res.json({ success: true, user });
  });
};

// Update profile
exports.updateProfile = (req, res) => {
  const { name, currency, avatar_url } = req.body;
  const sql = `
    UPDATE users SET
      name = COALESCE(?, name),
      currency = COALESCE(?, currency),
      avatar_url = COALESCE(?, avatar_url)
    WHERE id = ?
  `;

  db.run(sql, [name ? name.trim() : null, currency, avatar_url, req.user.id], function (err) {
    if (err) return res.status(500).json({ success: false, error: err.message });

    db.get('SELECT id, name, email, currency, avatar_url FROM users WHERE id = ?', [req.user.id], (err, user) => {
      if (err) return res.status(500).json({ success: false, error: err.message });
      res.json({
        success: true,
        message: 'Profile updated successfully!',
        user
      });
    });
  });
};
