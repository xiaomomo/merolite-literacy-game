/**
 * 人教版小学数学 1-3 年级（三年级上学期前）
 * 每个单元包含题目生成器，可无限生成随机练习题
 */

const mathData = {
  grades: [
    // ═══════════ 一年级上册 ═══════════
    {
      id: 'M1A', name: '一年级上册', icon: '📕',
      units: [
        {
          id: 'M1A-3', name: '1~5的加减法', icon: '🐣', desc: '5以内加减',
          generate(n) {
            return genAddSub(n, 1, 5);
          }
        },
        {
          id: 'M1A-6', name: '6~10的加减法', icon: '🌟', desc: '10以内加减',
          generate(n) {
            return genAddSub(n, 1, 10);
          }
        },
        {
          id: 'M1A-7', name: '11~20各数的认识', icon: '🔢', desc: '认识11到20',
          generate(n) {
            return genNumberRecog(n, 11, 20);
          }
        },
        {
          id: 'M1A-8', name: '20以内进位加法', icon: '🚀', desc: '凑十法',
          generate(n) {
            return genCarryAdd(n, 20);
          }
        },
      ]
    },
    // ═══════════ 一年级下册 ═══════════
    {
      id: 'M1B', name: '一年级下册', icon: '📗',
      units: [
        {
          id: 'M1B-2', name: '20以内退位减法', icon: '🔙', desc: '退位减法',
          generate(n) {
            return genBorrowSub(n, 20);
          }
        },
        {
          id: 'M1B-4', name: '100以内数的认识', icon: '💯', desc: '认识大数',
          generate(n) {
            return genNumberRecog(n, 20, 100);
          }
        },
        {
          id: 'M1B-6', name: '100以内加减法', icon: '🧮', desc: '两位数加减',
          generate(n) {
            return genAddSub(n, 10, 100);
          }
        },
      ]
    },
    // ═══════════ 二年级上册 ═══════════
    {
      id: 'M2A', name: '二年级上册', icon: '📘',
      units: [
        {
          id: 'M2A-2', name: '100以内加减法(二)', icon: '📐', desc: '进位退位',
          generate(n) {
            return genAddSub(n, 10, 100);
          }
        },
        {
          id: 'M2A-4', name: '表内乘法(一)', icon: '✖️', desc: '1~6的乘法',
          generate(n) {
            return genMultiply(n, 1, 6);
          }
        },
        {
          id: 'M2A-6', name: '表内乘法(二)', icon: '🌈', desc: '7~9的乘法',
          generate(n) {
            return genMultiply(n, 1, 9);
          }
        },
      ]
    },
    // ═══════════ 二年级下册 ═══════════
    {
      id: 'M2B', name: '二年级下册', icon: '📙',
      units: [
        {
          id: 'M2B-2', name: '表内除法(一)', icon: '➗', desc: '用乘法口诀求商',
          generate(n) {
            return genDivide(n, 1, 6);
          }
        },
        {
          id: 'M2B-4', name: '表内除法(二)', icon: '🎯', desc: '7~9的除法',
          generate(n) {
            return genDivide(n, 1, 9);
          }
        },
        {
          id: 'M2B-5', name: '万以内数的认识', icon: '🏔️', desc: '千和万',
          generate(n) {
            return genBigNumberRecog(n);
          }
        },
        {
          id: 'M2B-7', name: '万以内加减法', icon: '🔥', desc: '三四位数加减',
          generate(n) {
            return genAddSub(n, 100, 1000);
          }
        },
        {
          id: 'M2B-9', name: '找规律', icon: '🔍', desc: '发现数列规律',
          generate(n) {
            return genPattern(n);
          }
        },
      ]
    },
    // ═══════════ 三年级上册 ═══════════
    {
      id: 'M3A', name: '三年级上册', icon: '📓',
      units: [
        {
          id: 'M3A-2', name: '万以内加减法(二)', icon: '⚡', desc: '连续进退位',
          generate(n) {
            return genAddSub(n, 100, 10000);
          }
        },
        {
          id: 'M3A-4', name: '有余数的除法', icon: '🧩', desc: '余数是什么',
          generate(n) {
            return genDivideRemainder(n);
          }
        },
        {
          id: 'M3A-6', name: '多位数乘一位数', icon: '🚂', desc: '竖式乘法',
          generate(n) {
            return genMultiDigit(n);
          }
        },
        {
          id: 'M3A-7', name: '分数的初步认识', icon: '🍕', desc: '几分之几',
          generate(n) {
            return genFraction(n);
          }
        },
      ]
    },
  ],

  getGrade(id) { return this.grades.find(g => g.id === id); },
  getUnit(gradeId, unitId) {
    const g = this.getGrade(gradeId);
    return g ? g.units.find(u => u.id === unitId) : null;
  },
};

// ── 题目生成器 ──────────────────────────────────────

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = rand(0, i);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function makeChoices(answer, min, max) {
  const choices = new Set([answer]);
  while (choices.size < 4) {
    let wrong = answer + rand(-3, 3);
    if (wrong < min) wrong = min + rand(0, 3);
    if (wrong === answer) continue;
    choices.add(wrong);
  }
  return shuffle([...choices]);
}

// 加减法
function genAddSub(n, min, max) {
  const questions = [];
  for (let i = 0; i < n; i++) {
    const isAdd = Math.random() > 0.5;
    let a, b, answer, question;
    if (isAdd) {
      answer = rand(min + 1, max);
      a = rand(min, answer - 1);
      b = answer - a;
      question = `${a} + ${b} = ?`;
    } else {
      a = rand(min + 1, max);
      b = rand(min, a - 1);
      answer = a - b;
      question = `${a} − ${b} = ?`;
    }
    questions.push({
      question, answer,
      choices: makeChoices(answer, 0, max),
    });
  }
  return questions;
}

// 进位加法
function genCarryAdd(n, max) {
  const questions = [];
  for (let i = 0; i < n; i++) {
    let a, b;
    do {
      a = rand(2, 9);
      b = rand(2, 9);
    } while (a + b <= 10 || a + b > max);
    const answer = a + b;
    questions.push({
      question: `${a} + ${b} = ?`, answer,
      choices: makeChoices(answer, 2, max),
    });
  }
  return questions;
}

// 退位减法
function genBorrowSub(n, max) {
  const questions = [];
  for (let i = 0; i < n; i++) {
    const a = rand(11, max);
    const b = rand(a - 9 > 1 ? a - 9 : 2, a - 1);
    const answer = a - b;
    questions.push({
      question: `${a} − ${b} = ?`, answer,
      choices: makeChoices(answer, 0, max),
    });
  }
  return questions;
}

// 数的认识
function genNumberRecog(n, min, max) {
  const questions = [];
  const types = [
    () => {
      const a = rand(min, max - 1), b = rand(a + 1, max);
      return { question: `${a} 和 ${b}，哪个大？`, answer: b, choices: shuffle([a, b]) };
    },
    () => {
      const a = rand(min, max - 1);
      return { question: `${a} 后面的数是？`, answer: a + 1, choices: makeChoices(a + 1, min, max + 1) };
    },
    () => {
      const a = rand(min + 1, max);
      return { question: `${a} 前面的数是？`, answer: a - 1, choices: makeChoices(a - 1, min - 1, max) };
    },
  ];
  for (let i = 0; i < n; i++) {
    questions.push(types[rand(0, types.length - 1)]());
  }
  return questions;
}

// 乘法
function genMultiply(n, min, max) {
  const questions = [];
  for (let i = 0; i < n; i++) {
    const a = rand(min, max), b = rand(1, 9);
    const answer = a * b;
    questions.push({
      question: `${a} × ${b} = ?`, answer,
      choices: makeChoices(answer, 1, 81),
    });
  }
  return questions;
}

// 除法
function genDivide(n, min, max) {
  const questions = [];
  for (let i = 0; i < n; i++) {
    const b = rand(Math.max(min, 1), max);
    const q = rand(1, 9);
    const a = b * q;
    questions.push({
      question: `${a} ÷ ${b} = ?`, answer: q,
      choices: makeChoices(q, 1, 9),
    });
  }
  return questions;
}

// 有余数的除法
function genDivideRemainder(n) {
  const questions = [];
  for (let i = 0; i < n; i++) {
    const b = rand(2, 9);
    const q = rand(1, 9);
    const r = rand(1, b - 1);
    const a = b * q + r;
    questions.push({
      question: `${a} ÷ ${b} = ? ··· ?`,
      answer: q * 100 + r,
      choices: shuffle([q * 100 + r, q * 100 + r + 1, (q + 1) * 100 + r, q * 100 + (r > 1 ? r - 1 : r + 2)]),
      display: (v) => `${Math.floor(v / 100)} ··· ${v % 100}`,
    });
  }
  return questions;
}

// 万以内数的认识
function genBigNumberRecog(n) {
  const questions = [];
  for (let i = 0; i < n; i++) {
    const num = rand(100, 9999);
    const digit = rand(0, 3);
    const names = ['个', '十', '百', '千'];
    const val = Math.floor(num / Math.pow(10, digit)) % 10;
    questions.push({
      question: `${num} 的${names[digit]}位上是几？`, answer: val,
      choices: makeChoices(val, 0, 9),
    });
  }
  return questions;
}

// 多位数乘一位数
function genMultiDigit(n) {
  const questions = [];
  for (let i = 0; i < n; i++) {
    const a = rand(11, 999);
    const b = rand(2, 9);
    const answer = a * b;
    questions.push({
      question: `${a} × ${b} = ?`, answer,
      choices: makeChoices(answer, Math.max(answer - 50, 0), answer + 50),
    });
  }
  return questions;
}

// 分数初步认识
function genFraction(n) {
  const questions = [];
  const fracs = [
    { q: '把一个蛋糕平均分成2份，每份是？', a: '1/2', opts: ['1/2', '1/3', '1/4', '2/3'] },
    { q: '把一个苹果平均分成4份，取1份是？', a: '1/4', opts: ['1/2', '1/3', '1/4', '3/4'] },
    { q: '把一张纸平均分成3份，取2份是？', a: '2/3', opts: ['1/3', '2/3', '3/4', '1/2'] },
    { q: '1/2 和 1/4 哪个大？', a: '1/2', opts: ['1/2', '1/4', '一样大', '不知道'] },
    { q: '一个蛋糕吃了1/4，还剩多少？', a: '3/4', opts: ['1/4', '1/2', '3/4', '2/4'] },
    { q: '把一根绳子平均分成8份，取3份是？', a: '3/8', opts: ['3/8', '1/8', '5/8', '3/4'] },
    { q: '1/3 + 1/3 = ?', a: '2/3', opts: ['2/3', '1/3', '2/6', '1/6'] },
    { q: '1 − 1/4 = ?', a: '3/4', opts: ['3/4', '1/4', '1/2', '2/4'] },
    { q: '哪个分数最大？', a: '3/4', opts: ['1/4', '1/2', '3/4', '1/3'] },
    { q: '5个1/6合起来是？', a: '5/6', opts: ['5/6', '1/6', '5/5', '6/5'] },
  ];
  for (let i = 0; i < n; i++) {
    const f = fracs[i % fracs.length];
    questions.push({
      question: f.q, answer: f.a,
      choices: shuffle([...f.opts]),
      isText: true,
    });
  }
  return questions;
}

// 找规律
function genPattern(n) {
  const questions = [];
  const makers = [
    () => { const s = rand(1, 5), d = rand(1, 5); const seq = [s, s+d, s+2*d, s+3*d]; return { seq, next: s+4*d }; },
    () => { const s = rand(2, 5); const seq = [s, s*2, s*3, s*4]; return { seq, next: s*5 }; },
    () => { const s = rand(50, 100), d = rand(2, 10); const seq = [s, s-d, s-2*d, s-3*d]; return { seq, next: s-4*d }; },
  ];
  for (let i = 0; i < n; i++) {
    const m = makers[rand(0, makers.length - 1)]();
    questions.push({
      question: `找规律：${m.seq.join('，')}，？`,
      answer: m.next,
      choices: makeChoices(m.next, Math.max(m.next - 10, 0), m.next + 10),
    });
  }
  return questions;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = mathData;
}
