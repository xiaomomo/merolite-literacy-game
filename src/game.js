/**
 * 美乐蒂识字大冒险 - 完整版游戏逻辑
 * 包含：捉迷藏、泡泡消除、拼图识字三种游戏
 * 支持 Canvas 动画、商店系统、装饰系统
 */

class AdventureGame {
    constructor() {
        // 游戏状态
        this.state = {
            hasStarted: false,
            adventureDay: 1,
            lovePoints: 0,
            foundWords: [],
            visitedIslands: [],
            stickers: [],
            decorations: [],
            ownedDecorations: ['🌸', '⭐', '🎀'], // 初始装饰
            lastLoginDate: null,
            islandsProgress: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
        };

        // 游戏配置
        this.currentIsland = null;
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

        // 检查是否第一次打开
        if (!this.state.hasStarted) {
            this.showScreen('intro-screen');
        } else {
            this.checkDailyLogin();
            this.showScreen('map-screen');
            this.updateMap();
            this.showMapDialogue();
            this.animatePath();
        }

        this.updateUI();
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

    // 加载存档
    async loadState() {
        const saved = localStorage.getItem('merolite-adventure');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                this.state = { ...this.state, ...parsed };
            } catch (e) {
                console.error('加载存档失败:', e);
            }
        }
    }

    // 保存存档
    saveState() {
        localStorage.setItem('merolite-adventure', JSON.stringify(this.state));
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
            });
        }, 1000);
    }

    // 绑定事件
    bindEvents() {
        // 开始冒险
        document.getElementById('btn-start-adventure').addEventListener('click', () => {
            this.state.hasStarted = true;
            this.saveState();
            this.checkDailyLogin();
            this.showScreen('map-screen');
            this.updateMap();
            this.showMapDialogue();
            this.animatePath();
        });

        // 打开礼物
        document.getElementById('btn-open-gift').addEventListener('click', () => {
            this.openGift();
        });

        // 岛屿点击
        document.querySelectorAll('.island').forEach(island => {
            island.addEventListener('click', (e) => {
                const islandId = parseInt(e.currentTarget.dataset.island);
                this.enterIsland(islandId);
            });
        });

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
        for (let i = 1; i <= 5; i++) {
            const progressEl = document.getElementById(`island-${i}-progress`);
            const lockEl = document.getElementById(`island-${i}-lock`);
            const islandEl = document.getElementById(`island-${i}`);

            progressEl.textContent = `${this.state.islandsProgress[i]}/5`;

            if (i === 1) {
                islandEl.classList.remove('locked');
                lockEl.style.display = 'none';
            } else {
                const prevProgress = this.state.islandsProgress[i - 1];
                if (prevProgress >= 3) {
                    islandEl.classList.remove('locked');
                    lockEl.style.display = 'none';

                    // 检查是否刚解锁
                    if (!this.state.visitedIslands.includes(i)) {
                        this.showToast(`🎉 解锁新岛屿：${this.islandStories[i].name}！`);
                    }
                } else {
                    islandEl.classList.add('locked');
                    lockEl.style.display = 'block';
                }
            }
        }
    }

    // 显示 Toast
    showToast(message) {
        const toast = document.getElementById('levelup-toast');
        toast.querySelector('.toast-message').textContent = message;
        toast.classList.add('show');
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
        if (islandId > 1) {
            const prevProgress = this.state.islandsProgress[islandId - 1];
            if (prevProgress < 3) {
                this.showGameModal({
                    icon: '🔒',
                    message: '先完成前面的岛屿吧！<br>字宝宝们需要你的帮助～',
                    buttons: [{ text: '好的', value: true, primary: true }]
                });
                return;
            }
        }

        this.currentIsland = islandId;
        const islandData = this.islandStories[islandId];

        document.getElementById('level-title').textContent = islandData.name;
        document.getElementById('story-text').textContent = islandData.story;

        this.showScreen('level-screen');
        document.getElementById('level-story').style.display = 'block';
        document.getElementById('game-type-select').style.display = 'none';
        document.getElementById('game-area').style.display = 'none';

        if (!this.state.visitedIslands.includes(islandId)) {
            this.state.visitedIslands.push(islandId);
            this.saveState();
        }
    }

    // 显示游戏类型选择
    showGameTypeSelect() {
        document.getElementById('level-story').style.display = 'none';
        document.getElementById('game-area').style.display = 'none';
        const selectEl = document.getElementById('game-type-select');
        selectEl.style.display = 'block';

        // 重置选择状态
        document.querySelectorAll('.game-type-card').forEach(card => {
            card.classList.remove('selected');
        });
    }

    // 选择游戏类型
    selectGameType(type) {
        this.currentGameType = type;

        document.querySelectorAll('.game-type-card').forEach(card => {
            card.classList.remove('selected');
        });
        document.querySelector(`[data-type="${type}"]`).classList.add('selected');

        // 开始游戏
        setTimeout(() => {
            this.startLevel();
        }, 300);
    }

    // 开始关卡
    startLevel() {
        this.wordsFoundInSession = 0;

        // 根据当前岛屿获取对应的主题字库
        // 岛屿1（花花岛）：家庭篇、身体篇 -> level 1, 2
        // 岛屿2（泡泡海）：数字篇、自然篇·天地 -> level 3, 4
        // 岛屿3（星星山）：自然篇·山水 -> level 5
        // 岛屿4（拼图森林）：动物篇、植物篇 -> level 6, 7
        // 岛屿5（月光城堡）：颜色篇、方向篇、学校篇 -> level 8, 9, 10
        let levelIds = [];
        switch(this.currentIsland) {
            case 1:
                levelIds = [1, 2]; // 家庭篇、身体篇
                break;
            case 2:
                levelIds = [3, 4]; // 数字篇、自然篇·天地
                break;
            case 3:
                levelIds = [5]; // 自然篇·山水
                break;
            case 4:
                levelIds = [6, 7]; // 动物篇、植物篇
                break;
            case 5:
                levelIds = [8, 9, 10]; // 颜色篇、方向篇、学校篇
                break;
            default:
                levelIds = [1, 2, 3, 4, 5];
        }

        // 从对应主题中获取未找到的字
        const learnedWords = this.state.foundWords;
        let availableWords = [];

        levelIds.forEach(levelId => {
            const level = wordData.getLevel(levelId);
            if (level) {
                level.words.forEach(word => {
                    if (!learnedWords.includes(word.char)) {
                        availableWords.push(word);
                    }
                });
            }
        });

        // 如果该岛屿没有未找到的字了，从其他主题补充
        if (availableWords.length === 0) {
            const allWords = wordData.getAllWords();
            availableWords = allWords.filter(w => !learnedWords.includes(w.char));
        }

        // 随机打乱并选择最多 3 个字
        availableWords.sort(() => Math.random() - 0.5);
        const wordsToPlay = Math.min(3, availableWords.length);

        this.currentWords = availableWords.slice(0, wordsToPlay);

        if (this.currentWords.length === 0) {
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

        // 隐藏故事和游戏选择，显示游戏区域
        document.getElementById('level-story').style.display = 'none';
        document.getElementById('game-type-select').style.display = 'none';

        const gameArea = document.getElementById('game-area');
        gameArea.style.display = 'block';

        // 重置游戏内容和进度
        document.getElementById('game-content').innerHTML = '';
        document.getElementById('game-instruction').textContent = '准备开始...';

        this.updateGameProgress();

        // 延迟一下开始，确保显示正确
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

        document.getElementById('game-instruction').textContent =
            `美乐蒂说："${this.targetWord.char}"字宝宝在哪里呢？`;

        const content = document.getElementById('game-content');
        content.innerHTML = '';
        content.style.display = 'block';

        this.speak(`请找到${this.targetWord.char}字`);

        if (this.currentGameType === 'bubble') {
            this.startBubbleGame();
        } else if (this.currentGameType === 'puzzle') {
            this.startPuzzleGame();
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

        const allWords = wordData.getAllWords();
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

        const allWords = wordData.getAllWords();
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
        const allWords = wordData.getAllWords();
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

    // 显示找到字宝宝界面
    showFoundScreen(word) {
        // 显示覆盖层，不切换 screen
        const foundScreen = document.getElementById('found-screen');
        foundScreen.style.display = 'flex';

        document.getElementById('found-char').textContent = word.char;
        document.getElementById('found-message').textContent =
            `"${word.char}"字宝宝说："谢谢你找到我！我的家是${word.group}～"`;

        this.foundWordData = word;
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

        const islandProgress = this.state.islandsProgress[this.currentIsland];
        const isIslandCompleted = islandProgress >= 5;
        const sessionComplete = this.wordsFoundInSession >= this.currentWords.length;
        const allWords = wordData.getAllWords();
        const hasMoreWords = this.state.foundWords.length < allWords.length;

        setTimeout(() => {
            document.getElementById('found-screen').style.display = 'none';

            if (isIslandCompleted) {
                this.showGameModal({
                    icon: '🎉',
                    message: `太棒了！<br>${this.islandStories[this.currentIsland].name}的字宝宝都找到啦！<br><br>美乐蒂说："小小英雄真厉害！"`,
                    buttons: [{ text: '太棒了！', value: true, primary: true }]
                }).then(() => {
                    if (this.currentIsland < 5) {
                        this.showToast(`🎉 解锁新岛屿：${this.islandStories[this.currentIsland + 1].name}！`);
                    }
                    this.showScreen('map-screen');
                    this.showMapDialogue();
                    this.animatePath();
                });

            } else if (sessionComplete) {
                const remainingWords = 5 - islandProgress;

                if (remainingWords > 0 && hasMoreWords) {
                    this.showGameModal({
                        icon: '🎉',
                        message: `太棒了！本轮完成啦！<br><br>找到的字：${this.currentWords.map(w => w.char).join('、')}<br>获得爱心：+${this.currentWords.length * 3} 💖<br><br>${this.islandStories[this.currentIsland].name}还有 ${remainingWords} 个字宝宝等着你哦～`,
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

        // 显示装饰
        const decoContainer = document.getElementById('castle-decorations');
        decoContainer.innerHTML = '';
        this.state.ownedDecorations.slice(0, 8).forEach(deco => {
            const item = document.createElement('div');
            item.className = 'castle-decoration-item';
            item.textContent = deco;
            decoContainer.appendChild(item);
        });

        // 显示字宝宝
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

        const allWords = wordData.getAllWords();
        const foundWordObjects = allWords.filter(w => this.state.foundWords.includes(w.char));

        foundWordObjects.forEach(word => {
            const card = document.createElement('div');
            card.className = 'castle-word-card';
            card.innerHTML = `
                <span class="char">${word.char}</span>
                <span class="pinyin">${word.pinyin}</span>
            `;
            card.addEventListener('click', () => {
                this.showWordDetail(word);
            });
            grid.appendChild(card);
        });
    }

    // 显示背包
    showBackpack() {
        this.showScreen('backpack-screen');
        document.getElementById('backpack-love').textContent = this.state.lovePoints;

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
        } else {
            this.showGameModal({
                icon: '💔',
                message: '爱心不够呢，继续冒险赚爱心吧！',
                buttons: [{ text: '好的', value: true, primary: true }]
            });
        }
    }

    // 显示字的详情
    showWordDetail(word) {
        this.speak(word.char);
        setTimeout(() => {
            this.showGameModal({
                icon: word.char,
                message: `<b>${word.pinyin}</b><br><br>组词：${word.group}<br>例句：${word.example}`,
                buttons: [{ text: '知道了', value: true, primary: true }]
            });
        }, 300);
    }

    // 语音朗读
    speak(text) {
        if ('speechSynthesis' in window) {
            speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'zh-CN';
            utterance.rate = 0.8;
            utterance.pitch = 1.2;
            speechSynthesis.speak(utterance);
        }
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
