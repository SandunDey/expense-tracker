const { db } = require('../database/db');

// Get all transactions with search, type/category filters, date range, sorting and pagination
exports.getAllTransactions = (req, res) => {
  const userId = req.user.id;
  const {
    search = '',
    type = 'All',
    category = 'All',
    startDate = '',
    endDate = '',
    sortBy = 'date',
    order = 'DESC',
    page = 1,
    limit = 15
  } = req.query;

  const validSortColumns = ['id', 'title', 'amount', 'type', 'category', 'date', 'created_at'];
  const sanitizedSort = validSortColumns.includes(sortBy) ? sortBy : 'date';
  const sanitizedOrder = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

  const whereConditions = ['user_id = ?'];
  const params = [userId];

  // Search filter
  if (search.trim()) {
    whereConditions.push('(title LIKE ? OR notes LIKE ? OR category LIKE ? OR payment_method LIKE ?)');
    const searchTerm = `%${search.trim()}%`;
    params.push(searchTerm, searchTerm, searchTerm, searchTerm);
  }

  // Type filter (income vs expense)
  if (type && type !== 'All') {
    whereConditions.push('type = ?');
    params.push(type.toLowerCase());
  }

  // Category filter
  if (category && category !== 'All') {
    whereConditions.push('category = ?');
    params.push(category);
  }

  // Date range filters
  if (startDate) {
    whereConditions.push('date >= ?');
    params.push(startDate);
  }
  if (endDate) {
    whereConditions.push('date <= ?');
    params.push(endDate);
  }

  const whereClause = `WHERE ${whereConditions.join(' AND ')}`;

  // Total count for pagination metadata
  const countSql = `SELECT COUNT(*) AS total FROM transactions ${whereClause}`;

  db.get(countSql, params, (err, countRow) => {
    if (err) {
      return res.status(500).json({ success: false, error: err.message });
    }

    const total = countRow ? countRow.total : 0;
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit) || 15));
    const offset = (pageNum - 1) * limitNum;

    const querySql = `
      SELECT * FROM transactions
      ${whereClause}
      ORDER BY ${sanitizedSort} ${sanitizedOrder}, id DESC
      LIMIT ? OFFSET ?
    `;

    const queryParams = [...params, limitNum, offset];

    db.all(querySql, queryParams, (err, rows) => {
      if (err) {
        return res.status(500).json({ success: false, error: err.message });
      }

      res.json({
        success: true,
        data: rows,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum) || 1
        }
      });
    });
  });
};

// Get single transaction by ID
exports.getTransactionById = (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const sql = `SELECT * FROM transactions WHERE id = ? AND user_id = ?`;
  db.get(sql, [id, userId], (err, row) => {
    if (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
    if (!row) {
      return res.status(404).json({ success: false, message: 'Transaction not found.' });
    }
    res.json({ success: true, data: row });
  });
};

// Create a new transaction (Income or Expense)
exports.createTransaction = (req, res) => {
  const userId = req.user.id;
  const {
    title,
    amount,
    type,
    category,
    date,
    payment_method = 'Credit Card',
    notes = ''
  } = req.body;

  // Validation
  if (!title || !title.trim()) {
    return res.status(400).json({ success: false, message: 'Transaction title is required.' });
  }

  const parsedAmount = parseFloat(amount);
  if (isNaN(parsedAmount) || parsedAmount <= 0) {
    return res.status(400).json({ success: false, message: 'Amount must be a positive number.' });
  }

  if (!type || !['income', 'expense'].includes(type.toLowerCase())) {
    return res.status(400).json({ success: false, message: 'Type must be either "income" or "expense".' });
  }

  if (!category || !category.trim()) {
    return res.status(400).json({ success: false, message: 'Category is required.' });
  }

  if (!date) {
    return res.status(400).json({ success: false, message: 'Date is required (YYYY-MM-DD).' });
  }

  const sql = `
    INSERT INTO transactions (
      user_id, title, amount, type, category, date, payment_method, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const params = [
    userId,
    title.trim(),
    parsedAmount,
    type.toLowerCase(),
    category.trim(),
    date,
    payment_method ? payment_method.trim() : 'Credit Card',
    notes ? notes.trim() : ''
  ];

  db.run(sql, params, function (err) {
    if (err) {
      return res.status(500).json({ success: false, error: err.message });
    }

    const newId = this.lastID;
    db.get('SELECT * FROM transactions WHERE id = ?', [newId], (err, newTransaction) => {
      if (err) {
        return res.status(201).json({ success: true, id: newId, message: 'Transaction recorded successfully.' });
      }
      res.status(201).json({
        success: true,
        message: `${type === 'income' ? 'Income' : 'Expense'} recorded successfully!`,
        data: newTransaction
      });
    });
  });
};

// Update transaction
exports.updateTransaction = (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const {
    title,
    amount,
    type,
    category,
    date,
    payment_method,
    notes
  } = req.body;

  if (!title || !title.trim()) {
    return res.status(400).json({ success: false, message: 'Transaction title is required.' });
  }

  const parsedAmount = parseFloat(amount);
  if (isNaN(parsedAmount) || parsedAmount <= 0) {
    return res.status(400).json({ success: false, message: 'Amount must be a positive number.' });
  }

  if (!type || !['income', 'expense'].includes(type.toLowerCase())) {
    return res.status(400).json({ success: false, message: 'Type must be either "income" or "expense".' });
  }

  const sql = `
    UPDATE transactions SET
      title = ?,
      amount = ?,
      type = ?,
      category = ?,
      date = ?,
      payment_method = ?,
      notes = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ? AND user_id = ?
  `;

  const params = [
    title.trim(),
    parsedAmount,
    type.toLowerCase(),
    category ? category.trim() : 'Miscellaneous',
    date,
    payment_method || 'Credit Card',
    notes ? notes.trim() : '',
    id,
    userId
  ];

  db.run(sql, params, function (err) {
    if (err) {
      return res.status(500).json({ success: false, error: err.message });
    }

    if (this.changes === 0) {
      return res.status(404).json({ success: false, message: 'Transaction not found or unauthorized.' });
    }

    db.get('SELECT * FROM transactions WHERE id = ?', [id], (err, updatedTx) => {
      if (err) {
        return res.json({ success: true, message: 'Transaction updated successfully.' });
      }
      res.json({
        success: true,
        message: 'Transaction updated successfully!',
        data: updatedTx
      });
    });
  });
};

// Delete transaction
exports.deleteTransaction = (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const sql = `DELETE FROM transactions WHERE id = ? AND user_id = ?`;
  db.run(sql, [id, userId], function (err) {
    if (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ success: false, message: 'Transaction not found or unauthorized.' });
    }
    res.json({ success: true, message: 'Transaction deleted successfully.', id });
  });
};

// Export all transactions for CSV/JSON download
exports.exportTransactions = (req, res) => {
  const userId = req.user.id;
  const sql = `
    SELECT id, title, amount, type, category, date, payment_method, notes, created_at
    FROM transactions
    WHERE user_id = ?
    ORDER BY date DESC, id DESC
  `;

  db.all(sql, [userId], (err, rows) => {
    if (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
    res.json({ success: true, data: rows });
  });
};
