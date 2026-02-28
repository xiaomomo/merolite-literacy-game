const express = require('express');
const Database = require('better-sqlite3');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.json());
app.use(express.static(path.join(__dirname)));

// ── Database ─────────────────────────────────────────────
const dbPath = process.env.DB_PATH || path.join(__dirname, 'game.db');
const db = new Database(dbPath);
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

// ── TTS (Qwen3-TTS via DashScope) ───────────────────────

const TTS_CACHE_DIR = process.env.TTS_CACHE_DIR || path.join(__dirname, 'tts-cache');
fs.mkdirSync(TTS_CACHE_DIR, { recursive: true });

const DASHSCOPE_API_KEY = process.env.DASHSCOPE_API_KEY || '';
const TTS_VOICE = process.env.TTS_VOICE || 'Cherry';
const TTS_API_URL = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation';

app.post('/api/tts', async (req, res) => {
  const text = (req.body.text || '').trim();
  if (!text) return res.status(400).json({ error: '缺少 text 参数' });

  if (!DASHSCOPE_API_KEY) {
    return res.status(503).json({ error: 'TTS 未配置：缺少 DASHSCOPE_API_KEY' });
  }

  const hash = crypto.createHash('md5').update(text).digest('hex');
  const cacheFile = path.join(TTS_CACHE_DIR, `${hash}.wav`);

  if (fs.existsSync(cacheFile)) {
    res.set('Content-Type', 'audio/wav');
    return res.sendFile(cacheFile);
  }

  try {
    const apiRes = await fetch(TTS_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DASHSCOPE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'qwen3-tts-flash',
        input: { text },
        parameters: { voice: TTS_VOICE },
      }),
    });

    const data = await apiRes.json();

    if (!apiRes.ok || data.code) {
      console.error('TTS API error:', apiRes.status, JSON.stringify(data));
      return res.status(502).json({ error: 'TTS API 调用失败', detail: data.message });
    }

    const audioUrl = data.output?.audio?.url;
    if (!audioUrl) {
      console.error('TTS: 响应中没有音频 URL', JSON.stringify(data).slice(0, 500));
      return res.status(502).json({ error: '无法解析 TTS 响应' });
    }

    const audioRes = await fetch(audioUrl);
    const audioBuffer = Buffer.from(await audioRes.arrayBuffer());
    fs.writeFileSync(cacheFile, audioBuffer);
    res.set('Content-Type', 'audio/wav');
    res.send(audioBuffer);
  } catch (err) {
    console.error('TTS error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── AI 配图 (通义万相) ──────────────────────────────────

const IMG_CACHE_DIR = process.env.IMG_CACHE_DIR || path.join(__dirname, 'img-cache');
fs.mkdirSync(IMG_CACHE_DIR, { recursive: true });

const WANX_API_URL = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text2image/image-synthesis';
const WANX_TASK_URL = 'https://dashscope.aliyuncs.com/api/v1/tasks';

app.get('/api/illustration/:char', async (req, res) => {
  const char = req.params.char;
  if (!char || char.length !== 1) return res.status(400).json({ error: '需要单个汉字' });
  if (!DASHSCOPE_API_KEY) return res.status(503).json({ error: '未配置 API Key' });

  const cacheFile = path.join(IMG_CACHE_DIR, `${char}.png`);
  if (fs.existsSync(cacheFile)) {
    return res.sendFile(cacheFile);
  }

  const word = req.query.word || char;
  const prompt = `一只三丽鸥风格的My Melody美乐蒂兔子角色——粉色头巾、蓝色蝴蝶结、白色圆脸、棕色椭圆形眼睛、小黄鼻子、白色身体——和"${word}"的场景在一起。画面中有一个醒目的粉色中文汉字"${char}"。画面生动体现"${word}"的含义。儿童绘本插画风格，粉色系，温暖明亮，可爱卡通，简洁背景`;

  try {
    const createRes = await fetch(WANX_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DASHSCOPE_API_KEY}`,
        'Content-Type': 'application/json',
        'X-DashScope-Async': 'enable',
      },
      body: JSON.stringify({
        model: 'wanx2.1-t2i-turbo',
        input: { prompt },
        parameters: { size: '512*512', n: 1 },
      }),
    });

    const createData = await createRes.json();
    const taskId = createData.output?.task_id;
    if (!taskId) {
      console.error('Illustration create error:', JSON.stringify(createData));
      return res.status(502).json({ error: '创建图片任务失败' });
    }

    const maxWait = 30000;
    const start = Date.now();
    while (Date.now() - start < maxWait) {
      await new Promise(r => setTimeout(r, 2000));
      const pollRes = await fetch(`${WANX_TASK_URL}/${taskId}`, {
        headers: { 'Authorization': `Bearer ${DASHSCOPE_API_KEY}` },
      });
      const pollData = await pollRes.json();
      const status = pollData.output?.task_status;

      if (status === 'SUCCEEDED') {
        const imgUrl = pollData.output?.results?.[0]?.url;
        if (imgUrl) {
          const imgRes = await fetch(imgUrl);
          const imgBuf = Buffer.from(await imgRes.arrayBuffer());
          fs.writeFileSync(cacheFile, imgBuf);
          res.set('Content-Type', 'image/png');
          return res.send(imgBuf);
        }
        return res.status(502).json({ error: '无法获取图片 URL' });
      }
      if (status === 'FAILED') {
        console.error('Illustration task failed:', JSON.stringify(pollData).slice(0, 300));
        return res.status(502).json({ error: '图片生成失败' });
      }
    }
    res.status(504).json({ error: '图片生成超时' });
  } catch (err) {
    console.error('Illustration error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── Start ────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🌸 美乐蒂识字大冒险 服务器已启动: http://localhost:${PORT}`);
  if (DASHSCOPE_API_KEY) {
    console.log(`🎙️  TTS 已启用 (voice: ${TTS_VOICE})`);
  } else {
    console.log('⚠️  TTS 未启用：请设置环境变量 DASHSCOPE_API_KEY');
  }
});
