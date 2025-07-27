class PlayerPool {
    constructor() {
        // 玩家卡池，初始只有3张弱卡
        this.cards = [
            new Card(1, { mod: 'EZ', aim: 2, spd: 2, acc: 2 }),
            new Card(2, { mod: 'EZ', aim: 3, spd: 2, acc: 2 }),
            new Card(3, { mod: 'HD', aim: 2, spd: 3, acc: 2 })
        ];
        // 技能使用次数
        this.skillCounts = {
            reveal: 1,
            draw: 1,
            redraw: 1,
            steal: 1
        };
    }

    // 获胜后生成3张新卡，返回新卡数组
    generateRewardCards() {
        const rewards = [];
        for (let i = 0; i < 3; i++) {
            rewards.push(new Card(Date.now() + i));
        }
        return rewards;
    }

    // 玩家选择一张新卡加入卡池
    addCard(card) {
        this.cards.push(card);
    }

    // 升级指定卡牌（消耗2张卡牌）
    upgradeCard(targetId, costIds) {
        if (costIds.length !== 2) return false;
        // 移除消耗卡牌
        this.cards = this.cards.filter(card => !costIds.includes(card.id));
        // 升级目标卡牌
        const target = this.cards.find(card => card.id === targetId);
        if (target) {
            target.aim++;
            target.spd++;
            target.acc++;
            return true;
        }
        return false;
    }

    // 补充技能次数（消耗2张卡牌）
    addSkillCount(skillType, costIds) {
        if (costIds.length !== 2) return false;
        this.cards = this.cards.filter(card => !costIds.includes(card.id));
        if (this.skillCounts[skillType] !== undefined) {
            this.skillCounts[skillType]++;
            return true;
        }
        return false;
    }

    // 丢弃指定卡牌
    removeCard(cardId) {
        this.cards = this.cards.filter(card => card.id !== cardId);
    }

    // 获取当前卡池
    getCards() {
        return this.cards;
    }

    // 获取技能次数
    getSkillCounts() {
        return this.skillCounts;
    }
}

window.PlayerPool = PlayerPool;
