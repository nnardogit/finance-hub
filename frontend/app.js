// URL base dell'API backend
const API_BASE = 'http://localhost:5000/api';

// Variabili globali per salvare i dati caricati dall'API
let contiData = [];
let transazioniData = [];
let investimentiData = [];
let obiettiviData = [];

// Traccia la pagina corrente per non perdere il contesto dopo operazioni nei modal
let currentPage = 'dashboard';

// Stato per l'animazione in tempo reale degli investimenti
let investimentiAnimationData = {
    totale: 0,
    rendimento: 0,
    intervalId: null
};

// Dati storici per disegnare il grafico degli investimenti
let investimentiHistory = {
    values: [],
    maxPoints: 20,
    canvas: null,
    ctx: null
};

// ========================================
// UTILITY FUNCTIONS
// ========================================

// Formatta un numero come valuta in euro
const formatCurrency = (amount) => {
    return new Intl.NumberFormat('it-IT', {
        style: 'currency',
        currency: 'EUR'
    }).format(amount);
};

// Formatta una data nel formato italiano
const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('it-IT', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    }).format(date);
};

// ========================================
// GESTIONE NAVIGAZIONE E MODAL
// ========================================

// Cambia la pagina visualizzata nella dashboard
function showPage(pageName) {
    // Salva la pagina corrente
    currentPage = pageName;
    
    // Nasconde tutte le pagine
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    
    // Mostra solo la pagina richiesta
    document.getElementById(`${pageName}-page`).classList.add('active');
    
    // Aggiorna il menu laterale
    document.querySelectorAll('.navigation li').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.page === pageName) {
            item.classList.add('active');
        }
    });
    
    // Carica i dati specifici della pagina
    switch(pageName) {
        case 'dashboard':
            loadDashboard();
            break;
        case 'conti':
            loadConti();
            break;
        case 'transazioni':
            loadTransazioni();
            break;
        case 'investimenti':
            loadInvestimenti();
            break;
        case 'obiettivi':
            loadObiettivi();
            break;
    }

    localStorage.setItem('currentPage', pageName);
}

// Apre un modal specifico
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
        
        // Se è il modal transazione o investimento, popola la select dei conti
        if (modalId === 'modal-transazione') {
            populateContiSelect();
        } else if (modalId === 'modal-investimento') {
            populateContiSelectInvestimento();
        }
    }
}

// Chiude un modal
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
    }
}

// Popola la select dei conti nel form transazione
function populateContiSelect() {
    const select = document.getElementById('select-conto');
    select.innerHTML = '<option value="">Seleziona conto</option>';
    
    contiData.forEach(conto => {
        const option = document.createElement('option');
        option.value = conto.id;
        option.textContent = `${conto.nome} (${formatCurrency(conto.saldo)})`;
        select.appendChild(option);
    });
}

// Popola la select dei conti nel form investimento
function populateContiSelectInvestimento() {
    const select = document.getElementById('select-conto-investimento');
    select.innerHTML = '<option value="">Seleziona conto</option>';
    
    contiData.forEach(conto => {
        const option = document.createElement('option');
        option.value = conto.id;
        option.textContent = `${conto.nome} (${formatCurrency(conto.saldo)})`;
        select.appendChild(option);
    });
}

// ========================================
// ANIMAZIONE INVESTIMENTI
// ========================================

// Avvia l'animazione che simula variazioni in tempo reale degli investimenti
function startInvestimentiAnimation(totaleIniziale, rendimentoIniziale) {
    // Se non ci sono investimenti, non avviare l'animazione
    if (totaleIniziale === 0 || totaleIniziale === null) {
        console.log('Nessun investimento presente, animazione non avviata');
        stopInvestimentiAnimation();
        return;
    }
    
    investimentiAnimationData.totale = totaleIniziale;
    investimentiAnimationData.rendimento = rendimentoIniziale;
    
    // Pulisci eventuali animazioni precedenti
    if (investimentiAnimationData.intervalId) {
        clearInterval(investimentiAnimationData.intervalId);
    }
    
    // Avvia l'animazione ogni 4 secondi
    investimentiAnimationData.intervalId = setInterval(() => {
        animateInvestimentiValue();
    }, 4000);
    
    console.log('Animazione investimenti avviata');
}

// Ferma l'animazione degli investimenti
function stopInvestimentiAnimation() {
    if (investimentiAnimationData.intervalId) {
        clearInterval(investimentiAnimationData.intervalId);
        investimentiAnimationData.intervalId = null;
    }
}

// Simula una variazione casuale del valore degli investimenti
function animateInvestimentiValue() {
    // Genera variazione casuale tra -2% e +2%
    const variazione = (Math.random() - 0.5) * 0.04;
    
    const deltaRendimento = investimentiAnimationData.totale * variazione;
    const nuovoRendimento = investimentiAnimationData.rendimento + deltaRendimento;
    const nuovoTotale = investimentiAnimationData.totale + deltaRendimento;
    
    investimentiAnimationData.totale = nuovoTotale;
    investimentiAnimationData.rendimento = nuovoRendimento;
    
    updateInvestimentiCard(nuovoTotale, deltaRendimento);
}

// Aggiorna la card degli investimenti con i nuovi valori animati
function updateInvestimentiCard(nuovoTotale, deltaRendimento) {
    const totaleElement = document.getElementById('investimenti-totale');
    const rendimentoElement = document.getElementById('investimenti-rendimento');
    
    if (!totaleElement || !rendimentoElement) return;
    
    totaleElement.style.transition = 'all 0.5s ease';
    totaleElement.textContent = formatCurrency(nuovoTotale);
    
    const isPositivo = deltaRendimento >= 0;
    const arrow = isPositivo ? '↑' : '↓';
    const classe = isPositivo ? 'positive' : 'negative';
    
    rendimentoElement.className = `card-change ${classe}`;
    rendimentoElement.innerHTML = `
        <span class="arrow">${arrow}</span>
        ${isPositivo ? '+' : ''}${formatCurrency(deltaRendimento)}
    `;
    
    // Effetto pulsazione per attirare l'attenzione
    totaleElement.style.transform = 'scale(1.05)';
    setTimeout(() => {
        totaleElement.style.transform = 'scale(1)';
    }, 200);
    
    addInvestmentDataPoint(nuovoTotale);
}

// Aggiunge un punto dati allo storico per il grafico
function addInvestmentDataPoint(value) {
    investimentiHistory.values.push(value);
    
    // Mantieni solo gli ultimi 20 punti
    if (investimentiHistory.values.length > investimentiHistory.maxPoints) {
        investimentiHistory.values.shift();
    }
    
    drawInvestmentsChart();
}

// Disegna il grafico degli investimenti sul canvas
function drawInvestmentsChart() {
    const canvas = document.getElementById('investments-chart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    canvas.width = canvas.offsetWidth;
    canvas.height = 220;
    
    const padding = 50;
    const chartWidth = canvas.width - padding * 2;
    const chartHeight = canvas.height - padding * 2;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Se non ci sono abbastanza dati, mostra un messaggio
    if (investimentiHistory.values.length < 2) {
        ctx.fillStyle = '#64748b';
        ctx.font = '14px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Raccogliendo dati...', canvas.width / 2, canvas.height / 2);
        return;
    }
    
    const values = investimentiHistory.values;
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    const range = maxValue - minValue || 1;
    
    // Disegna la griglia di sfondo
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
        const y = padding + (chartHeight / 4) * i;
        ctx.beginPath();
        ctx.moveTo(padding, y);
        ctx.lineTo(canvas.width - padding, y);
        ctx.stroke();
        
        // Etichette sull'asse Y
        const value = maxValue - (range / 4) * i;
        ctx.fillStyle = '#64748b';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'right';
        const labelText = '€' + (value / 1000).toFixed(3) + 'k';
        ctx.fillText(labelText, padding - 5, y + 4);
    }
    
    // Crea gradiente per l'area sotto la linea
    const gradient = ctx.createLinearGradient(0, padding, 0, canvas.height - padding);
    gradient.addColorStop(0, 'rgba(16, 185, 129, 0.3)');
    gradient.addColorStop(1, 'rgba(16, 185, 129, 0.05)');
    
    // Disegna l'area
    ctx.beginPath();
    ctx.moveTo(padding, canvas.height - padding);
    
    values.forEach((value, index) => {
        const x = padding + (chartWidth / (values.length - 1)) * index;
        const y = canvas.height - padding - ((value - minValue) / range) * chartHeight;
        
        if (index === 0) {
            ctx.lineTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    });
    
    ctx.lineTo(canvas.width - padding, canvas.height - padding);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();
    
    // Disegna la linea principale
    ctx.beginPath();
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 2.5;
    
    values.forEach((value, index) => {
        const x = padding + (chartWidth / (values.length - 1)) * index;
        const y = canvas.height - padding - ((value - minValue) / range) * chartHeight;
        
        if (index === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    });
    
    ctx.stroke();
    
    // Disegna i punti sui valori
    ctx.fillStyle = '#10b981';
    values.forEach((value, index) => {
        const x = padding + (chartWidth / (values.length - 1)) * index;
        const y = canvas.height - padding - ((value - minValue) / range) * chartHeight;
        
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fill();
    });
}

// ========================================
// CARICAMENTO DASHBOARD
// ========================================

async function loadDashboard() {
    try {
        // Carica tutti i dati in parallelo
        await Promise.all([
            fetch(`${API_BASE}/conti`).then(r => r.json()).then(data => contiData = data),
            fetch(`${API_BASE}/transazioni`).then(r => r.json()).then(data => transazioniData = data),
            fetch(`${API_BASE}/investimenti`).then(r => r.json()).then(data => investimentiData = data),
            fetch(`${API_BASE}/obiettivi`).then(r => r.json()).then(data => obiettiviData = data)
        ]);
        
        updateDashboardStats();
        displayContiList();
        displayRecentTransactions();
        drawFinancialChart();
        displayCategoryExpenses();
        
        // Avvia l'animazione degli investimenti
        const totaleInvestimenti = investimentiData.reduce((sum, inv) => sum + inv.valore_attuale, 0);
        const totaleIniziale = investimentiData.reduce((sum, inv) => sum + inv.importo_iniziale, 0);
        const rendimento = totaleInvestimenti - totaleIniziale;
        startInvestimentiAnimation(totaleInvestimenti, rendimento);
        
    } catch (error) {
        console.error('Errore caricamento dashboard:', error);
    }
}

// Aggiorna le statistiche mostrate nelle card principali
function updateDashboardStats() {
    // Calcola saldo totale
    const saldoTotale = contiData.reduce((sum, conto) => sum + conto.saldo, 0);
    document.getElementById('saldo-totale').textContent = formatCurrency(saldoTotale);
    
    // Calcola variazione mensile (differenza tra entrate e uscite del mese)
    const now = new Date();
    const meseCorrente = now.getMonth();
    const annoCorrente = now.getFullYear();
    
    const transazioniMese = transazioniData.filter(t => {
        const data = new Date(t.data);
        return data.getMonth() === meseCorrente && data.getFullYear() === annoCorrente;
    });
    
    const entrate = transazioniMese.filter(t => t.tipo === 'entrata')
        .reduce((sum, t) => sum + t.importo, 0);
    const uscite = transazioniMese.filter(t => t.tipo === 'uscita')
        .reduce((sum, t) => sum + Math.abs(t.importo), 0);
    
    const variazione = entrate - uscite;
    const variazioneElement = document.getElementById('variazione-mensile');
    
    if (variazione >= 0) {
        variazioneElement.className = 'card-change positive';
        variazioneElement.innerHTML = `<span class="arrow">↑</span> +${formatCurrency(variazione)}`;
    } else {
        variazioneElement.className = 'card-change';
        variazioneElement.innerHTML = `<span class="arrow">↓</span> ${formatCurrency(variazione)}`;
    }
    
    // Calcola totale investimenti
    const totaleInvestimenti = investimentiData.reduce((sum, inv) => sum + inv.valore_attuale, 0);
    document.getElementById('investimenti-totale').textContent = formatCurrency(totaleInvestimenti);
    
    const totaleIniziale = investimentiData.reduce((sum, inv) => sum + inv.importo_iniziale, 0);
    const rendimento = totaleInvestimenti - totaleIniziale;
    
    const rendimentoElement = document.getElementById('investimenti-rendimento');
    if (rendimento >= 0) {
        rendimentoElement.className = 'card-change positive';
        rendimentoElement.innerHTML = `<span class="arrow">↑</span> +${formatCurrency(rendimento)}`;
    } else {
        rendimentoElement.className = 'card-change';
        rendimentoElement.innerHTML = `<span class="arrow">↓</span> ${formatCurrency(rendimento)}`;
    }
    
    // Spese mensili
    document.getElementById('spese-mensili').textContent = formatCurrency(uscite);
    
    // Obiettivi
    const obiettiviAttivi = obiettiviData.filter(obj => !obj.completato);
    const obiettiviCompletati = obiettiviData.filter(obj => obj.completato);
    
    document.getElementById('obiettivi-numero').textContent = obiettiviAttivi.length;
    document.getElementById('obiettivi-completati').textContent = `${obiettiviCompletati.length} completati`;
}

// Mostra la lista dei conti nella dashboard
function displayContiList() {
    const contiList = document.getElementById('conti-list');
    
    if (contiData.length === 0) {
        contiList.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">Nessun conto disponibile</p>';
        return;
    }
    
    contiList.innerHTML = contiData.slice(0, 3).map(conto => `
        <div class="list-item">
            <div class="list-item-icon blue">💳</div>
            <div class="list-item-content">
                <div class="list-item-title">${conto.nome}</div>
                <div class="list-item-subtitle">${conto.tipo}</div>
            </div>
            <div class="list-item-amount">${formatCurrency(conto.saldo)}</div>
        </div>
    `).join('');
}

// Mostra le transazioni più recenti
function displayRecentTransactions() {
    const transazioniRecenti = document.getElementById('transazioni-recenti');
    
    if (transazioniData.length === 0) {
        transazioniRecenti.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">Nessuna transazione</p>';
        return;
    }
    
    // Ordina per data decrescente e prendi le prime 5
    const recenti = [...transazioniData]
        .sort((a, b) => new Date(b.data) - new Date(a.data))
        .slice(0, 5);
    
    transazioniRecenti.innerHTML = recenti.map(trans => {
        const isPositive = trans.tipo === 'entrata';
        const colorClass = isPositive ? 'positive' : 'negative';
        const iconClass = isPositive ? 'green' : 'red';
        const icon = isPositive ? '💰' : '💸';
        
        return `
            <div class="list-item">
                <div class="list-item-icon ${iconClass}">${icon}</div>
                <div class="list-item-content">
                    <div class="list-item-title">${trans.descrizione || trans.categoria}</div>
                    <div class="list-item-subtitle">${formatDate(trans.data)}</div>
                </div>
                <div class="list-item-amount ${colorClass}">
                    ${isPositive ? '+' : ''}${formatCurrency(trans.importo)}
                </div>
            </div>
        `;
    }).join('');
}

// Disegna il grafico dell'andamento finanziario
function drawFinancialChart() {
    const canvas = document.getElementById('financial-chart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    canvas.width = canvas.offsetWidth;
    canvas.height = 220;
    
    // Raggruppa transazioni per mese negli ultimi 6 mesi
    const monthlyData = [];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const month = date.getMonth();
        const year = date.getFullYear();
        
        const transazioniMese = transazioniData.filter(t => {
            const tDate = new Date(t.data);
            return tDate.getMonth() === month && tDate.getFullYear() === year;
        });
        
        const entrate = transazioniMese
            .filter(t => t.tipo === 'entrata')
            .reduce((sum, t) => sum + t.importo, 0);
        
        const uscite = transazioniMese
            .filter(t => t.tipo === 'uscita')
            .reduce((sum, t) => sum + Math.abs(t.importo), 0);
        
        monthlyData.push({
            label: date.toLocaleDateString('it-IT', { month: 'short' }),
            entrate,
            uscite
        });
    }
    
    const padding = 50;
    const chartWidth = canvas.width - padding * 2;
    const chartHeight = canvas.height - padding * 2;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Trova il valore massimo per scalare il grafico
    const maxValue = Math.max(...monthlyData.map(d => Math.max(d.entrate, d.uscite)));
    
    if (maxValue === 0) {
        ctx.fillStyle = '#64748b';
        ctx.font = '14px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Nessun dato disponibile', canvas.width / 2, canvas.height / 2);
        return;
    }
    
    // Disegna griglia
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
        const y = padding + (chartHeight / 4) * i;
        ctx.beginPath();
        ctx.moveTo(padding, y);
        ctx.lineTo(canvas.width - padding, y);
        ctx.stroke();
    }
    
    // Larghezza delle barre
    const barWidth = (chartWidth / monthlyData.length) * 0.35;
    const spacing = chartWidth / monthlyData.length;
    
    // Disegna le barre
    monthlyData.forEach((data, index) => {
        const x = padding + spacing * index + spacing / 2;
        
        // Barra entrate (verde)
        const entrateHeight = (data.entrate / maxValue) * chartHeight;
        ctx.fillStyle = '#10b981';
        ctx.fillRect(x - barWidth, canvas.height - padding - entrateHeight, barWidth, entrateHeight);
        
        // Barra uscite (rosso)
        const usciteHeight = (data.uscite / maxValue) * chartHeight;
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(x, canvas.height - padding - usciteHeight, barWidth, usciteHeight);
        
        // Etichetta mese
        ctx.fillStyle = '#64748b';
        ctx.font = '11px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(data.label, x, canvas.height - padding + 20);
    });
    
    // Legenda - orizzontale e centrata
    const legendY = 15; // Posizione verticale più alta
    const centerX = canvas.width / 2;

    ctx.font = '12px sans-serif';
    ctx.fillStyle = '#64748b';

    // Entrate (a sinistra del centro)
    ctx.fillStyle = '#10b981';
    ctx.fillRect(centerX - 80, legendY, 15, 15);
    ctx.fillStyle = '#64748b';
    ctx.textAlign = 'left';
    ctx.fillText('Entrate', centerX - 60, legendY + 12);

    // Uscite (a destra del centro)
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(centerX + 10, legendY, 15, 15);
    ctx.fillStyle = '#64748b';
    ctx.fillText('Uscite', centerX + 30, legendY + 12);
}

// Mostra le spese divise per categoria
function displayCategoryExpenses() {
    const categoryExpenses = document.getElementById('category-expenses');
    
    // Calcola spese per categoria
    const now = new Date();
    const meseCorrente = now.getMonth();
    const annoCorrente = now.getFullYear();
    
    const usciteMese = transazioniData.filter(t => {
        const data = new Date(t.data);
        return t.tipo === 'uscita' && 
               data.getMonth() === meseCorrente && 
               data.getFullYear() === annoCorrente;
    });
    
    const categoryTotals = {};
    usciteMese.forEach(t => {
        if (!categoryTotals[t.categoria]) {
            categoryTotals[t.categoria] = 0;
        }
        categoryTotals[t.categoria] += Math.abs(t.importo);
    });
    
    const totaleUscite = Object.values(categoryTotals).reduce((a, b) => a + b, 0);
    
    if (totaleUscite === 0) {
        categoryExpenses.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">Nessuna spesa questo mese</p>';
        return;
    }
    
    // Ordina per importo decrescente
    const sortedCategories = Object.entries(categoryTotals)
        .sort((a, b) => b[1] - a[1]);
    
    categoryExpenses.innerHTML = sortedCategories.map(([categoria, importo]) => {
        const percentuale = (importo / totaleUscite) * 100;
        
        return `
            <div class="category-item">
                <div class="category-info">
                    <div class="category-name">${categoria}</div>
                    <div class="category-bar">
                        <div class="category-bar-fill" style="width: ${percentuale}%"></div>
                    </div>
                </div>
                <div class="category-amount">${formatCurrency(importo)}</div>
            </div>
        `;
    }).join('');
}

// ========================================
// GESTIONE CONTI
// ========================================

async function loadConti() {
    try {
        const response = await fetch(`${API_BASE}/conti`);
        contiData = await response.json();
        
        const contiGrid = document.getElementById('conti-grid');
        
        if (contiData.length === 0) {
            contiGrid.innerHTML = `
                <div style="text-align: center; padding: 3rem; color: var(--text-secondary);">
                    <div style="font-size: 3rem; margin-bottom: 1rem;">💳</div>
                    <p>Nessun conto disponibile. Creane uno nuovo!</p>
                </div>
            `;
            return;
        }
        
        contiGrid.innerHTML = contiData.map(conto => `
            <div class="list-item">
                <div class="list-item-icon blue">💳</div>
                <div class="list-item-content">
                    <div class="list-item-title">${conto.nome}</div>
                    <div class="list-item-subtitle">${conto.tipo}</div>
                </div>
                <div style="display: flex; align-items: center; gap: 1rem;">
                    <div class="list-item-amount">${formatCurrency(conto.saldo)}</div>
                    <button class="btn-delete" data-delete-conto="${conto.id}" title="Elimina conto">🗑️</button>
                </div>
            </div>
        `).join('');
        
        // Aggiungi event listener ai pulsanti elimina
        document.querySelectorAll('[data-delete-conto]').forEach(btn => {
            btn.addEventListener('click', () => deleteConto(btn.dataset.deleteConto));
        });
        
    } catch (error) {
        console.error('Errore caricamento conti:', error);
    }
}

async function addConto(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    
    const data = {
        nome: formData.get('nome'),
        tipo: formData.get('tipo'),
        saldo: parseFloat(formData.get('saldo'))
    };
    
    try {
        const response = await fetch(`${API_BASE}/conti`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        if (response.ok) {
            closeModal('modal-conto');
            event.target.reset();
            
            // Aggiorna la pagina corrente
            if (currentPage === 'conti') {
                await loadConti();
            } else if (currentPage === 'dashboard') {
                await loadDashboard();
            }
            
            showNotification('Conto creato con successo!');
        }
    } catch (error) {
        console.error('Errore creazione conto:', error);
        showNotification('Errore nella creazione del conto', 'error');
    }
}

async function deleteConto(id) {
    if (!confirm('Sei sicuro di voler eliminare questo conto?')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/conti/${id}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            // Aggiorna la pagina corrente
            if (currentPage === 'conti') {
                await loadConti();
            } else if (currentPage === 'dashboard') {
                await loadDashboard();
            }
            
            showNotification('Conto eliminato con successo!');
        }
    } catch (error) {
        console.error('Errore eliminazione conto:', error);
        showNotification('Errore nell\'eliminazione del conto', 'error');
    }
}

// ========================================
// GESTIONE TRANSAZIONI
// ========================================

async function loadTransazioni() {
    try {
        const response = await fetch(`${API_BASE}/transazioni`);
        transazioniData = await response.json();
        
        const transazioniList = document.getElementById('transazioni-list');
        
        if (transazioniData.length === 0) {
            transazioniList.innerHTML = `
                <div style="text-align: center; padding: 3rem; color: var(--text-secondary);">
                    <div style="font-size: 3rem; margin-bottom: 1rem;">📝</div>
                    <p>Nessuna transazione registrata. Aggiungine una!</p>
                </div>
            `;
            return;
        }
        
        // Ordina per data decrescente
        const sorted = [...transazioniData].sort((a, b) => new Date(b.data) - new Date(a.data));
        
        transazioniList.innerHTML = sorted.map(trans => {
            const isPositive = trans.tipo === 'entrata';
            const colorClass = isPositive ? 'positive' : 'negative';
            const iconClass = isPositive ? 'green' : 'red';
            const icon = isPositive ? '💰' : '💸';
            
            // Trova il nome del conto
            const conto = contiData.find(c => c.id === trans.conto_id);
            const contoNome = conto ? conto.nome : 'Conto sconosciuto';
            
            return `
                <div class="list-item">
                    <div class="list-item-icon ${iconClass}">${icon}</div>
                    <div class="list-item-content">
                        <div class="list-item-title">${trans.descrizione || trans.categoria}</div>
                        <div class="list-item-subtitle">${formatDate(trans.data)} • ${contoNome} • ${trans.categoria}</div>
                    </div>
                    <div style="display: flex; align-items: center; gap: 1rem;">
                        <div class="list-item-amount ${colorClass}">
                            ${isPositive ? '+' : ''}${formatCurrency(trans.importo)}
                        </div>
                        <button class="btn-delete" data-delete-transazione="${trans.id}" title="Elimina transazione">🗑️</button>
                    </div>
                </div>
            `;
        }).join('');
        
        // Aggiungi event listener ai pulsanti elimina
        document.querySelectorAll('[data-delete-transazione]').forEach(btn => {
            btn.addEventListener('click', () => deleteTransazione(btn.dataset.deleteTransazione));
        });
        
    } catch (error) {
        console.error('Errore caricamento transazioni:', error);
    }
}

async function addTransazione(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    
    let importo = parseFloat(formData.get('importo'));
    const tipo = formData.get('tipo');
    
    // Se è un'uscita, rendi l'importo negativo
    if (tipo === 'uscita' && importo > 0) {
        importo = -importo;
    }
    
    const data = {
        conto_id: parseInt(formData.get('conto_id')),
        tipo: tipo,
        categoria: formData.get('categoria'),
        importo: importo,
        descrizione: formData.get('descrizione'),
        data: new Date().toISOString().split('T')[0]
    };
    
    try {
        const response = await fetch(`${API_BASE}/transazioni`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        if (response.ok) {
            closeModal('modal-transazione');
            event.target.reset();
            
            // Aggiorna la pagina corrente
            if (currentPage === 'transazioni') {
                await loadTransazioni();
            } else if (currentPage === 'dashboard') {
                await loadDashboard();
            }
            
            showNotification('Transazione aggiunta con successo!');
        }
    } catch (error) {
        console.error('Errore creazione transazione:', error);
        showNotification('Errore nell\'aggiunta della transazione', 'error');
    }
}

async function deleteTransazione(id) {
    if (!confirm('Sei sicuro di voler eliminare questa transazione?')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/transazioni/${id}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            // Aggiorna la pagina corrente
            if (currentPage === 'transazioni') {
                await loadTransazioni();
            } else if (currentPage === 'dashboard') {
                await loadDashboard();
            }
            
            showNotification('Transazione eliminata con successo!');
        }
    } catch (error) {
        console.error('Errore eliminazione transazione:', error);
        showNotification('Errore nell\'eliminazione della transazione', 'error');
    }
}

// ========================================
// GESTIONE INVESTIMENTI
// ========================================

async function loadInvestimenti() {
    try {
        const response = await fetch(`${API_BASE}/investimenti`);
        investimentiData = await response.json();
        
        const investimentiGrid = document.getElementById('investimenti-grid');
        
        if (investimentiData.length === 0) {
            investimentiGrid.innerHTML = `
                <div style="text-align: center; padding: 3rem; color: var(--text-secondary); grid-column: 1 / -1;">
                    <div style="font-size: 3rem; margin-bottom: 1rem;">📈</div>
                    <p>Nessun investimento registrato. Creane uno!</p>
                </div>
            `;
            return;
        }
        
        investimentiGrid.innerHTML = investimentiData.map(inv => {
            const rendimento = inv.valore_attuale - inv.importo_iniziale;
            const percentuale = ((rendimento / inv.importo_iniziale) * 100).toFixed(2);
            const isPositivo = rendimento >= 0;
            const colorClass = isPositivo ? 'positive' : 'negative';
            
            return `
                <div class="card" style="position: relative;">
                    <div class="card-header">
                        <span>${inv.tipo}</span>
                        <span class="card-icon">📊</span>
                    </div>
                    <div class="card-amount" style="font-size: 1.5rem;">${inv.nome}</div>
                    <div style="margin: 1rem 0;">
                        <div style="font-size: 0.875rem; color: var(--text-secondary); margin-bottom: 0.25rem;">
                            Valore attuale
                        </div>
                        <div style="font-size: 1.75rem; font-weight: 700;">
                            ${formatCurrency(inv.valore_attuale)}
                        </div>
                    </div>
                    <div class="card-change ${colorClass}">
                        <span class="arrow">${isPositivo ? '↑' : '↓'}</span>
                        ${isPositivo ? '+' : ''}${formatCurrency(rendimento)} (${percentuale}%)
                    </div>
                    <button class="btn-delete-card" data-delete-investimento="${inv.id}" title="Elimina investimento">🗑️</button>
                </div>
            `;
        }).join('');
        
        // Aggiungi event listener ai pulsanti elimina
        document.querySelectorAll('[data-delete-investimento]').forEach(btn => {
            btn.addEventListener('click', () => deleteInvestimento(btn.dataset.deleteInvestimento));
        });
        
    } catch (error) {
        console.error('Errore caricamento investimenti:', error);
    }
}

async function addInvestimento(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    
    const data = {
        conto_id: parseInt(formData.get('conto_id')),
        nome: formData.get('nome'),
        tipo: formData.get('tipo'),
        importo_iniziale: parseFloat(formData.get('importo_iniziale')),
        valore_attuale: parseFloat(formData.get('valore_attuale'))
    };
    
    try {
        const response = await fetch(`${API_BASE}/investimenti`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        if (response.ok) {
            closeModal('modal-investimento');
            event.target.reset();
            
            // Aggiorna la pagina corrente
            if (currentPage === 'investimenti') {
                await loadInvestimenti();
            } else if (currentPage === 'dashboard') {
                await loadDashboard();
            }
            
            showNotification('Investimento creato e fondi prelevati dal conto!');
        } else {
            const error = await response.json();
            showNotification(error.detail || 'Errore nella creazione dell\'investimento', 'error');
        }
    } catch (error) {
        console.error('Errore creazione investimento:', error);
        showNotification('Errore nella creazione dell\'investimento', 'error');
    }
}

async function deleteInvestimento(id) {
    if (!confirm('Sei sicuro di voler eliminare questo investimento?')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/investimenti/${id}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            // Aggiorna la pagina corrente
            if (currentPage === 'investimenti') {
                await loadInvestimenti();
            } else if (currentPage === 'dashboard') {
                await loadDashboard();
            }
            
            showNotification('Investimento eliminato con successo!');
        }
    } catch (error) {
        console.error('Errore eliminazione investimento:', error);
        showNotification('Errore nell\'eliminazione dell\'investimento', 'error');
    }
}

// ========================================
// GESTIONE OBIETTIVI
// ========================================

async function loadObiettivi() {
    try {
        const response = await fetch(`${API_BASE}/obiettivi`);
        obiettiviData = await response.json();
        
        // Mostra solo gli obiettivi non completati
        const obiettiviAttivi = obiettiviData.filter(obj => !obj.completato);
        
        const obiettiviList = document.getElementById('obiettivi-list');
        
        if (obiettiviAttivi.length === 0) {
            obiettiviList.innerHTML = `
                <div style="text-align: center; padding: 3rem; color: var(--text-secondary);">
                    <div style="font-size: 3rem; margin-bottom: 1rem;">🎯</div>
                    <p>Nessun obiettivo attivo. Creane uno nuovo!</p>
                </div>
            `;
            return;
        }
        
        obiettiviList.innerHTML = obiettiviAttivi.map(obj => {
            const completato = obj.completato ? 'completed' : '';
            
            return `
                <div class="list-item">
                    <div style="flex: 1;">
                        <div style="display: flex; align-items: center; margin-bottom: 0.5rem;">
                            <div class="list-item-icon purple">🎯</div>
                            <div class="list-item-content">
                                <div class="list-item-title">${obj.titolo}</div>
                                <div class="list-item-subtitle">${obj.descrizione || 'Nessuna descrizione'}</div>
                            </div>
                        </div>
                        <div style="margin-left: 64px;">
                            <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem; font-size: 0.875rem;">
                                <span>${formatCurrency(obj.importo_attuale)} di ${formatCurrency(obj.importo_target)}</span>
                                <span style="font-weight: 600;">${obj.progresso}%</span>
                            </div>
                            <div class="progress-bar">
                                <div class="progress-fill ${completato}" style="width: ${obj.progresso}%"></div>
                            </div>
                        </div>
                    </div>
                    <div style="display: flex; gap: 0.5rem;">
                        <button class="btn-add-funds" data-add-funds="${obj.id}" data-importo-attuale="${obj.importo_attuale}" title="Aggiungi fondi">💰</button>
                        <button class="btn-delete" data-delete-obiettivo="${obj.id}" title="Elimina obiettivo">🗑️</button>
                    </div>
                </div>
            `;
        }).join('');
        
        // Aggiungi event listener
        document.querySelectorAll('[data-add-funds]').forEach(btn => {
            btn.addEventListener('click', () => {
                aggiungiFondi(btn.dataset.addFunds, parseFloat(btn.dataset.importoAttuale));
            });
        });
        
        document.querySelectorAll('[data-delete-obiettivo]').forEach(btn => {
            btn.addEventListener('click', () => deleteObiettivo(btn.dataset.deleteObiettivo));
        });
        
    } catch (error) {
        console.error('Errore caricamento obiettivi:', error);
    }
}

async function aggiungiFondi(obiettivoId, importoAttuale) {
    const importoDaAggiungere = prompt('Quanto vuoi aggiungere a questo obiettivo?', '0');
    
    if (importoDaAggiungere === null) {
        return;
    }
    
    const importo = parseFloat(importoDaAggiungere);
    
    if (isNaN(importo) || importo <= 0) {
        showNotification('Inserisci un importo valido maggiore di zero', 'error');
        return;
    }
    
    const nuovoImporto = importoAttuale + importo;
    
    try {
        const response = await fetch(`${API_BASE}/obiettivi/${obiettivoId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ importo_attuale: nuovoImporto })
        });
        
        if (response.ok) {
            // Aggiorna la pagina corrente
            if (currentPage === 'obiettivi') {
                await loadObiettivi();
            } else if (currentPage === 'dashboard') {
                await loadDashboard();
            }
            
            showNotification(`Aggiunti ${formatCurrency(importo)} all'obiettivo!`);
        } else {
            showNotification('Errore nell\'aggiornamento dell\'obiettivo', 'error');
        }
    } catch (error) {
        console.error('Errore aggiunta fondi:', error);
        showNotification('Errore nell\'aggiornamento dell\'obiettivo', 'error');
    }
}

async function addObiettivo(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    
    const data = {
        titolo: formData.get('titolo'),
        descrizione: formData.get('descrizione'),
        importo_target: parseFloat(formData.get('importo_target')),
        importo_attuale: parseFloat(formData.get('importo_attuale'))
    };
    
    try {
        const response = await fetch(`${API_BASE}/obiettivi`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        if (response.ok) {
            closeModal('modal-obiettivo');
            event.target.reset();
            
            // Aggiorna la pagina corrente
            if (currentPage === 'obiettivi') {
                await loadObiettivi();
            } else if (currentPage === 'dashboard') {
                await loadDashboard();
            }
            
            showNotification('Obiettivo creato con successo!');
        }
    } catch (error) {
        console.error('Errore creazione obiettivo:', error);
        showNotification('Errore nella creazione dell\'obiettivo', 'error');
    }
}

async function deleteObiettivo(id) {
    if (!confirm('Sei sicuro di voler eliminare questo obiettivo?')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/obiettivi/${id}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            // Aggiorna la pagina corrente
            if (currentPage === 'obiettivi') {
                await loadObiettivi();
            } else if (currentPage === 'dashboard') {
                await loadDashboard();
            }
            
            showNotification('Obiettivo eliminato con successo!');
        } else {
            showNotification('Errore nell\'eliminazione dell\'obiettivo', 'error');
        }
    } catch (error) {
        console.error('Errore eliminazione obiettivo:', error);
        showNotification('Errore nell\'eliminazione dell\'obiettivo', 'error');
    }
}

// ========================================
// NOTIFICHE
// ========================================

function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#10b981' : '#ef4444'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
        z-index: 2000;
        animation: slideIn 0.3s;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// ========================================
// INIZIALIZZAZIONE
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    // Carica la dashboard all'avvio
    const savedPage = localStorage.getItem('currentPage') || 'dashboard';
    showPage(savedPage);
    
    // Event listener per la navigazione tra le pagine
    document.querySelectorAll('[data-page]').forEach(item => {
        item.addEventListener('click', () => showPage(item.dataset.page));
    });
    
    // Event listener per aprire i modal
    document.querySelectorAll('[data-modal]').forEach(btn => {
        btn.addEventListener('click', () => openModal(btn.dataset.modal));
    });
    
    // Event listener per chiudere i modal (X)
    document.querySelectorAll('[data-close]').forEach(btn => {
        btn.addEventListener('click', () => closeModal(btn.dataset.close));
    });
    
    // Event listener per navigare con i pulsanti "Gestisci" e "Vedi tutte"
    document.querySelectorAll('[data-navigate]').forEach(btn => {
        btn.addEventListener('click', () => showPage(btn.dataset.navigate));
    });
    
    // Chiudi modal cliccando fuori
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    });
    
    // Event listener per i form
    document.getElementById('form-conto').addEventListener('submit', addConto);
    document.getElementById('form-transazione').addEventListener('submit', addTransazione);
    document.getElementById('form-investimento').addEventListener('submit', addInvestimento);
    document.getElementById('form-obiettivo').addEventListener('submit', addObiettivo);
});