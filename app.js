let expenses = JSON.parse(localStorage.getItem('expenses')) || [];

const dashboardView = document.getElementById('dashboardView');
const formView = document.getElementById('formView');
const expensesList = document.getElementById('expensesList');
const expenseForm = document.getElementById('expenseForm');
const formTitle = document.getElementById('formTitle');

// Elementi aggiornati
const searchFilter = document.getElementById('searchFilter');
const dateFilter = document.getElementById('dateFilter'); // Era monthFilter
const sortSelect = document.getElementById('sortSelect');
const displayTotal = document.getElementById('displayTotal'); // Nuovo

document.addEventListener('DOMContentLoaded', () => {
  renderExpenses();
  
  searchFilter.addEventListener('input', renderExpenses);
  dateFilter.addEventListener('change', renderExpenses); // Era monthFilter
  sortSelect.addEventListener('change', renderExpenses);
});

function renderExpenses() {
  const searchTerm = searchFilter.value.toLowerCase();
  const filterDate = dateFilter.value; // Formato "YYYY-MM-DD"
  const sortBy = sortSelect.value;

  let filtered = expenses.filter(exp => {
    const matchesSearch = 
      exp.testo.toLowerCase().includes(searchTerm) || 
      exp.descrizione.toLowerCase().includes(searchTerm) ||
      (exp.citta && exp.citta.toLowerCase().includes(searchTerm));
      
    // Verifica esatta sul giorno (o mostra tutto se il filtro è vuoto)
    const matchesDate = filterDate === "" || exp.data === filterDate;
    
    return matchesSearch && matchesDate;
  });

  filtered.sort((a, b) => {
    if (sortBy === 'dataDesc') return new Date(b.data) - new Date(a.data);
    if (sortBy === 'dataAsc') return new Date(a.data) - new Date(b.data);
    if (sortBy === 'importoDesc') return b.importo - a.importo;
    if (sortBy === 'importoAsc') return a.importo - b.importo;
  });

  // --- NUOVO: Calcolo e aggiornamento del totale ---
  // Il metodo reduce somma tutti gli importi dell'array filtrato
  const totale = filtered.reduce((somma, exp) => somma + exp.importo, 0);
  displayTotal.textContent = `€${totale.toFixed(2)}`;
  // -------------------------------------------------

  expensesList.innerHTML = '';
  if (filtered.length === 0) {
    expensesList.innerHTML = '<p style="text-align:center; color:#8e8e93; margin-top:20px;">Nessuna spesa trovata.</p>';
    return;
  }

  filtered.forEach(exp => {
    const div = document.createElement('div');
    div.className = 'expense-card';
    
    const cityDisplay = exp.citta ? ` • 📍 ${exp.citta}` : '';
    
    div.innerHTML = `
      <div class="expense-header">
        <span class="expense-title">${exp.testo}</span>
        <span class="expense-amount">€${exp.importo.toFixed(2)}</span>
      </div>
      <div class="expense-date">${formatData(exp.data)}${cityDisplay}</div>
      ${exp.descrizione ? `<div class="expense-desc">${exp.descrizione}</div>` : ''}
      <div class="expense-actions">
        <button class="btn-small btn-edit" onclick="editExpense(${exp.id})">Modifica</button>
        <button class="btn-small btn-delete" onclick="deleteExpense(${exp.id})">Elimina</button>
      </div>
    `;
    expensesList.appendChild(div);
  });
}

// ... (Il resto del codice rimane identico per form, export CSV, delete, ecc.) ...

expenseForm.addEventListener('submit', (e) => {
  e.preventDefault();
  
  const idValue = document.getElementById('expenseId').value;
  const expenseData = {
    id: idValue ? parseInt(idValue) : Date.now(),
    data: document.getElementById('data').value,
    importo: parseFloat(document.getElementById('importo').value),
    testo: document.getElementById('testo').value,
    citta: document.getElementById('citta').value,
    descrizione: document.getElementById('descrizione').value
  };

  if (idValue) {
    const index = expenses.findIndex(e => e.id === parseInt(idValue));
    expenses[index] = expenseData;
  } else {
    expenses.push(expenseData);
  }

  localStorage.setItem('expenses', JSON.stringify(expenses));
  renderExpenses();
  switchView('dashboard');
});

function deleteExpense(id) {
  if(confirm('Vuoi davvero eliminare questa spesa?')) {
    expenses = expenses.filter(exp => exp.id !== id);
    localStorage.setItem('expenses', JSON.stringify(expenses));
    renderExpenses();
  }
}

function editExpense(id) {
  const exp = expenses.find(e => e.id === id);
  document.getElementById('expenseId').value = exp.id;
  document.getElementById('data').value = exp.data;
  document.getElementById('importo').value = exp.importo;
  document.getElementById('testo').value = exp.testo;
  document.getElementById('citta').value = exp.citta || ''; 
  document.getElementById('descrizione').value = exp.descrizione;
  
  formTitle.textContent = 'Modifica Spesa';
  switchView('form');
}

document.getElementById('fabAdd').addEventListener('click', () => {
  expenseForm.reset();
  document.getElementById('expenseId').value = '';
  document.getElementById('data').value = new Date().toISOString().split('T')[0];
  formTitle.textContent = 'Nuova Spesa';
  switchView('form');
});

document.getElementById('btnCancel').addEventListener('click', () => {
  switchView('dashboard');
});

function switchView(view) {
  if (view === 'dashboard') {
    dashboardView.classList.remove('hidden');
    formView.classList.add('hidden');
  } else {
    dashboardView.classList.add('hidden');
    formView.classList.remove('hidden');
  }
}

function formatData(dateStr) {
  const parts = dateStr.split('-');
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

// Codice per Esportazione CSV
document.getElementById('btnExport').addEventListener('click', exportToCSV);

function exportToCSV() {
  const expensesJSON = localStorage.getItem('expenses');
  if (!expensesJSON || JSON.parse(expensesJSON).length === 0) {
    alert('Nessuna spesa da esportare!');
    return;
  }
  const currentExpenses = JSON.parse(expensesJSON);

  const headers = ['Data', 'Importo', 'Categoria', 'Citta', 'Descrizione'];
  const csvRows = [];
  csvRows.push(headers.join(';')); 

  currentExpenses.forEach(exp => {
    const row = [
      exp.data,
      exp.importo.toString().replace('.', ','), 
      `"${exp.testo.replace(/"/g, '""')}"`,     
      `"${exp.citta ? exp.citta.replace(/"/g, '""') : ''}"`,
      `"${exp.descrizione ? exp.descrizione.replace(/"/g, '""') : ''}"`
    ];
    csvRows.push(row.join(';'));
  });

  const csvContent = csvRows.join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  const dateStr = new Date().toISOString().split('T')[0];
  link.setAttribute('download', `Spese_${dateStr}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
