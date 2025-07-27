class Player {
    constructor() {
        // 技能使用次数
        this.skillCounts = {
            reveal: 1,
            draw: 1,
            redraw: 1,
            steal: 1
        };
    }

    /**
     * 获胜后可以在N张卡牌中选择1张加入卡池，提供给玩家选择
     * @param {CardPool} cardPool 
     * @param {number} showCards 展示的卡牌数量，默认为3
     * @returns 
     */
    generateRewardCards(cardPool, showCards = 3) {
        const rewards = [];
        // 从cardPool.playerAvailableDeck中随机抽取showCards张不同的卡牌作为选项，因为只是展示给玩家挑选1张，所以此时不对playerAvailableDeck做改动
        let showCount = Math.min(cardPool.playerAvailableDeck.length, showCards);
        for (let i = 0; i < showCount; i++) {
            const index = Math.floor(Math.random() * cardPool.playerAvailableDeck.length);
            const card = cardPool.playerAvailableDeck[index];
            // 确保卡牌不重复
            if (!rewards.some(reward => reward.id === card.id)) {
                rewards.push(card);
            } else {
                i--; // 如果重复了，重新抽取
            }
        }
        return rewards;
    }

    /**
     * 玩家选择一张奖励卡牌加入实际卡池
     * @param {CardPool} cardPool 
     * @param {Card} card 
     */
    addCard(cardPool, card) {
        // 从cardPool.playerAvailableDeck中删除相同ID的卡牌
        const index = cardPool.playerAvailableDeck.findIndex(c => c.id === card.id);
        if (index !== -1) {
            cardPool.playerAvailableDeck.splice(index, 1);
        }
        // 添加到玩家实际卡池
        cardPool.playerDeck.push(card);
    }

    /**
     * 升级指定卡牌（消耗2张卡牌）
     * @param {CardPool} cardPool 
     * @param {number} targetId 目标卡牌ID
     * @param {Array<number>} costIds 作为升级素材的2个卡牌ID
     * @returns {boolean} 升级是否成功
     */
    upgradeCard(cardPool, targetId, costIds) {
        if (costIds.length !== 2) return false;

        // 检查目标卡牌是否存在
        const targetCard = cardPool.playerDeck.find(card => card.id === targetId);
        if (!targetCard) return false;

        // 检查消耗的卡牌是否存在
        const costCards = cardPool.playerDeck.filter(card => costIds.includes(card.id));
        if (costCards.length !== 2) return false;

        // 删除消耗的卡牌
        cardPool.playerDeck = cardPool.playerDeck.filter(card => !costIds.includes(card.id));

        // 升级目标卡牌，每个属性值+1
        targetCard.aim += 1;
        targetCard.spd += 1;
        targetCard.acc += 1;

        return true;
    }

    /**
     * 补充技能次数（消耗2张卡牌）
     * @param {CardPool} cardPool 
     * @param {"reveal" | "draw" | "redraw" | "steal"} skillType 技能类型
     * @param {Array<number>} costIds 消耗的2个卡牌ID
     * @returns {boolean} 技能次数是否增加成功
     */
    addSkillCount(cardPool, skillType, costIds) {
        if (costIds.length !== 2) return false;

        // 检查技能类型是否有效
        if (!this.skillCounts.hasOwnProperty(skillType)) return false;

        // 检查消耗的卡牌是否存在
        const costCards = cardPool.playerDeck.filter(card => costIds.includes(card.id));
        if (costCards.length !== 2) return false;

        // 删除消耗的卡牌
        cardPool.playerDeck = cardPool.playerDeck.filter(card => !costIds.includes(card.id));

        // 增加技能次数
        this.skillCounts[skillType] += 1;

        return true;
    }

    /**
     * 丢弃指定卡牌
     * @param {CardPool} cardPool 
     * @param {number} cardId 丢弃的卡牌ID
     * @returns {boolean} 丢弃是否成功
     */
    removeCard(cardPool, cardId) {
        // 检查卡牌是否存在
        const cardIndex = cardPool.playerDeck.findIndex(card => card.id === cardId);
        if (cardIndex === -1) return false;

        // 从玩家实际卡池中删除卡牌
        cardPool.playerDeck.splice(cardIndex, 1);
        return true;
    }
}
