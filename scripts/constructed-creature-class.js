// constructed-creature-class.js

window.ConstructedCreatureClass = {
    // Основные классы
    TEMPLATES: {
        alchemist: { label: "Алхимик", stats: { perception: "low", crafting: "high", int: "high", dex: "moderate", str: "moderate", hp: "moderate", strikeBonus: "moderate", strikeDamage: "moderate" }},
        barbarian: { label: "Варвар", stats: { athletics: "high", str: "high", con: "high", ac: "high", fort: "high", hp: "high", strikeBonus: "moderate", strikeDamage: "extreme" }},
        bard: { label: "Бард", stats: { occultism: "moderate", perception: "high", cha: "high", fort: "low", wil: "high", hp: "moderate", strikeBonus: "low", spellcasting: "high" }},
        champion: { label: "Чемпион", stats: { religion: "moderate", perception: "low", str: "high", cha: "moderate", ac: "extreme", ref: "low", strikeBonus: "moderate", strikeDamage: "high" }},
        cleric: { label: "Жрец", stats: { religion: "high", perception: "high", wis: "high", ac: "low", fort: "low", wil: "high", hp: "moderate", strikeBonus: "low", spellcasting: "high" }},
        druid: { label: "Друид", stats: { nature: "high", perception: "high", wis: "high", wil: "high", hp: "moderate", strikeBonus: "low", spellcasting: "high" }},
        fighter: { label: "Воин", stats: { athletics: "high", str: "high", ac: "high", wil: "low", strikeBonus: "high", strikeDamage: "high" }},
        investigator: { label: "Следователь", stats: { society: "high", perception: "high", int: "high", fort: "low", wil: "high", hp: "moderate", strikeBonus: "moderate", strikeDamage: "moderate" }},
        monk: { label: "Монах", stats: { athletics: "high", dex: "high", wis: "moderate", ac: "high", strikeBonus: "moderate", strikeDamage: "high" }},
        ranger: { label: "Следопыт", stats: { nature: "moderate", survival: "moderate", perception: "high", str: "high", ac: "high", strikeBonus: "moderate", strikeDamage: "high" }},
        rogue: { label: "Плут", stats: { stealth: "high", thievery: "high", perception: "high", dex: "high", ac: "high", fort: "low", ref: "high", hp: "moderate", strikeBonus: "moderate", strikeDamage: "high" }},
        sorcerer: { label: "Чародей", stats: { perception: "low", cha: "high", ac: "low", fort: "low", hp: "low", strikeBonus: "low", spellcasting: "high" }},
        wizard: { label: "Волшебник", stats: { arcana: "high", perception: "low", int: "high", ac: "low", fort: "low", hp: "low", strikeBonus: "low", spellcasting: "high" }}
    },

    // Подклассы Плута
    ROGUE_RACKETS: {
        thief: { name: "Вор", uuid: "Compendium.pf2e-ts-adv-v2.Build.Item.MSkvpjCBdQQzTFjS" },
        ruffian: { name: "Головорез", uuid: "Compendium.pf2e-ts-adv-v2.Build.Item.HZ0afEEHohBTNPWK" },
        scoundrel: { name: "Негодяй", uuid: "Compendium.pf2e-ts-adv-v2.Build.Item.cLsfqrEO4CJZxg7S" },
        poisoner: { name: "Отравитель", uuid: "Compendium.pf2e-ts-adv-v2.Build.Item.GifPKUhuNoG04Ri3" }
    },
    
    _subclassCache: {},

    getOptionsHTML: function(className) {
        if (className === 'rogue') {
            const options = Object.entries(this.ROGUE_RACKETS).map(([key, val]) => `<option value="${key}">${val.name}</option>`).join("");
            return `
            <div class="class-suboption-block" style="margin-top: 10px; padding: 10px; background: rgba(0,0,0,0.05); border-radius: 4px; border-left: 3px solid #e05297;">
                <label style="font-weight:bold; display:block;">Специализация Плута (Subclass):</label>
                <select id="mm-rogue-racket" class="subclass-select" style="width: 100%; margin-top: 5px;">
                    <option value="none">-- Выберите --</option>
                    ${options}
                </select>
                <div id="mm-subclass-desc" class="enriched-desc" style="display:none;"></div>
            </div>`;
        }
        return "";
    },

    activateListeners: function(html, updateCallback) {
        const self = this;
        html.find("#mm-rogue-racket").change(async function() {
            const key = $(this).val();
            const descBlock = html.find("#mm-subclass-desc");
            
            if (key !== "none") {
                descBlock.show().html("<em>Загрузка...</em>");
                const data = await self.getSubclassParsedData('rogue', key);
                // Превращаем текст в HTML с кнопками
                const enriched = await TextEditor.enrichHTML(data.desc, {async: true});
                descBlock.html(enriched);
            } else {
                descBlock.hide().html("");
            }
            
            if (updateCallback) updateCallback();
        });
    },

    // Получить данные подкласса (включая Item object)
    getSubclassParsedData: async function(className, subKey) {
        const cacheKey = `${className}_${subKey}`;
        if (this._subclassCache[cacheKey]) return this._subclassCache[cacheKey];

        let result = { stats: {}, lores: [], items: [], desc: "" };

        if (className === 'rogue' && this.ROGUE_RACKETS[subKey]) {
            const uuid = this.ROGUE_RACKETS[subKey].uuid;
            try {
                const item = await fromUuid(uuid);
                if (item) {
                    result.desc = item.system.description.value;
                    result.items.push(item.toObject()); // Сохраняем объект предмета
                    
                    if (window.ConstructedCreatureParser) {
                        const parsed = window.ConstructedCreatureParser.parseDescription(result.desc);
                        result.stats = parsed.stats;
                        result.lores = parsed.lores;
                    }
                }
            } catch(e) { console.error("Monster Maker: Error loading subclass", e); }
        }

        this._subclassCache[cacheKey] = result;
        return result;
    }
};