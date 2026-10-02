# FinanceFlow - Full-Stack Expense Tracker & Financial Analytics

A modern, responsive, and full-featured **Expense Tracker Web Application** developed for the **Auspify Full Stack Development Internship Program** (**Task 3 - Medium**).

---

## 📌 Project Overview
**Task 3: Expense Tracker Web Application**
> **Description:** Develop a web application to track income, expenses, and financial summaries.

### 🎯 Key Highlights:
- **Full CRUD for Financial Transactions**: Seamlessly record, categorize, update, and remove expenses and income streams.
- **Dynamic Data Visualizations**: Interactive cash flow bar chart (Income vs Expenses) and category breakdown doughnut chart powered by Chart.js.
- **Budget Goal Tracking**: Set category-level monthly budgets with real-time visual progress bars and over-budget warning alerts.
- **Secure Authentication System**: User registration, login with bcrypt password hashing, JWT authorization, and an evaluator **"One-Click Demo Login"**.
- **Search, Filters & Pagination**: Debounced keyword search, category filtering, date presets (All time, This Month, Last 30 Days, This Year), sorting, and server-side pagination.
- **Reporting & Data Export**: Instant one-click CSV and JSON data export for offline spreadsheet analysis.
- **Aesthetic UI / UX**: Premium dark/light mode toggle, glassmorphism design system, smooth micro-animations, and modern typography (Google Fonts *Outfit* & *Plus Jakarta Sans*).

---

## 🏗️ Project Architecture & Structure

```
expense-tracker/
├── database/
│   ├── db.js                     # SQLite connection, schema migrations & demo seeder
│   └── expense_tracker.db        # SQLite database file
├── middleware/
│   └── auth.js                   # JWT token authentication & route protection
├── controllers/
│   ├── authController.js         # Register, login, demo access, and profile updates
│   ├── transactionController.js  # CRUD, filtering, search, sorting & pagination
│   ├── statsController.js        # Summary cards, monthly trends & category breakdown
│   ├── budgetController.js       # Category budgets, spending comparison & alerts
│   └── systemController.js       # Seed data reset for quick demonstrations
├── routes/
│   ├── auth.js                   # /api/auth routes
│   ├── transactions.js           # /api/transactions routes
│   ├── stats.js                  # /api/stats routes
│   ├── budgets.js                # /api/budgets routes
│   └── system.js                 # /api/system routes
├── public/
│   ├── index.html                # Semantic, accessible, and responsive dashboard UI
│   ├── css/
│   │   └── style.css             # Vanilla CSS design system with custom properties & themes
│   └── js/
│       ├── api.js                # Modular REST API client with JWT storage
│       ├── charts.js             # Chart.js visual renderers with theme support
│       └── app.js                # Application state, events, modals, and export logic
├── server.js                     # Express.js application entrypoint & static server
├── package.json                  # Dependencies & start scripts
└── README.md                     # Comprehensive project documentation
```

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v16 or higher)
- [npm](https://www.npmjs.com/) (bundled with Node.js)

### Installation
1. Clone this repository or open the project directory:
   ```bash
   cd expense-tracker
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the application:
   ```bash
   npm start
   ```
   Or run in development watch mode:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to:
   ```
   http://localhost:5000
   ```

---

## 🔑 Demo Account (Instant Access)
For instant evaluation and testing without registering a new account:
- **Email:** `demo@auspify.com`
- **Password:** `demo1234`
- *Or simply click the **"One-Click Demo Login"** button on the welcome screen.*

---

## 📡 REST API Reference

### 🔐 Authentication (`/api/auth`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/auth/register` | Register new user account | No |
| `POST` | `/api/auth/login` | Log in with email & password | No |
| `POST` | `/api/auth/demo-login` | Instant demo login for evaluation | No |
| `GET` | `/api/auth/profile` | Get current user's profile | Yes (Bearer Token) |
| `PUT` | `/api/auth/profile` | Update profile information | Yes (Bearer Token) |

### 💳 Transactions (`/api/transactions`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/transactions` | Query transactions (search, filter, sort, page) | Yes |
| `GET` | `/api/transactions/:id` | Get single transaction details | Yes |
| `POST` | `/api/transactions` | Create new expense or income record | Yes |
| `PUT` | `/api/transactions/:id` | Update existing transaction record | Yes |
| `DELETE`| `/api/transactions/:id` | Delete transaction record | Yes |
| `GET` | `/api/transactions/export`| Fetch all transactions for CSV/JSON export | Yes |

### 📊 Financial Reports & Summaries (`/api/stats`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/stats` | Get lifetime summaries, monthly cash flow & category distributions | Yes |

### 🎯 Category Budgets (`/api/budgets`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/budgets` | Get category budgets with actual spending comparison | Yes |
| `POST` | `/api/budgets` | Set or update a monthly category budget limit | Yes |
| `DELETE`| `/api/budgets/:id` | Remove a category budget | Yes |

### 🔄 System (`/api/system`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/system/reset/seed` | Reset user data to initial sample seed records | Yes |

---

## 🎨 Design & Accessibility Features
- **Curated Harmonious Theme**: Deep obsidian surfaces (`#0b0f19`, `#111827`), emerald accents for income (`#10b981`), rose/crimson accents for expenses (`#f43f5e`), and indigo brand accents (`#6366f1`).
- **Glassmorphism & Micro-animations**: Subtle backdrop blur, interactive hover states, dynamic progress animations, and alert tags.
- **Theme Switcher**: Instant transition between Dark Mode and Light Mode with persistence in `localStorage`.
- **Responsive Layout**: Fluid experience optimized across desktop, tablet, and mobile displays.

---

## 📜 Auspify Internship Task Checklist
- [x] **Step 1:** Design dashboard screens (Modern UI with KPIs, charts, filters, and transaction tables).
- [x] **Step 2:** Create expense & income management APIs (Express RESTful endpoints with validation).
- [x] **Step 3:** Store financial records in a database (SQLite3 relational tables with foreign keys and cascade delete).
- [x] **Step 4:** Display reports and summaries (Lifetime net balance, monthly trends bar chart, category doughnut chart, and budget progress).
- [x] **Step 5:** Implement authentication (JWT-based secure tokens, password hashing via bcrypt, user data isolation, and demo login).