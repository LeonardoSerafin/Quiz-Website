# Quiz Studio

Sito web statico che genera quiz da un input JSON standardizzato.

## Avvio

Apri `index.html` nel browser.

## Formato Input JSON

```json
{
  "title": "Titolo del quiz",
  "questions": [
    {
      "id": "q1",
      "text": "Testo della domanda",
      "options": ["Opzione A", "Opzione B", "Opzione C"],
      "correctIndex": 1
    }
  ]
}
```

## Regole

- `title`: stringa non vuota.
- `questions`: array con almeno una domanda.
- `text`: stringa non vuota.
- `options`: array di almeno 2 stringhe non vuote.
- `correctIndex`: indice numerico dell'opzione corretta (0-based).

## Funzionalita

- Import da JSON standardizzato.
- Import da file JSON locale.
- Navigazione tra domande.
- Barra di avanzamento percentuale durante il quiz.
- Salvataggio automatico progresso su `localStorage` con ripristino del quiz interrotto.
- Randomizzazione opzionale di domande e opzioni all'avvio.
- Uscita dal quiz in corso con conferma tramite modale.
- Calcolo punteggio finale.
- Revisione domanda per domanda con risposta corretta evidenziata.
