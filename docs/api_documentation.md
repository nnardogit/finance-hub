# API Documentation - FinanceHub

**Base URL:** `http://localhost:5000/api`

---

## Dashboard

### GET /dashboard

Restituisce i dati aggregati della dashboard.

**Response:**

```json
{
  "saldo_totale": 17420.50,
  "variazione_mensile": 2374.60,
  "investimenti": {
    "totale": 28410.00,
    "rendimento": 5410.00
  },
  "spese_mensili": 125.40,
  "obiettivi": {
    "totale": 3,
    "completati": 1
  }
}
```

---

## Conti

### GET /conti

Ottiene tutti i conti bancari.

**Response:**

```json
[
  {
    "id": 1,
    "nome": "Conto Corrente Principale",
    "tipo": "Conto Corrente",
    "saldo": 5420.50,
    "created_at": "2025-01-15T10:00:00"
  }
]
```

### GET /conti/{conto_id}

Ottiene un singolo conto.

**Response:**

```json
{
  "id": 1,
  "nome": "Conto Corrente Principale",
  "tipo": "Conto Corrente",
  "saldo": 5420.50,
  "created_at": "2025-01-15T10:00:00"
}
```

### POST /conti

Crea un nuovo conto.

**Request Body:**

```json
{
  "nome": "Conto Risparmio",
  "tipo": "Conto Risparmio",
  "saldo": 10000.00
}
```

**Response:**

```json
{
  "id": 2,
  "message": "Conto creato con successo"
}
```

### DELETE /conti/{conto_id}

Elimina un conto (solo se non ha transazioni associate).

**Response:**

```json
{
  "message": "Conto eliminato con successo"
}
```

---

## Transazioni

### GET /transazioni

Ottiene tutte le transazioni (limite predefinito: 50).

**Query Parameters:**

- `limit` (optional): numero massimo di risultati

**Response:**

```json
[
  {
    "id": 1,
    "conto_id": 1,
    "tipo": "uscita",
    "categoria": "Shopping",
    "importo": -89.90,
    "descrizione": "Abbigliamento",
    "data": "2025-01-15T14:30:00"
  }
]
```

### GET /transazioni/conto/{conto_id}

Ottiene tutte le transazioni di un conto specifico.

**Response:**

```json
[
  {
    "id": 1,
    "conto_id": 1,
    "tipo": "entrata",
    "categoria": "Stipendio",
    "importo": 2500.00,
    "descrizione": "Stipendio mensile",
    "data": "2025-01-01T08:00:00"
  }
]
```

### POST /transazioni

Crea una nuova transazione e aggiorna il saldo del conto.

**Request Body:**

```json
{
  "conto_id": 1,
  "tipo": "uscita",
  "categoria": "Shopping",
  "importo": -50.00,
  "descrizione": "Acquisto online",
  "data": "2025-01-20T15:30:00"
}
```

**Note:**

- Per le uscite, l'importo deve essere negativo
- Il campo `data` è opzionale (default: now)

**Response:**

```json
{
  "id": 5,
  "message": "Transazione creata con successo"
}
```

### DELETE /transazioni/{transazione_id}

Elimina una transazione e ripristina il saldo del conto.

**Response:**

```json
{
  "message": "Transazione eliminata con successo"
}
```

### GET /transazioni/stats

Calcola statistiche sulle spese per categoria (mese corrente).

**Response:**

```json
[
  {
    "categoria": "Shopping",
    "totale": 89.90,
    "count": 3
  },
  {
    "categoria": "Transport",
    "totale": 35.50,
    "count": 2
  }
]
```

### GET /transazioni/chart

Prepara i dati per il grafico dell'andamento finanziario (ultimi 6 mesi).

**Response:**

```json
{
  "mesi": ["Gen", "Feb", "Mar", "Apr", "Mag", "Giu"],
  "entrate": [2500.00, 2500.00, 2800.00, 2500.00, 2500.00, 3000.00],
  "uscite": [1200.00, 1350.00, 1100.00, 1400.00, 1250.00, 1300.00]
}
```

---

## Investimenti

### GET /investimenti

Ottiene tutti gli investimenti.

**Response:**

```json
[
  {
    "id": 1,
    "conto_id": 1,
    "nome": "Portafoglio Azionario",
    "tipo": "Azioni",
    "importo_iniziale": 15000.00,
    "valore_attuale": 19960.00,
    "rendimento": 4960.00,
    "rendimento_percentuale": 33.07,
    "data_inizio": "2024-06-01T10:00:00"
  }
]
```

### POST /investimenti

Crea un nuovo investimento, preleva i fondi dal conto e registra la transazione.

**Request Body:**

```json
{
  "conto_id": 1,
  "nome": "ETF S&P 500",
  "tipo": "ETF",
  "importo_iniziale": 5000.00,
  "valore_attuale": 5200.00
}
```

**Note:**

- Verifica che il conto abbia fondi sufficienti
- Sottrae automaticamente l'importo dal saldo del conto
- Crea una transazione di tipo "uscita" con categoria "Investimento"

**Response:**

```json
{
  "id": 3,
  "message": "Investimento creato con successo"
}
```

### DELETE /investimenti/{investimento_id}

Elimina un investimento.

**Response:**

```json
{
  "message": "Investimento eliminato con successo"
}
```

---

## Obiettivi

### GET /obiettivi

Ottiene tutti gli obiettivi (ordinati per completamento).

**Response:**

```json
[
  {
    "id": 1,
    "titolo": "Vacanza estiva",
    "descrizione": "Viaggio in Grecia",
    "importo_target": 3000.00,
    "importo_attuale": 1200.00,
    "completato": false,
    "progresso": 40.00,
    "data_creazione": "2025-01-10T12:00:00"
  }
]
```

### POST /obiettivi

Crea un nuovo obiettivo di risparmio.

**Request Body:**

```json
{
  "titolo": "Nuovo laptop",
  "descrizione": "MacBook Pro",
  "importo_target": 2500.00,
  "importo_attuale": 0
}
```

**Response:**

```json
{
  "id": 4,
  "message": "Obiettivo creato con successo"
}
```

### PUT /obiettivi/{obiettivo_id}

Aggiorna l'importo di un obiettivo e segna come completato se raggiunto.

**Request Body:**

```json
{
  "importo_attuale": 1500.00
}
```

**Note:**

- Se `importo_attuale >= importo_target`, l'obiettivo viene automaticamente segnato come completato

**Response:**

```json
{
  "message": "Obiettivo aggiornato con successo"
}
```

### DELETE /obiettivi/{obiettivo_id}

Elimina un obiettivo.

**Response:**

```json
{
  "message": "Obiettivo eliminato con successo"
}
```

---

## Codici di Stato HTTP

- `200 OK` - Richiesta completata con successo
- `201 Created` - Risorsa creata con successo
- `400 Bad Request` - Errore nei dati inviati
- `404 Not Found` - Risorsa non trovata
- `500 Internal Server Error` - Errore del server

---

## Note

- Tutti gli endpoint restituiscono JSON
- Le date sono in formato ISO 8601
- Gli importi sono in formato decimale (es: 1234.56)
