/**
 * 美乐蒂识字大冒险 - 完整版游戏逻辑
 * 包含：捉迷藏、泡泡消除、拼图识字三种游戏
 * 支持 Canvas 动画、商店系统、装饰系统
 * 后端同步：Express + SQLite
 */

class AdventureGame {
    constructor() {
        this.defaultState = {
            hasStarted: false,
            adventureDay: 1,
            lovePoints: 0,
            foundWords: [],
            visitedIslands: [],
            stickers: [],
            decorations: [],
            ownedDecorations: ['🌸', '⭐', '🎀'],
            lastLoginDate: null,
            currentGradeId: null,
            islandsProgress: {}
        };

        this.state = { ...this.defaultState };
        this.playerId = null;
        this._saveTimer = null;

        // 游戏配置
        this.currentGrade = null;
        this.currentIsland = null;
        this.currentIslandData = null;
        this.currentWords = [];
        this.targetWord = null;
        this.wordsFoundInSession = 0;
        this.totalWordsToFind = 3;
        this.currentGameType = null;

        // 音效
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();

        // 商店物品
        this.shopItems = [
            { id: 'flower1', name: '樱花', icon: '🌸', price: 20 },
            { id: 'star1', name: '星星', icon: '⭐', price: 20 },
            { id: 'ribbon1', name: '蝴蝶结', icon: '🎀', price: 20 },
            { id: 'moon1', name: '月亮', icon: '🌙', price: 30 },
            { id: 'unicorn1', name: '独角兽', icon: '🦄', price: 50 },
            { id: 'candy1', name: '糖果', icon: '🍬', price: 25 },
            { id: 'palette1', name: '画板', icon: '🎨', price: 30 },
            { id: 'circus1', name: '帐篷', icon: '🎪', price: 40 },
            { id: 'sparkle1', name: '闪光', icon: '✨', price: 35 },
            { id: 'heart1', name: '爱心', icon: '❤️', price: 30 },
            { id: 'rainbow1', name: '彩虹', icon: '🌈', price: 45 },
            { id: 'diamond1', name: '钻石', icon: '💎', price: 60 }
        ];

        // 岛屿故事
        this.islandStories = {
            1: {
                name: "花花岛",
                story: "这里是花花岛，字宝宝们最喜欢在这里采花蜜～\n\n可是大雾来了，它们找不到回家的路了...\n\n美乐蒂说：'小小英雄，快帮帮它们吧！'",
                greeting: "哇！花花岛的字宝宝在向你招手呢！"
            },
            2: {
                name: "泡泡海",
                story: "来到泡泡海啦！字宝宝们藏在五彩的泡泡里，\n\n随着海风飘呀飘...\n\n美乐蒂说：'戳破泡泡，就能找到字宝宝哦！'",
                greeting: "泡泡海里好多泡泡！找找看哪个是字宝宝？"
            },
            3: {
                name: "星星山",
                story: "爬上星星山，字宝宝们变成了小星星，\n\n在天空中眨眼睛～\n\n美乐蒂说：'摘下最亮的那颗星，就是字宝宝！'",
                greeting: "星星山的字宝宝闪闪发光，好漂亮！"
            },
            4: {
                name: "拼图森林",
                story: "拼图森林里的字宝宝最调皮，\n\n它们把自己拆成了碎片，藏在树叶下...\n\n美乐蒂说：'把碎片拼起来，就能找到字宝宝啦！'",
                greeting: "拼图森林的字宝宝在和你玩捉迷藏呢！"
            },
            5: {
                name: "月光城堡",
                story: "终于来到月光城堡！这里是字宝宝王国的中心，\n\n所有的字宝宝都在这里等着你～\n\n美乐蒂说：'小小英雄，谢谢你帮助了大家！'",
                greeting: "月光城堡的字宝宝们都在感谢你呢！"
            }
        };

        // Canvas 上下文
        this.pathCanvas = null;
        this.pathCtx = null;
        this.gameCanvas = null;
        this.gameCtx = null;

        // 动画帧
        this.animationFrame = null;

        this.init();
    }

    // 初始化游戏
    async init() {
        await this.loadState();
        this.setupCanvas();
        this.bindEvents();
        this.renderShop();
        this.renderGradeSelect();

        if (!this.state.hasStarted) {
            this.showScreen('intro-screen');
            this.speakLater('在很远的地方，有一个神奇的字宝宝王国。可是有一天，一场大雾把王国笼罩，所有的字宝宝都迷路了！美乐蒂需要一位小小英雄的帮助，一起寻找字宝宝，送它们回家！你愿意帮助美乐蒂吗？点击开始冒险吧！', 500);
        } else if (this.state.currentGradeId) {
            this.selectGrade(this.state.currentGradeId, true);
            this.checkDailyLogin();
        } else {
            this.checkDailyLogin();
            this.showScreen('grade-screen');
            this.speakLater('选择你要学习的课本吧！', 400);
        }

        this.updateUI();
    }

    // ── 年级选择 ──────────────────────────────

    renderGradeSelect() {
        const grid = document.getElementById('grade-grid');
        grid.innerHTML = '';
        wordData.grades.forEach(grade => {
            const unitCount = grade.units.length;
            const wordCount = grade.units.reduce((s, u) => s + u.words.length, 0);
            const card = document.createElement('div');
            card.className = 'grade-card';
            card.innerHTML = `
                <div class="grade-card-icon">${grade.icon}</div>
                <div class="grade-card-name">${grade.name}</div>
                <div class="grade-card-info">${unitCount} 个单元 · ${wordCount} 个字</div>
            `;
            card.addEventListener('click', () => this.selectGrade(grade.id));
            grid.appendChild(card);
        });
    }

    selectGrade(gradeId, silent) {
        this.currentGrade = wordData.getGrade(gradeId);
        if (!this.currentGrade) return;
        this.state.currentGradeId = gradeId;
        this.saveState();

        this.buildMapForGrade();
        this.showScreen('map-screen');
        this.updateMap();
        if (!silent) this.showMapDialogue();
        this.animatePath();

        // 预加载地图页常用语音
        this.prefetch([
            '选择你喜欢的游戏吧！捉迷藏，泡泡消除，拼图识字，还是听音选字？',
            '好的，玩捉迷藏！', '好的，玩泡泡消除！', '好的，玩拼图识字！', '好的，玩听音选字！',
        ]);
    }

    buildMapForGrade() {
        const mapArea = document.querySelector('.map-area');
        const title = mapArea.querySelector('.map-title');
        title.textContent = `📚 ${this.currentGrade.name}`;

        mapArea.querySelectorAll('.island').forEach(el => el.remove());

        this.currentGrade.units.forEach((unit, idx) => {
            const el = document.createElement('div');
            el.className = 'island';
            el.dataset.island = unit.id;
            el.id = `island-${unit.id}`;
            el.innerHTML = `
                <div class="island-sprite">${unit.icon}</div>
                <div class="island-name">${unit.name}</div>
                <div class="island-progress" id="progress-${unit.id}">0/${unit.words.length}</div>
                <div class="island-lock" id="lock-${unit.id}">🔒</div>
            `;
            el.style.order = idx + 1;
            el.addEventListener('click', () => this.enterIsland(unit.id));
            const canvas = mapArea.querySelector('.path-canvas');
            mapArea.insertBefore(el, canvas);
        });
    }

    // 设置 Canvas
    setupCanvas() {
        // 路径 Canvas
        this.pathCanvas = document.getElementById('path-canvas');
        if (this.pathCanvas) {
            this.pathCtx = this.pathCanvas.getContext('2d');
            this.resizePathCanvas();
        }

        // 游戏 Canvas
        this.gameCanvas = document.getElementById('game-canvas');
        if (this.gameCanvas) {
            this.gameCtx = this.gameCanvas.getContext('2d');
            this.resizeGameCanvas();
        }
    }

    resizePathCanvas() {
        if (!this.pathCanvas) return;
        const rect = this.pathCanvas.parentElement.getBoundingClientRect();
        this.pathCanvas.width = rect.width;
        this.pathCanvas.height = rect.height;
    }

    resizeGameCanvas() {
        if (!this.gameCanvas) return;
        const rect = this.gameCanvas.getBoundingClientRect();
        this.gameCanvas.width = rect.width;
        this.gameCanvas.height = rect.height;
    }

    // ── 后端 API 方法 ──────────────────────────────────────

    async apiRequest(method, path, body) {
        try {
            const opts = { method, headers: { 'Content-Type': 'application/json' } };
            if (body) opts.body = JSON.stringify(body);
            const res = await fetch(`/api${path}`, opts);
            if (!res.ok) return null;
            return await res.json();
        } catch {
            return null;
        }
    }

    async ensurePlayer() {
        let id = localStorage.getItem('merolite-player-id');
        if (id) {
            const check = await this.apiRequest('GET', `/players/${id}`);
            if (check && !check.error) { this.playerId = id; return; }
        }
        const res = await this.apiRequest('POST', '/players', {
            name: '小小英雄',
            state: this.defaultState
        });
        if (res && res.id) {
            this.playerId = res.id;
            localStorage.setItem('merolite-player-id', res.id);
        }
    }

    // ── 存档加载 / 保存 ─────────────────────────────────

    async loadState() {
        await this.ensurePlayer();

        if (this.playerId) {
            const data = await this.apiRequest('GET', `/players/${this.playerId}/state`);
            if (data && data.state && Object.keys(data.state).length > 0) {
                this.state = { ...this.defaultState, ...data.state };
                localStorage.setItem('merolite-adventure', JSON.stringify(this.state));
                return;
            }
        }

        const saved = localStorage.getItem('merolite-adventure');
        if (saved) {
            try { this.state = { ...this.defaultState, ...JSON.parse(saved) }; } catch {}
        }
    }

    saveState() {
        localStorage.setItem('merolite-adventure', JSON.stringify(this.state));
        this.saveToServer();
    }

    saveToServer() {
        if (!this.playerId) return;
        clearTimeout(this._saveTimer);
        this._saveTimer = setTimeout(() => {
            this.apiRequest('PUT', `/players/${this.playerId}/state`, { state: this.state });
        }, 300);
    }

    // 检查每日登录
    checkDailyLogin() {
        const today = new Date().toDateString();

        if (this.state.lastLoginDate !== today) {
            // 在更新 lastLoginDate 之前，先计算是否需要增加冒险天数
            if (this.state.lastLoginDate) {
                const lastDate = new Date(this.state.lastLoginDate);
                const todayDate = new Date(today);
                const diffDays = Math.floor((todayDate - lastDate) / (1000 * 60 * 60 * 24));
                if (diffDays >= 1) {
                    this.state.adventureDay++;
                }
            } else {
                // 首次登录，算第1天
                this.state.adventureDay = 1;
            }

            // 更新最后登录日期
            this.state.lastLoginDate = today;

            // 显示登录奖励
            setTimeout(() => {
                this.showDailyReward();
            }, 500);

            this.saveState();
        }
    }

    // 显示登录奖励
    showDailyReward() {
        this.showScreen('daily-reward-screen');
        this.speakLater('每日惊喜！美乐蒂给你准备了小礼物！快点击打开礼物吧！', 300);
    }

    // 打开礼物
    openGift() {
        this.playSound('correct');
        this.showConfetti();

        const loveReward = 5 + Math.floor(Math.random() * 5);
        this.state.lovePoints += loveReward;

        const stickers = ['🌸', '🎀', '⭐', '🌙', '🦄', '🍬', '🎨', '🎪'];
        const newSticker = stickers[Math.floor(Math.random() * stickers.length)];
        if (!this.state.stickers.includes(newSticker)) {
            this.state.stickers.push(newSticker);
        }

        this.saveState();
        this.updateUI();

        setTimeout(() => {
            this.showGameModal({
                icon: '🎁',
                message: `美乐蒂送给你：<br><br>💖 ${loveReward} 爱心<br>🎨 ${newSticker} 贴纸`,
                buttons: [{ text: '谢谢美乐蒂！', value: true, primary: true }]
            }).then(() => {
                this.showScreen('map-screen');
                this.updateMap();
                this.animatePath();
                this.speakLater('这是冒险地图，选择一个岛屿开始冒险吧！', 300);
            });
            this.speakLater(`美乐蒂送给你${loveReward}颗爱心，还有一张贴纸！`, 200);
        }, 1000);
    }

    // 绑定事件
    bindEvents() {
        // 开始冒险
        document.getElementById('btn-start-adventure').addEventListener('click', () => {
            this.state.hasStarted = true;
            this.saveState();
            this.speak('出发！');
            this.checkDailyLogin();
            this.showScreen('grade-screen');
            this.speakLater('选择你要学习的课本吧！', 400);
        });

        // 回到年级选择
        document.getElementById('btn-back-intro').addEventListener('click', () => {
            this.showScreen('grade-screen');
            this.speakLater('选择你要学习的课本吧！', 300);
        });

        document.getElementById('btn-switch-grade').addEventListener('click', () => {
            this.showScreen('grade-screen');
            this.speakLater('选择你要学习的课本吧！', 300);
        });

        // 打开礼物
        document.getElementById('btn-open-gift').addEventListener('click', () => {
            this.openGift();
        });

        // 岛屿点击（动态生成，在 buildMapForGrade 中绑定）

        // 底部按钮
        document.getElementById('btn-castle').addEventListener('click', () => {
            this.showCastle();
        });

        document.getElementById('btn-backpack').addEventListener('click', () => {
            this.showBackpack();
        });

        // 返回按钮
        document.getElementById('btn-back-map').addEventListener('click', () => {
            this.showScreen('map-screen');
            this.showMapDialogue();
            this.animatePath();
        });

        document.getElementById('btn-back-castle').addEventListener('click', () => {
            this.showScreen('map-screen');
            this.showMapDialogue();
        });

        document.getElementById('btn-back-backpack').addEventListener('click', () => {
            this.showScreen('map-screen');
            this.showMapDialogue();
        });

        document.getElementById('btn-back-shop').addEventListener('click', () => {
            this.showBackpack();
        });

        document.getElementById('btn-back-game').addEventListener('click', () => {
            // 返回游戏类型选择
            document.getElementById('game-area').style.display = 'none';
            this.showGameTypeSelect();
        });

        // 开始关卡
        document.getElementById('btn-start-level').addEventListener('click', () => {
            this.showGameTypeSelect();
        });

        // 学习阶段：下一个字 / 开始玩
        document.getElementById('btn-learn-done').addEventListener('click', () => {
            if (this._learnWords && this._learnIndex < this._learnWords.length - 1) {
                this._learnIndex++;
                this.showLearnCard();
            } else {
                this.beginGamePlay();
            }
        });

        // 游戏类型选择
        document.querySelectorAll('.game-type-card').forEach(card => {
            card.addEventListener('click', (e) => {
                const type = e.currentTarget.dataset.type;
                this.selectGameType(type);
            });
        });

        // 送字宝宝回家
        document.getElementById('btn-send-home').addEventListener('click', () => {
            this.sendWordHome();
        });

        // 商店
        document.getElementById('btn-shop').addEventListener('click', () => {
            this.showShop();
        });
    }

    // 显示屏幕
    showScreen(screenId) {
        this.stopSpeaking();
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        document.getElementById(screenId).classList.add('active');

        // 调整 Canvas 大小
        setTimeout(() => {
            if (screenId === 'map-screen') {
                this.resizePathCanvas();
                this.animatePath();
            } else if (screenId === 'game-area') {
                this.resizeGameCanvas();
            }
        }, 100);
    }

    // 更新 UI
    updateUI() {
        document.getElementById('adventure-day-text').textContent = `第 ${this.state.adventureDay} 天`;
        document.getElementById('love-points-text').textContent = this.state.lovePoints;
    }

    // 更新地图
    updateMap() {
        if (!this.currentGrade) return;
        const units = this.currentGrade.units;

        units.forEach((unit, idx) => {
            const progressEl = document.getElementById(`progress-${unit.id}`);
            const lockEl = document.getElementById(`lock-${unit.id}`);
            const islandEl = document.getElementById(`island-${unit.id}`);
            if (!progressEl || !lockEl || !islandEl) return;

            const progress = this.state.islandsProgress[unit.id] || 0;
            progressEl.textContent = `${progress}/${unit.words.length}`;

            if (idx === 0) {
                islandEl.classList.remove('locked');
                lockEl.style.display = 'none';
            } else {
                const prevUnit = units[idx - 1];
                const prevProgress = this.state.islandsProgress[prevUnit.id] || 0;
                const unlockThreshold = Math.min(3, prevUnit.words.length);
                if (prevProgress >= unlockThreshold) {
                    islandEl.classList.remove('locked');
                    lockEl.style.display = 'none';
                } else {
                    islandEl.classList.add('locked');
                    lockEl.style.display = 'block';
                }
            }
        });
    }

    // 显示 Toast
    showToast(message) {
        const toast = document.getElementById('levelup-toast');
        toast.querySelector('.toast-message').textContent = message;
        toast.classList.add('show');
        this.speakLater(message, 200);
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }

    // 显示美乐蒂对话
    showMapDialogue() {
        const dialogues = [
            "小小英雄，今天也要加油哦！",
            "字宝宝们在等你呢！",
            "一起去冒险吧！",
            "又长大了一天呢，真棒！",
            "今天的冒险会是什么呢？"
        ];

        const dialogue = dialogues[Math.floor(Math.random() * dialogues.length)];
        document.getElementById('map-dialogue').textContent = dialogue;
        this.speakLater(dialogue, 400);
    }

    // 绘制路径动画
    animatePath() {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }
        if (!this.pathCtx) return;

        this.pathCtx.clearRect(0, 0, this.pathCanvas.width, this.pathCanvas.height);

        // 绘制虚线路径
        const path = new Path2D("M 180 120 Q 250 150 320 120 T 460 120 T 600 150 T 740 120 T 880 150");

        this.pathCtx.strokeStyle = '#FFB6C1';
        this.pathCtx.lineWidth = 8;
        this.pathCtx.setLineDash([20, 10]);
        this.pathCtx.lineCap = 'round';

        // 动画偏移
        const offset = Date.now() / 50 % 30;
        this.pathCtx.lineDashOffset = -offset;

        this.pathCtx.stroke(path);

        this.animationFrame = requestAnimationFrame(() => this.animatePath());
    }

    // 进入岛屿
    enterIsland(islandId) {
        if (!this.currentGrade) return;
        const units = this.currentGrade.units;
        const idx = units.findIndex(u => u.id === islandId);
        const unit = units[idx];
        if (!unit) return;

        if (idx > 0) {
            const prevUnit = units[idx - 1];
            const prevProgress = this.state.islandsProgress[prevUnit.id] || 0;
            const unlockThreshold = Math.min(3, prevUnit.words.length);
            if (prevProgress < unlockThreshold) {
                this.showGameModal({
                    icon: '🔒',
                    message: '先完成前面的单元吧！<br>字宝宝们需要你的帮助～',
                    buttons: [{ text: '好的', value: true, primary: true }]
                });
                this.speakLater('先完成前面的单元吧！字宝宝们需要你的帮助！', 200);
                return;
            }
        }

        this.currentIsland = islandId;
        this.currentIslandData = unit;

        const storyText = `欢迎来到"${unit.name}"！这里有${unit.words.length}个字宝宝等着你来找。美乐蒂说：'小小英雄，快帮帮它们吧！'`;

        document.getElementById('level-title').textContent = unit.name;
        document.getElementById('story-text').textContent = storyText;

        this.showScreen('level-screen');
        document.getElementById('level-story').style.display = 'block';
        document.getElementById('game-type-select').style.display = 'none';
        document.getElementById('game-area').style.display = 'none';

        if (!this.state.visitedIslands.includes(islandId)) {
            this.state.visitedIslands.push(islandId);
            this.saveState();
        }

        this.speakLater(storyText + ' 点击出发找字宝宝！', 300);

        // 预加载本单元字的发音
        const unitWords = this.currentIslandData.words.slice(0, 10);
        this.prefetch(unitWords.map(w => `${w.char}，${w.pinyin}，${w.word || ''}`));
    }

    // 显示游戏类型选择
    showGameTypeSelect() {
        document.getElementById('level-story').style.display = 'none';
        document.getElementById('game-area').style.display = 'none';
        const selectEl = document.getElementById('game-type-select');
        selectEl.style.display = 'block';

        document.querySelectorAll('.game-type-card').forEach(card => {
            card.classList.remove('selected');
        });

        this.speakLater('选择你喜欢的游戏吧！捉迷藏，泡泡消除，还是拼图识字？', 300);
    }

    // 选择游戏类型
    selectGameType(type) {
        this.currentGameType = type;

        document.querySelectorAll('.game-type-card').forEach(card => {
            card.classList.remove('selected');
        });
        document.querySelector(`[data-type="${type}"]`).classList.add('selected');

        const names = { 'hide-seek': '捉迷藏', 'bubble': '泡泡消除', 'puzzle': '拼图识字', 'listen': '听音选字' };
        this.speak(`好的，玩${names[type]}！`);

        setTimeout(() => {
            this.startLevel();
        }, 300);
    }

    // 开始关卡
    startLevel() {
        this.wordsFoundInSession = 0;

        if (!this.currentIslandData) return;

        const learnedWords = this.state.foundWords;

        // ── 间隔复习：混入需要复习的字（20%） ──
        let newWords = this.currentIslandData.words.filter(
            w => !learnedWords.includes(w.char)
        );
        let reviewWords = [];
        if (!this.state.reviewLog) this.state.reviewLog = {};
        const now = Date.now();
        const DAY = 86400000;
        const reviewCandidates = this.currentIslandData.words.filter(w => {
            if (!learnedWords.includes(w.char)) return false;
            const last = this.state.reviewLog[w.char] || 0;
            return (now - last) > DAY;
        });
        reviewCandidates.sort(() => Math.random() - 0.5);
        reviewWords = reviewCandidates.slice(0, 1);

        if (newWords.length === 0 && reviewWords.length === 0) {
            const allGradeWords = wordData.getAllWordsForGrade(this.currentGrade.id);
            newWords = allGradeWords.filter(w => !learnedWords.includes(w.char));
        }

        newWords.sort(() => Math.random() - 0.5);
        const newSlice = newWords.slice(0, Math.max(2, 3 - reviewWords.length));
        this.currentWords = [...newSlice, ...reviewWords];
        this.currentWords.sort(() => Math.random() - 0.5);

        if (this.currentWords.length === 0) {
            this.speakLater('哇！所有的字宝宝都被你找到啦！美乐蒂说，你真是太厉害了！', 200);
            this.showGameModal({
                icon: '🎊',
                message: '哇！所有的字宝宝都被你找到啦！<br><br>美乐蒂说："你真是太厉害了！"',
                buttons: [{ text: '太棒了！', value: true, primary: true }]
            }).then(() => {
                this.showScreen('map-screen');
                this.showMapDialogue();
                this.animatePath();
            });
            return;
        }

        this.totalWordsToFind = this.currentWords.length;

        // ── 先学后玩：展示本轮要学的新字 ──
        const hasNewWords = newSlice.length > 0;
        if (hasNewWords) {
            this.showLearnPhase(newSlice);
        } else {
            this.beginGamePlay();
        }
    }

    // 先学后玩：逐字学习
    showLearnPhase(words) {
        this._learnWords = words;
        this._learnIndex = 0;
        this.showLearnCard();
    }

    showLearnCard() {
        const words = this._learnWords;
        const idx = this._learnIndex;
        if (idx >= words.length) { this.beginGamePlay(); return; }

        const word = words[idx];
        const isLast = idx === words.length - 1;

        document.getElementById('level-story').style.display = 'none';
        document.getElementById('game-type-select').style.display = 'none';
        document.getElementById('game-area').style.display = 'none';
        const learnEl = document.getElementById('learn-phase');
        learnEl.style.display = 'block';

        document.querySelector('.learn-title').textContent =
            `📖 第 ${idx + 1}/${words.length} 个字宝宝`;

        const cardsEl = document.getElementById('learn-cards');
        cardsEl.innerHTML = '';

        const card = document.createElement('div');
        card.className = 'learn-card-full';

        const strokeId = `stroke-${Date.now()}`;
        const imgId = `img-${Date.now()}`;

        card.innerHTML = `
            <div class="lcf-top">
                <div class="lcf-stroke" id="${strokeId}"></div>
                <div class="lcf-img" id="${imgId}"><span class="lcf-img-loading">🎨</span></div>
            </div>
            <div class="lcf-info">
                <span class="lcf-char">${word.char}</span>
                <span class="lcf-pinyin">${word.pinyin}</span>
                <span class="lcf-word">${word.word || ''}</span>
            </div>
            <button class="lcf-play-btn">🔊 听一听</button>
        `;

        card.querySelector('.lcf-play-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            this.speak(`${word.char}，${word.pinyin}，${word.word || ''}`);
        });
        cardsEl.appendChild(card);

        // 更新底部按钮
        const doneBtn = document.getElementById('btn-learn-done');
        doneBtn.textContent = isLast ? '✅ 认识了，开始玩！' : '👉 下一个字';

        // 笔画动画
        setTimeout(() => {
            try {
                const writer = HanziWriter.create(strokeId, word.char, {
                    width: 150, height: 150, padding: 5,
                    strokeAnimationSpeed: 0.8, delayBetweenStrokes: 300,
                    strokeColor: '#FF69B4', radicalColor: '#FF69B4',
                    outlineColor: '#FFD1DC', drawingColor: '#FF69B4',
                });
                writer.animateCharacter();
                document.getElementById(strokeId).addEventListener('click', () => writer.animateCharacter());
            } catch {}
        }, 100);

        // AI 配图
        const imgEl = document.getElementById(imgId);
        fetch(`/api/illustration/${encodeURIComponent(word.char)}?word=${encodeURIComponent(word.word || word.char)}`)
            .then(r => r.ok ? r.blob() : Promise.reject())
            .then(blob => { imgEl.innerHTML = `<img src="${URL.createObjectURL(blob)}" alt="${word.char}" />`; })
            .catch(() => { imgEl.innerHTML = `<span class="lcf-img-placeholder">${word.char}</span>`; });

        // 自动朗读
        this.speakLater(`${word.char}，${word.pinyin}，${word.word || ''}`, 400);

        // 预加载下一个字的发音
        if (idx + 1 < words.length) {
            const next = words[idx + 1];
            this.prefetch(`${next.char}，${next.pinyin}，${next.word || ''}`);
        }
    }

    // 从学习阶段进入游戏
    beginGamePlay() {
        document.getElementById('learn-phase').style.display = 'none';
        document.getElementById('level-story').style.display = 'none';
        document.getElementById('game-type-select').style.display = 'none';

        const gameArea = document.getElementById('game-area');
        gameArea.style.display = 'block';

        document.getElementById('game-content').innerHTML = '';
        document.getElementById('game-instruction').textContent = '准备开始...';

        this.updateGameProgress();

        setTimeout(() => {
            this.nextWord();
        }, 100);
    }

    // 下一个字
    nextWord() {
        if (this.wordsFoundInSession >= this.currentWords.length) {
            return;
        }

        this.targetWord = this.currentWords[this.wordsFoundInSession];

        if (this.currentGameType === 'listen') {
            document.getElementById('game-instruction').textContent =
                '听声音，找到对应的字宝宝！';
        } else {
            document.getElementById('game-instruction').textContent =
                `美乐蒂说："${this.targetWord.char}"字宝宝在哪里呢？`;
        }

        const content = document.getElementById('game-content');
        content.innerHTML = '';
        content.style.display = 'block';

        if (this.currentGameType !== 'listen') {
            this.speak(`请找到${this.targetWord.char}字`);
        }

        if (this.currentGameType === 'bubble') {
            this.startBubbleGame();
        } else if (this.currentGameType === 'puzzle') {
            this.startPuzzleGame();
        } else if (this.currentGameType === 'listen') {
            this.startListenGame();
        } else {
            this.startHideSeekGame();
        }
    }

    // 更新游戏进度
    updateGameProgress() {
        document.getElementById('game-progress-text').textContent =
            `${this.wordsFoundInSession}/${this.totalWordsToFind}`;
    }

    // 游戏 1：捉迷藏
    startHideSeekGame() {
        const container = document.getElementById('game-content');

        container.innerHTML = '';
        container.style.display = 'flex';
        container.style.flexWrap = 'wrap';
        container.style.justifyContent = 'center';
        container.style.alignItems = 'flex-end';
        container.style.gap = '24px';
        container.style.padding = '30px 20px 40px';

        const allWords = wordData.getAllWordsForGrade(this.currentGrade ? this.currentGrade.id : "1A");
        const options = [this.targetWord];

        while (options.length < 4) {
            const randomWord = allWords[Math.floor(Math.random() * allWords.length)];
            if (!options.find(w => w.char === randomWord.char)) {
                options.push(randomWord);
            }
        }

        options.sort(() => Math.random() - 0.5);

        const cardThemes = [
            { decos: ['🌸', '🌷'], face: '🐱' },
            { decos: ['🍀', '🌿'], face: '🐰' },
            { decos: ['⭐', '✨'], face: '🐻' },
            { decos: ['🎀', '💜'], face: '🐼' }
        ];

        options.forEach((word, index) => {
            const theme = cardThemes[index % cardThemes.length];
            const card = document.createElement('div');
            card.className = `game-card-large card-style-${index % 4}`;
            card.innerHTML = `
                <span class="card-deco top-left">${theme.decos[0]}</span>
                <span class="card-deco top-right">${theme.decos[1]}</span>
                <span class="char">${word.char}</span>
                <span class="card-face">${theme.face}</span>
            `;

            card.addEventListener('click', () => {
                if (word.char === this.targetWord.char) {
                    this.playSound('correct');
                    this.showFoundScreen(word);
                } else {
                    this.playSound('wrong');
                    card.style.opacity = '0.4';
                    card.style.transform = 'scale(0.9)';
                    card.style.filter = 'grayscale(0.6)';
                    this.speak('再试试');
                }
            });

            container.appendChild(card);
        });
    }

    // 游戏 2：泡泡消除
    startBubbleGame() {
        const gameArea = document.getElementById('game-area');
        const gameContent = document.getElementById('game-content');
        const gameInstruction = document.getElementById('game-instruction');

        gameArea.style.display = 'block';
        gameContent.style.display = 'block';
        gameContent.style.position = 'relative';
        gameContent.style.minHeight = '450px';
        gameInstruction.style.display = 'block';

        gameContent.innerHTML = '';

        const allWords = wordData.getAllWordsForGrade(this.currentGrade ? this.currentGrade.id : "1A");
        const options = [this.targetWord];

        while (options.length < 5) {
            const randomWord = allWords[Math.floor(Math.random() * allWords.length)];
            if (!options.find(w => w.char === randomWord.char)) {
                options.push(randomWord);
            }
        }

        options.sort(() => Math.random() - 0.5);

        const positions = [
            { x: 20, y: 80 },
            { x: 50, y: 20 },
            { x: 80, y: 100 },
            { x: 35, y: 150 },
            { x: 65, y: 50 }
        ];

        options.forEach((word, index) => {
            const bubble = document.createElement('div');
            bubble.className = 'bubble-item';

            const size = 80 + Math.random() * 40;
            const colors = [
                'rgba(255, 182, 193, 0.7)',
                'rgba(255, 192, 203, 0.7)',
                'rgba(221, 160, 221, 0.7)',
                'rgba(135, 206, 235, 0.7)'
            ];

            bubble.style.cssText = `
                position: absolute;
                width: ${size}px;
                height: ${size}px;
                left: ${positions[index].x}%;
                top: ${positions[index].y}px;
                background: radial-gradient(circle at 30% 30%, rgba(255,255,255,0.8), ${colors[index % colors.length]});
                border: 3px solid rgba(255, 105, 180, 0.5);
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: ${3 + Math.random()}rem;
                color: #FF69B4;
                cursor: pointer;
                z-index: 10;
            `;

            bubble.innerHTML = `<span>${word.char}</span>`;

            bubble.addEventListener('click', (e) => {
                if (word.char === this.targetWord.char) {
                    this.playSound('correct');
                    this.createBubblePop(e.clientX, e.clientY);
                    setTimeout(() => {
                        this.showFoundScreen(word);
                    }, 300);
                } else {
                    this.playSound('wrong');
                    bubble.style.background = 'rgba(200, 200, 200, 0.5)';
                    this.speak('不对哦');
                }
            });

            gameContent.appendChild(bubble);
        });
    }

    // 创建泡泡爆破效果
    createBubblePop(x, y) {
        const pop = document.createElement('div');
        pop.className = 'bubble-pop';
        pop.innerHTML = '💥';
        pop.style.left = `${x}px`;
        pop.style.top = `${y}px`;
        pop.style.fontSize = '3rem';
        document.body.appendChild(pop);

        setTimeout(() => pop.remove(), 500);
    }

    // 游戏 3：拼图识字
    startPuzzleGame() {
        const container = document.getElementById('game-content');
        container.innerHTML = '';

        const puzzleContainer = document.createElement('div');
        puzzleContainer.className = 'puzzle-container';

        // 显示目标字的部首和部件
        const targetChar = this.targetWord.char;

        // 简化版：显示两个部件，让孩子选择正确的组合
        puzzleContainer.innerHTML = `
            <p style="font-size: 1.3rem; color: #888;">帮"${targetChar}"字找到正确的部件吧！</p>
            <div class="puzzle-board" id="puzzle-board"></div>
            <div class="puzzle-pieces" id="puzzle-pieces"></div>
        `;

        container.appendChild(puzzleContainer);

        // 生成部件选项（简化：直接用其他字作为干扰）
        const allWords = wordData.getAllWordsForGrade(this.currentGrade ? this.currentGrade.id : "1A");
        const pieces = [this.targetWord];

        while (pieces.length < 4) {
            const randomWord = allWords[Math.floor(Math.random() * allWords.length)];
            if (!pieces.find(w => w.char === randomWord.char)) {
                pieces.push(randomWord);
            }
        }

        pieces.sort(() => Math.random() - 0.5);

        const piecesContainer = document.getElementById('puzzle-pieces');
        pieces.forEach(word => {
            const piece = document.createElement('div');
            piece.className = 'puzzle-piece';
            piece.textContent = word.char;

            piece.addEventListener('click', () => {
                if (word.char === this.targetWord.char) {
                    this.playSound('correct');
                    piece.classList.add('placed');

                    const board = document.getElementById('puzzle-board');
                    board.innerHTML = `<div class="puzzle-slot word-appear">${word.char}</div>`;

                    setTimeout(() => {
                        this.showFoundScreen(word);
                    }, 1000);
                } else {
                    this.playSound('wrong');
                    piece.style.opacity = '0.5';
                    this.speak('再试试');
                }
            });

            piecesContainer.appendChild(piece);
        });
    }

    // 游戏 4：听音选字
    startListenGame() {
        const container = document.getElementById('game-content');
        container.innerHTML = '';
        container.style.display = 'block';
        container.style.textAlign = 'center';

        document.getElementById('game-instruction').textContent =
            '听声音，找到对应的字宝宝！';

        const playBtn = document.createElement('button');
        playBtn.className = 'listen-play-btn';
        playBtn.textContent = '🔊';
        playBtn.addEventListener('click', () => {
            this.speak(this.targetWord.char);
        });
        container.appendChild(playBtn);

        const allWords = wordData.getAllWordsForGrade(this.currentGrade ? this.currentGrade.id : '1A');
        const options = [this.targetWord];
        while (options.length < 4) {
            const rw = allWords[Math.floor(Math.random() * allWords.length)];
            if (!options.find(w => w.char === rw.char)) options.push(rw);
        }
        options.sort(() => Math.random() - 0.5);

        const grid = document.createElement('div');
        grid.style.cssText = 'display:flex;flex-wrap:wrap;justify-content:center;gap:15px;margin-top:15px;';

        options.forEach((word, i) => {
            const card = document.createElement('div');
            card.className = `game-card-large card-style-${i % 4}`;
            card.innerHTML = `<span class="char">${word.char}</span>`;
            card.addEventListener('click', () => {
                if (word.char === this.targetWord.char) {
                    this.playSound('correct');
                    this.showFoundScreen(word);
                } else {
                    this.playSound('wrong');
                    card.style.opacity = '0.4';
                    card.style.filter = 'grayscale(0.6)';
                    this.speak('不对哦，再听一次');
                    this.speakLater(this.targetWord.char, 1500);
                }
            });
            grid.appendChild(card);
        });

        container.appendChild(grid);

        this.speakLater(this.targetWord.char, 500);
    }

    // 显示找到字宝宝界面
    showFoundScreen(word) {
        const foundScreen = document.getElementById('found-screen');
        foundScreen.style.display = 'flex';

        document.getElementById('found-char').textContent = word.char;
        const wordGroup = word.word || word.group || '';
        const msg = `${word.pinyin}　　组词：${wordGroup}`;
        document.getElementById('found-message').innerHTML =
            `<b style="font-size:1.5rem;color:#FF69B4">${word.pinyin}</b><br>组词：${wordGroup}`;

        this.foundWordData = word;

        // 间隔复习：记录复习时间
        if (!this.state.reviewLog) this.state.reviewLog = {};
        this.state.reviewLog[word.char] = Date.now();
        this.saveState();

        // 后台生成芽芽专属配图（不阻塞UI，缓存后城堡可用）
        fetch(`/api/personal-illustration/${encodeURIComponent(word.char)}?word=${encodeURIComponent(word.word || word.char)}`)
            .catch(() => {});

        const foundText = `找到啦！${word.char}，${word.pinyin}，${wordGroup}。点击送字宝宝回家吧！`;
        this.speakLater(foundText, 300);

        // 预加载下一轮可能需要的语音
        const nextIdx = this.wordsFoundInSession;
        if (nextIdx < this.currentWords.length) {
            const nw = this.currentWords[nextIdx];
            this.prefetch(`请找到${nw.char}字`);
        }
    }

    // 送字宝宝回家
    sendWordHome() {
        if (!this.foundWordData) {
            this.showGameModal({
                icon: '😢',
                message: '出错了，没有找到字宝宝数据，<br>请刷新页面重试',
                buttons: [{ text: '好的', value: true, primary: true }]
            });
            return;
        }

        this.playSound('correct');
        this.showConfetti();

        const foundNewWord = !this.state.foundWords.includes(this.foundWordData.char);

        if (foundNewWord) {
            this.state.foundWords.push(this.foundWordData.char);
            this.state.islandsProgress[this.currentIsland]++;
        }

        this.state.lovePoints += 3;
        this.wordsFoundInSession++;

        this.saveState();
        this.updateUI();
        this.updateMap();
        this.updateGameProgress();

        const islandProgress = this.state.islandsProgress[this.currentIsland] || 0;
        const totalInIsland = this.currentIslandData ? this.currentIslandData.words.length : 5;
        const isIslandCompleted = islandProgress >= totalInIsland;
        const sessionComplete = this.wordsFoundInSession >= this.currentWords.length;
        const allWords = wordData.getAllWordsForGrade(this.currentGrade ? this.currentGrade.id : "1A");
        const hasMoreWords = this.state.foundWords.length < allWords.length;

        setTimeout(() => {
            document.getElementById('found-screen').style.display = 'none';

            if (isIslandCompleted) {
                const islandName = this.currentIslandData ? this.currentIslandData.name : '这个单元';
                this.speakLater(`太棒了！${islandName}的字宝宝都找到啦！美乐蒂说，小小英雄真厉害！`, 200);
                this.showGameModal({
                    icon: '🎉',
                    message: `太棒了！<br>${islandName}的字宝宝都找到啦！<br><br>美乐蒂说："小小英雄真厉害！"`,
                    buttons: [{ text: '太棒了！', value: true, primary: true }]
                }).then(() => {
                    if (this.currentGrade) {
                        const units = this.currentGrade.units;
                        const curIdx = units.findIndex(u => u.id === this.currentIsland);
                        if (curIdx >= 0 && curIdx < units.length - 1) {
                            this.showToast(`🎉 解锁新单元：${units[curIdx + 1].name}！`);
                        }
                    }
                    this.showScreen('map-screen');
                    this.showMapDialogue();
                    this.animatePath();
                });

            } else if (sessionComplete) {
                const remainingWords = totalInIsland - islandProgress;

                if (remainingWords > 0 && hasMoreWords) {
                    const foundChars = this.currentWords.map(w => w.char).join('、');
                    this.speakLater(`太棒了！本轮完成啦！你找到了${foundChars}。还有${remainingWords}个字宝宝等着你哦，要继续玩吗？`, 200);
                    this.showGameModal({
                        icon: '🎉',
                        message: `太棒了！本轮完成啦！<br><br>找到的字：${foundChars}<br>获得爱心：+${this.currentWords.length * 3} 💖<br><br>${this.currentIslandData ? this.currentIslandData.name : '这个单元'}还有 ${remainingWords} 个字宝宝等着你哦～`,
                        buttons: [
                            { text: '继续玩！', value: true, primary: true },
                            { text: '回地图', value: false, primary: false }
                        ]
                    }).then(continuePlaying => {
                        if (continuePlaying) {
                            this.showGameTypeSelect();
                        } else {
                            this.showScreen('map-screen');
                            this.showMapDialogue();
                            this.animatePath();
                        }
                    });
                } else {
                    this.showGameModal({
                        icon: '🎉',
                        message: '哇！这个岛屿上的字宝宝都被你找到啦！<br><br>美乐蒂说："小小英雄太厉害了！"',
                        buttons: [{ text: '太棒了！', value: true, primary: true }]
                    }).then(() => {
                        this.showScreen('map-screen');
                        this.showMapDialogue();
                        this.animatePath();
                    });
                }

            } else {
                const gameArea = document.getElementById('game-area');
                const gameContent = document.getElementById('game-content');
                const gameInstruction = document.getElementById('game-instruction');

                gameArea.style.display = 'block';
                gameContent.style.display = 'block';
                gameContent.innerHTML = '';
                gameInstruction.style.display = 'block';

                this.nextWord();
            }
        }, 500);
    }

    // 显示城堡
    showCastle() {
        this.showScreen('castle-screen');
        document.getElementById('castle-count').textContent = this.state.foundWords.length;
        const count = this.state.foundWords.length;
        if (count === 0) {
            this.speakLater('字宝宝城堡！城堡里还没有字宝宝呢，快去冒险邀请字宝宝们来住吧！', 300);
        } else {
            this.speakLater(`字宝宝城堡！已经住了${count}个字宝宝。点一个字宝宝看芽芽的专属图片吧！`, 300);
        }

        // 显示装饰
        const decoContainer = document.getElementById('castle-decorations');
        decoContainer.innerHTML = '';
        this.state.ownedDecorations.slice(0, 8).forEach(deco => {
            const item = document.createElement('div');
            item.className = 'castle-decoration-item';
            item.textContent = deco;
            decoContainer.appendChild(item);
        });

        // 显示字宝宝图鉴
        const grid = document.getElementById('castle-words-grid');
        grid.innerHTML = '';

        if (this.state.foundWords.length === 0) {
            grid.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 50px; color: #888;">
                    <p style="font-size: 3rem;">🏰</p>
                    <p>城堡里还没有字宝宝呢</p>
                    <p>快去冒险，邀请字宝宝们来住吧！</p>
                </div>
            `;
            return;
        }

        const allWords = wordData.getAllWordsForGrade(this.currentGrade ? this.currentGrade.id : '1A');
        const foundWordObjects = allWords.filter(w => this.state.foundWords.includes(w.char));

        foundWordObjects.forEach(word => {
            const card = document.createElement('div');
            card.className = 'castle-img-card';
            card.innerHTML = `
                <div class="cic-img-wrap"><span class="cic-loading">🎨</span></div>
                <div class="cic-label">
                    <span class="cic-char">${word.char}</span>
                    <span class="cic-pinyin">${word.pinyin}</span>
                </div>
            `;

            // 加载专属配图
            const wrap = card.querySelector('.cic-img-wrap');
            fetch(`/api/personal-illustration/${encodeURIComponent(word.char)}?word=${encodeURIComponent(word.word || word.char)}`)
                .then(r => r.ok ? r.blob() : Promise.reject())
                .then(blob => {
                    wrap.innerHTML = `<img src="${URL.createObjectURL(blob)}" alt="${word.char}" />`;
                })
                .catch(() => {
                    wrap.innerHTML = `<span class="cic-fallback">${word.char}</span>`;
                });

            card.addEventListener('click', () => {
                this.showCastleDetail(word);
            });
            grid.appendChild(card);
        });
    }

    // 城堡大图详情
    showCastleDetail(word) {
        this.speak(word.char);
        const w = word.word || word.group || '';

        const modal = document.getElementById('game-modal');
        const iconEl = document.getElementById('modal-icon');
        const messageEl = document.getElementById('modal-message');
        const buttonsEl = document.getElementById('modal-buttons');

        iconEl.textContent = '';
        iconEl.style.fontSize = '0';

        // 先显示加载状态
        messageEl.innerHTML = `
            <div class="castle-detail">
                <div class="cd-img-container"><span class="lcf-img-loading">🎨</span></div>
                <div class="cd-info">
                    <span class="cd-char">${word.char}</span>
                    <span class="cd-pinyin">${word.pinyin}</span>
                    <span class="cd-word">组词：${w}</span>
                </div>
            </div>
        `;

        buttonsEl.innerHTML = '';
        const btn = document.createElement('button');
        btn.className = 'game-modal-btn primary';
        btn.textContent = '🔊 听一听';
        btn.addEventListener('click', () => {
            this.speak(`${word.char}，${word.pinyin}，${w}`);
        });
        buttonsEl.appendChild(btn);

        const closeBtn = document.createElement('button');
        closeBtn.className = 'game-modal-btn secondary';
        closeBtn.textContent = '关闭';
        closeBtn.addEventListener('click', () => {
            modal.style.display = 'none';
            iconEl.style.fontSize = '';
        });
        buttonsEl.appendChild(closeBtn);

        modal.style.display = 'flex';

        // 加载大图
        const imgContainer = modal.querySelector('.cd-img-container');
        fetch(`/api/personal-illustration/${encodeURIComponent(word.char)}?word=${encodeURIComponent(w)}`)
            .then(r => r.ok ? r.blob() : Promise.reject())
            .then(blob => {
                imgContainer.innerHTML = `<img src="${URL.createObjectURL(blob)}" alt="${word.char}" />`;
            })
            .catch(() => {
                imgContainer.innerHTML = `<span style="font-size:5rem;color:var(--pink-dark)">${word.char}</span>`;
            });

        this.speakLater(`${word.char}，${word.pinyin}，${w}`, 300);
    }

    // 显示背包
    showBackpack() {
        this.showScreen('backpack-screen');
        document.getElementById('backpack-love').textContent = this.state.lovePoints;
        this.speakLater(`我的背包！你有${this.state.lovePoints}颗爱心，已经找到${this.state.foundWords.length}个字宝宝，探索了${this.state.visitedIslands.length}个岛屿！`, 300);

        const stickersGrid = document.getElementById('stickers-grid');
        stickersGrid.innerHTML = '';

        const allStickers = ['🌸', '🎀', '⭐', '🌙', '🦄', '🍬', '🎨', '🎪', '🌟', '🌺'];
        allStickers.forEach(sticker => {
            const item = document.createElement('div');
            item.className = `sticker-item ${this.state.stickers.includes(sticker) ? 'collected' : ''}`;
            item.textContent = sticker;
            stickersGrid.appendChild(item);
        });

        document.getElementById('stat-adventure-days').textContent = this.state.adventureDay;
        document.getElementById('stat-words-found').textContent = this.state.foundWords.length;
        document.getElementById('stat-islands-explored').textContent = this.state.visitedIslands.length;
    }

    // 显示商店
    showShop() {
        this.showScreen('shop-screen');
        document.getElementById('shop-love-points').textContent = this.state.lovePoints;
        this.renderShop();
        this.speakLater(`魔法商店！你有${this.state.lovePoints}颗爱心，可以买城堡装饰哦！`, 300);
    }

    // 渲染商店
    renderShop() {
        const grid = document.getElementById('shop-grid');
        grid.innerHTML = '';

        this.shopItems.forEach(item => {
            const owned = this.state.ownedDecorations.includes(item.icon);
            const el = document.createElement('div');
            el.className = `shop-item ${owned ? 'owned' : ''}`;
            el.innerHTML = `
                <div class="shop-item-icon">${item.icon}</div>
                <div class="shop-item-name">${item.name}</div>
                <div class="shop-item-price">${owned ? '已拥有' : item.price + ' 💖'}</div>
            `;

            if (!owned) {
                el.addEventListener('click', () => {
                    this.buyDecoration(item);
                });
            }

            grid.appendChild(el);
        });
    }

    // 购买装饰
    buyDecoration(item) {
        if (this.state.lovePoints >= item.price) {
            this.state.lovePoints -= item.price;
            this.state.ownedDecorations.push(item.icon);
            this.saveState();
            this.updateUI();
            document.getElementById('shop-love-points').textContent = this.state.lovePoints;
            this.renderShop();

            this.playSound('correct');
            this.showGameModal({
                icon: '🎉',
                message: `购买了 ${item.name}！<br>快去城堡看看装饰效果吧～`,
                buttons: [{ text: '好的', value: true, primary: true }]
            });
            this.speakLater(`购买了${item.name}！快去城堡看看装饰效果吧！`, 200);
        } else {
            this.showGameModal({
                icon: '💔',
                message: '爱心不够呢，继续冒险赚爱心吧！',
                buttons: [{ text: '好的', value: true, primary: true }]
            });
            this.speakLater('爱心不够呢，继续冒险赚爱心吧！', 200);
        }
    }

    // 显示字的详情
    showWordDetail(word) {
        this.speak(word.char);
        setTimeout(() => {
            const w = word.word || word.group || '';
            const ex = word.example || '';
            this.showGameModal({
                icon: word.char,
                message: `<b>${word.pinyin}</b><br><br>组词：${w}${ex ? '<br>例句：' + ex : ''}`,
                buttons: [{ text: '知道了', value: true, primary: true }]
            });
            this.speakLater(`${word.char}，${word.pinyin}。组词：${w}。${ex}`, 200);
        }, 300);
    }

    // ── 语音系统（预加载 + 内存缓存） ───────────────

    stopSpeaking() {
        clearTimeout(this._speakTimer);
        this._speakTimer = null;
        if (this._currentAudio) {
            this._currentAudio.pause();
            this._currentAudio.currentTime = 0;
            this._currentAudio = null;
        }
        if ('speechSynthesis' in window) speechSynthesis.cancel();
    }

    _cleanText(text) {
        return text.replace(/<[^>]*>/g, '').replace(/\n/g, '，').trim();
    }

    _ttsUrl(text) {
        return `/api/tts?t=${encodeURIComponent(text)}`;
    }

    // 预加载：让浏览器缓存音频（GET 请求 + Cache-Control: immutable）
    prefetch(texts) {
        const list = Array.isArray(texts) ? texts : [texts];
        list.forEach(raw => {
            const t = this._cleanText(raw);
            if (!t) return;
            // 用 <link rel=prefetch> 或 fetch 触发浏览器缓存
            const link = document.createElement('link');
            link.rel = 'prefetch';
            link.as = 'audio';
            link.href = this._ttsUrl(t);
            document.head.appendChild(link);
        });
    }

    // 播放：GET 请求 → 浏览器缓存命中秒播放
    speak(text) {
        const clean = this._cleanText(text);
        if (!clean) return;
        this.stopSpeaking();

        const audio = new Audio(this._ttsUrl(clean));
        audio.onerror = () => {
            if ('speechSynthesis' in window) {
                const u = new SpeechSynthesisUtterance(clean);
                u.lang = 'zh-CN'; u.rate = 0.85; u.pitch = 1.2;
                speechSynthesis.speak(u);
            }
        };
        this._currentAudio = audio;
        audio.play().catch(() => {});
    }

    speakLater(text, delay = 300) {
        clearTimeout(this._speakTimer);
        this._speakTimer = setTimeout(() => this.speak(text), delay);
    }

    // 播放音效
    playSound(type) {
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        if (type === 'correct') {
            oscillator.frequency.setValueAtTime(523.25, this.audioContext.currentTime);
            oscillator.frequency.setValueAtTime(659.25, this.audioContext.currentTime + 0.1);
            oscillator.frequency.setValueAtTime(783.99, this.audioContext.currentTime + 0.2);
            gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.4);
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + 0.4);
        } else {
            oscillator.frequency.setValueAtTime(200, this.audioContext.currentTime);
            gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + 0.3);
        }
    }

    // 游戏内弹窗（替代 alert/confirm）
    showGameModal(options) {
        return new Promise((resolve) => {
            const modal = document.getElementById('game-modal');
            const iconEl = document.getElementById('modal-icon');
            const messageEl = document.getElementById('modal-message');
            const buttonsEl = document.getElementById('modal-buttons');

            iconEl.textContent = options.icon || '🎀';
            messageEl.innerHTML = options.message;
            buttonsEl.innerHTML = '';

            const buttons = options.buttons || [{ text: '好的', value: true, primary: true }];
            buttons.forEach(btn => {
                const button = document.createElement('button');
                button.className = `game-modal-btn ${btn.primary ? 'primary' : 'secondary'}`;
                button.textContent = btn.text;
                button.addEventListener('click', () => {
                    modal.style.display = 'none';
                    resolve(btn.value);
                });
                buttonsEl.appendChild(button);
            });

            modal.style.display = 'flex';
        });
    }

    // 庆祝动画
    showConfetti() {
        const colors = ['#FF69B4', '#FFB6C1', '#FFC0CB', '#DDA0DD', '#FFD700', '#87CEEB'];

        for (let i = 0; i < 50; i++) {
            setTimeout(() => {
                const confetti = document.createElement('div');
                confetti.className = 'confetti';
                confetti.style.cssText = `
                    position: fixed;
                    left: ${Math.random() * 100}vw;
                    top: -10px;
                    width: ${8 + Math.random() * 8}px;
                    height: ${8 + Math.random() * 8}px;
                    background: ${colors[Math.floor(Math.random() * colors.length)]};
                    animation: fall ${2 + Math.random() * 2}s linear forwards;
                    z-index: 9999;
                `;
                document.body.appendChild(confetti);

                setTimeout(() => confetti.remove(), 4000);
            }, i * 30);
        }
    }
}

// 启动游戏
const game = new AdventureGame();
