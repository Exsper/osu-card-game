// 管理整个游戏的全部卡牌，包括目前还未使用到的所有卡牌
class CardPool {
    constructor(useRealPlayers = false) {
        this.useRealPlayers = useRealPlayers;
        // 因为玩家可以偷取对手的卡牌，所以要确保两个卡池中的卡牌没有相同ID，用一个数字记录目前生成过的卡牌数量，以便生成新的卡牌ID
        this.deckLength = 0;
        // 游戏中玩家和敌人分别从各自的卡池中抽取卡牌
        // 可选卡牌池，这里的卡池是敌人和玩家可以获得的额外卡牌，包括可以在游戏获胜后可选择的新卡牌，不好含玩家和敌人已经拥有的卡牌
        this.playerAvailableDeck = [];
        this.enemyAvailableDeck = [];
        // 玩家和敌人当前的实际卡池
        this.playerDeck = [];
        this.enemyDeck = [];
        // 游戏进度，随游戏进度卡牌数值会逐渐提高
        this.progress = 0;
        // 实际osu玩家。只会分配到玩家理论卡池中，每条分配到之后应删除该条
        this.osuPlayers = (this.useRealPlayers) ? [
            { userId: 2360046, userName: 'Candy', mod: 'HD', aim: 4, spd: 2, acc: 7 },
            { userId: 2, userName: 'peppy', mod: 'EZ', aim: 2, spd: 2, acc: 2 },
            { userId: 3, userName: 'BanchoBot', mod: 'DT', aim: 2, spd: 7, acc: 2 },
        ] : [];

        // 创建初始卡池
        this.createBaseDeck();
    }

    // 根据游戏进度调整卡牌数值
    // 卡牌各项数值 + [0 到 (process - 6) / 2]中的随机数
    adjustCardValues(card) {
        card.aim += Math.floor(Math.random() * (this.progress - 6) / 2);
        if (card.aim < 1) card.aim = 1; // 确保属性值不低于1
        card.spd += Math.floor(Math.random() * (this.progress - 6) / 2);
        if (card.spd < 1) card.spd = 1; // 确保属性值不低于1
        card.acc += Math.floor(Math.random() * (this.progress - 6) / 2);
        if (card.acc < 1) card.acc = 1; // 确保属性值不低于1
        return card;
    }

    createMoreDeck() {
        const eachAddCount = 5; // 每次敌人和玩家理论卡池分别添加5张卡牌
        const addOsuPlayerCount = 1; // 每次添加1张osu玩家卡牌给玩家理论卡池
        let startIndex = this.deckLength; // 从当前卡牌数量开始添加新卡牌

        // 自动增加进度
        this.progress += 1; // 每次添加卡牌增加1点进度

        // 只保留玩家可选卡池中的osu玩家卡牌，其他以前的可选卡牌全部删除
        this.playerAvailableDeck = this.playerAvailableDeck.filter(c => c.userId > 0);
        // 只保留敌人可选卡池中的osu玩家卡牌，其他以前的可选卡牌全部删除（理论上敌人不可能拥有osu玩家卡牌，但是以后如果会给敌人设置技能系统就不一定了）
        this.enemyAvailableDeck = this.enemyAvailableDeck.filter(c => c.userId > 0);

        // 添加osu玩家卡牌
        let realAddCount = 0; // 实际添加的osu玩家卡牌数量
        if (this.osuPlayers.length > 0) {
            for (let i = 0; i < addOsuPlayerCount; i++) {
                if (this.osuPlayers.length === 0) break; // 没有更多玩家卡牌可添加
                // 随机选择一个玩家
                const playerIndex = Math.floor(Math.random() * this.osuPlayers.length);
                const player = this.osuPlayers[playerIndex];
                // 从玩家卡牌列表中移除该玩家
                this.osuPlayers.splice(playerIndex, 1);
                // 创建玩家卡牌
                const card = new Card(startIndex + i + 1, {
                    mod: player.mod,
                    aim: player.aim,
                    spd: player.spd,
                    acc: player.acc
                }, {
                    userId: player.userId,
                    userName: player.userName
                });
                this.adjustCardValues(card);
                this.deckLength += 1; // 更新卡牌数量
                this.playerAvailableDeck.push(card); // 添加本次新增卡牌到玩家可选卡池
                realAddCount += 1; // 实际添加的osu玩家卡牌数量
            }
        }
        // 为玩家添加普通卡牌
        startIndex += realAddCount; // 更新起始索引
        for (let i = 0; i < (eachAddCount - realAddCount); i++) {
            const card = new Card(startIndex + i + 1);
            this.adjustCardValues(card);
            this.deckLength += 1; // 更新卡牌数量
            this.playerAvailableDeck.push(card); // 添加到玩家可选卡池
        }
        // 为敌人添加普通卡牌
        startIndex += (eachAddCount - realAddCount); // 更新起始索引
        for (let i = 0; i < eachAddCount; i++) {
            const card = new Card(startIndex + i + 1);
            this.adjustCardValues(card);
            this.deckLength += 1; // 更新卡牌数量
            this.enemyAvailableDeck.push(card); // 添加到敌人可选卡池
        }

        // 玩家手动挑选卡牌，这里只为敌人随机选择卡牌
        // 敌人选择3张添加到敌人实际卡池，同时删除(3 - 1)张属性值较低的卡牌，最终新增卡牌数和玩家新增卡牌数相同
        // 因为玩家可以选择1张新卡牌之外，还可以升级卡牌，这样双方水平进步应该比较均衡
        for (let i = 0; i < 3; i++) {
            const index = Math.floor(Math.random() * this.enemyAvailableDeck.length);
            const card = this.enemyAvailableDeck.splice(index, 1)[0];
            this.enemyDeck.push(card);
        }
        // 删除敌人实际卡池中2张属性值较低的卡牌
        this.enemyDeck.sort((a, b) => (a.aim + a.spd + a.acc) - (b.aim + b.spd + b.acc));
        this.enemyDeck.pop();
        this.enemyDeck.pop();
    }

    // 创建初始卡池，包含一些数值较低的卡牌，和特定的osu玩家卡牌
    createBaseDeck() {
        const baseEachDeckCount = 25; // 敌人和玩家各自可选卡牌池的基础卡牌数量
        const basePlayerCount = 20; // 基础玩家实际卡池数量
        const baseEnemyCount = 20; // 基础敌人实际卡池数量

        // 开局不把osu玩家加入可选卡牌池

        // 为玩家创建一些基础卡牌
        for (let i = 0; i < baseEachDeckCount; i++) {
            const card = new Card(i + 1);
            // 调整卡牌数值
            this.adjustCardValues(card);
            this.deckLength += 1; // 更新卡牌数量
            this.playerAvailableDeck.push(card);
        }

        // 为敌人创建一些基础卡牌
        for (let i = 0; i < baseEachDeckCount; i++) {
            const card = new Card(baseEachDeckCount + i + 1);
            // 调整卡牌数值
            this.adjustCardValues(card);
            this.deckLength += 1; // 更新卡牌数量
            this.enemyAvailableDeck.push(card);
        }

        // 将部分可选卡牌池中的卡牌放入实际卡池
        for (let i = 0; i < basePlayerCount; i++) {
            const index = Math.floor(Math.random() * this.playerAvailableDeck.length);
            const card = this.playerAvailableDeck.splice(index, 1)[0];
            this.playerDeck.push(card);
        }
        for (let i = 0; i < baseEnemyCount; i++) {
            const index = Math.floor(Math.random() * this.enemyAvailableDeck.length);
            const card = this.enemyAvailableDeck.splice(index, 1)[0];
            this.enemyDeck.push(card);
        }


    }
}