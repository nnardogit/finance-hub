from datetime import datetime

class Conto:
    """
    Rappresenta un conto bancario (corrente, risparmio, carta prepagata, ecc.)
    """
    def __init__(self, id=None, nome=None, tipo=None, saldo=0.0, created_at=None):
        self.id = id
        self.nome = nome
        self.tipo = tipo
        self.saldo = saldo
        self.created_at = created_at or datetime.now()
    
    def to_dict(self):
        """Converte l'oggetto in un dizionario per la serializzazione JSON"""
        return {
            'id': self.id,
            'nome': self.nome,
            'tipo': self.tipo,
            'saldo': self.saldo,
            'created_at': self.created_at.isoformat() if isinstance(self.created_at, datetime) else self.created_at
        }
    
    @staticmethod
    def from_row(row):
        """Crea un oggetto Conto da una riga del database"""
        return Conto(
            id=row['id'],
            nome=row['nome'],
            tipo=row['tipo'],
            saldo=row['saldo'],
            created_at=row['created_at']
        )


class Transazione:
    """
    Rappresenta una transazione finanziaria (entrata o uscita)
    collegata a un conto specifico
    """
    def __init__(self, id=None, conto_id=None, tipo=None, categoria=None, 
                 importo=0.0, descrizione=None, data=None):
        self.id = id
        self.conto_id = conto_id
        self.tipo = tipo
        self.categoria = categoria
        self.importo = importo
        self.descrizione = descrizione
        self.data = data or datetime.now()
    
    def to_dict(self):
        """Converte l'oggetto in un dizionario per la serializzazione JSON"""
        return {
            'id': self.id,
            'conto_id': self.conto_id,
            'tipo': self.tipo,
            'categoria': self.categoria,
            'importo': self.importo,
            'descrizione': self.descrizione,
            'data': self.data.isoformat() if isinstance(self.data, datetime) else self.data
        }
    
    @staticmethod
    def from_row(row):
        """Crea un oggetto Transazione da una riga del database"""
        return Transazione(
            id=row['id'],
            conto_id=row['conto_id'],
            tipo=row['tipo'],
            categoria=row['categoria'],
            importo=row['importo'],
            descrizione=row['descrizione'],
            data=row['data']
        )


class Investimento:
    """
    Rappresenta un investimento finanziario (azioni, fondi, ETF, crypto, ecc.)
    Tiene traccia del valore iniziale, attuale e del rendimento
    """
    def __init__(self, id=None, conto_id=None, nome=None, tipo=None, importo_iniziale=0.0,
                valore_attuale=0.0, rendimento=0.0, data_inizio=None):
            self.id = id
            self.conto_id = conto_id
            self.nome = nome
            self.tipo = tipo
            self.importo_iniziale = importo_iniziale
            self.valore_attuale = valore_attuale
            self.rendimento = rendimento
            self.data_inizio = data_inizio or datetime.now()
    
    def calcola_rendimento_percentuale(self):
        """
        Calcola il rendimento percentuale dell'investimento
        Formula: (rendimento / importo_iniziale) * 100
        """
        if self.importo_iniziale == 0:
            return 0
        return (self.rendimento / self.importo_iniziale) * 100
    
    def to_dict(self):
        """Converte l'oggetto in un dizionario includendo il rendimento percentuale"""
        return {
            'id': self.id,
            'conto_id': self.conto_id,
            'nome': self.nome,
            'tipo': self.tipo,
            'importo_iniziale': self.importo_iniziale,
            'valore_attuale': self.valore_attuale,
            'rendimento': self.rendimento,
            'rendimento_percentuale': round(self.calcola_rendimento_percentuale(), 2),
            'data_inizio': self.data_inizio.isoformat() if isinstance(self.data_inizio, datetime) else self.data_inizio
        }
    
    @staticmethod
    def from_row(row):
        """Crea un oggetto Investimento da una riga del database"""
        return Investimento(
            id=row['id'],
            conto_id=row['conto_id'],
            nome=row['nome'],
            tipo=row['tipo'],
            importo_iniziale=row['importo_iniziale'],
            valore_attuale=row['valore_attuale'],
            rendimento=row['rendimento'],
            data_inizio=row['data_inizio']
        )


class Obiettivo:
    """
    Rappresenta un obiettivo di risparmio con un target da raggiungere
    Calcola automaticamente il progresso e lo stato di completamento
    """
    def __init__(self, id=None, titolo=None, descrizione=None, importo_target=0.0,
                 importo_attuale=0.0, completato=False, data_creazione=None):
        self.id = id
        self.titolo = titolo
        self.descrizione = descrizione
        self.importo_target = importo_target
        self.importo_attuale = importo_attuale
        self.completato = completato
        self.data_creazione = data_creazione or datetime.now()
    
    def calcola_progresso(self):
        """
        Calcola la percentuale di completamento dell'obiettivo
        Il valore è limitato a max 100% anche se si supera il target
        """
        if self.importo_target == 0:
            return 0
        return min((self.importo_attuale / self.importo_target) * 100, 100)
    
    def to_dict(self):
        """Converte l'oggetto in un dizionario includendo il progresso calcolato"""
        return {
            'id': self.id,
            'titolo': self.titolo,
            'descrizione': self.descrizione,
            'importo_target': self.importo_target,
            'importo_attuale': self.importo_attuale,
            'completato': bool(self.completato),
            'progresso': round(self.calcola_progresso(), 2),
            'data_creazione': self.data_creazione.isoformat() if isinstance(self.data_creazione, datetime) else self.data_creazione
        }
    
    @staticmethod
    def from_row(row):
        """Crea un oggetto Obiettivo da una riga del database"""
        return Obiettivo(
            id=row['id'],
            titolo=row['titolo'],
            descrizione=row['descrizione'],
            importo_target=row['importo_target'],
            importo_attuale=row['importo_attuale'],
            completato=row['completato'],
            data_creazione=row['data_creazione']
        )