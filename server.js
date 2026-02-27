const express = require('express');
const Database = require('better-sqlite3');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.json());
app.use(express.static(path.join(__dirname)));

// ── Database ─────────────────────────────────────────────
const db = new Database(path.join(__dirname, 'game.db'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS players (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL DEFAULT '小小英雄',
    created_at  TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS game_state (
    player_id   TEXT PRIMARY KEY,
    state       TEXT NOT NULL DEFAULT '{}',
    updated_at  TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (player_id) REFERENCES players(id)
  );
`);

const stmts = {
  createPlayer:    db.prepare(`INSERT INTO players (id, name) VALUES (?, ?)`),
  getPlayer:       db.prepare(`SELECT * FROM players WHERE id = ?`),
  getState:        db.prepare(`SELECT state FROM game_state WHERE player_id = ?`),
  upsertState:     db.prepare(`
    INSERT INTO game_state (player_id, state, updated_at)
    VALUES (?, ?, datetime('now'))
    ON CONFLICT(player_id) DO UPDATE SET state = excluded.state, updated_at = datetime('now')
  `),
  createWithState: db.transaction((id, name, state) => {
    stmts.createPlayer.run(id, name);
    stmts.upsertState.run(id, JSON.stringify(state));
  })
};

// ── API Routes ───────────────────────────────────────────

// Create player
app.post('/api/players', (req, res) => {
  const id = crypto.randomUUID();
  const name = req.body.name || '小小英雄';
  const initialState = req.body.state || {};
  try {
    stmts.createWithState(id, name, initialState);
    res.status(201).json({ id, name });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get player state
app.get('/api/players/:id/state', (req, res) => {
  const row = stmts.getState.get(req.params.id);
  if (!row) return res.status(404).json({ error: '玩家不存在' });
  try {
    res.json({ state: JSON.parse(row.state) });
  } catch {
    res.json({ state: {} });
  }
});

// Save player state
app.put('/api/players/:id/state', (req, res) => {
  const player = stmts.getPlayer.get(req.params.id);
  if (!player) return res.status(404).json({ error: '玩家不存在' });
  try {
    stmts.upsertState.run(req.params.id, JSON.stringify(req.body.state));
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get player info
app.get('/api/players/:id', (req, res) => {
  const player = stmts.getPlayer.get(req.params.id);
  if (!player) return res.status(404).json({ error: '玩家不存在' });
  res.json(player);
});

// ── Start ────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🌸 美乐蒂识字大冒险 服务器已启动: http://localhost:${PORT}`);
});
