class CardGame {
    constructor() {
        this.playerHealth = 5;
        this.enemyHealth = 5;
        this.round = 1;
        this.playerHand = [];
        this.enemyHand = [];
        this.deck = [];
        this.selectedCards = [];
        this.currentMod = 'NM';
        this.isTB = false;
        this.gameOver = false;

        // DOM元素引用
        this.playerHandEl = document.getElementById('player-hand');
        this.enemyHandEl = document.getElementById('enemy-hand');
        this.playerHealthEl = document.getElementById('player-health');
        this.enemyHealthEl = document.getElementById('enemy-health');
        this.playerHealthBar = document.getElementById('player-health-bar');
        this.enemyHealthBar = document.getElementById('enemy-health-bar');
        this.roundEl = document.getElementById('round-number');
        this.cardsLeftEl = document.getElementById('cards-left');
        this.modIndicator = document.getElementById('mod-indicator');
        this.playBtn = document.getElementById('play-btn');
        this.endTurnBtn = document.getElementById('end-turn-btn');
        this.restartBtn = document.getElementById('restart-btn');
        this.playerPlayedEl = document.getElementById('player-played');
        this.enemyPlayedEl = document.getElementById('enemy-played');
        this.battleResult = document.getElementById('battle-result');
        this.criticalIndicator = document.getElementById('critical-indicator');

        // 绑定事件
        this.playBtn.addEventListener('click', () => this.playSelectedCards());
        this.endTurnBtn.addEventListener('click', () => this.endTurn());
        this.restartBtn.addEventListener('click', () => this.restartGame());

        // 初始化游戏
        this.initGame();
    }

    initGame() {
        this.playerHealth = 5;
        this.enemyHealth = 5;
        this.round = 1;
        this.selectedCards = [];
        this.isTB = false;
        this.gameOver = false;

        // 创建牌库
        this.createDeck();

        // 初始抽牌
        this.drawInitialCards();

        // 随机环境MOD
        this.setRandomMod();

        // 更新UI
        this.updateUI();
    }

    createDeck() {
        this.deck = [];
        const mods = ['HR', 'EZ', 'DT', 'HD'];

        for (let i = 0; i < 30; i++) {
            const card = {
                id: i,
                aim: Math.floor(Math.random() * 10) + 1,
                spd: Math.floor(Math.random() * 10) + 1,
                acc: Math.floor(Math.random() * 10) + 1,
                mod: mods[Math.floor(Math.random() * mods.length)]
            };
            this.deck.push(card);
        }
    }

    drawInitialCards() {
        this.playerHand = [];
        this.enemyHand = [];

        // 初始抽6张牌
        for (let i = 0; i < 6; i++) {
            this.playerHand.push(this.drawCard());
            this.enemyHand.push(this.drawCard());
        }
    }

    drawCard() {
        if (this.deck.length === 0) {
            console.log("牌库已空");
            return null;
        }
        const index = Math.floor(Math.random() * this.deck.length);
        return this.deck.splice(index, 1)[0];
    }

    setRandomMod() {
        const mods = ['NM', 'HR', 'EZ', 'DT', 'HD'];
        this.currentMod = mods[Math.floor(Math.random() * mods.length)];
    }

    renderCards() {
        // 渲染玩家手牌
        this.playerHandEl.innerHTML = '';
        this.playerHand.forEach(card => {
            const cardEl = this.createCardElement(card, true);
            this.playerHandEl.appendChild(cardEl);
        });

        // 渲染电脑手牌（背面显示）
        this.enemyHandEl.innerHTML = '';
        this.enemyHand.forEach(card => {
            const cardEl = document.createElement('div');
            cardEl.className = 'card';
            cardEl.innerHTML = `
                        <div class="card-header">
                            <div class="card-mod">隐藏</div>
                        </div>
                        <div class="card-stats">
                            <div class="stat">
                                <span class="stat-name">Aim</span>
                                <span class="stat-value">?</span>
                            </div>
                            <div class="stat">
                                <span class="stat-name">Spd</span>
                                <span class="stat-value">?</span>
                            </div>
                            <div class="stat">
                                <span class="stat-name">Acc</span>
                                <span class="stat-value">?</span>
                            </div>
                        </div>
                        <div class="card-footer">点击查看详情</div>
                    `;
            this.enemyHandEl.appendChild(cardEl);
        });
    }

    createCardElement(card, isPlayer) {
        const cardEl = document.createElement('div');
        cardEl.className = 'card';
        if (this.selectedCards.includes(card.id)) {
            cardEl.classList.add('selected');
        }
        let aimValue = "";
        let spdValue = "";
        let accValue = "";
        // 计算实际值（考虑MOD效果）
        const multiplier = (card.mod === this.currentMod) ? 1.2 : 1;
        aimValue += card.aim + ((multiplier > 1) ? ` +${(card.aim * (multiplier - 1)).toFixed(1)}` : "");
        spdValue += card.spd + ((multiplier > 1) ? ` +${(card.spd * (multiplier - 1)).toFixed(1)}` : "");
        accValue += card.acc + ((multiplier > 1) ? ` +${(card.acc * (multiplier - 1)).toFixed(1)}` : "");

        cardEl.innerHTML = `
                    <div class="card-header">
                        <div class="card-mod ${card.mod === this.currentMod ? 'highlight' : ''}">${card.mod}</div>
                    </div>
                    <div class="card-stats">
                        <div class="stat">
                            <span class="stat-name">Aim</span>
                            <span class="stat-value">${aimValue}</span>
                        </div>
                        <div class="stat">
                            <span class="stat-name">Spd</span>
                            <span class="stat-value">${spdValue}</span>
                        </div>
                        <div class="stat">
                            <span class="stat-name">Acc</span>
                            <span class="stat-value">${accValue}</span>
                        </div>
                    </div>
                    <div class="card-footer">ID: ${card.id}</div>
                `;

        if (isPlayer) {
            cardEl.addEventListener('click', () => {
                this.toggleCardSelection(card);
            });
        }

        return cardEl;
    }

    toggleCardSelection(card) {
        if (this.gameOver) return;

        const index = this.selectedCards.indexOf(card.id);

        // TB模式下最多可以选择4张牌，否则最多3张
        const maxSelection = this.isTB ? 4 : 3;

        if (index === -1) {
            if (this.selectedCards.length < maxSelection) {
                this.selectedCards.push(card.id);
            }
        } else {
            this.selectedCards.splice(index, 1);
        }

        // 更新按钮状态
        this.playBtn.disabled = this.selectedCards.length === 0;

        // 重新渲染手牌以更新选中状态
        this.renderCards();
    }

    playSelectedCards() {
        if (this.selectedCards.length === 0 || this.selectedCards.length > (this.isTB ? 4 : 3)) return;

        // 获取玩家选择的卡牌
        const playerCards = this.playerHand.filter(card =>
            this.selectedCards.includes(card.id)
        );

        // 移除已使用的卡牌
        this.playerHand = this.playerHand.filter(card =>
            !this.selectedCards.includes(card.id)
        );

        // AI选择卡牌（简单策略）
        const enemyCards = this.enemyAI();

        // 显示双方出牌
        this.displayPlayedCards(playerCards, enemyCards);

        // 进行战斗计算
        this.calculateBattle(playerCards, enemyCards);

        // 清空选择
        this.selectedCards = [];
        this.playBtn.disabled = true;
    }

    enemyAI() {
        // 简单AI策略：随机选择1-3张牌
        const cardCount = this.isTB ?
            Math.min(4, this.enemyHand.length) :
            Math.min(3, Math.floor(Math.random() * 3) + 1);

        const selected = [];
        const handCopy = [...this.enemyHand];

        for (let i = 0; i < cardCount; i++) {
            if (handCopy.length === 0) break;

            // 优先选择当前MOD的卡牌
            const modCards = handCopy.filter(card => card.mod === this.currentMod);
            const nonModCards = handCopy.filter(card => card.mod !== this.currentMod);

            if (modCards.length > 0) {
                const index = Math.floor(Math.random() * modCards.length);
                selected.push(modCards[index]);
                handCopy.splice(handCopy.indexOf(modCards[index]), 1);
            } else if (nonModCards.length > 0) {
                const index = Math.floor(Math.random() * nonModCards.length);
                selected.push(nonModCards[index]);
                handCopy.splice(handCopy.indexOf(nonModCards[index]), 1);
            }
        }

        // 从手牌中移除选择的卡牌
        this.enemyHand = this.enemyHand.filter(card =>
            !selected.includes(card)
        );

        return selected;
    }

    displayPlayedCards(playerCards, enemyCards) {
        // 显示玩家出牌
        this.playerPlayedEl.innerHTML = '';
        playerCards.forEach(card => {
            const cardEl = this.createCardElement(card, false);
            this.playerPlayedEl.appendChild(cardEl);
        });

        // 显示电脑出牌
        this.enemyPlayedEl.innerHTML = '';
        enemyCards.forEach(card => {
            const cardEl = this.createCardElement(card, false);
            this.enemyPlayedEl.appendChild(cardEl);
        });
    }

    calculateBattle(playerCards, enemyCards) {
        // 计算玩家属性总和（考虑MOD效果）
        const playerStats = this.calculateTotalStats(playerCards);
        const enemyStats = this.calculateTotalStats(enemyCards);

        // 检查是否暴击（所有属性都高于对手）
        const isCritical = playerStats.aim > enemyStats.aim &&
            playerStats.spd > enemyStats.spd &&
            playerStats.acc > enemyStats.acc;

        // 比较最高属性
        const playerMax = Math.max(playerStats.aim, playerStats.spd, playerStats.acc);
        const enemyMax = Math.max(enemyStats.aim, enemyStats.spd, enemyStats.acc);

        let resultText = '';

        if (playerMax > enemyMax) {
            resultText = "玩家获胜!";
            const damage = isCritical ? 2 : 1;
            this.enemyHealth = Math.max(0, this.enemyHealth - damage);
        } else if (playerMax < enemyMax) {
            resultText = "电脑获胜!";
            const damage = isCritical ? 2 : 1;
            this.playerHealth = Math.max(0, this.playerHealth - damage);
        } else {
            // 平局时比较第二高属性
            const playerSorted = [playerStats.aim, playerStats.spd, playerStats.acc].sort((a, b) => b - a);
            const enemySorted = [enemyStats.aim, enemyStats.spd, enemyStats.acc].sort((a, b) => b - a);

            if (playerSorted[1] > enemySorted[1]) {
                resultText = "玩家获胜 (第二属性)!";
                const damage = isCritical ? 2 : 1;
                this.enemyHealth = Math.max(0, this.enemyHealth - damage);
            } else if (playerSorted[1] < enemySorted[1]) {
                resultText = "电脑获胜 (第二属性)!";
                const damage = isCritical ? 2 : 1;
                this.playerHealth = Math.max(0, this.playerHealth - damage);
            } else {
                // 再次平局比较第三属性
                if (playerSorted[2] > enemySorted[2]) {
                    resultText = "玩家获胜 (第三属性)!";
                    const damage = isCritical ? 2 : 1;
                    this.enemyHealth = Math.max(0, this.enemyHealth - damage);
                } else if (playerSorted[2] < enemySorted[2]) {
                    resultText = "电脑获胜 (第三属性)!";
                    const damage = isCritical ? 2 : 1;
                    this.playerHealth = Math.max(0, this.playerHealth - damage);
                } else {
                    resultText = "平局!";
                }
            }
        }

        this.battleResult.textContent = resultText;

        if (isCritical) {
            this.criticalIndicator.innerHTML = '<div class="critical-hit">暴击! 双倍伤害!</div>';
        } else {
            this.criticalIndicator.innerHTML = '';
        }

        // 检查游戏是否结束
        this.checkGameEnd();

        // 更新UI
        this.updateUI();
    }

    calculateTotalStats(cards) {
        let aim = 0;
        let spd = 0;
        let acc = 0;

        cards.forEach(card => {
            const multiplier = (card.mod === this.currentMod) ? 1.2 : 1;
            aim += card.aim * multiplier;
            spd += card.spd * multiplier;
            acc += card.acc * multiplier;
        });

        return { aim, spd, acc };
    }

    endTurn() {
        if (this.gameOver) return;

        // 进入下一回合
        this.round++;

        // 抽牌（第一回合后每回合抽2张）
        if (this.round > 1) {
            this.playerHand.push(this.drawCard());
            this.playerHand.push(this.drawCard());
            this.enemyHand.push(this.drawCard());
            this.enemyHand.push(this.drawCard());
        }

        // 检查是否进入TB模式
        this.isTB = (this.playerHealth === 1 && this.enemyHealth === 1);

        // 随机环境MOD
        this.setRandomMod();

        // 清空选择
        this.selectedCards = [];
        this.playBtn.disabled = true;

        // 清空战斗结果
        this.playerPlayedEl.innerHTML = '';
        this.enemyPlayedEl.innerHTML = '';
        this.battleResult.textContent = '等待开始...';
        this.criticalIndicator.innerHTML = '';

        // 更新UI
        this.updateUI();
    }

    checkGameEnd() {
        if (this.playerHealth <= 0 || this.enemyHealth <= 0) {
            this.gameOver = true;
            const winner = this.playerHealth <= 0 ? "电脑" : "玩家";
            this.battleResult.textContent = `游戏结束! ${winner}获胜!`;
            this.playBtn.disabled = true;
        }
    }

    restartGame() {
        this.initGame();
    }

    updateUI() {
        // 更新生命值
        this.playerHealthEl.textContent = this.playerHealth;
        this.enemyHealthEl.textContent = this.enemyHealth;
        this.playerHealthBar.style.width = `${(this.playerHealth / 5) * 100}%`;
        this.enemyHealthBar.style.width = `${(this.enemyHealth / 5) * 100}%`;

        // 更新回合和卡牌数量
        this.roundEl.textContent = this.round;
        this.cardsLeftEl.textContent = this.deck.length;

        // 更新MOD指示器
        this.modIndicator.textContent = `当前环境: ${this.currentMod} ${this.currentMod === 'NM' ? '(无MOD)' : ''}`;

        // 根据MOD改变指示器颜色
        const modColors = {
            'NM': '#a29bfe',
            'HR': '#ff7675',
            'EZ': '#55efc4',
            'DT': '#fdcb6e',
            'HD': '#74b9ff'
        };
        this.modIndicator.style.background = `rgba(0, 0, 0, 0.3)`;
        this.modIndicator.style.color = modColors[this.currentMod] || '#fff';

        // 渲染卡牌
        this.renderCards();

        // 更新按钮状态
        this.playBtn.disabled = this.selectedCards.length === 0 || this.gameOver;
        this.playBtn.textContent = this.isTB ?
            `出牌 (选择1-4张)` :
            `出牌 (选择1-3张)`;
    }
}