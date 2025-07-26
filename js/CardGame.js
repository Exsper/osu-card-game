class CardGame {
    constructor() {
        this.deckCount = 25; // 每副牌的卡牌数量
        this.fullHealth = 6; // 初始生命值
        this.playerHealth = 6;
        this.enemyHealth = 6;
        this.round = 1;
        this.playerHand = [];
        this.enemyHand = [];
        this.baseDeck = [];
        this.playerDeck = [];
        this.enemyDeck = [];
        this.selectedCards = [];
        this.currentMod = 'NM';
        this.isTB = false;
        this.gameOver = false;
        this.hasPlayed = false; // 标记是否已出牌
        // 技能系统变量
        this.skillsUsed = {
            reveal: false,
            draw: false,
            redraw: false,
            steal: false
        };
        this.stealMode = false; // 是否处于偷取模式
        this.revealedEnemyCards = []; // 被侦察显示的敌方卡牌

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
        this.battleOutcome = document.getElementById('battle-outcome');
        this.comparisonDetail = document.getElementById('comparison-detail');

        // 获取技能卡片元素
        this.skill1 = document.getElementById('skill1');
        this.skill2 = document.getElementById('skill2');
        this.skill3 = document.getElementById('skill3');
        this.skill4 = document.getElementById('skill4');
        this.skillHint = document.getElementById('skill-hint');


        // 绑定事件
        this.playBtn.addEventListener('click', () => this.playSelectedCards());
        this.endTurnBtn.addEventListener('click', () => this.endTurn());
        this.restartBtn.addEventListener('click', () => this.restartGame());

        // 绑定技能事件
        this.skill1.addEventListener('click', () => this.useSkill('reveal'));
        this.skill2.addEventListener('click', () => this.useSkill('draw'));
        this.skill3.addEventListener('click', () => this.useSkill('redraw'));
        this.skill4.addEventListener('click', () => this.useSkill('steal'));

        // 初始化游戏
        this.initGame();
    }

    initGame() {
        this.playerHealth = this.fullHealth;
        this.enemyHealth = this.fullHealth;
        this.round = 1;
        this.selectedCards = [];
        this.isTB = false;
        this.gameOver = false;
        this.hasPlayed = false;
        this.skillsUsed = {
            reveal: false,
            draw: false,
            redraw: false,
            steal: false
        };
        this.stealMode = false;
        this.revealedEnemyCards = [];

        // 创建共享牌库（基础牌库）
        this.createBaseDeck();

        // 为玩家和电脑创建独立的牌库副本
        this.playerDeck = JSON.parse(JSON.stringify(this.baseDeck));
        this.enemyDeck = JSON.parse(JSON.stringify(this.baseDeck));

        // 初始抽牌
        this.drawInitialCards();

        // 随机环境MOD
        this.setRandomMod();

        // 清空战斗结果
        this.playerPlayedEl.innerHTML = '';
        this.enemyPlayedEl.innerHTML = '';
        this.battleOutcome.textContent = '等待开始...';
        this.criticalIndicator.innerHTML = '';

        // 更新UI
        this.updateUI();
    }

    createBaseDeck() {
        this.baseDeck = [];
        const mods = ['HR', 'EZ', 'DT', 'HD'];

        for (let i = 0; i < this.deckCount; i++) {
            // 卡牌生成策略
            let card = new Card(i + 1);

            this.baseDeck.push(card);
        }
    }



    drawInitialCards() {
        this.playerHand = [];
        this.enemyHand = [];

        // 初始抽6张牌（各自从自己的牌库抽）
        for (let i = 0; i < 6; i++) {
            let playerCard = this.drawPlayerCard();
            let enemyCard = this.drawEnemyCard();
            if (playerCard !== null) this.playerHand.push(playerCard);
            if (enemyCard !== null) this.enemyHand.push(enemyCard);
        }
    }

    drawPlayerCard() {
        if (this.playerDeck.length === 0) {
            console.log("玩家牌库已空");
            return null;
        }
        const index = Math.floor(Math.random() * this.playerDeck.length);
        return this.playerDeck.splice(index, 1)[0];
    }

    drawEnemyCard() {
        if (this.enemyDeck.length === 0) {
            console.log("电脑牌库已空");
            return null;
        }
        const index = Math.floor(Math.random() * this.enemyDeck.length);
        return this.enemyDeck.splice(index, 1)[0];
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
        if (this.isTB) this.currentMod = mods[0];
        else this.currentMod = mods[Math.floor(Math.random() * mods.length)];
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

            // 侦察模式下显示的卡牌
            if (this.revealedEnemyCards.includes(card.id)) {
                cardEl.classList.add('revealed');
                cardEl.innerHTML = this.createCardElement(card, false).innerHTML; // 使用createCardElement生成内容
            }
            else {
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
                        <div class="card-footer">隐藏卡牌</div>
                    `;
            }
            cardEl.classList.add('enemy-card');

            // 偷取模式下可点击
            if (this.stealMode) {
                cardEl.classList.add('steal-target');
                cardEl.addEventListener('click', () => {
                    this.stealEnemyCard(card.id);
                });
            }
            this.enemyHandEl.appendChild(cardEl);
        });
    }

    createCardElement(card, isHand) {
        const cardEl = document.createElement('div');
        cardEl.className = 'card';

        // 判断是否禁用
        let disabled = false;
        if (isHand) {
            // 情况1：已出牌但未结束回合
            if (this.hasPlayed) {
                disabled = true;
            }
            // 情况2：未出牌但选择已达上限
            else {
                const maxSelection = this.isTB ? 4 : 3;
                if (this.selectedCards.length >= maxSelection &&
                    !this.selectedCards.includes(card.id)) {
                    disabled = true;
                }
            }
        }

        // 计算属性值
        const aimVal = card.aim;
        const spdVal = card.spd;
        const accVal = card.acc;
        const values = [aimVal, spdVal, accVal];
        const maxValue = Math.max(...values);
        const minValue = Math.min(...values);

        // 判断卡牌类型
        let cardType = "balanced"; // 默认平衡卡

        // 检查单属性突出（偏科卡）
        if (aimVal === maxValue && (aimVal - spdVal >= 3) && (aimVal - accVal >= 3)) {
            cardType = "high-aim";
        } else if (spdVal === maxValue && (spdVal - aimVal >= 3) && (spdVal - accVal >= 3)) {
            cardType = "high-spd";
        } else if (accVal === maxValue && (accVal - aimVal >= 3) && (accVal - spdVal >= 3)) {
            cardType = "high-acc";
        }
        // 检查双高属性
        else if (values.filter(v => v >= 7).length >= 2) {
            cardType = "double-high";
        }

        // 添加类型类名
        cardEl.classList.add(cardType);

        if (disabled) {
            cardEl.classList.add('disabled');
        }

        if (isHand && this.selectedCards.includes(card.id)) {
            cardEl.classList.add('selected');
        }

        let aimValue = "";
        let spdValue = "";
        let accValue = "";
        // 计算实际值（考虑MOD效果）
        const multiplier = (card.mod === this.currentMod) ? 1.5 : 1;
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

        // 只有未禁用的玩家卡牌才添加点击事件
        if (isHand && !disabled) {
            cardEl.addEventListener('click', () => {
                this.toggleCardSelection(card);
            });
        }

        return cardEl;
    }

    toggleCardSelection(card) {
        if (this.gameOver || this.hasPlayed) return; // 已出牌或游戏结束不能选择

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
        // 标记已出牌
        this.hasPlayed = true;

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

        // 显示下一回合按钮
        this.endTurnBtn.disabled = false;

        this.updateSkillsState();
    }

    enemyAI() {
        // 简单AI策略：随机选择1-3张牌，特殊情况下3张牌
        let needFull = false;
        if (this.enemyHand.length > 5) needFull = true;
        if (this.enemyHealth < 3) needFull = true;

        let cardCount = 0;
        if (this.isTB) cardCount = 4;
        else if (needFull) cardCount = 3;
        else cardCount = Math.floor(Math.random() * 3) + 1;

        cardCount = Math.min(cardCount, this.enemyHand.length);

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

    formatStats(stats) {
        // 找出最大值
        const maxValue = Math.max(stats.aim, stats.spd, stats.acc);
        let result = `
        <div class='result-sum'>Aim=${stats.aim}${stats.aim === maxValue ? '（最高）' : ''}</div>
        <div class='result-sum'>Spd=${stats.spd}${stats.spd === maxValue ? '（最高）' : ''}</div>
        <div class='result-sum'>Acc=${stats.acc}${stats.acc === maxValue ? '（最高）' : ''}</div>
    `;
        return result;
    }

    calculateBattle(playerCards, enemyCards) {
        // 计算玩家属性总和（考虑MOD效果）
        const playerStats = this.calculateTotalStats(playerCards);
        const enemyStats = this.calculateTotalStats(enemyCards);

        // 检查是否暴击（所有属性都高于对手）
        let isCritical = false;
        if (playerStats.aim > enemyStats.aim && playerStats.spd > enemyStats.spd && playerStats.acc > enemyStats.acc) isCritical = true;
        if (playerStats.aim < enemyStats.aim && playerStats.spd < enemyStats.spd && playerStats.acc < enemyStats.acc) isCritical = true;

        // 找出双方最高属性
        const playerMax = Math.max(playerStats.aim, playerStats.spd, playerStats.acc);
        const enemyMax = Math.max(enemyStats.aim, enemyStats.spd, enemyStats.acc);

        // 确定最高属性的名称
        const playerMaxAttr = playerStats.aim === playerMax ? 'Aim' :
            playerStats.spd === playerMax ? 'Spd' : 'Acc';
        const enemyMaxAttr = enemyStats.aim === enemyMax ? 'Aim' :
            enemyStats.spd === enemyMax ? 'Spd' : 'Acc';

        // 构建详细比较信息
        let comparisonText = '';
        let resultText = '';
        let outcomeClass = '';
        let damageTarget = null; // 'player' 或 'enemy'
        let damage = isCritical ? 2 : 1;

        // 格式化属性显示
        const playerStatsHTML = this.formatStats(playerStats);
        const enemyStatsHTML = this.formatStats(enemyStats);

        // 更新玩家和电脑出牌区域的属性显示
        this.playerPlayedEl.innerHTML += '<br>' + playerStatsHTML;
        this.enemyPlayedEl.innerHTML += '<br>' + enemyStatsHTML;

        // 比较最高属性
        comparisonText = `比较最高属性: 
                    <span class="attribute-highlight ${playerMaxAttr.toLowerCase()}-highlight">玩家${playerMaxAttr}=${playerMax}</span> 
                    vs 
                    <span class="attribute-highlight ${enemyMaxAttr.toLowerCase()}-highlight">电脑${enemyMaxAttr}=${enemyMax}</span>`;

        if (playerMax > enemyMax) {
            resultText = "玩家获胜!";
            outcomeClass = "player-win";
            damageTarget = 'enemy';
            comparisonText += `<br><span class="result-highlight">玩家=${playerMax} > ${enemyMax}=电脑</span>`;
        } else if (playerMax < enemyMax) {
            resultText = "电脑获胜!";
            outcomeClass = "enemy-win";
            damageTarget = 'player';
            comparisonText += `<br><span class="result-highlight">玩家=${playerMax} < ${enemyMax}=电脑</span>`;
        } else {
            // 平局时比较第二高属性
            const playerSorted = [playerStats.aim, playerStats.spd, playerStats.acc].sort((a, b) => b - a);
            const enemySorted = [enemyStats.aim, enemyStats.spd, enemyStats.acc].sort((a, b) => b - a);

            comparisonText += `<br>最高属性平局，比较第二属性`;

            if (playerSorted[1] > enemySorted[1]) {
                resultText = "玩家获胜 (第二属性)!";
                outcomeClass = "player-win";
                damageTarget = 'enemy';
                comparisonText += `<br><span class="result-highlight">玩家=${playerSorted[1]} > ${enemySorted[1]}=电脑</span>`;
            } else if (playerSorted[1] < enemySorted[1]) {
                resultText = "电脑获胜 (第二属性)!";
                outcomeClass = "enemy-win";
                damageTarget = 'player';
                comparisonText += `<br><span class="result-highlight">玩家=${playerSorted[1]} < ${enemySorted[1]}=电脑</span>`;
            } else {
                // 再次平局比较第三属性
                comparisonText += `<br>第二属性平局，比较第三属性`;

                if (playerSorted[2] > enemySorted[2]) {
                    resultText = "玩家获胜 (第三属性)!";
                    outcomeClass = "player-win";
                    damageTarget = 'enemy';
                    comparisonText += `<br><span class="result-highlight">玩家=${playerSorted[2]} > ${enemySorted[2]}=电脑</span>`;
                } else if (playerSorted[2] < enemySorted[2]) {
                    resultText = "电脑获胜 (第三属性)!";
                    outcomeClass = "enemy-win";
                    damageTarget = 'player';
                    comparisonText += `<br><span class="result-highlight">玩家=${playerSorted[2]} < ${enemySorted[2]}=电脑</span>`;
                } else {
                    resultText = "平局!";
                    outcomeClass = "draw-outcome";
                    comparisonText += `<br><span class="result-highlight">第三属性也平局!</span>`;
                }
            }
        }

        // 应用伤害
        if (damageTarget === 'enemy') {
            this.enemyHealth = Math.max(0, this.enemyHealth - damage);
        } else if (damageTarget === 'player') {
            this.playerHealth = Math.max(0, this.playerHealth - damage);
        }

        // 更新战斗结果
        this.battleOutcome.textContent = resultText;
        this.battleOutcome.className = `battle-outcome ${outcomeClass}`;

        // 更新比较详情
        this.comparisonDetail.innerHTML = comparisonText;

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
            const multiplier = (card.mod === this.currentMod) ? 1.5 : 1;
            aim += card.aim * (multiplier * 10) / 10;
            spd += card.spd * (multiplier * 10) / 10;
            acc += card.acc * (multiplier * 10) / 10;
        });
        aim = aim * 10 / 10;
        spd = spd * 10 / 10;
        acc = acc * 10 / 10;

        return { aim, spd, acc };
    }

    // 检查玩家和电脑的手牌和牌库数量，均为0时游戏结束
    checkHandAndDeckIsEmpty() {
        // 玩家牌库为空且手牌也为空时，若无法发动偷取技能，则游戏无法进行，判定为游戏结束
        if (this.playerDeck.length === 0 && this.playerHand.length === 0 && (this.skillsUsed.steal === true || this.playerHealth <= 1)) {
            this.gameOver = true;
            this.battleResult.textContent = "游戏结束! 玩家无牌可出，电脑获胜!";
            this.playBtn.disabled = true;
            this.endTurnBtn.disabled = true;
            return true;
        }

        // 电脑牌库为空且手牌也为空时判定失败
        if (this.enemyDeck.length === 0 && this.enemyHand.length === 0) {
            this.gameOver = true;
            this.battleResult.textContent = "游戏结束! 电脑无牌可出，玩家获胜!";
            this.playBtn.disabled = true;
            this.endTurnBtn.disabled = true;
            return true;
        }

        return false;
    }

    endTurn() {
        this.endTurnBtn.disabled = true;

        if (this.gameOver) return;

        // 进入下一回合
        this.round++;

        // 抽牌（第一回合后每回合抽2张）
        if (this.round > 1) {
            for (let i = 0; i < 2; i++) {
                let playerCard = this.drawPlayerCard();
                let enemyCard = this.drawEnemyCard();
                if (playerCard !== null) this.playerHand.push(playerCard);
                if (enemyCard !== null) this.enemyHand.push(enemyCard);
            }
        }

        // 检查玩家和电脑的手牌和牌库数量
        if (this.checkHandAndDeckIsEmpty()) {
            this.updateUI();
            return;
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
        this.battleOutcome.textContent = '请出牌...';
        this.comparisonDetail.textContent = '';
        this.criticalIndicator.innerHTML = '';

        // 重置已出牌状态
        this.hasPlayed = false;

        // 退出偷取模式
        this.stealMode = false;

        // 更新UI
        this.updateUI();
    }

    checkGameEnd() {
        if (this.playerHealth <= 0 || this.enemyHealth <= 0) {
            this.gameOver = true;
            const winner = this.playerHealth <= 0 ? "电脑" : "玩家";
            this.battleOutcome.textContent = `游戏结束! ${winner}获胜!`;
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
        this.playerHealthBar.style.width = `${(this.playerHealth / this.fullHealth) * 100}%`;
        this.enemyHealthBar.style.width = `${(this.enemyHealth / this.fullHealth) * 100}%`;

        // 更新回合和卡牌数量
        this.roundEl.textContent = this.round;
        this.cardsLeftEl.textContent = `玩家: ${this.playerDeck.length} | 电脑: ${this.enemyDeck.length}`;

        // 更新MOD指示器
        if (this.isTB) this.modIndicator.textContent = '当前比赛: TB (无MOD)';
        else this.modIndicator.textContent = `当前比赛: ${this.currentMod} ${this.currentMod === 'NM' ? '(无MOD)' : ''}`;

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
        this.endTurnBtn.disabled = true;

        // 更新技能状态
        this.updateSkillsState();
    }

    // 更新技能状态
    updateSkillsState() {
        // 生命值不足时禁用所有技能，出牌后也无法使用技能
        const canUseSkills = this.playerHealth > 1 && !this.hasPlayed;

        // 更新每个技能状态
        this.skill1.classList.toggle('used', this.skillsUsed.reveal);
        this.skill2.classList.toggle('used', this.skillsUsed.draw);
        this.skill3.classList.toggle('used', this.skillsUsed.redraw);
        this.skill4.classList.toggle('used', this.skillsUsed.steal);

        this.skill1.classList.toggle('disabled', !canUseSkills || this.skillsUsed.reveal);
        this.skill2.classList.toggle('disabled', !canUseSkills || this.skillsUsed.draw);
        this.skill3.classList.toggle('disabled', !canUseSkills || this.skillsUsed.redraw);
        this.skill4.classList.toggle('disabled', !canUseSkills || this.skillsUsed.steal);

        // 更新提示
        if (!canUseSkills) {
            if (this.hasPlayed) this.skillHint.textContent = "等待下一回合使用技能...";
            else this.skillHint.textContent = "生命值不足，无法使用技能！";
        } else if (this.stealMode) {
            this.skillHint.textContent = "请点击要偷取的敌方卡牌！";
        } else {
            this.skillHint.textContent = "生命值大于1时可以使用技能";
        }
    }

    // 使用技能
    useSkill(skillType) {
        if (this.hasPlayed || this.gameOver) {
            return;
        }

        if (this.playerHealth <= 1) {
            this.skillHint.textContent = "生命值不足，无法使用技能！";
            return;
        }

        if (this.skillsUsed[skillType]) {
            this.skillHint.textContent = "该技能已经使用过！";
            return;
        }

        // 判断技能使用是否成功
        let success = false;
        switch (skillType) {
            case 'reveal':
                success = this.useRevealSkill();
                break;
            case 'draw':
                success = this.useDrawSkill();
                break;
            case 'redraw':
                success = this.useRedrawSkill();
                break;
            case 'steal':
                success = this.useStealSkill();
                break;
        }

        if (success) {
            // 扣除生命值
            this.playerHealth -= 1;

            // 标记技能已使用
            this.skillsUsed[skillType] = true;
        }

        // 更新UI
        this.updateUI();
    }

    // 侦察敌情技能
    useRevealSkill() {
        this.skillHint.textContent = "已显示敌方当前手牌！";

        // 记录当前敌方所有卡牌为已侦察
        this.enemyHand.forEach(card => {
            if (!this.revealedEnemyCards.includes(card.id)) {
                this.revealedEnemyCards.push(card.id);
            }
        });

        // 重新渲染敌方手牌
        this.renderCards();

        return true; // 技能使用成功
    }

    // 紧急补给技能
    useDrawSkill() {
        if (this.playerDeck.length < 1) {
            this.skillHint.textContent = "牌库已空，无法抽牌！";
            return false; // 技能使用失败
        }

        this.skillHint.textContent = "已抽取2张额外卡牌！";

        // 抽两张牌
        const card1 = this.drawPlayerCard();
        const card2 = this.drawPlayerCard();

        if (card1) this.playerHand.push(card1);
        if (card2) this.playerHand.push(card2);

        // 重新渲染玩家手牌
        this.renderCards();

        return true; // 技能使用成功
    }

    // 重整旗鼓技能
    useRedrawSkill() {
        if (this.playerHand.length === 0) {
            this.skillHint.textContent = "手牌已空，无法重抽！";
            return false; // 技能使用失败
        }
        if (this.playerDeck.length < 1) {
            this.skillHint.textContent = "牌库不足，无法重抽！";
            return false; // 技能使用失败
        }

        this.skillHint.textContent = "已重新抽取手牌！";

        // 记录当前手牌数量
        const handSize = this.playerHand.length;

        // 丢弃所有手牌（不是放回牌库）
        /*
        this.playerHand.forEach(card => {
            this.playerDeck.push(card);
        });
        */

        // 清空手牌
        this.playerHand = [];

        // 重新抽取相同数量的卡牌
        for (let i = 0; i < handSize; i++) {
            const card = this.drawPlayerCard();
            if (card) {
                this.playerHand.push(card);
            }
        }

        // 清空选择
        this.selectedCards = [];

        // 重新渲染玩家手牌
        this.renderCards();

        return true; // 技能使用成功
    }

    // 妙手空空技能
    useStealSkill() {
        if (this.enemyHand.length === 0) {
            this.skillHint.textContent = "敌方手牌已空，无法偷取！";
            return false; // 技能使用失败
        }

        this.skillHint.textContent = "请点击要偷取的敌方卡牌！";
        this.stealMode = true;

        // 重新渲染敌方手牌，使其可点击
        this.renderCards();

        return true; // 技能使用成功
    }

    // 偷取敌方卡牌
    stealEnemyCard(cardId) {
        // 找到要偷取的卡牌
        const cardIndex = this.enemyHand.findIndex(card => card.id === cardId);

        if (cardIndex !== -1) {
            // 从敌方手牌中移除
            const [stolenCard] = this.enemyHand.splice(cardIndex, 1);

            // 防止存在同ID卡牌，ID+100
            stolenCard.id += 100; // 确保ID唯一

            // 添加到玩家手牌
            this.playerHand.push(stolenCard);

            // 退出偷取模式
            this.stealMode = false;
            this.skillHint.textContent = `已偷取敌方卡牌 #${stolenCard.id}！`;

            // 重新渲染双方手牌
            this.renderCards();

            // 偷取后判定游戏是否结束
            this.checkHandAndDeckIsEmpty();
            this.updateUI();

            // 如果已出牌，则自动结束回合，防止卡死
            if (this.hasPlayed && !this.gameOver) {
                setTimeout(() => this.endTurn(), 500); // 适当延迟，给玩家反馈
            }
        }
    }
}