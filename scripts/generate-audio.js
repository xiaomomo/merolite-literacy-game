#!/usr/bin/env node
/**
 * 预生成全部 TTS 音频
 * 用法: DASHSCOPE_API_KEY=sk-xxx node scripts/generate-audio.js
 *
 * 生成后文件存在 tts-cache/ 目录，服务器会直接读取，
 * 游戏运行时所有语音零延迟。
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const API_URL = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation';
const API_KEY = process.env.DASHSCOPE_API_KEY;
const VOICE = process.env.TTS_VOICE || 'Cherry';
const CACHE_DIR = path.join(__dirname, '..', 'tts-cache');

if (!API_KEY) {
  console.error('❌ 请设置 DASHSCOPE_API_KEY 环境变量');
  process.exit(1);
}

fs.mkdirSync(CACHE_DIR, { recursive: true });

// ── 加载字库 ────────────────────────────────────────────

const wordDataPath = path.join(__dirname, '..', 'data', 'wordData.js');
let wordDataSrc = fs.readFileSync(wordDataPath, 'utf8');
// 把 const wordData = {...} 变成 module.exports
wordDataSrc = wordDataSrc.replace(/^const wordData\s*=/m, 'module.exports =');
// 去掉末尾的 if(typeof module) 块（已经用 module.exports 了）
wordDataSrc = wordDataSrc.replace(/if\s*\(typeof module[\s\S]*$/, '');
const tmpFile = path.join(__dirname, '_wordData_tmp.js');
fs.writeFileSync(tmpFile, wordDataSrc);
const wordData = require(tmpFile);
fs.unlinkSync(tmpFile);
const allWords = wordData.getAllWords();

console.log(`📚 字库: ${allWords.length} 个字`);

// ── 收集所有要生成的文本 ────────────────────────────────

const texts = new Set();

// 1. 静态 UI 文案
const staticPhrases = [
  '在很远的地方，有一个神奇的字宝宝王国。可是有一天，一场大雾把王国笼罩，所有的字宝宝都迷路了！美乐蒂需要一位小小英雄的帮助，一起寻找字宝宝，送它们回家！你愿意帮助美乐蒂吗？点击开始冒险吧！',
  '选择你要学习的课本吧！',
  '选择你喜欢的游戏吧！捉迷藏，泡泡消除，拼图识字，还是听音选字？',
  '好的，玩捉迷藏！', '好的，玩泡泡消除！', '好的，玩拼图识字！', '好的，玩听音选字！',
  '每日惊喜！美乐蒂给你准备了小礼物！快点击打开礼物吧！',
  '出发！', '再试试', '不对哦', '不对哦，再听一次',
  '先完成前面的单元吧！字宝宝们需要你的帮助！',
  '爱心不够呢，继续冒险赚爱心吧！',
  '听声音，找到对应的字宝宝！',
  '小小英雄，今天也要加油哦！',
  '字宝宝们在等你呢！',
  '一起去冒险吧！',
  '又长大了一天呢，真棒！',
  '今天的冒险会是什么呢？',
  '这是冒险地图，选择一个岛屿开始冒险吧！',
];
staticPhrases.forEach(t => texts.add(t));

// 2. 每个字的发音 + 组词
allWords.forEach(w => {
  const pron = `${w.char}，${w.pinyin}，${w.word || ''}`;
  texts.add(pron);
});

// 3. 游戏指令："请找到X字"
allWords.forEach(w => {
  texts.add(`请找到${w.char}字`);
});

// 4. 找到时的庆祝
allWords.forEach(w => {
  const wg = w.word || '';
  texts.add(`找到啦！${w.char}，${w.pinyin}，${wg}。点击送字宝宝回家吧！`);
});

// 5. 每个单元的故事
if (wordData.grades) {
  wordData.grades.forEach(grade => {
    grade.units.forEach(unit => {
      const story = `欢迎来到"${unit.name}"！这里有${unit.words.length}个字宝宝等着你来找。美乐蒂说：'小小英雄，快帮帮它们吧！' 点击出发找字宝宝！`;
      texts.add(story);
      texts.add(`先来认识这个字宝宝吧！看笔画动画，听发音，还有美乐蒂的配图哦！`);
    });
  });
}

// 6. 单个字的朗读（城堡点击用）
allWords.forEach(w => texts.add(w.char));

console.log(`🎤 总计 ${texts.size} 条文本待生成`);

// ── 检查已有缓存，跳过 ────────────────────────────────

const todoTexts = [];
for (const t of texts) {
  const hash = crypto.createHash('md5').update(t).digest('hex');
  const file = path.join(CACHE_DIR, `${hash}.wav`);
  if (!fs.existsSync(file)) {
    todoTexts.push(t);
  }
}

console.log(`✅ 已缓存: ${texts.size - todoTexts.length} 条`);
console.log(`📝 待生成: ${todoTexts.length} 条`);

if (todoTexts.length === 0) {
  console.log('🎉 全部音频已就绪，无需生成！');
  process.exit(0);
}

// ── 逐个生成（限速：每秒 2 个请求）────────────────────

async function generateOne(text) {
  const hash = crypto.createHash('md5').update(text).digest('hex');
  const file = path.join(CACHE_DIR, `${hash}.wav`);

  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'qwen3-tts-flash',
      input: { text },
      parameters: { voice: VOICE },
    }),
  });

  const data = await res.json();
  const audioUrl = data.output?.audio?.url;
  if (!audioUrl) {
    console.error(`  ❌ 失败: "${text.slice(0, 20)}..." → ${data.message || 'no url'}`);
    return false;
  }

  const audioRes = await fetch(audioUrl);
  const buf = Buffer.from(await audioRes.arrayBuffer());
  fs.writeFileSync(file, buf);
  return true;
}

async function run() {
  let done = 0;
  let failed = 0;
  const total = todoTexts.length;
  const startTime = Date.now();

  for (let i = 0; i < total; i++) {
    const text = todoTexts[i];
    const short = text.length > 25 ? text.slice(0, 25) + '...' : text;

    try {
      const ok = await generateOne(text);
      if (ok) done++; else failed++;
    } catch (err) {
      console.error(`  ❌ 错误: "${short}" → ${err.message}`);
      failed++;
    }

    // 进度
    const pct = ((i + 1) / total * 100).toFixed(1);
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(0);
    const eta = ((Date.now() - startTime) / (i + 1) * (total - i - 1) / 1000 / 60).toFixed(1);
    process.stdout.write(`\r  [${pct}%] ${i + 1}/${total} | ✅${done} ❌${failed} | ${elapsed}s已用 | 预计${eta}min`);

    // 限速：每个请求间隔 500ms
    if (i < total - 1) await new Promise(r => setTimeout(r, 500));
  }

  console.log(`\n\n🎉 完成！生成 ${done} 条，失败 ${failed} 条`);
  console.log(`📁 缓存目录: ${CACHE_DIR}`);
  console.log(`📊 缓存大小: ${(getDirSize(CACHE_DIR) / 1024 / 1024).toFixed(1)} MB`);
}

function getDirSize(dir) {
  let size = 0;
  for (const f of fs.readdirSync(dir)) {
    size += fs.statSync(path.join(dir, f)).size;
  }
  return size;
}

run().catch(console.error);
