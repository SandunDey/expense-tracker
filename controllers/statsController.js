const { db } = require('../database/db');

// Get comprehensive financial statistics for dashboard and reports
exports.getFinancialStats = (req, res) => {
  const userId = req.user.id;
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonthStr = `${currentYear}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  // 1. Overall Lifetime Summary
  const summarySql = `
    SELECT
      COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) AS totalIncome,
      COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS totalExpense,
      COUNT(*) AS totalTransactions,
      COUNT(DISTINCT category) AS totalCategories
    FROM transactions
    WHERE user_id = ?
  `;

  // 2. Current Month Summary
  const currentMonthSql = `
    SELECT
      COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) AS monthIncome,
      COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS monthExpense
    FROM transactions
    WHERE user_id = ? AND strftime('%Y-%m', date) = ?
  `;

  // 3. Category Breakdown (Expenses)
  const categoryExpenseSql = `
    SELECT
      category,
      ROUND(SUM(amount), 2) AS total,
      COUNT(*) AS count
    FROM transactions
    WHERE user_id = ? AND type = 'expense'
    GROUP BY category
    ORDER BY total DESC
  `;

  // 4. Category Breakdown (Income)
  const categoryIncomeSql = `
    SELECT
      category,
      ROUND(SUM(amount), 2) AS total,
      COUNT(*) AS count
    FROM transactions
    WHERE user_id = ? AND type = 'income'
    GROUP BY category
    ORDER BY total DESC
  `;

  // 5. Monthly History (Last 6 months)
  const monthlyTrendsSql = `
    SELECT
      strftime('%Y-%m', date) AS month,
      ROUND(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 2) AS income,
      ROUND(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 2) AS expense
    FROM transactions
    WHERE user_id = ?
    GROUP BY strftime('%Y-%m', date)
    ORDER BY month DESC
    LIMIT 6
  `;

  // 6. Recent 5 Transactions
  const recentSql = `
    SELECT * FROM transactions
    WHERE user_id = ?
    ORDER BY date DESC, id DESC
    LIMIT 5
  `;

  db.get(summarySql, [userId], (err, summary) => {
    if (err) return res.status(500).json({ success: false, error: err.message });

    db.get(currentMonthSql, [userId, currentMonthStr], (err, currentMonth) => {
      if (err) return res.status(500).json({ success: false, error: err.message });

      db.all(categoryExpenseSql, [userId], (err, expenseCategories) => {
        if (err) return res.status(500).json({ success: false, error: err.message });

        db.all(categoryIncomeSql, [userId], (err, incomeCategories) => {
          if (err) return res.status(500).json({ success: false, error: err.message });

          db.all(monthlyTrendsSql, [userId], (err, monthlyTrends) => {
            if (err) return res.status(500).json({ success: false, error: err.message });

            db.all(recentSql, [userId], (err, recentTransactions) => {
              if (err) return res.status(500).json({ success: false, error: err.message });

              const totalIncome = summary ? parseFloat(summary.totalIncome) : 0;
              const totalExpense = summary ? parseFloat(summary.totalExpense) : 0;
              const netBalance = totalIncome - totalExpense;
              const savingsRate = totalIncome > 0 ? Math.max(0, ((netBalance / totalIncome) * 100).toFixed(1)) : 0;

              const monthIncome = currentMonth ? parseFloat(currentMonth.monthIncome) : 0;
              const monthExpense = currentMonth ? parseFloat(currentMonth.monthExpense) : 0;
              const monthBalance = monthIncome - monthExpense;

              res.json({
                success: true,
                summary: {
                  totalIncome: Number(totalIncome.toFixed(2)),
                  totalExpense: Number(totalExpense.toFixed(2)),
                  netBalance: Number(netBalance.toFixed(2)),
                  savingsRate: Number(savingsRate),
                  totalTransactions: summary ? summary.totalTransactions : 0,
                  totalCategories: summary ? summary.totalCategories : 0
                },
                currentMonth: {
                  month: currentMonthStr,
                  income: Number(monthIncome.toFixed(2)),
                  expense: Number(monthExpense.toFixed(2)),
                  balance: Number(monthBalance.toFixed(2))
                },
                expenseCategories,
                incomeCategories,
                monthlyTrends: (monthlyTrends || []).reverse(),
                recentTransactions
              });
            });
          });
        });
      });
    });
  });
};
