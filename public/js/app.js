// ===================================================================
// EXPENSE TRACKER - MAIN FRONTEND APPLICATION
// Auspify Full Stack Internship - Task 3 (Medium)
// ===================================================================

const EXPENSE_CATEGORIES = [
  'Housing',
  'Food & Dining',
  'Transportation',
  'Utilities',
  'Entertainment',
  'Shopping',
  'Healthcare',
  'Subscriptions',
  'Education',
  'Travel',
  'Miscellaneous'
];

const INCOME_CATEGORIES = [
  'Salary',
  'Freelance',
  'Investments',
  'Business',
  'Gifts',
  'Refunds',
  'Other Income'
];

// App State
const state = {
  user: null,
  activeTab: 'All', // 'All', 'expense', 'income'
  searchQuery: '',
  selectedCategory: 'All',
  dateFilter: 'all', // 'all', 'this-month', 'last-30', 'this-year'
  sortBy: 'date',
  order: 'DESC',
  page: 1,
  limit: 10,
  totalPages: 1,
  totalRecords: 0,
  transactions: [],
  editingTxId: null
};

// ===================================================================
// INITIALIZATION
// ===================================================================
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  setupEventListeners();
  checkAuthAndLoad();
});

// Theme Management
function initTheme() {
  const savedTheme = localStorage.getItem('auspify_theme') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);
  updateThemeIcon(savedTheme);
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'dark';
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('auspify_theme', next);
  updateThemeIcon(next);
  refreshDashboardStats();
}

function updateThemeIcon(theme) {
  const icon = document.getElementById('theme-toggle-icon');
  if (icon) {
    icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
  }
}

// Authentication check
async function checkAuthAndLoad() {
  if (API.isAuthenticated()) {
    try {
      const res = await API.getProfile();
      state.user = res.user;
      renderAppView(true);
      loadDashboardData();
    } catch (e) {
      API.logout();
      renderAppView(false);
    }
  } else {
    renderAppView(false);
  }
}

function renderAppView(isAuth) {
  const authContainer = document.getElementById('auth-view');
  const dashboardContainer = document.getElementById('dashboard-view');
  const userMenu = document.getElementById('nav-user-menu');
  const actionBtns = document.getElementById('nav-action-buttons');

  if (isAuth) {
    authContainer.classList.add('hidden');
    dashboardContainer.classList.remove('hidden');
    userMenu.classList.remove('hidden');
    actionBtns.classList.remove('hidden');

    if (state.user) {
      document.getElementById('nav-user-name').textContent = state.user.name;
      document.getElementById('nav-user-avatar').src = state.user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(state.user.name)}`;
      document.getElementById('currency-badge').textContent = state.user.currency || '$';
    }
  } else {
    authContainer.classList.remove('hidden');
    dashboardContainer.classList.add('hidden');
    userMenu.classList.add('hidden');
    actionBtns.classList.add('hidden');
  }
}

// ===================================================================
// EVENT LISTENERS SETUP
// ===================================================================
function setupEventListeners() {
  // Theme toggle
  document.getElementById('theme-toggle-btn').addEventListener('click', toggleTheme);

  // Auth Tabs (Login vs Register)
  document.getElementById('tab-login-btn').addEventListener('click', () => switchAuthTab('login'));
  document.getElementById('tab-register-btn').addEventListener('click', () => switchAuthTab('register'));

  // Auth Forms
  document.getElementById('login-form').addEventListener('submit', handleLogin);
  document.getElementById('register-form').addEventListener('submit', handleRegister);
  document.getElementById('demo-login-btn').addEventListener('click', handleDemoLogin);

  // Logout
  document.getElementById('logout-btn').addEventListener('click', handleLogout);

  // Modal open buttons
  document.getElementById('btn-add-expense').addEventListener('click', () => openTransactionModal('expense'));
  document.getElementById('btn-add-income').addEventListener('click', () => openTransactionModal('income'));
  document.getElementById('btn-header-add-expense').addEventListener('click', () => openTransactionModal('expense'));
  document.getElementById('btn-header-add-income').addEventListener('click', () => openTransactionModal('income'));
  document.getElementById('btn-set-budget').addEventListener('click', openBudgetModal);

  // Modal close buttons
  document.getElementById('tx-modal-close').addEventListener('click', closeTransactionModal);
  document.getElementById('tx-modal-cancel').addEventListener('click', closeTransactionModal);
  document.getElementById('budget-modal-close').addEventListener('click', closeBudgetModal);
  document.getElementById('budget-modal-cancel').addEventListener('click', closeBudgetModal);

  // Transaction Modal Form & Type Selector
  document.getElementById('tx-type-expense').addEventListener('click', () => setModalType('expense'));
  document.getElementById('tx-type-income').addEventListener('click', () => setModalType('income'));
  document.getElementById('transaction-form').addEventListener('submit', handleSaveTransaction);

  // Budget Modal Form
  document.getElementById('budget-form').addEventListener('submit', handleSaveBudget);

  // Transaction Filter Tabs (All / Expenses / Income)
  document.querySelectorAll('.tab-btn[data-filter-tab]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.tab-btn[data-filter-tab]').forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      state.activeTab = e.target.getAttribute('data-filter-tab');
      state.page = 1;
      loadTransactions();
    });
  });

  // Search input with debounce
  let searchTimeout = null;
  document.getElementById('tx-search-input').addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      state.searchQuery = e.target.value.trim();
      state.page = 1;
      loadTransactions();
    }, 350);
  });

  // Category filter
  document.getElementById('category-filter-select').addEventListener('change', (e) => {
    state.selectedCategory = e.target.value;
    state.page = 1;
    loadTransactions();
  });

  // Date range filter
  document.getElementById('date-filter-select').addEventListener('change', (e) => {
    state.dateFilter = e.target.value;
    state.page = 1;
    loadTransactions();
  });

  // Sort dropdown
  document.getElementById('sort-filter-select').addEventListener('change', (e) => {
    const val = e.target.value;
    const [sortBy, order] = val.split('-');
    state.sortBy = sortBy;
    state.order = order;
    state.page = 1;
    loadTransactions();
  });

  // Pagination buttons
  document.getElementById('prev-page-btn').addEventListener('click', () => {
    if (state.page > 1) {
      state.page--;
      loadTransactions();
    }
  });

  document.getElementById('next-page-btn').addEventListener('click', () => {
    if (state.page < state.totalPages) {
      state.page++;
      loadTransactions();
    }
  });

  // Export actions
  document.getElementById('btn-export-csv').addEventListener('click', handleExportCSV);
  document.getElementById('btn-export-json').addEventListener('click', handleExportJSON);

  // Reset Seed Data
  document.getElementById('btn-reset-data').addEventListener('click', handleResetSeedData);

  // Listen for session expiry
  window.addEventListener('auth:expired', () => {
    showToast('Your session has expired. Please log in again.', 'error');
    renderAppView(false);
  });
}

// ===================================================================
// AUTHENTICATION LOGIC
// ===================================================================
function switchAuthTab(tab) {
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  const tabLogin = document.getElementById('tab-login-btn');
  const tabRegister = document.getElementById('tab-register-btn');

  if (tab === 'login') {
    loginForm.classList.remove('hidden');
    registerForm.classList.add('hidden');
    tabLogin.classList.add('active');
    tabRegister.classList.remove('active');
  } else {
    loginForm.classList.add('hidden');
    registerForm.classList.remove('hidden');
    tabLogin.classList.remove('active');
    tabRegister.classList.add('active');
  }
}

async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;

  try {
    const res = await API.login(email, password);
    state.user = res.user;
    showToast(`Welcome back, ${res.user.name}!`, 'success');
    renderAppView(true);
    loadDashboardData();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function handleRegister(e) {
  e.preventDefault();
  const name = document.getElementById('reg-name').value;
  const email = document.getElementById('reg-email').value;
  const password = document.getElementById('reg-password').value;
  const currency = document.getElementById('reg-currency').value;

  try {
    const res = await API.register(name, email, password, currency);
    state.user = res.user;
    showToast('Registration successful! Welcome to Expense Tracker.', 'success');
    renderAppView(true);
    loadDashboardData();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function handleDemoLogin() {
  try {
    const res = await API.demoLogin();
    state.user = res.user;
    showToast('Logged in as Demo User (Alex Rivera)', 'success');
    renderAppView(true);
    loadDashboardData();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function handleLogout() {
  API.logout();
  state.user = null;
  showToast('Logged out successfully.', 'info');
  renderAppView(false);
}

// ===================================================================
// DASHBOARD DATA FETCHING & RENDERING
// ===================================================================
async function loadDashboardData() {
  populateCategoryDropdowns();
  await Promise.all([
    refreshDashboardStats(),
    loadBudgets(),
    loadTransactions()
  ]);
}

async function refreshDashboardStats() {
  try {
    const data = await API.getStats();
    const currency = state.user?.currency || '$';

    // Summary Metric Cards
    const netBalanceEl = document.getElementById('metric-net-balance');
    const netBalance = data.summary.netBalance;
    netBalanceEl.textContent = formatCurrency(netBalance, currency);
    netBalanceEl.className = `metric-value ${netBalance >= 0 ? 'text-success' : 'text-danger'}`;

    document.getElementById('metric-total-income').textContent = formatCurrency(data.summary.totalIncome, currency);
    document.getElementById('metric-total-expense').textContent = formatCurrency(data.summary.totalExpense, currency);
    document.getElementById('metric-savings-rate').textContent = `${data.summary.savingsRate}%`;

    // Monthly Subtext
    document.getElementById('month-income-sub').textContent = `${currency}${data.currentMonth.income.toLocaleString()} this month`;
    document.getElementById('month-expense-sub').textContent = `${currency}${data.currentMonth.expense.toLocaleString()} this month`;
    document.getElementById('savings-sub').textContent = data.summary.savingsRate > 20 ? 'Healthy Financial Buffer' : 'Watch discretionary expenses';

    // Render Charts
    renderMonthlyTrendChart('monthlyCashflowChart', data.monthlyTrends, currency);
    renderCategoryDistributionChart('categoryDoughnutChart', data.expenseCategories, currency);
  } catch (err) {
    console.error('Failed to load financial statistics:', err);
  }
}

async function loadBudgets() {
  try {
    const data = await API.getBudgets();
    const container = document.getElementById('budgets-list-container');
    const currency = state.user?.currency || '$';

    if (!data.budgets || data.budgets.length === 0) {
      container.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 2rem; color: var(--text-muted);">
          <i class="fas fa-bullseye" style="font-size: 2rem; margin-bottom: 0.5rem; display:block;"></i>
          No category budgets set. Click "+ Set Budget Goal" to create your first spending limit!
        </div>
      `;
      return;
    }

    container.innerHTML = data.budgets.map(b => {
      const barClass = b.isOver ? 'danger' : (b.isWarning ? 'warning' : '');
      const statusBadge = b.isOver 
        ? `<span class="badge-tag negative"><i class="fas fa-exclamation-triangle"></i> Over Limit</span>`
        : (b.isWarning 
          ? `<span class="badge-tag" style="background:var(--warning-light); color:var(--warning);"><i class="fas fa-bell"></i> Near Limit</span>` 
          : `<span class="badge-tag positive"><i class="fas fa-check-circle"></i> On Track</span>`);

      return `
        <div class="budget-item">
          <div class="budget-top">
            <span class="budget-cat-name">
              <i class="${getCategoryIcon(b.category)}"></i>
              ${escapeHtml(b.category)}
            </span>
            ${statusBadge}
          </div>
          <div class="budget-amounts">
            <span>Spent: <strong>${currency}${b.currentSpent.toFixed(2)}</strong></span>
            <span>Limit: <strong>${currency}${b.monthlyLimit.toFixed(2)}</strong></span>
          </div>
          <div class="budget-progress-track">
            <div class="budget-progress-bar ${barClass}" style="width: ${Math.min(100, b.percentage)}%;"></div>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 0.5rem; font-size: 0.775rem;">
            <span style="color: ${b.isOver ? 'var(--expense)' : 'var(--text-muted)'};">
              ${b.isOver ? `Over by ${currency}${Math.abs(b.remaining).toFixed(2)}` : `${currency}${b.remaining.toFixed(2)} remaining`}
            </span>
            <span style="color: var(--text-secondary); font-weight: 600;">${b.percentage}%</span>
          </div>
        </div>
      `;
    }).join('');
  } catch (err) {
    console.error('Failed to load budgets:', err);
  }
}

// ===================================================================
// TRANSACTIONS LIST & CRUD
// ===================================================================
async function loadTransactions() {
  const tableBody = document.getElementById('transactions-table-body');
  const emptyState = document.getElementById('transactions-empty-state');
  const tableWrap = document.getElementById('transactions-table-wrap');
  const currency = state.user?.currency || '$';

  // Compute date filter ranges
  let startDate = '';
  let endDate = '';
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');

  if (state.dateFilter === 'this-month') {
    startDate = `${year}-${month}-01`;
    endDate = `${year}-${month}-31`;
  } else if (state.dateFilter === 'last-30') {
    const past30 = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
    startDate = past30.toISOString().split('T')[0];
    endDate = now.toISOString().split('T')[0];
  } else if (state.dateFilter === 'this-year') {
    startDate = `${year}-01-01`;
    endDate = `${year}-12-31`;
  }

  const params = {
    search: state.searchQuery,
    type: state.activeTab,
    category: state.selectedCategory,
    startDate,
    endDate,
    sortBy: state.sortBy,
    order: state.order,
    page: state.page,
    limit: state.limit
  };

  try {
    const res = await API.getTransactions(params);
    state.transactions = res.data;
    state.totalPages = res.pagination.totalPages;
    state.totalRecords = res.pagination.total;

    // Update Pagination UI
    document.getElementById('page-info-text').textContent = `Showing page ${state.page} of ${state.totalPages} (${state.totalRecords} records)`;
    document.getElementById('prev-page-btn').disabled = state.page <= 1;
    document.getElementById('next-page-btn').disabled = state.page >= state.totalPages;

    if (!res.data || res.data.length === 0) {
      tableWrap.classList.add('hidden');
      emptyState.classList.remove('hidden');
      return;
    }

    tableWrap.classList.remove('hidden');
    emptyState.classList.add('hidden');

    tableBody.innerHTML = res.data.map(tx => {
      const isIncome = tx.type === 'income';
      const icon = getCategoryIcon(tx.category);

      return `
        <tr>
          <td>
            <div class="tx-title-group">
              <div class="tx-icon ${isIncome ? 'income' : 'expense'}">
                <i class="${icon}"></i>
              </div>
              <div class="tx-meta">
                <h4>${escapeHtml(tx.title)}</h4>
                <span>${tx.notes ? escapeHtml(tx.notes) : 'No notes added'}</span>
              </div>
            </div>
          </td>
          <td>
            <span class="category-pill">
              <i class="${icon}"></i>
              ${escapeHtml(tx.category)}
            </span>
          </td>
          <td>
            <span style="color: var(--text-secondary); font-size: 0.85rem;">
              <i class="far fa-calendar-alt" style="margin-right: 0.25rem;"></i>
              ${formatDate(tx.date)}
            </span>
          </td>
          <td>
            <span class="badge-tag neutral" style="font-weight: 500;">
              ${escapeHtml(tx.payment_method || 'Card')}
            </span>
          </td>
          <td class="text-right">
            <span class="tx-amount ${isIncome ? 'income' : 'expense'}">
              ${isIncome ? '+' : '-'}${currency}${Number(tx.amount).toFixed(2)}
            </span>
          </td>
          <td>
            <div class="action-buttons" style="justify-content: flex-end;">
              <button class="action-btn" title="Edit" onclick="editTransaction(${tx.id})">
                <i class="fas fa-pen"></i>
              </button>
              <button class="action-btn delete" title="Delete" onclick="deleteTransaction(${tx.id})">
                <i class="fas fa-trash-alt"></i>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// Transaction Modal Handlers
function openTransactionModal(type = 'expense', txToEdit = null) {
  const modal = document.getElementById('transaction-modal');
  const title = document.getElementById('tx-modal-title');
  const form = document.getElementById('transaction-form');

  form.reset();
  state.editingTxId = txToEdit ? txToEdit.id : null;

  if (txToEdit) {
    title.textContent = `Edit ${txToEdit.type === 'income' ? 'Income' : 'Expense'}`;
    setModalType(txToEdit.type);
    document.getElementById('tx-title').value = txToEdit.title;
    document.getElementById('tx-amount').value = txToEdit.amount;
    document.getElementById('tx-category').value = txToEdit.category;
    document.getElementById('tx-date').value = txToEdit.date;
    document.getElementById('tx-payment').value = txToEdit.payment_method || 'Credit Card';
    document.getElementById('tx-notes').value = txToEdit.notes || '';
  } else {
    title.textContent = `Record New ${type === 'income' ? 'Income' : 'Expense'}`;
    setModalType(type);
    document.getElementById('tx-date').value = new Date().toISOString().split('T')[0];
  }

  modal.classList.add('active');
}

function closeTransactionModal() {
  document.getElementById('transaction-modal').classList.remove('active');
  state.editingTxId = null;
}

function setModalType(type) {
  const expBtn = document.getElementById('tx-type-expense');
  const incBtn = document.getElementById('tx-type-income');
  const catSelect = document.getElementById('tx-category');

  if (type === 'income') {
    incBtn.classList.add('active', 'income');
    expBtn.classList.remove('active', 'expense');
    incBtn.setAttribute('data-active', 'true');
    expBtn.setAttribute('data-active', 'false');

    catSelect.innerHTML = INCOME_CATEGORIES.map(c => `<option value="${c}">${c}</option>`).join('');
  } else {
    expBtn.classList.add('active', 'expense');
    incBtn.classList.remove('active', 'income');
    expBtn.setAttribute('data-active', 'true');
    incBtn.setAttribute('data-active', 'false');

    catSelect.innerHTML = EXPENSE_CATEGORIES.map(c => `<option value="${c}">${c}</option>`).join('');
  }
}

async function handleSaveTransaction(e) {
  e.preventDefault();

  const isIncome = document.getElementById('tx-type-income').getAttribute('data-active') === 'true';
  const type = isIncome ? 'income' : 'expense';

  const txData = {
    title: document.getElementById('tx-title').value.trim(),
    amount: parseFloat(document.getElementById('tx-amount').value),
    type,
    category: document.getElementById('tx-category').value,
    date: document.getElementById('tx-date').value,
    payment_method: document.getElementById('tx-payment').value,
    notes: document.getElementById('tx-notes').value.trim()
  };

  try {
    if (state.editingTxId) {
      await API.updateTransaction(state.editingTxId, txData);
      showToast('Transaction updated successfully!', 'success');
    } else {
      await API.createTransaction(txData);
      showToast(`${type === 'income' ? 'Income' : 'Expense'} added successfully!`, 'success');
    }

    closeTransactionModal();
    refreshDashboardStats();
    loadBudgets();
    loadTransactions();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

window.editTransaction = async (id) => {
  try {
    const res = await API.getTransaction(id);
    openTransactionModal(res.data.type, res.data);
  } catch (err) {
    showToast(err.message, 'error');
  }
};

window.deleteTransaction = async (id) => {
  if (!confirm('Are you sure you want to delete this financial record? This cannot be undone.')) {
    return;
  }

  try {
    await API.deleteTransaction(id);
    showToast('Transaction deleted successfully.', 'success');
    refreshDashboardStats();
    loadBudgets();
    loadTransactions();
  } catch (err) {
    showToast(err.message, 'error');
  }
};

// ===================================================================
// BUDGET GOALS MODAL & MANAGEMENT
// ===================================================================
function openBudgetModal() {
  const modal = document.getElementById('budget-modal');
  const catSelect = document.getElementById('budget-category');
  catSelect.innerHTML = EXPENSE_CATEGORIES.map(c => `<option value="${c}">${c}</option>`).join('');
  document.getElementById('budget-limit').value = '';
  modal.classList.add('active');
}

function closeBudgetModal() {
  document.getElementById('budget-modal').classList.remove('active');
}

async function handleSaveBudget(e) {
  e.preventDefault();
  const category = document.getElementById('budget-category').value;
  const limit = parseFloat(document.getElementById('budget-limit').value);

  try {
    await API.setBudget(category, limit);
    showToast(`Monthly budget for ${category} set!`, 'success');
    closeBudgetModal();
    loadBudgets();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// ===================================================================
// EXPORT & RESET DATA
// ===================================================================
async function handleExportCSV() {
  try {
    const res = await API.exportTransactions();
    const rows = res.data;

    if (!rows || rows.length === 0) {
      showToast('No transactions to export.', 'info');
      return;
    }

    const headers = ['ID', 'Date', 'Type', 'Category', 'Title', 'Amount', 'Payment Method', 'Notes'];
    const csvContent = [
      headers.join(','),
      ...rows.map(r => [
        r.id,
        `"${r.date}"`,
        `"${r.type.toUpperCase()}"`,
        `"${r.category}"`,
        `"${escapeQuotes(r.title)}"`,
        r.amount,
        `"${escapeQuotes(r.payment_method || '')}"`,
        `"${escapeQuotes(r.notes || '')}"`
      ].join(','))
    ].join('\n');

    downloadFile(csvContent, `expense_tracker_export_${new Date().toISOString().split('T')[0]}.csv`, 'text/csv');
    showToast('CSV export downloaded successfully!', 'success');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function handleExportJSON() {
  try {
    const res = await API.exportTransactions();
    const jsonStr = JSON.stringify(res.data, null, 2);
    downloadFile(jsonStr, `expense_tracker_export_${new Date().toISOString().split('T')[0]}.json`, 'application/json');
    showToast('JSON export downloaded successfully!', 'success');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function handleResetSeedData() {
  if (!confirm('Reset your financial data to the default sample records? This will overwrite your current entries with demonstration data.')) {
    return;
  }

  try {
    await API.resetSeedData();
    showToast('Sample financial records reset successfully!', 'success');
    loadDashboardData();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// ===================================================================
// HELPER UTILITIES
// ===================================================================
function populateCategoryDropdowns() {
  const filterSelect = document.getElementById('category-filter-select');
  const allCategories = ['All', ...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES];
  filterSelect.innerHTML = allCategories.map(c => `<option value="${c}">${c === 'All' ? 'All Categories' : c}</option>`).join('');
}

function getCategoryIcon(category) {
  const icons = {
    'Housing': 'fas fa-home',
    'Food & Dining': 'fas fa-utensils',
    'Transportation': 'fas fa-car',
    'Utilities': 'fas fa-bolt',
    'Entertainment': 'fas fa-film',
    'Shopping': 'fas fa-shopping-bag',
    'Healthcare': 'fas fa-heartbeat',
    'Subscriptions': 'fas fa-sync-alt',
    'Education': 'fas fa-graduation-cap',
    'Travel': 'fas fa-plane',
    'Salary': 'fas fa-money-bill-wave',
    'Freelance': 'fas fa-laptop-code',
    'Investments': 'fas fa-chart-line',
    'Business': 'fas fa-briefcase',
    'Gifts': 'fas fa-gift',
    'Refunds': 'fas fa-undo-alt'
  };
  return icons[category] || 'fas fa-receipt';
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-');
  const d = new Date(year, parseInt(month) - 1, day);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatCurrency(val, currency = '$') {
  return `${currency}${Number(val || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function escapeHtml(text) {
  if (!text) return '';
  return String(text).replace(/[&<>"']/g, m => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  }[m]));
}

function escapeQuotes(str) {
  return String(str || '').replace(/"/g, '""');
}

function downloadFile(content, fileName, contentType) {
  const blob = new Blob([content], { type: contentType });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(a.href);
}

// Toast Notifications
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;

  const iconMap = {
    success: 'fas fa-check-circle',
    error: 'fas fa-exclamation-circle',
    info: 'fas fa-info-circle'
  };

  toast.innerHTML = `
    <i class="${iconMap[type] || 'fas fa-info-circle'} toast-icon"></i>
    <div style="flex-grow: 1;">${escapeHtml(message)}</div>
  `;

  container.appendChild(toast);
  setTimeout(() => toast.classList.add('show'), 10);

  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

window.showToast = showToast;
