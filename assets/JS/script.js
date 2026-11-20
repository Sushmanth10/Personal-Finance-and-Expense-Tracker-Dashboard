// State & Storage
let transactions = [];
let editingId = null;
let chartInstance = null;
let darkMode = false;

// DOM Elements
const categorySelect = document.getElementById('category-select');
const descriptionInput = document.getElementById('description-input');
const amountInput = document.getElementById('amount-input');
const addBtn = document.getElementById('add-btn');
const expensesList = document.getElementById('expenses-list');
const filterCategory = document.getElementById('filter-category');
const filterType = document.getElementById('filter-type');
const totalBalance = document.getElementById('total-balance');
const totalIncome = document.getElementById('total-income');
const totalExpense = document.getElementById('total-expense');
const transactionCount = document.getElementById('transaction-count');
const clearAllBtn = document.getElementById('clear-all-btn');
const themeToggle = document.getElementById('theme-toggle');
const themeIcon = document.getElementById('theme-icon');

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

function saveData() {
  localStorage.setItem('transactions', JSON.stringify(transactions));
}

function loadData() {
  const saved = localStorage.getItem('transactions');
  if (saved) {
    transactions = JSON.parse(saved);
  }
}

// Master Render
function renderAll() {
  renderStats();
  renderList();
  renderChart();
}

function renderStats() {
  const total = transactions.reduce((sum, t) => {
    return t.type === 'income' ? sum + t.amount : sum - t.amount;
  }, 0);

  const income = transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const expense = transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  totalBalance.textContent = `₹${total.toFixed(2)}`;
  totalIncome.textContent = `₹${income.toFixed(2)}`;
  totalExpense.textContent = `₹${expense.toFixed(2)}`;
  transactionCount.textContent = transactions.length;
}

function getFilteredTransactions() {
  const category = filterCategory.value;
  const type = filterType.value;

  return transactions.filter((t) => {
    if (category !== 'all' && t.category !== category) return false;
    if (type !== 'all' && t.type !== type) return false;
    return true;
  });
}

function renderList() {
  const filtered = getFilteredTransactions();

  if (filtered.length === 0) {
    expensesList.innerHTML = `<div class="no-expenses">No transactions match your filter.</div>`;
    return;
  }

  // Sort by date descending
  const sorted = [...filtered].sort((a, b) => new Date(b.date) - new Date(a.date));

  let html = '';
  sorted.forEach((t) => {
    const isIncome = t.type === 'income';
    const amountClass = isIncome ? 'income-amount' : '';
    const sign = isIncome ? '+' : '-';

    html += `
      <div class="expense-item" data-id="${t.id}">
        <div class="expense-info">
          <h4>${t.description}</h4>
          <div class="expense-meta">
            <span class="category-badge">${t.category}</span>
            <span>${formatDate(t.date)}</span>
            <span style="text-transform: capitalize;">${t.type}</span>
          </div>
        </div>
        <div class="expense-amount ${amountClass}">
          ${sign}₹${t.amount.toFixed(2)}
        </div>
        <div class="expense-actions">
          <button class="edit-btn" data-id="${t.id}" title="Edit">
            <i class="fas fa-pen"></i>
          </button>
          <button class="delete-btn" data-id="${t.id}" title="Delete">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </div>
    `;
  });

  expensesList.innerHTML = html;

  expensesList.querySelectorAll('.delete-btn').forEach((button) => {
    button.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = button.dataset.id;
      if (confirm('Delete this transaction?')) {
        transactions = transactions.filter((t) => t.id !== id);
        saveData();
        if (editingId === id) {
          clearForm();
        }
        renderAll();
      }
    });
  });

  expensesList.querySelectorAll('.edit-btn').forEach((button) => {
    button.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = button.dataset.id;
      const t = transactions.find((tr) => tr.id === id);

      if (t) {
        editingId = id;
        descriptionInput.value = t.description;
        amountInput.value = t.amount;
        categorySelect.value = t.category;

        document.querySelectorAll('input[name="type"]').forEach((r) => {
          r.checked = r.value === t.type;
        });

        addBtn.innerHTML = `<i class="fas fa-save"></i> Update`;
        addBtn.style.background = 'var(--warning)';
        document.querySelector('.add-form').scrollIntoView({ behavior: 'smooth' });
      }
    });
  });
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function renderChart() {
  const ctx = document.getElementById('category-chart').getContext('2d');

  // Aggregate expenses by category
  const expenses = transactions.filter((t) => t.type === 'expense');
  const categoryMap = {};

  expenses.forEach((t) => {
    categoryMap[t.category] = (categoryMap[t.category] || 0) + t.amount;
  });

  const labels = Object.keys(categoryMap);
  const data = Object.values(categoryMap);
  const colors = [
    '#3b82f6',
    '#10b981',
    '#ef4444',
    '#8b5cf6',
    '#f59e0b',
    '#ec4899',
    '#14b8a6',
    '#f97316',
    '#6b7280',
  ];

  if (chartInstance) {
    chartInstance.destroy();
  }

  if (labels.length === 0) {
    chartInstance = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['No Data'],
        datasets: [
          {
            data: [1],
            backgroundColor: ['#e5e7eb'],
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom' },
        },
        cutout: '70%',
      },
    });
    return;
  }

  chartInstance = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: labels,
      datasets: [
        {
          data: data,
          backgroundColor: colors.slice(0, labels.length),
          borderWidth: 0,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            boxWidth: 12,
            font: { size: 11 },
            padding: 12,
            color: getComputedStyle(document.documentElement)
              .getPropertyValue('--text-primary')
              .trim() || '#1a1a2a',
          },
        },
      },
      cutout: '65%',
    },
  });
}

function handleAdd() {
  const description = descriptionInput.value.trim();
  const amount = parseFloat(amountInput.value);
  const category = categorySelect.value;
  const type = document.querySelector('input[name="type"]:checked').value;

  if (!description) {
    alert('Please Enter Description');
    return;
  }

  if (isNaN(amount) || amount <= 0) {
    alert('Please Enter Amount');
    return;
  }

  if (editingId) {
    const index = transactions.findIndex((t) => t.id === editingId);
    if (index !== -1) {
      transactions[index].description = description;
      transactions[index].amount = amount;
      transactions[index].category = category;
      transactions[index].type = type;
      transactions[index].updatedAt = new Date().toISOString();
    }
    clearForm();
  } else {
    const newTransaction = {
      id: generateId(),
      description,
      amount,
      category,
      type,
      date: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
    transactions.push(newTransaction);
    clearForm();
  }

  saveData();
  renderAll();
}

function clearForm() {
  descriptionInput.value = '';
  amountInput.value = '';
  categorySelect.value = 'Food';
  document.querySelector('input[name="type"][value="expense"]').checked = true;
  editingId = null;
  addBtn.innerHTML = `<i class="fas fa-plus"></i> Add`;
  addBtn.style.background = '';
}

function clearAll() {
  if (transactions.length === 0) return;
  if (confirm('Delete all transactions? This cannot be undone.')) {
    transactions = [];
    saveData();
    clearForm();
    renderAll();
  }
}

themeToggle.addEventListener('click', () => {
  darkMode = !darkMode;
  document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
  themeIcon.className = darkMode ? 'fas fa-sun' : 'fas fa-moon';
  renderChart();
});

addBtn.addEventListener('click', handleAdd);

document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && e.target.closest('.add-form')) {
    handleAdd();
  }
});

filterCategory.addEventListener('change', renderList);
filterType.addEventListener('change', renderList);
clearAllBtn.addEventListener('click', clearAll);

loadData();
renderAll();
categorySelect.value = 'Food';
console.log('Expense Tracker Loaded Data:', transactions.length);