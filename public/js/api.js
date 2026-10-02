// ===================================================================
// EXPENSE TRACKER - API CLIENT MODULE
// Auspify Full Stack Internship - Task 3 (Medium)
// ===================================================================

const API_BASE = '/api';

const API = {
  // Authentication & Token management
  getToken() {
    return localStorage.getItem('auspify_auth_token');
  },

  setToken(token) {
    if (token) {
      localStorage.setItem('auspify_auth_token', token);
    } else {
      localStorage.removeItem('auspify_auth_token');
    }
  },

  getCurrentUser() {
    const raw = localStorage.getItem('auspify_user');
    return raw ? JSON.parse(raw) : null;
  },

  setCurrentUser(user) {
    if (user) {
      localStorage.setItem('auspify_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('auspify_user');
    }
  },

  isAuthenticated() {
    return !!this.getToken();
  },

  logout() {
    this.setToken(null);
    this.setCurrentUser(null);
  },

  // Base HTTP Request Wrapper
  async request(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          // Token expired or invalid
          this.logout();
          window.dispatchEvent(new CustomEvent('auth:expired'));
        }
        throw new Error(data.message || 'An error occurred while communicating with the server.');
      }

      return data;
    } catch (err) {
      throw err;
    }
  },

  // Auth Endpoints
  async register(name, email, password, currency = '$') {
    const data = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, currency })
    });
    if (data.token) {
      this.setToken(data.token);
      this.setCurrentUser(data.user);
    }
    return data;
  },

  async login(email, password) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    if (data.token) {
      this.setToken(data.token);
      this.setCurrentUser(data.user);
    }
    return data;
  },

  async demoLogin() {
    const data = await this.request('/auth/demo-login', {
      method: 'POST'
    });
    if (data.token) {
      this.setToken(data.token);
      this.setCurrentUser(data.user);
    }
    return data;
  },

  async getProfile() {
    return this.request('/auth/profile');
  },

  // Transaction Endpoints
  async getTransactions(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/transactions?${queryString}`);
  },

  async getTransaction(id) {
    return this.request(`/transactions/${id}`);
  },

  async createTransaction(transactionData) {
    return this.request('/transactions', {
      method: 'POST',
      body: JSON.stringify(transactionData)
    });
  },

  async updateTransaction(id, transactionData) {
    return this.request(`/transactions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(transactionData)
    });
  },

  async deleteTransaction(id) {
    return this.request(`/transactions/${id}`, {
      method: 'DELETE'
    });
  },

  async exportTransactions() {
    return this.request('/transactions/export');
  },

  // Financial Stats & Analytics Endpoints
  async getStats() {
    return this.request('/stats');
  },

  // Budget Endpoints
  async getBudgets() {
    return this.request('/budgets');
  },

  async setBudget(category, monthly_limit) {
    return this.request('/budgets', {
      method: 'POST',
      body: JSON.stringify({ category, monthly_limit })
    });
  },

  async deleteBudget(id) {
    return this.request(`/budgets/${id}`, {
      method: 'DELETE'
    });
  },

  // System & Reset
  async resetSeedData() {
    return this.request('/system/reset/seed', {
      method: 'POST'
    });
  }
};

window.API = API;
