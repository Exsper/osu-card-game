class Battle {
    /**
     * 单次对战类，负责处理玩家和电脑的对战逻辑
     * @param {num} id 比赛ID（从0开始）
     * @param {CardPool} cardPool 整个游戏的全部卡牌
     * @param {Player} player 玩家对象
     * @param {boolean} useRealPlayers 是否使用真实玩家数据
     */
    constructor(id, cardPool, player, useRealPlayers = false) {
        this.modMultiplier = 1.5;

        this.id = id;
        this.cardPool = cardPool;
        this.player = player;
        this.useRealPlayers = useRealPlayers; // 是否使用真实玩家数据
        // 生命值每过5局+1
        this.fullHealth = 3 + Math.floor(this.id / 3);
        this.playerHealth = this.fullHealth;
        this.enemyHealth = this.fullHealth;
        this.round = 1;
        this.playerHand = [];
        this.enemyHand = [];
        this.playerDeck = [];
        this.enemyDeck = [];
        this.selectedCards = [];
        this.currentMod = 'NM';
        this.isTB = false;
        this.gameOver = false;
        this.hasPlayed = false; // 标记是否已出牌
        // 技能系统变量，虽然技能次数大于1可以多次使用，但是每局游戏只能使用一次
        this.skillsUsed = {
            reveal: false,
            draw: false,
            redraw: false,
            steal: false
        };
        this.stealMode = false; // 是否处于偷取模式
        this.revealedEnemyCards = []; // 被侦察显示的敌方卡牌

        this.isPlayerWin = -1;  // 1=playerwin 0=enemywin -1=undergoing

        this.clearListeners();
        this.initUIReferences();
        this.bindEvents();

        // 初始化游戏
        this.initGame();
    }

    initUIReferences() {
        // DOM元素引用
        this.playerHandEl = document.getElementById('player-hand');
        this.enemyHandEl = document.getElementById('enemy-hand');
        this.playerHealthEl = document.getElementById('player-health');
        this.playerFullHealthEl = document.getElementById('player-fullhealth');
        this.enemyHealthEl = document.getElementById('enemy-health');
        this.enemyFullHealthEl = document.getElementById('enemy-fullhealth');
        this.playerHealthBar = document.getElementById('player-health-bar');
        this.enemyHealthBar = document.getElementById('enemy-health-bar');
        this.roundEl = document.getElementById('round-number');
        this.battleNumberEl = document.getElementById('battle-number');
        this.cardsLeftEl = document.getElementById('cards-left');
        this.modIndicator = document.getElementById('mod-indicator');
        this.playBtn = document.getElementById('play-btn');
        this.endTurnBtn = document.getElementById('end-turn-btn');
        this.playerPlayedEl = document.getElementById('player-played');
        this.enemyPlayedEl = document.getElementById('enemy-played');
        this.criticalIndicator = document.getElementById('critical-indicator');
        this.battleOutcome = document.getElementById('battle-outcome');
        this.comparisonDetail = document.getElementById('comparison-detail');
        this.revealSkillCount = document.getElementById('reveal-skill-count');
        this.drawSkillCount = document.getElementById('draw-skill-count');
        this.redrawSkillCount = document.getElementById('redraw-skill-count');
        this.stealSkillCount = document.getElementById('steal-skill-count');
        this.selectedAimEl = document.getElementById('selected-aim');
        this.selectedSpdEl = document.getElementById('selected-spd');
        this.selectedAccEl = document.getElementById('selected-acc');
        this.selectedStatsEl = document.getElementById('selected-stats');

        // 获取技能卡片元素
        this.skill1 = document.getElementById('skill1');
        this.skill2 = document.getElementById('skill2');
        this.skill3 = document.getElementById('skill3');
        this.skill4 = document.getElementById('skill4');
        this.skillHint = document.getElementById('skill-hint');
    }

    bindEvents() {
        // 绑定事件
        this.playBtn.addEventListener('click', () => this.playSelectedCards());
        this.endTurnBtn.addEventListener('click', () => this.endTurn());

        // 绑定技能事件
        this.skill1.addEventListener('click', () => this.useSkill('reveal'));
        this.skill2.addEventListener('click', () => this.useSkill('draw'));
        this.skill3.addEventListener('click', () => this.useSkill('redraw'));
        this.skill4.addEventListener('click', () => this.useSkill('steal'));
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
        this.isPlayerWin = -1;

        // 从cardPool中深拷贝玩家和敌人的卡池，对战中不能影响玩家实际卡池（偷取技能也只针对本局游戏）
        this.playerDeck = this.cardPool.playerDeck.map(card => new Card(card.id, {
            mod: card.mod,
            aim: card.aim,
            spd: card.spd,
            acc: card.acc
        }, {
            userId: card.userId,
            userName: card.userName
        }));
        this.enemyDeck = this.cardPool.enemyDeck.map(card => new Card(card.id, {
            mod: card.mod,
            aim: card.aim,
            spd: card.spd,
            acc: card.acc
        }, {
            userId: card.userId,
            userName: card.userName
        }));

        // 初始抽牌
        this.drawInitialCards();

        // 初始化属性总和显示
        this.updateSelectedStats();

        // 随机环境MOD
        this.setRandomMod();

        // 清空战斗结果
        this.playerPlayedEl.innerHTML = '';
        this.enemyPlayedEl.innerHTML = '';
        this.battleOutcome.textContent = '等待开始...';
        this.battleOutcome.className = `battle-outcome`;
        this.comparisonDetail.textContent = '';
        this.criticalIndicator.innerHTML = '';

        // 更新UI
        this.updateUI();

        // 更新按钮状态
        this.playBtn.disabled = this.selectedCards.length === 0 || this.gameOver;
        this.playBtn.textContent = this.isTB ?
            `出牌 (选择1-4张)` :
            `出牌 (选择1-3张)`;
        this.endTurnBtn.disabled = true;

        this.showBattlePhase();
    }

    showBattlePhase() {
        document.getElementById('battle-area').classList.toggle('hide', false);
        document.getElementById('play-btn').classList.toggle('hide', false);
        document.getElementById('skills-area').classList.toggle('hide', false);
        document.getElementById('result-area').classList.toggle('hide', true);
        document.getElementById('reward-area').classList.toggle('hide', true);
    }

    showResultPhase() {
        document.getElementById('battle-area').classList.toggle('hide', true);
        document.getElementById('play-btn').classList.toggle('hide', true);
        document.getElementById('skills-area').classList.toggle('hide', true);
        document.getElementById('result-area').classList.toggle('hide', false);
        document.getElementById('reward-area').classList.toggle('hide', true);
    }

    showRewardPhase() {
        document.getElementById('battle-area').classList.toggle('hide', true);
        document.getElementById('play-btn').classList.toggle('hide', true);
        document.getElementById('skills-area').classList.toggle('hide', true);
        document.getElementById('result-area').classList.toggle('hide', true);
        document.getElementById('reward-area').classList.toggle('hide', false);
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
                cardEl.innerHTML = card.DrawHiddenCardInnerHTML(); // 使用Card类的隐藏卡牌HTML方法
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

    /**
     * 
     * @param {Card} card 卡牌
     * @param {boolean} isHand 是否为可操作的玩家手牌
     * @returns 
     */
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

        // 设置卡牌样式
        card.SetCardElStyle(cardEl);
        // 设置卡牌内容
        cardEl.innerHTML = card.DrawCardInnerHTML(this.currentMod, this.useRealPlayers);

        if (disabled) {
            cardEl.classList.add('disabled');
        }

        if (isHand && this.selectedCards.includes(card.id)) {
            cardEl.classList.add('selected');
        }

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

        // 更新属性总和显示
        this.updateSelectedStats();
    }

    // 更新选中卡牌属性总和
    updateSelectedStats() {
        let aim = 0, spd = 0, acc = 0;

        // 计算选中卡牌的总属性值
        this.selectedCards.forEach(cardId => {
            const card = this.playerHand.find(c => c.id === cardId);
            if (card) {
                const multiplier = (card.mod === this.currentMod) ? this.modMultiplier : 1;
                aim += card.aim * multiplier;
                spd += card.spd * multiplier;
                acc += card.acc * multiplier;
            }
        });

        // 更新UI
        this.selectedAimEl.textContent = parseFloat(aim.toFixed(1));
        this.selectedSpdEl.textContent = parseFloat(spd.toFixed(1));
        this.selectedAccEl.textContent = parseFloat(acc.toFixed(1));

        // 标记最大值
        let max = Math.max(aim, spd, acc);
        if (max > 0) {
            if (max == aim) {
                this.selectedAimEl.classList.add("top");
                this.selectedSpdEl.classList.remove("top");
                this.selectedAccEl.classList.remove("top");
            }
            else if (max == spd) {
                this.selectedAimEl.classList.remove("top");
                this.selectedSpdEl.classList.add("top");
                this.selectedAccEl.classList.remove("top");
            }
            else if (max == acc) {
                this.selectedAimEl.classList.remove("top");
                this.selectedSpdEl.classList.remove("top");
                this.selectedAccEl.classList.add("top");
            }
        }

        // 显示/隐藏统计区域
        this.selectedStatsEl.style.display = this.selectedCards.length > 0 ? 'flex' : 'none';
    }

    // 玩家出牌后
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

        // 重置属性总和显示
        this.updateSelectedStats();

        // 显示下一回合按钮
        this.endTurnBtn.disabled = false;
        if (this.gameOver) {
            if (this.isPlayerWin) this.endTurnBtn.textContent = '选择奖励';
            else this.endTurnBtn.textContent = '重新开始';
        }
        else this.endTurnBtn.textContent = '下一回合';

        this.updateSkillsState();

        this.showResultPhase();
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
            const multiplier = (card.mod === this.currentMod) ? this.modMultiplier : 1;
            aim += parseFloat((card.aim * multiplier).toFixed(1));
            spd += parseFloat((card.spd * multiplier).toFixed(1));
            acc += parseFloat((card.acc * multiplier).toFixed(1));
        });

        return { aim, spd, acc };
    }

    // 检查玩家和电脑的手牌和牌库数量，均为0时游戏结束
    checkHandAndDeckIsEmpty() {
        // 电脑牌库为空且手牌也为空时判定失败
        if (this.enemyDeck.length === 0 && this.enemyHand.length === 0) {
            this.gameOver = true;
            this.battleOutcome.textContent = "游戏结束! 电脑无牌可出，玩家获胜!";
            const outcomeClass = "player-win";
            this.battleOutcome.className = `battle-outcome ${outcomeClass}`;
            this.playBtn.disabled = true;
            this.endTurnBtn.disabled = false;
            this.isPlayerWin = 1;
            this.endTurnBtn.textContent = '选择奖励';
            this.showResultPhase();
            return true;
        }

        // 玩家牌库为空且手牌也为空时，若无法发动偷取技能，则游戏无法进行，判定为游戏结束
        if (this.playerDeck.length === 0 && this.playerHand.length === 0) {
            // 检查是否满足发动偷取的条件
            if (this.player.skillCounts.steal <= 0 || this.skillsUsed.steal == true || this.playerHealth <= 1 || this.enemyHand.length === 0) {
                this.gameOver = true;
                this.battleOutcome.textContent = "游戏结束! 玩家无牌可出，电脑获胜!";
                const outcomeClass = "enemy-win";
                this.battleOutcome.className = `battle-outcome ${outcomeClass}`;
                this.playBtn.disabled = true;
                this.endTurnBtn.disabled = false;
                this.isPlayerWin = 0;
                this.endTurnBtn.textContent = '重新开始';
                this.showResultPhase();
                return true;
            }
        }

        return false;
    }

    clearListeners() {
        // 清除所有按钮事件
        const btnIds = [
            'play-btn',
            'end-turn-btn',
            'skill1',
            'skill2',
            'skill3',
            'skill4',
        ];
        btnIds.forEach(id => {
            const oldBtn = document.getElementById(id);
            if (oldBtn) {
                const newBtn = oldBtn.cloneNode(true); // true表示深拷贝（不带事件）
                oldBtn.parentNode.replaceChild(newBtn, oldBtn);
            }
        });
    }

    endGame() {
        // 游戏已结束，如果获胜则进入挑选奖励卡牌环节，如果失败则游戏重置
        /*
            单局测试用
            this.player.skillCounts.reveal = 1;
            this.player.skillCounts.draw = 1;
            this.player.skillCounts.redraw = 1;
            this.player.skillCounts.steal = 1;
            this.initGame();
        */
        if (this.isPlayerWin === 1) {
            // window.game.battleCount += 1;
            // 奖励 局数*50 的金钱
            this.player.addGold((this.id + 1) * 50);
            this.showRewardPhase();
            window.game.showRewardScreen();
        }
        else {
            this.clearListeners();
            window.game.restart();
        }
    }

    // 到下一回合
    endTurn() {
        // 更新按钮状态
        this.playBtn.disabled = this.selectedCards.length === 0 || this.gameOver;
        this.endTurnBtn.disabled = true;

        if (this.gameOver) {
            this.endGame();
            return;
        }

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
            return;
        }

        this.updateUI();

        // 检查是否进入TB模式
        this.isTB = (this.playerHealth === 1 && this.enemyHealth === 1);
        this.playBtn.textContent = this.isTB ?
            `出牌 (选择1-4张)` :
            `出牌 (选择1-3张)`;

        // 随机环境MOD
        this.setRandomMod();

        // 清空选择
        this.selectedCards = [];
        this.playBtn.disabled = true;

        // 清空战斗结果
        this.playerPlayedEl.innerHTML = '';
        this.enemyPlayedEl.innerHTML = '';
        this.battleOutcome.textContent = '请出牌...';
        this.battleOutcome.className = `battle-outcome`;
        this.comparisonDetail.textContent = '';
        this.criticalIndicator.innerHTML = '';

        // 重置已出牌状态
        this.hasPlayed = false;

        // 退出偷取模式
        this.stealMode = false;

        // 更新UI
        this.updateUI();

        this.showBattlePhase();
    }

    checkGameEnd() {
        if (this.playerHealth <= 0 || this.enemyHealth <= 0) {
            this.gameOver = true;
            const winner = this.playerHealth <= 0 ? "电脑" : "玩家";
            this.isPlayerWin = this.playerHealth <= 0 ? 0 : 1;
            this.battleOutcome.textContent = `游戏结束! ${winner}获胜!`;
            this.playBtn.disabled = true;
        }
    }

    updateUI() {
        // 更新生命值
        this.playerHealthEl.textContent = this.playerHealth;
        this.playerFullHealthEl.textContent = this.fullHealth;
        this.enemyHealthEl.textContent = this.enemyHealth;
        this.enemyFullHealthEl.textContent = this.fullHealth;
        this.playerHealthBar.style.width = `${(this.playerHealth / this.fullHealth) * 100}%`;
        this.enemyHealthBar.style.width = `${(this.enemyHealth / this.fullHealth) * 100}%`;

        // 更新回合和卡牌数量
        this.roundEl.textContent = this.round;
        this.battleNumberEl.textContent = this.id + 1;
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

        // 更新技能状态
        this.updateSkillsState();
    }

    // 更新技能状态
    updateSkillsState() {
        // 生命值不足时禁用所有技能，出牌后也无法使用技能
        const canUseSkills = this.playerHealth > 1 && !this.hasPlayed;

        // 更新技能计数
        this.revealSkillCount.textContent = `${this.player.skillCounts.reveal}`;
        this.drawSkillCount.textContent = `${this.player.skillCounts.draw}`;
        this.redrawSkillCount.textContent = `${this.player.skillCounts.redraw}`;
        this.stealSkillCount.textContent = `${this.player.skillCounts.steal}`;

        // 本局使用过技能则无法再使用
        this.skill1.classList.toggle('used', this.skillsUsed.reveal);
        this.skill2.classList.toggle('used', this.skillsUsed.draw);
        this.skill3.classList.toggle('used', this.skillsUsed.redraw);
        this.skill4.classList.toggle('used', this.skillsUsed.steal);

        // 根据技能使用情况禁用按钮
        this.skill1.classList.toggle('disabled', !canUseSkills || this.player.skillCounts.reveal <= 0);
        this.skill2.classList.toggle('disabled', !canUseSkills || this.player.skillCounts.draw <= 0);
        this.skill3.classList.toggle('disabled', !canUseSkills || this.player.skillCounts.redraw <= 0);
        this.skill4.classList.toggle('disabled', !canUseSkills || this.player.skillCounts.steal <= 0);

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
            // 将技能次数减1
            this.player.skillCounts[skillType] -= 1;
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

            // 在卡牌创建时采取了措施，不可能有相同id的卡牌
            // stolenCard.id += 100;

            // 添加到玩家手牌
            this.playerHand.push(stolenCard);

            // 退出偷取模式
            this.stealMode = false;
            this.skillHint.textContent = `已偷取敌方卡牌 #${stolenCard.id}！`;

            // 重新渲染双方手牌
            this.renderCards();

            this.updateUI();

            // 偷取后检查电脑的手牌和牌库数量
            if (this.checkHandAndDeckIsEmpty()) {
                return;
            }

            // 如果已出牌，则自动结束回合，防止卡死
            if (this.hasPlayed && !this.gameOver) {
                setTimeout(() => this.endTurn(), 500); // 适当延迟，给玩家反馈
            }
        }
    }
}