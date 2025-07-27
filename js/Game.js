class Game {
    constructor(useRealPlayers = false) {
        this.useRealPlayers = useRealPlayers;
        /** 游戏状态
         * @param {"collection" | "battle" | "reward"} 养成 / 战斗 / 选择奖励 */
        this.gameState = "battle"; // collection, battle, reward
        this.cardPool = new CardPool(this.useRealPlayers);
        this.player = new Player();

        // 关卡结束奖励选择项，后续说不定可以升级
        this.showRewardCardCount = 3;

        // 卡牌管理界面选择项
        this.selectedCards = [];
        this.selectedAction = null;

        // 经过比赛次数（也就是获胜次数，因为失败了就终止了）
        this.battleCount = 0;
        this.battle = null;

        this.initUIReferences();
        this.bindEvents();
    }

    initUIReferences() {
        // 标签页切换
        // this.tabBtns = document.querySelectorAll('.tab-btn');
        // this.tabContents = document.querySelectorAll('.tab-content');

        // 收藏界面元素
        this.collectionContainer = document.getElementById('collection-container');
        this.totalCardsEl = document.getElementById('total-cards');
        this.battleCountEl = document.getElementById('battle-count');
        this.upgradeBtn = document.getElementById('upgrade-btn');
        this.rechargeBtn = document.getElementById('recharge-btn');
        this.discardBtn = document.getElementById('discard-btn');
        this.actionHint = document.getElementById('action-hint');
        this.startBattleBtn = document.getElementById('start-battle-btn');
        this.confirmActionBtn = document.getElementById('confirm-action-btn');

        // 奖励界面元素
        this.rewardArea = document.getElementById('reward-area');
        this.rewardCards = document.getElementById('reward-cards');

        // 选择加次数技能
        this.skillSelectGroup = document.getElementById('skill-select-group');
        this.skillSelectBtns = Array.from(document.querySelectorAll('.skill-select-btn'));

    }

    clearListeners() {
        // 清除所有按钮事件
        const btnIds = [
            'upgrade-btn',
            'recharge-btn',
            'discard-btn',
            'start-battle-btn',
            'skill-1-btn',
            'skill-2-btn',
            'skill-3-btn',
            'skill-4-btn',
            'confirm-action-btn',
        ];
        btnIds.forEach(id => {
            const oldBtn = document.getElementById(id);
            if (oldBtn) {
                const newBtn = oldBtn.cloneNode(true); // true表示深拷贝（不带事件）
                oldBtn.parentNode.replaceChild(newBtn, oldBtn);
            }
        });
    }

    startBattle() {
        // 切换到对战界面
        document.getElementById('collection-tab').classList.remove('active');
        document.getElementById('battle-tab').classList.add('active');
        this.gameState = 'battle';
        this.battle = new Battle(this.battleCount, this.cardPool, this.player, this.useRealPlayers);
    }

    restart() {
        // 清除所有按钮事件
        this.clearListeners();

        // 重新初始化游戏数据
        this.gameState = "battle";
        this.cardPool = new CardPool(this.useRealPlayers);
        this.player = new Player();
        this.showRewardCardCount = 3;
        this.selectedCards = [];
        this.selectedAction = null;
        this.battleCount = 0;
        this.battle = null;

        this.initUIReferences();
        this.bindEvents(); // 重新绑定事件
        this.startBattle();
    }

    // 卡牌管理界面

    renderCollection() {
        this.collectionContainer.innerHTML = '';

        this.cardPool.playerDeck.forEach(card => {
            const cardEl = this.createCollectionCard(card);
            this.collectionContainer.appendChild(cardEl);
        });
    }

    /**
     * 
     * @param {Card} card 
     * @returns {HTMLDivElement}
     */
    createCollectionCard(card) {
        const cardEl = document.createElement('div');
        cardEl.className = 'card';
        if (this.selectedCards.includes(card.id)) {
            cardEl.classList.add('collection-selected');
        }

        cardEl.innerHTML = card.DrawCardInnerHTML("", this.useRealPlayers);
        card.SetCardElStyle(cardEl);

        cardEl.addEventListener('click', () => {
            this.toggleCardSelection(card);
        });

        return cardEl;
    }

    /**
     * 
     * @param {Card} card 
     */
    toggleCardSelection(card) {
        if (this.selectedAction === 'discard') {
            // 丢弃卡牌 - 只需要选择一张
            if (this.selectedCards.length > 0 && this.selectedCards[0] === card.id) {
                this.selectedCards = [];
            } else {
                this.selectedCards = [card.id];
                this.actionHint.textContent = `已选择卡牌，点击“确认”按钮以丢弃`;
            }
        } else if (this.selectedAction === 'upgrade') {
            // 升级卡牌 - 先选目标卡，再选材料卡
            if (this.selectedCards.length === 0) {
                // 选择目标卡
                this.selectedCards = [card.id];
                this.actionHint.textContent = `已选择目标卡牌: ${(this.useRealPlayers && card.userId > 0) ? card.userName : "ID: " + card.id}，请选择两张材料卡牌`;
            } else if (this.selectedCards.length < 3) {
                // 选择材料卡（不能选择目标卡）
                if (this.selectedCards[0] !== card.id && !this.selectedCards.includes(card.id)) {
                    this.selectedCards.push(card.id);
                }

                if (this.selectedCards.length === 3) {
                    this.actionHint.textContent = `已选择目标卡牌和两张材料卡牌，点击“确认”按钮以升级`;
                }
            }
        } else if (this.selectedAction === 'recharge') {
            // 技能充能 - 选择两张材料卡
            if (this.selectedCards.length < 2 && !this.selectedCards.includes(card.id)) {
                this.selectedCards.push(card.id);

                if (this.selectedCards.length === 2) {
                    this.actionHint.textContent = `已选择两张材料卡牌，点击“确认”按钮选择要充能的技能`;
                }
            }
        } else {
            // 默认选择（无操作）
            if (this.selectedCards.length > 0 && this.selectedCards[0] === card.id) {
                this.selectedCards = [];
            } else {
                this.selectedCards = [card.id];
                this.actionHint.textContent = `已选择卡牌: ${(this.useRealPlayers && card.userId > 0) ? card.userName : "ID: " + card.id}`;
            }
        }

        // 重新渲染收藏
        this.renderCollection();
    }

    doUpgradeCard() {
        if (this.selectedCards.length !== 3) {
            this.actionHint.textContent = "请选择一张目标卡牌和两张材料卡牌";
            return;
        }

        const [targetId, materialId1, materialId2] = this.selectedCards;

        // 升级目标卡牌
        let success = this.player.upgradeCard(this.cardPool, targetId, [materialId1, materialId2]);
        if (!success) {
            this.actionHint.textContent = "卡牌选择无效，请重试";
            return;
        }

        // 清空选择
        this.selectedCards = [];
        this.selectedAction = null;

        // 更新UI
        this.renderCollection();
        this.updateStats();

        const targetCard = this.cardPool.playerDeck.find(card => card.id === targetId);
        this.actionHint.textContent = `成功升级 ${(this.useRealPlayers && targetCard.userId > 0) ? targetCard.userName : "ID: " + targetCard.id} ！`;
    }

    updateStats() {
        this.totalCardsEl.textContent = this.cardPool.playerDeck.length;

        // 更新比赛次数
        this.battleCountEl.textContent = this.cardPool.progress;
    }


    showRewardScreen() {
        // 生成3张奖励卡牌
        this.rewardCards.innerHTML = '';
        const rewardOptions = this.player.generateRewardCards(this.cardPool, this.showRewardCardCount);

        rewardOptions.forEach(card => {
            const cardEl = this.createRewardCard(card);
            this.rewardCards.appendChild(cardEl);
        });

        // 显示奖励界面
        this.rewardArea.style.display = 'block';
        this.gameState = 'reward';
    }

    /**
     * 
     * @param {Card} card 
     * @returns {HTMLDivElement}
     */
    createRewardCard(card) {
        const cardEl = document.createElement('div');
        cardEl.className = 'card';

        cardEl.innerHTML = card.DrawCardInnerHTML("", this.useRealPlayers);
        card.SetCardElStyle(cardEl);

        cardEl.addEventListener('click', () => {
            this.player.addCard(this.cardPool, card);

            // 更新UI
            this.renderCollection();
            this.updateStats();

            // 隐藏奖励界面
            this.rewardArea.style.display = 'none';
            this.gameState = 'collection';

            // 切换到养成界面
            document.getElementById('battle-tab').classList.remove('active');
            document.getElementById('collection-tab').classList.add('active');

            // 提示用户
            this.actionHint.textContent = `已添加新卡牌: ${(this.useRealPlayers && card.userId > 0) ? card.userName : "ID: " + card.id} 到你的收藏！`;
        });

        return cardEl;
    }

    bindEvents() {
        // 标签页切换
        /*
        this.tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const tab = btn.dataset.tab;

                // 更新按钮状态
                this.tabBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                // 更新内容显示
                this.tabContents.forEach(content => content.classList.remove('active'));
                document.getElementById(`${tab}-tab`).classList.add('active');
            });
        });
        */

        // 升级按钮
        this.upgradeBtn.addEventListener('click', () => {
            this.selectedAction = 'upgrade';
            this.actionHint.textContent = "请选择要升级的目标卡牌";
        });

        // 技能充能按钮
        this.rechargeBtn.addEventListener('click', () => {
            this.selectedAction = 'recharge';
            if (this.selectedCards.length !== 2) {
                this.actionHint.textContent = "请选择两张材料卡牌";
                return;
            }
            // 显示技能选择按钮组
            this.skillSelectGroup.style.display = 'block';
            this.actionHint.textContent = "请选择要充能的技能类型";
        });

        // 技能选择按钮组事件
        this.skillSelectBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const skillType = btn.dataset.skill;
                let success = this.player.addSkillCount(this.cardPool, skillType, this.selectedCards);
                if (!success) {
                    this.actionHint.textContent = "充能失败，请检查卡牌选择";
                    this.skillSelectGroup.style.display = 'none';
                    return;
                }
                // 清空选择
                this.selectedCards = [];
                this.selectedAction = null;
                this.skillSelectGroup.style.display = 'none';
                // 更新UI
                this.renderCollection();
                this.updateStats();
                let skillString = ""
                switch (skillType) {
                    case "reveal": { skillString = "侦察敌情"; break; }
                    case "draw": { skillString = "紧急补给"; break; }
                    case "redraw": { skillString = "重整旗鼓"; break; }
                    case "steal": { skillString = "妙手空空"; break; }
                    default: { skillString = "未知技能"; break; }
                }
                this.actionHint.textContent = `成功为技能【${skillString}】充能！`;
            });
        });

        // 丢弃按钮
        this.discardBtn.addEventListener('click', () => {
            this.selectedAction = 'discard';
            this.actionHint.textContent = "请选择要丢弃的卡牌";
        });

        // 确认按钮
        this.confirmActionBtn.addEventListener('click', () => {
            if (this.selectedAction === 'upgrade') {
                this.doUpgradeCard();
            } else if (this.selectedAction === 'recharge') {
                // 技能充能需要先选2张材料卡，再选技能类型
                if (this.selectedCards.length !== 2) {
                    this.actionHint.textContent = "请选择两张材料卡牌";
                    return;
                }
                this.skillSelectGroup.style.display = 'block';
                this.actionHint.textContent = "请选择要充能的技能类型";
            } else if (this.selectedAction === 'discard') {
                if (this.selectedCards.length !== 1) {
                    this.actionHint.textContent = "请选择要丢弃的卡牌";
                    return;
                }
                let success = this.player.removeCard(this.cardPool, this.selectedCards[0]);
                if (!success) {
                    this.actionHint.textContent = "丢弃失败，请重试";
                    return;
                }
                this.selectedCards = [];
                this.selectedAction = null;
                this.renderCollection();
                this.updateStats();
                this.actionHint.textContent = "卡牌已丢弃";
            } else {
                this.actionHint.textContent = "请先选择操作类型";
            }
        });

        // 新一局比赛按钮
        this.startBattleBtn.addEventListener('click', () => {
            this.battleCount += 1;
            this.cardPool.createMoreDeck();
            this.startBattle();
        });
    }
}