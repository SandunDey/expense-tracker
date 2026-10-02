const { db } = require('../database/db');

// Get all budgets with current month actual spending comparison
exports.getBudgets = (req, res) => {
  const userId = req.user.id;
  const now = new Date();
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const sql = `
    SELECT
      b.id,
      b.category,
      b.monthly_limit,
      COALESCE(spent_data.total_spent, 0) AS current_spent
    FROM budgets b
    LEFT JOIN (
      SELECT category, SUM(amount) AS total_spent
      FROM transactions
      WHERE user_id = ? AND type = 'expense' AND strftime('%Y-%m', date) = ?
      GROUP BY category
    ) spent_data ON b.category = spent_data.category
    WHERE b.user_id = ?
    ORDER BY b.category ASC
  `;

  db.all(sql, [userId, currentMonthStr, userId], (err, rows) => {
    if (err) return res.status(500).json({ success: false, error: err.message });

    const budgets = (rows || []).map(row => {
      const limit = Number(row.monthly_limit);
      const spent = Number(row.current_spent);
      const remaining = Number((limit - spent).toFixed(2));
      const percentage = limit > 0 ? Math.min(200, Math.round((spent / limit) * 100)) : 0;
      const isOver = spent > limit;
      const isWarning = !isOver && percentage >= 80;

      return {
        id: row.id,
        category: row.category,
        monthlyLimit: limit,
        currentSpent: spent,
        remaining,
        percentage,
        isOver,
        isWarning
      };
    });

    res.json({
      success: true,
      currentMonth: currentMonthStr,
      budgets
    });
  });
};

// Set or update a category budget
exports.setBudget = (req, res) => {
  const userId = req.user.id;
  const { category, monthly_limit } = req.body;

  if (!category || !category.trim()) {
    return res.status(400).json({ success: false, message: 'Category is required.' });
  }

  const limitNum = parseFloat(monthly_limit);
  if (isNaN(limitNum) || limitNum <= 0) {
    return res.status(400).json({ success: false, message: 'Budget limit must be a positive number.' });
  }

  const sql = `
    INSERT INTO budgets (user_id, category, monthly_limit)
    VALUES (?, ?, ?)
    ON CONFLICT(user_id, category) DO UPDATE SET
      monthly_limit = excluded.monthly_limit
  `;

  db.run(sql, [userId, category.trim(), limitNum], function (err) {
    if (err) return res.status(500).json({ success: false, error: err.message });

    res.json({
      success: true,
      message: `Budget for "${category}" set to $${limitNum.toFixed(2)}.`
    });
  });
};

// Delete a category budget
exports.deleteBudget = (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;

  const sql = `DELETE FROM budgets WHERE id = ? AND user_id = ?`;
  db.run(sql, [id, userId], function (err) {
    if (err) return res.status(500).json({ success: false, error: err.message });
    if (this.changes === 0) return res.status(404).json({ success: false, message: 'Budget not found.' });

    res.json({ success: true, message: 'Budget removed successfully.' });
  });
};
