const { db } = require('../database/db');

exports.resetSampleData = (req, res) => {
  const userId = req.user.id;

  const now = new Date();
  const year = now.getFullYear();
  const monthStr = String(now.getMonth() + 1).padStart(2, '0');
  const prevMonthStr = String(now.getMonth() === 0 ? 12 : now.getMonth()).padStart(2, '0');
  const prevYear = now.getMonth() === 0 ? year - 1 : year;

  const sampleTransactions = [
    { title: 'Tech Corp Senior Salary', amount: 5400.00, type: 'income', category: 'Salary', date: `${year}-${monthStr}-01`, payment_method: 'Direct Deposit', notes: 'Monthly engineering base salary' },
    { title: 'Freelance Fullstack Project', amount: 1250.00, type: 'income', category: 'Freelance', date: `${year}-${monthStr}-08`, payment_method: 'Bank Transfer', notes: 'React & Node milestone delivery' },
    { title: 'Stock Dividend Yield', amount: 215.50, type: 'income', category: 'Investments', date: `${year}-${monthStr}-15`, payment_method: 'Direct Deposit', notes: 'Index fund quarterly dividend' },
    { title: 'Apartment Rental Payment', amount: 1450.00, type: 'expense', category: 'Housing', date: `${year}-${monthStr}-02`, payment_method: 'Bank Transfer', notes: 'Monthly downtown studio lease' },
    { title: 'Whole Foods Market', amount: 142.30, type: 'expense', category: 'Food & Dining', date: `${year}-${monthStr}-03`, payment_method: 'Credit Card', notes: 'Weekly grocery run' },
    { title: 'Electric & High-speed Fiber', amount: 135.00, type: 'expense', category: 'Utilities', date: `${year}-${monthStr}-05`, payment_method: 'Debit Card', notes: 'City power & 1Gbps internet' },
    { title: 'Metro Transit Pass', amount: 85.00, type: 'expense', category: 'Transportation', date: `${year}-${monthStr}-06`, payment_method: 'Credit Card', notes: 'Monthly commuter card refill' },
    { title: 'Blue Bottle Artisan Coffee', amount: 18.50, type: 'expense', category: 'Food & Dining', date: `${year}-${monthStr}-07`, payment_method: 'Apple Pay', notes: 'Coffee & croissant with colleague' },
    { title: 'Cloud Server & GitHub Copilot', amount: 48.00, type: 'expense', category: 'Subscriptions', date: `${year}-${monthStr}-09`, payment_method: 'Credit Card', notes: 'AWS hosting + Copilot subscription' },
    { title: 'Trader Joe\'s Groceries', amount: 96.45, type: 'expense', category: 'Food & Dining', date: `${year}-${monthStr}-11`, payment_method: 'Debit Card', notes: 'Produce and pantry essentials' },
    { title: 'Cinema IMAX & Dinner', amount: 64.00, type: 'expense', category: 'Entertainment', date: `${year}-${monthStr}-12`, payment_method: 'Credit Card', notes: 'Weekend movie night with friends' },
    { title: 'Ergonomic Mechanical Keyboard', amount: 179.99, type: 'expense', category: 'Shopping', date: `${year}-${monthStr}-14`, payment_method: 'Credit Card', notes: 'Keychron wireless work upgrade' },
    { title: 'Pharmacy & Wellness Vitamins', amount: 32.50, type: 'expense', category: 'Healthcare', date: `${year}-${monthStr}-16`, payment_method: 'Debit Card', notes: 'Health supplements' },
    { title: 'Gym & Crossfit Membership', amount: 75.00, type: 'expense', category: 'Healthcare', date: `${year}-${monthStr}-18`, payment_method: 'Credit Card', notes: 'Monthly fitness center fee' },
    { title: 'Gas Station Fuel Refill', amount: 52.00, type: 'expense', category: 'Transportation', date: `${year}-${monthStr}-20`, payment_method: 'Credit Card', notes: 'Full tank unleaded' },
    { title: 'Tech Corp Senior Salary', amount: 5400.00, type: 'income', category: 'Salary', date: `${prevYear}-${prevMonthStr}-01`, payment_method: 'Direct Deposit', notes: 'Monthly salary' },
    { title: 'Side Consulting Advisory', amount: 800.00, type: 'income', category: 'Freelance', date: `${prevYear}-${prevMonthStr}-14`, payment_method: 'Bank Transfer', notes: 'API architecture audit' },
    { title: 'Apartment Rental Payment', amount: 1450.00, type: 'expense', category: 'Housing', date: `${prevYear}-${prevMonthStr}-02`, payment_method: 'Bank Transfer', notes: 'Rent' },
    { title: 'Groceries & Supplies', amount: 410.00, type: 'expense', category: 'Food & Dining', date: `${prevYear}-${prevMonthStr}-09`, payment_method: 'Debit Card', notes: 'Combined grocery spend' }
  ];

  const sampleBudgets = [
    { category: 'Housing', limit: 1500.00 },
    { category: 'Food & Dining', limit: 550.00 },
    { category: 'Transportation', limit: 250.00 },
    { category: 'Utilities', limit: 180.00 },
    { category: 'Entertainment', limit: 150.00 },
    { category: 'Shopping', limit: 300.00 },
    { category: 'Healthcare', limit: 150.00 },
    { category: 'Subscriptions', limit: 75.00 }
  ];

  db.serialize(() => {
    db.run('DELETE FROM transactions WHERE user_id = ?', [userId], (err) => {
      if (err) return res.status(500).json({ success: false, error: err.message });

      db.run('DELETE FROM budgets WHERE user_id = ?', [userId], (bErr) => {
        if (bErr) return res.status(500).json({ success: false, error: bErr.message });

        const txStmt = db.prepare(`
          INSERT INTO transactions (user_id, title, amount, type, category, date, payment_method, notes)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);

        sampleTransactions.forEach(t => {
          txStmt.run(userId, t.title, t.amount, t.type, t.category, t.date, t.payment_method, t.notes);
        });

        txStmt.finalize((txFinErr) => {
          if (txFinErr) return res.status(500).json({ success: false, error: txFinErr.message });

          const bStmt = db.prepare(`
            INSERT INTO budgets (user_id, category, monthly_limit)
            VALUES (?, ?, ?)
          `);

          sampleBudgets.forEach(b => {
            bStmt.run(userId, b.category, b.limit);
          });

          bStmt.finalize((bFinErr) => {
            if (bFinErr) return res.status(500).json({ success: false, error: bFinErr.message });

            res.json({
              success: true,
              message: 'Sample financial records and budgets reset successfully!'
            });
          });
        });
      });
    });
  });
};
