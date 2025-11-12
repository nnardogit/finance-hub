import sqlite3
from datetime import datetime

class Database:
    def __init__(self, db_name='finance.db'):
        self.db_name = db_name
        self.init_db()
    
    def get_connection(self):
        """Crea una nuova connessione al database SQLite"""
        conn = sqlite3.connect(self.db_name)
        # Row factory permette di accedere alle colonne per nome invece che per indice
        conn.row_factory = sqlite3.Row
        return conn
    
    def init_db(self):
        """Inizializza il database creando le tabelle se non esistono"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        # Crea la tabella per i conti bancari
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS conti (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nome TEXT NOT NULL,
                tipo TEXT NOT NULL,
                saldo REAL NOT NULL DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Crea la tabella per le transazioni (entrate/uscite)
        # La foreign key collega ogni transazione al suo conto
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS transazioni (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                conto_id INTEGER NOT NULL,
                tipo TEXT NOT NULL,
                categoria TEXT NOT NULL,
                importo REAL NOT NULL,
                descrizione TEXT,
                data TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (conto_id) REFERENCES conti (id)
            )
        ''')
        
        # Crea la tabella per gli investimenti
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS investimenti (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                conto_id INTEGER NOT NULL,
                nome TEXT NOT NULL,
                tipo TEXT NOT NULL,
                importo_iniziale REAL NOT NULL,
                valore_attuale REAL NOT NULL,
                rendimento REAL NOT NULL,
                data_inizio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (conto_id) REFERENCES conti (id)
            )
        ''')
        
        # Crea la tabella per gli obiettivi di risparmio
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS obiettivi (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                titolo TEXT NOT NULL,
                descrizione TEXT,
                importo_target REAL NOT NULL,
                importo_attuale REAL DEFAULT 0,
                completato BOOLEAN DEFAULT 0,
                data_creazione TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        conn.commit()
        conn.close()
        
        # Decommentare questa riga per inserire dati di test al primo avvio
        # self._insert_sample_data()

    def _insert_sample_data(self):
        """Inserisce dati di esempio nel database per testing"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        # Verifica se il database è vuoto prima di inserire i dati
        cursor.execute('SELECT COUNT(*) as count FROM conti')
        if cursor.fetchone()['count'] == 0:
            
            # Inserisce due conti di esempio
            cursor.execute('''
                INSERT INTO conti (nome, tipo, saldo) VALUES
                ('Conto Corrente Principale', 'Conto Corrente', 5420.50),
                ('Conto Risparmio', 'Conto Risparmio', 12000.00)
            ''')
            
            # Inserisce alcune transazioni di esempio
            cursor.execute('''
                INSERT INTO transazioni (conto_id, tipo, categoria, importo, descrizione, data) VALUES
                (1, 'uscita', 'Shopping', -89.90, 'Abbigliamento', '2025-01-15 14:30:00'),
                (1, 'uscita', 'Transport', -35.50, 'Rifornimento carburante', '2025-01-12 09:15:00'),
                (1, 'entrata', 'Stipendio', 2500.00, 'Stipendio mensile', '2025-01-01 08:00:00'),
                (2, 'entrata', 'Risparmio', 500.00, 'Trasferimento mensile', '2025-01-01 10:00:00')
            ''')
            
            # Inserisce investimenti di esempio 
            cursor.execute('''
                INSERT INTO investimenti (conto_id, nome, tipo, importo_iniziale, valore_attuale, rendimento) VALUES
                (1, 'Portafoglio Azionario', 'Azioni', 15000.00, 19960.00, 4960.00),
                (2, 'Fondo Pensione', 'Fondo', 8000.00, 8450.00, 450.00)
            ''')
            
            # Inserisce obiettivi di esempio (uno già completato)
            cursor.execute('''
                INSERT INTO obiettivi (titolo, descrizione, importo_target, importo_attuale, completato) VALUES
                ('Vacanza estiva', 'Viaggio in Grecia', 3000.00, 1200.00, 0),
                ('Fondo emergenza', 'Riserva per imprevisti', 5000.00, 5000.00, 1),
                ('Nuovo laptop', 'MacBook Pro', 2500.00, 800.00, 0)
            ''')
            
            conn.commit()
        
        conn.close()