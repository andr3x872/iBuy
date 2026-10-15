let expenses = JSON.parse(localStorage.getItem('expenses')) || [];
let budgetLimit = parseFloat(localStorage.getItem('budgetLimit')) || 0;

const views = {
  dashboard: document.getElementById('dashboardView'),
  form: document.getElementById('formView'),
  settings: document.getElementById('settingsView')
};

const expensesList = document.getElementById('expensesList');
const searchFilter = document.getElementById('searchFilter');
const startDateFilter = document.getElementById('startDate');
const endDateFilter = document.getElementById('endDate');
const sortSelect = document.getElementById('sortSelect');
const displayTotal = document.getElementById('displayTotal');
const budgetInfo = document.getElementById('budgetInfo');
const budgetProgress = document.getElementById('budgetProgress');
const budgetLimitInput = document.getElementById('budgetLimitInput');

// Calcolo Sabato Passato e Prossimo Sabato
function getPreviousSaturday() {
  const d = new Date();
  d.setDate(d.getDate() - (d.getDay() === 6 ? 7 : d.getDay() + 1));
  return d.toISOString().split('T')[0];
}
function getNextSaturday() {
  const d = new Date();
  d.setDate(d.getDate() + (6 - d.getDay() === 0 ? 7 : 6 - d.getDay()));
  return d.toISOString().split('T')[0];
}

document.addEventListener('DOMContentLoaded', () => {
  // Imposta filtri data di default
  startDateFilter.value = getPreviousSaturday();
  endDateFilter.value = getNextSaturday();
  budgetLimitInput.value = budgetLimit > 0 ? budgetLimit : '';

  renderExpenses();
  
  searchFilter.addEventListener('input', renderExpenses);
  startDateFilter.addEventListener('change', renderExpenses);
  endDateFilter.addEventListener('change', renderExpenses);
  sortSelect.addEventListener('change', renderExpenses);
});

function renderExpenses() {
  const searchTerm = searchFilter.value.toLowerCase();
  const start = startDateFilter.value;
  const end = endDateFilter.value;
  const sortBy = sortSelect.value;

  let filtered = expenses.filter(exp => {
    const matchesSearch = 
      exp.testo.toLowerCase().includes(searchTerm) || 
      (exp.descrizione && exp.descrizione.toLowerCase().includes(searchTerm)) ||
      (exp.citta && exp.citta.toLowerCase().includes(searchTerm));
      
    const matchesStartDate = start === "" || exp.data >= start;
    const matchesEndDate = end === "" || exp.data <= end;
    
    return matchesSearch && matchesStartDate && matchesEndDate;
  });

  filtered.sort((a, b) => {
    if (sortBy === 'dataDesc') return new Date(b.data) - new Date(a.data);
    if (sortBy === 'dataAsc') return new Date(a.data) - new Date(b.data);
    if (sortBy === 'importoDesc') return b.importo - a.importo;
    if (sortBy === 'importoAsc') return a.importo - b.importo;
  });

  // Calcolo Totale e Budget
  const totale = filtered.reduce((somma, exp) => somma + exp.importo, 0);
  displayTotal.textContent = `€${totale.toFixed(2)}`;

  if (budgetLimit > 0) {
    budgetInfo.textContent = `Limite: €${budgetLimit.toFixed(2)}`;
    let perc = (totale / budgetLimit) * 100;
    budgetProgress.style.width = `${Math.min(perc, 100)}%`;
    if (perc > 100) budgetProgress.classList.add('over-budget');
    else budgetProgress.classList.remove('over-budget');
  } else {
    budgetInfo.textContent = `Limite: Non impostato`;
    budgetProgress.style.width = `0%`;
  }

  expensesList.innerHTML = '';
  if (filtered.length === 0) {
    expensesList.innerHTML = '<p style="text-align:center; color:#8e8e93; margin-top:20px;">Nessuna spesa nel periodo.</p>';
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

// --- CRUD ---
document.getElementById('expenseForm').addEventListener('submit', (e) => {
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
  document.getElementById('descrizione').value = exp.descrizione || '';
  document.getElementById('formTitle').textContent = 'Modifica Spesa';
  switchView('form');
}

// --- NAVIGAZIONE VIEWS ---
function switchView(viewName) {
  Object.keys(views).forEach(k => {
    if (k === viewName) views[k].classList.remove('hidden');
    else views[k].classList.add('hidden');
  });
}

document.getElementById('fabAdd').addEventListener('click', () => {
  document.getElementById('expenseForm').reset();
  document.getElementById('expenseId').value = '';
  document.getElementById('data').value = new Date().toISOString().split('T')[0];
  document.getElementById('formTitle').textContent = 'Nuova Spesa';
  switchView('form');
});
document.getElementById('btnSettings').addEventListener('click', () => switchView('settings'));
document.querySelectorAll('.btnCancel').forEach(btn => {
  btn.addEventListener('click', () => switchView('dashboard'));
});

function formatData(dateStr) {
  const parts = dateStr.split('-');
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

// --- IMPOSTAZIONI ---
document.getElementById('btnSaveBudget').addEventListener('click', () => {
  budgetLimit = parseFloat(budgetLimitInput.value) || 0;
  localStorage.setItem('budgetLimit', budgetLimit);
  alert('Limite aggiornato!');
  renderExpenses();
});

document.getElementById('btnExport').addEventListener('click', () => {
  if (expenses.length === 0) return alert('Nessuna spesa!');
  const headers = ['Data', 'Importo', 'Categoria', 'Citta', 'Descrizione'];
  const rows = [headers.join(';')];
  expenses.forEach(exp => {
    rows.push([
      exp.data,
      exp.importo.toString().replace('.', ','),
      `"${exp.testo.replace(/"/g, '""')}"`,
      `"${(exp.citta || '').replace(/"/g, '""')}"`,
      `"${(exp.descrizione || '').replace(/"/g, '""')}"`
    ].join(';'));
  });
  const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.setAttribute('download', `Spese_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
});

document.getElementById('csvFileInput').addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(evt) {
    const lines = evt.target.result.split('\n');
    let imported = 0;
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      
      // Regex base per ignorare i ; dentro le virgolette
      const cols = lines[i].split(/;(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(s => s.replace(/(^"\vert{}"$)/g, '').replace(/""/g, '"'));
      
      if (cols.length >= 3) {
        expenses.push({
          id: Date.now() + i, // Genera ID unici
          data: cols[0],
          importo: parseFloat(cols[1].replace(',', '.')),
          testo: cols[2],
          citta: cols[3] || '',
          descrizione: cols[4] || ''
        });
        imported++;
      }
    }
    localStorage.setItem('expenses', JSON.stringify(expenses));
    alert(`${imported} spese importate con successo!`);
    renderExpenses();
    e.target.value = ''; // Resetta l'input file
  };
  reader.readAsText(file);
});