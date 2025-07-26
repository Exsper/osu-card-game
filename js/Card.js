class Card {
    /**
     * 
     * @param {num} id 卡牌ID
     * @param {{mod: string, aim: num, spd: num, acc: num}} params 卡牌参数
     * - mod: 卡牌模式 (HR, EZ, DT, HD)
     */
    constructor(id, params = {}) {
        this.id = id;

        // 如果未提供参数，则随机生成
        if (typeof params.mod !== 'string' || typeof params.aim !== 'number' || typeof params.spd !== 'number' || typeof params.acc !== 'number') {
            this.CreateRandomCard();
        }
        else {
            this.mod = params.mod;
            this.aim = params.aim;
            this.spd = params.spd;
            this.acc = params.acc;
        }
    }

    // 随机创建
    CreateRandomCard() {
        const cardType = Math.random();

        // 60% 偏科型卡牌 (一个属性极高)
        if (cardType < 0.6) {
            this.generateSpecializedCard();
        }
        // 30% 平衡型卡牌 (属性分布均衡)
        else if (cardType < 0.9) {
            this.generateBalancedCard();
        }
        // 10% 双高型卡牌 (两个属性高，一个低)
        else {
            this.generateDoubleHighCard();
        }

        const mods = ['HR', 'EZ', 'DT', 'HD'];
        this.mod = mods[Math.floor(Math.random() * mods.length)];
    }

    generateSpecializedCard() {
        const attributes = ['aim', 'spd', 'acc'];
        const specializedAttr = attributes[Math.floor(Math.random() * 3)];
        const otherAttrs = attributes.filter(attr => attr !== specializedAttr);

        // 主要属性值 (8-10)
        const highValue = Math.floor(Math.random() * 3) + 8;

        // 其他两个属性值 (1-5)
        const lowValue1 = Math.floor(Math.random() * 5) + 1;
        const lowValue2 = Math.floor(Math.random() * 5) + 1;


        this[specializedAttr] = highValue;
        this[otherAttrs[0]] = lowValue1;
        this[otherAttrs[1]] = lowValue2;
    }

    generateBalancedCard() {
        // 基础值 (3-6)
        const baseValue = Math.floor(Math.random() * 4) + 3;

        // 各属性在基础值上波动 (-2到+2)
        const aim = baseValue + Math.floor(Math.random() * 5) - 2;
        const spd = baseValue + Math.floor(Math.random() * 5) - 2;
        const acc = baseValue + Math.floor(Math.random() * 5) - 2;

        // 确保属性在1-10范围内
        this.aim = Math.min(10, Math.max(1, aim));
        this.spd = Math.min(10, Math.max(1, spd));
        this.acc = Math.min(10, Math.max(1, acc));

    }

    generateDoubleHighCard() {
        const attributes = ['aim', 'spd', 'acc'];
        const lowAttr = attributes[Math.floor(Math.random() * 3)];
        const highAttrs = attributes.filter(attr => attr !== lowAttr);

        // 两个高属性 (6-9)
        const highValue1 = Math.floor(Math.random() * 4) + 6;
        const highValue2 = Math.floor(Math.random() * 4) + 6;

        // 低属性 (1-7)
        const lowValue = Math.floor(Math.random() * 7) + 1;

        this[highAttrs[0]] = highValue1;
        this[highAttrs[1]] = highValue2;
        this[lowAttr] = lowValue;
    }
}