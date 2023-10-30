const express = require('express');
const { check, validationResult } = require('express-validator');
const sqlite3 = require('sqlite3').verbose();

const app = express();
app.use(express.json());

const db = new sqlite3.Database('agendamento.db');

// Crie a tabela para armazenar os agendamentos
db.run(`CREATE TABLE IF NOT EXISTS agendamento (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  data DATE,
  hora TIME,
  paciente TEXT,
  doutor TEXT,
  status TEXT
)`);

// Agendamento de consulta
app.post('/agendamento', [
  check('data').notEmpty(),
  check('hora').notEmpty(),
  check('paciente').notEmpty(),
  check('doutor').notEmpty(),
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { data, hora, paciente, doutor } = req.body;
  const status = 'marcado';

  const stmt = db.prepare('INSERT INTO agendamento (data, hora, paciente, doutor, status) VALUES (?, ?, ?, ?, ?)');
  stmt.run(data, hora, paciente, doutor, status, function(err) {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Erro ao agendar a consulta' });
    }

    res.status(201).json({ id: this.lastID });
  });
});

// Listagem de consultas agendadas
app.get('/agendamento', (req, res) => {
  db.all('SELECT * FROM agendamento', (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Erro ao buscar os agendamentos' });
    }
    res.json(rows);
  });
});

// Cancelamento de consulta
app.delete('/agendamento/:id', (req, res) => {
  const id = req.params.id;
  db.run('DELETE FROM agendamento WHERE id = ?', id, function(err) {
    if (err) {
      return res.status(500).json({ error: 'Erro ao cancelar a consulta' });
    }

    if (this.changes === 0) {
      return res.status(404).json({ error: 'Consulta não encontrada' });
    }

    res.sendStatus(204);
  });
});

// Inicie o servidor
const port = 3030;
app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});
