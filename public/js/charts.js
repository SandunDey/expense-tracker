// ===================================================================
// EXPENSE TRACKER - CHARTS & DATA VISUALIZATION
// Auspify Full Stack Internship - Task 3 (Medium)
// ===================================================================

let monthlyTrendChartInstance = null;
let categoryDistributionChartInstance = null;

const ChartPalette = [
  '#6366f1', // Indigo
  '#ec4899', // Pink
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#06b6d4', // Cyan
  '#8b5cf6', // Purple
  '#f43f5e', // Rose
  '#14b8a6', // Teal
  '#eab308', // Yellow
  '#3b82f6'  // Blue
];

// Helper to format currency
function formatCurrency(val, currency = '$') {
  return `${currency}${Number(val || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// Render Monthly Cashflow Chart (Income vs Expense)
function renderMonthlyTrendChart(canvasId, trends, currency = '$') {
  const ctx = document.getElementById(canvasId);
  if (!ctx) return;

  if (monthlyTrendChartInstance) {
    monthlyTrendChartInstance.destroy();
  }

  const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
  const gridColor = isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)';
  const textColor = isDark ? '#94a3b8' : '#64748b';

  const labels = trends.map(t => {
    const [year, month] = t.month.split('-');
    const date = new Date(year, parseInt(month) - 1, 1);
    return date.toLocaleString('default', { month: 'short', year: '2-digit' });
  });

  const incomeData = trends.map(t => t.income);
  const expenseData = trends.map(t => t.expense);

  monthlyTrendChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels.length ? labels : ['No Data'],
      datasets: [
        {
          label: 'Income',
          data: incomeData.length ? incomeData : [0],
          backgroundColor: '#10b981',
          borderRadius: 6,
          borderSkipped: false,
          maxBarThickness: 32
        },
        {
          label: 'Expenses',
          data: expenseData.length ? expenseData : [0],
          backgroundColor: '#f43f5e',
          borderRadius: 6,
          borderSkipped: false,
          maxBarThickness: 32
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
          align: 'end',
          labels: {
            color: textColor,
            usePointStyle: true,
            boxWidth: 8,
            boxHeight: 8,
            font: { family: 'Plus Jakarta Sans', size: 12, weight: '500' }
          }
        },
        tooltip: {
          backgroundColor: isDark ? '#1e293b' : '#ffffff',
          titleColor: isDark ? '#f8fafc' : '#0f172a',
          bodyColor: isDark ? '#cbd5e1' : '#334155',
          borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
          borderWidth: 1,
          padding: 12,
          boxPadding: 6,
          usePointStyle: true,
          callbacks: {
            label: function (context) {
              return ` ${context.dataset.label}: ${formatCurrency(context.raw, currency)}`;
            }
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: textColor, font: { family: 'Plus Jakarta Sans', size: 11 } }
        },
        y: {
          grid: { color: gridColor },
          ticks: {
            color: textColor,
            font: { family: 'Plus Jakarta Sans', size: 11 },
            callback: (val) => `${currency}${val}`
          }
        }
      }
    }
  });
}

// Render Category Doughnut Chart (Expense Breakdown)
function renderCategoryDistributionChart(canvasId, categoryData, currency = '$') {
  const ctx = document.getElementById(canvasId);
  if (!ctx) return;

  if (categoryDistributionChartInstance) {
    categoryDistributionChartInstance.destroy();
  }

  const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
  const textColor = isDark ? '#94a3b8' : '#64748b';

  const labels = (categoryData || []).map(c => c.category);
  const values = (categoryData || []).map(c => c.total);

  if (labels.length === 0) {
    labels.push('No Expenses');
    values.push(1);
  }

  categoryDistributionChartInstance = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [
        {
          data: values,
          backgroundColor: ChartPalette.slice(0, labels.length),
          borderWidth: 2,
          borderColor: isDark ? '#111827' : '#ffffff',
          hoverOffset: 6
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '70%',
      plugins: {
        legend: {
          position: 'right',
          labels: {
            color: textColor,
            usePointStyle: true,
            boxWidth: 8,
            boxHeight: 8,
            font: { family: 'Plus Jakarta Sans', size: 12, weight: '500' }
          }
        },
        tooltip: {
          backgroundColor: isDark ? '#1e293b' : '#ffffff',
          titleColor: isDark ? '#f8fafc' : '#0f172a',
          bodyColor: isDark ? '#cbd5e1' : '#334155',
          borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
          borderWidth: 1,
          padding: 12,
          boxPadding: 6,
          callbacks: {
            label: function (context) {
              if (labels[0] === 'No Expenses') return ' No expenses recorded';
              return ` ${context.label}: ${formatCurrency(context.raw, currency)}`;
            }
          }
        }
      }
    }
  });
}

window.renderMonthlyTrendChart = renderMonthlyTrendChart;
window.renderCategoryDistributionChart = renderCategoryDistributionChart;
