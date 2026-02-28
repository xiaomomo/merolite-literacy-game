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

// GET 请求：浏览器可缓存，配合 prefetch 实现零延迟
app.get('/api/tts', async (req, res) => {
  const text = (req.query.t || '').trim();
  if (!text) return res.status(400).json({ error: '缺少 t 参数' });
  if (!DASHSCOPE_API_KEY) return res.status(503).json({ error: 'TTS 未配置' });

  const hash = crypto.createHash('md5').update(text).digest('hex');
  const cacheFile = path.join(TTS_CACHE_DIR, `${hash}.wav`);

  // 有缓存：直接返回，标记为浏览器可永久缓存
  if (fs.existsSync(cacheFile)) {
    res.set('Content-Type', 'audio/wav');
    res.set('Cache-Control', 'public, max-age=31536000, immutable');
    return res.sendFile(cacheFile);
  }

  // 无缓存：调 API 生成
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
      return res.status(502).json({ error: 'TTS 调用失败' });
    }

    const audioUrl = data.output?.audio?.url;
    if (!audioUrl) return res.status(502).json({ error: '无音频' });

    const audioRes = await fetch(audioUrl);
    const audioBuffer = Buffer.from(await audioRes.arrayBuffer());
    fs.writeFileSync(cacheFile, audioBuffer);
    res.set('Content-Type', 'audio/wav');
    res.set('Cache-Control', 'public, max-age=31536000, immutable');
    res.send(audioBuffer);
  } catch (err) {
    console.error('TTS error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// 兼容旧的 POST 接口（内部预热用）
app.post('/api/tts', (req, res) => {
  const text = (req.body.text || '').trim();
  if (!text) return res.status(400).json({ error: '缺少 text' });
  // 重定向到 GET
  res.redirect(307, `/api/tts?t=${encodeURIComponent(text)}`);
});

// ── AI 配图 (通义万相) ──────────────────────────────────

const IMG_CACHE_DIR = process.env.IMG_CACHE_DIR || path.join(__dirname, 'img-cache');
const PERSONAL_IMG_DIR = path.join(IMG_CACHE_DIR, 'personal');
fs.mkdirSync(IMG_CACHE_DIR, { recursive: true });
fs.mkdirSync(PERSONAL_IMG_DIR, { recursive: true });

const CHILD_DESC = process.env.CHILD_DESC
  || '一个6岁的中国小女孩芽芽，齐刘海短黑发、圆脸、大眼睛、微笑，穿粉色绣花汉服斗篷配白色毛绒领子';

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

// ── 芽芽专属配图 ────────────────────────────────────────

app.get('/api/personal-illustration/:char', async (req, res) => {
  const char = req.params.char;
  if (!char || char.length !== 1) return res.status(400).json({ error: '需要单个汉字' });
  if (!DASHSCOPE_API_KEY) return res.status(503).json({ error: '未配置 API Key' });

  const cacheFile = path.join(PERSONAL_IMG_DIR, `${char}.png`);
  if (fs.existsSync(cacheFile)) {
    return res.sendFile(cacheFile);
  }

  const word = req.query.word || char;
  const prompt = `${CHILD_DESC}，正在和"${word}"互动的温馨场景。画面中有一个醒目的粉色中文汉字"${char}"。画面生动体现"${word}"的含义——比如"${word}"相关的物品、动物或场景。儿童绘本水彩插画风格，温暖明亮，粉色系，柔和色调，充满童趣`;

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
        parameters: { size: '768*768', n: 1 },
      }),
    });

    const createData = await createRes.json();
    const taskId = createData.output?.task_id;
    if (!taskId) {
      console.error('Personal illustration error:', JSON.stringify(createData));
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
        console.error('Personal illustration failed:', JSON.stringify(pollData).slice(0, 300));
        return res.status(502).json({ error: '图片生成失败' });
      }
    }
    res.status(504).json({ error: '图片生成超时' });
  } catch (err) {
    console.error('Personal illustration error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── TTS 批量预热 ────────────────────────────────────────

const STATIC_PHRASES = [
  '选择你要学习的课本吧！',
  '选择你喜欢的游戏吧！捉迷藏，泡泡消除，拼图识字，还是听音选字？',
  '好的，玩捉迷藏！', '好的，玩泡泡消除！', '好的，玩拼图识字！', '好的，玩听音选字！',
  '每日惊喜！美乐蒂给你准备了小礼物！快点击打开礼物吧！',
  '再试试', '不对哦', '不对哦，再听一次', '出发！',
  '先完成前面的单元吧！字宝宝们需要你的帮助！',
  '爱心不够呢，继续冒险赚爱心吧！',
  '找到啦！', '点击送字宝宝回家吧！',
];

async function prewarmTts() {
  if (!DASHSCOPE_API_KEY) return;
  let warmed = 0;
  for (const text of STATIC_PHRASES) {
    const hash = crypto.createHash('md5').update(text).digest('hex');
    const file = path.join(TTS_CACHE_DIR, `${hash}.wav`);
    if (fs.existsSync(file)) { warmed++; continue; }
    try {
      const r = await fetch(TTS_API_URL, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${DASHSCOPE_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'qwen3-tts-flash', input: { text }, parameters: { voice: TTS_VOICE } }),
      });
      const d = await r.json();
      if (d.output?.audio?.url) {
        const ar = await fetch(d.output.audio.url);
        fs.writeFileSync(file, Buffer.from(await ar.arrayBuffer()));
        warmed++;
      }
    } catch {}
  }
  console.log(`🔊 TTS 预热完成: ${warmed}/${STATIC_PHRASES.length} 条已缓存`);
}

// ── Start ────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🌸 美乐蒂识字大冒险 服务器已启动: http://localhost:${PORT}`);
  if (DASHSCOPE_API_KEY) {
    console.log(`🎙️  TTS 已启用 (voice: ${TTS_VOICE})`);
    prewarmTts();
  } else {
    console.log('⚠️  TTS 未启用：请设置环境变量 DASHSCOPE_API_KEY');
  }
});
