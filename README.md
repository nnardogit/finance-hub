# FinanceHub - Sistema di Gestione Finanziaria Personale

> Progetto finale per la Laurea in Informatica  
> Un'applicazione web moderna per la gestione completa delle finanze personali

## Indice

- [Panoramica](#panoramica)
- [Caratteristiche](#caratteristiche)
- [Tecnologie Utilizzate](#tecnologie-utilizzate)
- [Architettura](#architettura)
- [Prerequisiti](#prerequisiti)
- [Installazione](#installazione)
- [Utilizzo](#utilizzo)
- [Struttura del Progetto](#struttura-del-progetto)
- [API Endpoints](#api-endpoints)
- [Database](#database)

---

## Panoramica

**FinanceHub** è un'applicazione web full-stack progettata per aiutare gli utenti a gestire le proprie finanze personali in modo semplice ed efficace. L'applicazione offre una dashboard intuitiva con visualizzazioni grafiche, gestione di conti bancari, tracciamento delle transazioni, monitoraggio degli investimenti e definizione di obiettivi di risparmio.

### Motivazione

Questo progetto nasce dall'esigenza di avere uno strumento centralizzato e personalizzabile per il monitoraggio finanziario personale, offrendo funzionalità tipicamente disponibili solo in applicazioni commerciali.

---

## Caratteristiche

### Dashboard Principale

- Panoramica finanziaria completa con visualizzazione immediata di saldo totale, investimenti, spese mensili e obiettivi
- Grafici interattivi per l'andamento finanziario, performance investimenti e analisi spese per categoria
- Interfaccia moderna con design responsive e animazioni fluide

### Gestione Conti

- Creazione e gestione di conti bancari multipli 
- Tracciamento automatico del saldo
- Aggiornamento in tempo reale

### Transazioni

- Registrazione di entrate e uscite
- Categorizzazione delle spese 
- Storico completo con filtri e ricerca
- Aggiornamento automatico dei saldi dei conti

### Investimenti

- Monitoraggio di portafogli di investimento
- Calcolo automatico dei rendimenti assoluti e percentuali
- Visualizzazione grafica delle performance
- Animazioni in tempo reale del valore del portafoglio

### Obiettivi di Risparmio

- Definizione di obiettivi con target personalizzati
- Barre di progresso visive per ogni obiettivo
- Marcatura automatica degli obiettivi completati
- Sistema di motivazione al risparmio

---

## Tecnologie Utilizzate

### Backend

- **[FastAPI](https://fastapi.tiangolo.com/)** - Framework web moderno e ad alte prestazioni per Python
- **[Pydantic](https://docs.pydantic.dev/)** - Validazione dati e settings management
- **[SQLite](https://www.sqlite.org/)** - Database SQL leggero e embedded
- **[Uvicorn](https://www.uvicorn.org/)** - ASGI server per FastAPI

### Frontend

- **HTML5** - Markup semantico
- **CSS3** - Styling moderno con variabili CSS e animazioni
- **JavaScript (ES6+)** - Logica client-side e interazioni

### Architettura

- **REST API** - Comunicazione client-server tramite HTTP/JSON
- **SPA (Single Page Application)** - Navigazione fluida senza ricaricamenti

---

## Architettura

Il progetto segue un'architettura **client-server separata**:

```
┌─────────────────┐         HTTP/REST         ┌─────────────────┐
│                 │  ◄────────────────────►   │                 │
│    FRONTEND     │      JSON Data            │     BACKEND     │
│  (HTML/CSS/JS)  │                           │    (FastAPI)    │
│                 │                           │                 │
└─────────────────┘                           └────────┬────────┘
                                                       │
                                                       │ SQL
                                                       ▼
                                              ┌─────────────────┐
                                              │   SQLite DB     │
                                              │  (finance.db)   │
                                              └─────────────────┘
```

### Pattern Utilizzati

- **MVC (Model-View-Controller)**: separazione tra logica di business, presentazione e controllo
- **Repository Pattern**: accesso al database tramite classe `Database` centralizzata
- **DTO (Data Transfer Objects)**: modelli Pydantic per validazione input/output

---

## Prerequisiti

Prima di iniziare, assicurati di avere installato:

- **Python 3.8 o superiore** - [Download Python](https://www.python.org/downloads/)
- **pip** - Package manager Python (solitamente incluso con Python)
- **Un browser moderno** - Chrome, Firefox, Safari o Edge (versioni recenti)

### Verifica Installazione

```bash
# Verifica versione Python
python --version  # o python3 --version

# Verifica pip
pip --version  # o pip3 --version
```

---

## Installazione

### 1. Clona il Repository

```bash
git clone https://github.com/nnardogit/finance-hub
cd finance-hub
```

### 2. Installa le Dipendenze Backend

```bash
cd backend
pip install -r requirements.txt
```

### 3. Inizializza il Database

Il database SQLite verrà creato automaticamente al primo avvio del server.

---

## Utilizzo

### Avvio del Backend

Dalla cartella `backend/`:

```bash
python app.py
```

Il server sarà disponibile su: `http://localhost:5000`

**Documentazione API interattiva**: `http://localhost:5000/docs`

### Avvio del Frontend

Dalla cartella `frontend/`:

#### Opzione 1: Server Python Integrato

```bash
python -m http.server 8000
```

Apri il browser e vai su: `http://localhost:8000`

#### Opzione 2: Live Server (VS Code)

Se usi Visual Studio Code:

1. Installa l'estensione **Live Server**
2. Fai click destro su `index.html`
3. Seleziona "Open with Live Server"

#### Opzione 3: Apertura Diretta

Puoi semplicemente aprire `index.html` direttamente nel browser (potrebbero esserci limitazioni CORS).

---

## Struttura del Progetto

```
finance-hub/
│
├── backend/                   # Backend FastAPI
│   ├── app.py                 # API endpoints e configurazione server
│   ├── database.py            # Gestione database SQLite
│   ├── models.py              # Modelli dati (Conto, Transazione, ecc.)
│   ├── requirements.txt       # Dipendenze Python
│   └── finance.db             # Database SQLite (creato automaticamente)
│
├── frontend/                   # Frontend Web
│   ├── index.html             # Struttura HTML dell'applicazione
│   ├── style.css              # Stili e layout
│   └── app.js                 # Logica JavaScript e chiamate API
│
├── docs/                      # Documentazione aggiuntiva
│   └── api_documentation.md   # Documentazione API dettagliata
│
└── README.md                  # Questo file
```

---

## API Endpoints

### Dashboard

| Metodo | Endpoint         | Descrizione                     |
| ------ | ---------------- | ------------------------------- |
| GET    | `/api/dashboard` | Dati aggregati per la dashboard |

### Conti

| Metodo | Endpoint          | Descrizione              |
| ------ | ----------------- | ------------------------ |
| GET    | `/api/conti`      | Lista tutti i conti      |
| GET    | `/api/conti/{id}` | Dettagli conto specifico |
| POST   | `/api/conti`      | Crea nuovo conto         |
| DELETE | `/api/conti/{id}` | Elimina conto            |

### Transazioni

| Metodo | Endpoint                      | Descrizione                      |
| ------ | ----------------------------- | -------------------------------- |
| GET    | `/api/transazioni`            | Lista transazioni (con limite)   |
| GET    | `/api/transazioni/conto/{id}` | Transazioni di un conto          |
| POST   | `/api/transazioni`            | Crea nuova transazione           |
| DELETE | `/api/transazioni/{id}`       | Elimina transazione              |
| GET    | `/api/transazioni/stats`      | Statistiche spese per categoria  |
| GET    | `/api/transazioni/chart`      | Dati per grafici (ultimi 6 mesi) |

### Investimenti

| Metodo | Endpoint                 | Descrizione                  |
| ------ | ------------------------ | ---------------------------- |
| GET    | `/api/investimenti`      | Lista tutti gli investimenti |
| POST   | `/api/investimenti`      | Crea nuovo investimento      |
| DELETE | `/api/investimenti/{id}` | Elimina investimento         |

### Obiettivi

| Metodo | Endpoint              | Descrizione               |
| ------ | --------------------- | ------------------------- |
| GET    | `/api/obiettivi`      | Lista tutti gli obiettivi |
| POST   | `/api/obiettivi`      | Crea nuovo obiettivo      |
| PUT    | `/api/obiettivi/{id}` | Aggiorna obiettivo        |
| DELETE | `/api/obiettivi/{id}` | Elimina obiettivo         |

Per la documentazione completa e interattiva, visita: `http://localhost:5000/docs`

---

## Database

### Schema Relazionale

Il database SQLite è composto da 4 tabelle principali:

#### **conti**

```sql
CREATE TABLE conti (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    tipo TEXT NOT NULL,
    saldo REAL NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### **transazioni**

```sql
CREATE TABLE transazioni (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    conto_id INTEGER NOT NULL,
    tipo TEXT NOT NULL,              -- 'entrata' o 'uscita'
    categoria TEXT NOT NULL,
    importo REAL NOT NULL,
    descrizione TEXT,
    data TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (conto_id) REFERENCES conti (id)
);
```

#### **investimenti**

```sql
CREATE TABLE investimenti (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    conto_id INTEGER NOT NULL,
    nome TEXT NOT NULL,
    tipo TEXT NOT NULL,
    importo_iniziale REAL NOT NULL,
    valore_attuale REAL NOT NULL,
    rendimento REAL NOT NULL,
    data_inizio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (conto_id) REFERENCES conti (id)
);
```

#### **obiettivi**

```sql
CREATE TABLE obiettivi (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    titolo TEXT NOT NULL,
    descrizione TEXT,
    importo_target REAL NOT NULL,
    importo_attuale REAL DEFAULT 0,
    completato BOOLEAN DEFAULT 0,
    data_creazione TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Relazioni

- Ogni **transazione** è collegata a un **conto** (relazione 1:N)
- Ogni **investimento** è collegato a un **conto** (relazione 1:N)
- Gli **obiettivi** sono indipendenti

---

## Risorse Utili

- [Documentazione FastAPI](https://fastapi.tiangolo.com/)
- [Guida SQLite](https://www.sqlite.org/docs.html)
- [MDN Web Docs](https://developer.mozilla.org/)
