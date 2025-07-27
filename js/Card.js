class Card {
    /**
     * 
     * @param {num} id 卡牌ID
     * @param {{mod: string, aim: num, spd: num, acc: num}} params 卡牌参数
     * @param {{userId: num, userName: string}} userInfo 用户信息
     * - mod: 卡牌模式 (HR, EZ, DT, HD)
     */
    constructor(id, params = {}, userInfo = {}) {
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
        if (typeof userInfo.userId !== 'number' || typeof userInfo.userName !== 'string') {
            this.userId = -1;
            this.userName = '路人玩家' + this.id; // 默认用户名
            this.avatarUrl = 'https://a.ppy.sh/-1'; // 默认头像
        }
        else {
            this.userId = userInfo.userId;
            this.userName = userInfo.userName;
            this.avatarUrl = `https://a.ppy.sh/${this.userId}?${Date.now()}`
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


    SetCardElStyle(cardEl) {
        // 计算属性值
        const aimVal = this.aim;
        const spdVal = this.spd;
        const accVal = this.acc;
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
    }

    DrawCardInnerHTML(currentMod, showAvatar = true) {
        let aimValue = "";
        let spdValue = "";
        let accValue = "";
        // 计算实际值（考虑MOD效果）
        const multiplier = (this.mod === currentMod) ? 1.5 : 1;
        aimValue += this.aim + ((multiplier > 1) ? ` +${(this.aim * (multiplier - 1)).toFixed(1)}` : "");
        spdValue += this.spd + ((multiplier > 1) ? ` +${(this.spd * (multiplier - 1)).toFixed(1)}` : "");
        accValue += this.acc + ((multiplier > 1) ? ` +${(this.acc * (multiplier - 1)).toFixed(1)}` : "");

        // 添加玩家信息
        const playerInfo =
            (showAvatar && this.userId > 0) ?
                `<div class="player-header">
                <img src="${this.avatarUrl}" alt="${this.userName}" class="player-avatar">
                <div class="player-name">${this.userName}</div>
            </div>`
                : ``;

        return `
            ${playerInfo}
            <div class="card-header">
                <div class="card-mod ${this.mod === currentMod ? 'highlight' : ''}">${this.mod}</div>
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
            <div class="card-footer">${(showAvatar && this.userId > 0) ? "osuID: " + this.userId : "ID: " + this.id}</div>
            `;
    }

    DrawHiddenCardInnerHTML() {
        return `
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
}