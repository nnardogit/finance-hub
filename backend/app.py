from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from database import Database
from models import Conto, Transazione, Investimento, Obiettivo
from datetime import datetime

app = FastAPI()

# Configurazione CORS - permette richieste dal frontend
# In produzione, sostituire "*" con il dominio specifico
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Inizializza la connessione al database
db = Database()


# --- Modelli Pydantic per validazione dati ---

class ContoCreate(BaseModel):
    nome: str
    tipo: str
    saldo: float = 0

class TransazioneCreate(BaseModel):
    conto_id: int
    tipo: str
    categoria: str
    importo: float
    descrizione: str = ""
    data: Optional[str] = None

class InvestimentoCreate(BaseModel):
    conto_id: int
    nome: str
    tipo: str
    importo_iniziale: float
    valore_attuale: float

class ObiettivoCreate(BaseModel):
    titolo: str
    descrizione: str = ""
    importo_target: float
    importo_attuale: float = 0

class ObiettivoUpdate(BaseModel):
    importo_attuale: float


# --- DASHBOARD ---

@app.get('/api/dashboard')
def get_dashboard():
    """Restituisce i dati aggregati per la dashboard principale"""
    conn = db.get_connection()
    cursor = conn.cursor()
    
    # Saldo totale di tutti i conti
    cursor.execute('SELECT SUM(saldo) as totale FROM conti')
    saldo_totale = cursor.fetchone()['totale'] or 0
    
    # Variazione del mese corrente (entrate - uscite)
    cursor.execute('''
        SELECT SUM(importo) as variazione 
        FROM transazioni 
        WHERE strftime('%Y-%m', data) = strftime('%Y-%m', 'now')
    ''')
    variazione_mensile = cursor.fetchone()['variazione'] or 0
    
    # Totale investimenti e rendimento
    cursor.execute('SELECT SUM(valore_attuale) as totale FROM investimenti')
    totale_investimenti = cursor.fetchone()['totale'] or 0
    
    cursor.execute('SELECT SUM(rendimento) as totale FROM investimenti')
    rendimento_investimenti = cursor.fetchone()['totale'] or 0
    
    # Calcola solo le uscite del mese corrente
    cursor.execute('''
        SELECT SUM(importo) as totale 
        FROM transazioni 
        WHERE tipo = 'uscita' AND strftime('%Y-%m', data) = strftime('%Y-%m', 'now')
    ''')
    spese_mensili = abs(cursor.fetchone()['totale'] or 0)
    
    # Conta obiettivi totali e completati
    cursor.execute('SELECT COUNT(*) as totale FROM obiettivi')
    totale_obiettivi = cursor.fetchone()['totale']
    
    cursor.execute('SELECT COUNT(*) as completati FROM obiettivi WHERE completato = 1')
    obiettivi_completati = cursor.fetchone()['completati']
    
    conn.close()
    
    return {
        'saldo_totale': round(saldo_totale, 2),
        'variazione_mensile': round(variazione_mensile, 2),
        'investimenti': {
            'totale': round(totale_investimenti, 2),
            'rendimento': round(rendimento_investimenti, 2)
        },
        'spese_mensili': round(spese_mensili, 2),
        'obiettivi': {
            'totale': totale_obiettivi,
            'completati': obiettivi_completati
        }
    }


# --- ENDPOINT CONTI ---

@app.get('/api/conti')
def get_conti():
    """Ottiene la lista di tutti i conti"""
    conn = db.get_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM conti ORDER BY created_at DESC')
    rows = cursor.fetchall()
    conn.close()
    
    conti = [Conto.from_row(row).to_dict() for row in rows]
    return conti

@app.get('/api/conti/{conto_id}')
def get_conto(conto_id: int):
    """Ottiene un singolo conto tramite ID"""
    conn = db.get_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM conti WHERE id = ?', (conto_id,))
    row = cursor.fetchone()
    conn.close()
    
    if row:
        return Conto.from_row(row).to_dict()
    raise HTTPException(status_code=404, detail='Conto non trovato')

@app.post('/api/conti', status_code=201)
def create_conto(conto: ContoCreate):
    """Crea un nuovo conto bancario"""
    conn = db.get_connection()
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO conti (nome, tipo, saldo) 
        VALUES (?, ?, ?)
    ''', (conto.nome, conto.tipo, conto.saldo))
    conn.commit()
    
    conto_id = cursor.lastrowid
    conn.close()
    
    return {'id': conto_id, 'message': 'Conto creato con successo'}

@app.delete('/api/conti/{conto_id}')
def delete_conto(conto_id: int):
    """Elimina un conto (solo se non ha transazioni associate)"""
    conn = db.get_connection()
    cursor = conn.cursor()
    
    # Verifica se ci sono transazioni collegate a questo conto
    cursor.execute('SELECT COUNT(*) as count FROM transazioni WHERE conto_id = ?', (conto_id,))
    transazioni_count = cursor.fetchone()['count']
    
    if transazioni_count > 0:
        conn.close()
        raise HTTPException(
            status_code=400, 
            detail='Impossibile eliminare: il conto ha transazioni associate'
        )
    
    cursor.execute('DELETE FROM conti WHERE id = ?', (conto_id,))
    conn.commit()
    
    rows_affected = cursor.rowcount
    conn.close()
    
    if rows_affected > 0:
        return {'message': 'Conto eliminato con successo'}
    raise HTTPException(status_code=404, detail='Conto non trovato')


# --- ENDPOINT TRANSAZIONI ---

@app.get('/api/transazioni')
def get_transazioni(limit: int = Query(50)):
    """Ottiene tutte le transazioni (con limite opzionale)"""
    conn = db.get_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM transazioni ORDER BY data DESC LIMIT ?', (limit,))
    rows = cursor.fetchall()
    conn.close()
    
    transazioni = [Transazione.from_row(row).to_dict() for row in rows]
    return transazioni

@app.get('/api/transazioni/conto/{conto_id}')
def get_transazioni_conto(conto_id: int):
    """Ottiene tutte le transazioni di un conto specifico"""
    conn = db.get_connection()
    cursor = conn.cursor()
    cursor.execute(
        'SELECT * FROM transazioni WHERE conto_id = ? ORDER BY data DESC', 
        (conto_id,)
    )
    rows = cursor.fetchall()
    conn.close()
    
    transazioni = [Transazione.from_row(row).to_dict() for row in rows]
    return transazioni

@app.post('/api/transazioni', status_code=201)
def create_transazione(transazione: TransazioneCreate):
    """Crea una nuova transazione e aggiorna il saldo del conto"""
    conn = db.get_connection()
    cursor = conn.cursor()
    
    # Inserisce la transazione nel database
    cursor.execute('''
        INSERT INTO transazioni (conto_id, tipo, categoria, importo, descrizione, data) 
        VALUES (?, ?, ?, ?, ?, ?)
    ''', (
        transazione.conto_id,
        transazione.tipo,
        transazione.categoria,
        transazione.importo,
        transazione.descrizione,
        transazione.data or datetime.now().isoformat()
    ))
    
    # Aggiorna automaticamente il saldo del conto
    # L'importo è già negativo per le uscite, quindi basta sommarlo
    cursor.execute('''
        UPDATE conti 
        SET saldo = saldo + ? 
        WHERE id = ?
    ''', (transazione.importo, transazione.conto_id))
    
    conn.commit()
    transazione_id = cursor.lastrowid
    conn.close()
    
    return {'id': transazione_id, 'message': 'Transazione creata con successo'}

@app.delete('/api/transazioni/{transazione_id}')
def delete_transazione(transazione_id: int):
    """Elimina una transazione"""
    conn = db.get_connection()
    cursor = conn.cursor()
    
    cursor.execute('DELETE FROM transazioni WHERE id = ?', (transazione_id,))
    conn.commit()
    
    rows_affected = cursor.rowcount
    conn.close()
    
    if rows_affected > 0:
        return {'message': 'Transazione eliminata con successo'}
    raise HTTPException(status_code=404, detail='Transazione non trovata')

@app.get('/api/transazioni/stats')
def get_transazioni_stats():
    """Calcola statistiche sulle spese per categoria (mese corrente)"""
    conn = db.get_connection()
    cursor = conn.cursor()
    
    # Raggruppa le uscite del mese per categoria
    cursor.execute('''
        SELECT categoria, SUM(importo) as totale, COUNT(*) as count
        FROM transazioni
        WHERE tipo = 'uscita' AND strftime('%Y-%m', data) = strftime('%Y-%m', 'now')
        GROUP BY categoria
        ORDER BY totale ASC
    ''')
    
    rows = cursor.fetchall()
    conn.close()
    
    # Converte gli importi negativi in positivi per la visualizzazione
    stats = [
        {
            'categoria': row['categoria'], 
            'totale': abs(row['totale']), 
            'count': row['count']
        } 
        for row in rows
    ]
    return stats

@app.get('/api/transazioni/chart')
def get_chart_data():
    """Prepara i dati per il grafico dell'andamento finanziario (ultimi 6 mesi)"""
    conn = db.get_connection()
    cursor = conn.cursor()
    
    # Query per ottenere entrate e uscite aggregate per mese
    cursor.execute('''
        SELECT 
            strftime('%Y-%m', data) as mese,
            SUM(CASE WHEN tipo = 'entrata' THEN importo ELSE 0 END) as entrate,
            SUM(CASE WHEN tipo = 'uscita' THEN ABS(importo) ELSE 0 END) as uscite
        FROM transazioni
        WHERE data >= date('now', '-6 months')
        GROUP BY strftime('%Y-%m', data)
        ORDER BY mese ASC
    ''')
    
    rows = cursor.fetchall()
    conn.close()
    
    # Formatta i dati per il frontend
    mesi = []
    entrate = []
    uscite = []
    
    mesi_nomi = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 
                 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic']
    
    for row in rows:
        # Converte YYYY-MM in nome mese abbreviato
        anno, mese_num = row['mese'].split('-')
        mese_nome = mesi_nomi[int(mese_num) - 1]
        
        mesi.append(mese_nome)
        entrate.append(round(row['entrate'], 2))
        uscite.append(round(row['uscite'], 2))
    
    return {
        'mesi': mesi,
        'entrate': entrate,
        'uscite': uscite
    }


# --- ENDPOINT INVESTIMENTI ---

@app.get('/api/investimenti')
def get_investimenti():
    """Ottiene la lista di tutti gli investimenti"""
    conn = db.get_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM investimenti ORDER BY data_inizio DESC')
    rows = cursor.fetchall()
    conn.close()
    
    investimenti = [Investimento.from_row(row).to_dict() for row in rows]
    return investimenti

@app.post('/api/investimenti', status_code=201)
def create_investimento(investimento: InvestimentoCreate):
    """Crea un nuovo investimento, preleva i fondi dal conto e registra la transazione"""
    conn = db.get_connection()
    cursor = conn.cursor()
    
    # Verifica che il conto esista
    cursor.execute('SELECT saldo FROM conti WHERE id = ?', (investimento.conto_id,))
    conto = cursor.fetchone()
    
    if not conto:
        conn.close()
        raise HTTPException(status_code=404, detail='Conto non trovato')
    
    # Verifica che ci siano fondi sufficienti
    if conto['saldo'] < investimento.importo_iniziale:
        conn.close()
        raise HTTPException(
            status_code=400, 
            detail=f'Fondi insufficienti. Saldo disponibile: €{conto["saldo"]:.2f}'
        )
    
    # Calcola il rendimento come differenza tra valore attuale e iniziale
    rendimento = investimento.valore_attuale - investimento.importo_iniziale
    
    # Inserisce l'investimento
    cursor.execute('''
        INSERT INTO investimenti (conto_id, nome, tipo, importo_iniziale, valore_attuale, rendimento) 
        VALUES (?, ?, ?, ?, ?, ?)
    ''', (
        investimento.conto_id,
        investimento.nome,
        investimento.tipo,
        investimento.importo_iniziale,
        investimento.valore_attuale,
        rendimento
    ))
    investimento_id = cursor.lastrowid
    
    # Crea una transazione di uscita per registrare il movimento
    cursor.execute('''
        INSERT INTO transazioni (conto_id, tipo, categoria, importo, descrizione, data) 
        VALUES (?, ?, ?, ?, ?, ?)
    ''', (
        investimento.conto_id,
        'uscita',
        'Investimento',
        -investimento.importo_iniziale,  # Importo negativo
        f'Investimento in {investimento.nome}',
        datetime.now().isoformat()
    ))

    # Aggiorna il saldo usando SOMMA ALGEBRICA (come le transazioni normali)
    cursor.execute('''
        UPDATE conti 
        SET saldo = saldo + ? 
        WHERE id = ?
    ''', (-investimento.importo_iniziale, investimento.conto_id))  # Passa valore negativo
    
    conn.commit()
    conn.close()
    
    return {'id': investimento_id, 'message': 'Investimento creato con successo'}

@app.delete('/api/investimenti/{investimento_id}')
def delete_investimento(investimento_id: int):
    """Elimina un investimento"""
    conn = db.get_connection()
    cursor = conn.cursor()
    
    cursor.execute('DELETE FROM investimenti WHERE id = ?', (investimento_id,))
    conn.commit()
    
    rows_affected = cursor.rowcount
    conn.close()
    
    if rows_affected > 0:
        return {'message': 'Investimento eliminato con successo'}
    raise HTTPException(status_code=404, detail='Investimento non trovato')


# --- ENDPOINT OBIETTIVI ---

@app.get('/api/obiettivi')
def get_obiettivi():
    """Ottiene tutti gli obiettivi (ordinati per completamento)"""
    conn = db.get_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM obiettivi ORDER BY completato, data_creazione DESC')
    rows = cursor.fetchall()
    conn.close()
    
    obiettivi = [Obiettivo.from_row(row).to_dict() for row in rows]
    return obiettivi

@app.post('/api/obiettivi', status_code=201)
def create_obiettivo(obiettivo: ObiettivoCreate):
    """Crea un nuovo obiettivo di risparmio"""
    conn = db.get_connection()
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO obiettivi (titolo, descrizione, importo_target, importo_attuale) 
        VALUES (?, ?, ?, ?)
    ''', (
        obiettivo.titolo,
        obiettivo.descrizione,
        obiettivo.importo_target,
        obiettivo.importo_attuale
    ))
    conn.commit()
    
    obiettivo_id = cursor.lastrowid
    conn.close()
    
    return {'id': obiettivo_id, 'message': 'Obiettivo creato con successo'}

@app.put('/api/obiettivi/{obiettivo_id}')
def update_obiettivo(obiettivo_id: int, obiettivo: ObiettivoUpdate):
    """Aggiorna l'importo di un obiettivo e segna come completato se raggiunto"""
    conn = db.get_connection()
    cursor = conn.cursor()
    
    # Aggiorna l'importo e controlla automaticamente se è stato raggiunto il target
    cursor.execute('''
        UPDATE obiettivi 
        SET importo_attuale = ?, 
            completato = CASE WHEN ? >= importo_target THEN 1 ELSE 0 END
        WHERE id = ?
    ''', (obiettivo.importo_attuale, obiettivo.importo_attuale, obiettivo_id))
    
    conn.commit()
    conn.close()
    
    return {'message': 'Obiettivo aggiornato con successo'}

@app.delete('/api/obiettivi/{obiettivo_id}')
def delete_obiettivo(obiettivo_id: int):
    """Elimina un obiettivo"""
    conn = db.get_connection()
    cursor = conn.cursor()
    
    cursor.execute('DELETE FROM obiettivi WHERE id = ?', (obiettivo_id,))
    conn.commit()
    
    rows_affected = cursor.rowcount
    conn.close()
    
    if rows_affected > 0:
        return {'message': 'Obiettivo eliminato con successo'}
    raise HTTPException(status_code=404, detail='Obiettivo non trovato')


# --- AVVIO SERVER ---

if __name__ == '__main__':
    import uvicorn
    print("Server FastAPI avviato su http://localhost:5000")
    print("Documentazione API disponibile su: http://localhost:5000/docs")
    uvicorn.run(app, host="0.0.0.0", port=5000)