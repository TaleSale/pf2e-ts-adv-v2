// constructed-creature.js

// --- ПАРСЕР ОПИСАНИЙ ---
window.ConstructedCreatureParser = {
    KEY_MAP: {
        "Сила": "str", "Strength": "str", "Ловкость": "dex", "Dexterity": "dex", "Телосложение": "con", "Constitution": "con",
        "Интеллект": "int", "Intelligence": "int", "Мудрость": "wis", "Wisdom": "wis", "Харизма": "cha", "Charisma": "cha",
        "КБ": "ac", "AC": "ac", "Класс Брони": "ac", "Armor Class": "ac",
        "Стойкость": "fort", "Fortitude": "fort", "Рефлекс": "ref", "Reflex": "ref", "Воля": "wil", "Will": "wil",
        "Восприятие": "perception", "Perception": "perception", "ОЗ": "hp", "HP": "hp",
        "Акробатика": "acrobatics", "Acrobatics": "acrobatics", "Аркана": "arcana", "Arcana": "arcana", "Атлетика": "athletics", "Athletics": "athletics",
        "Ремесло": "crafting", "Crafting": "crafting", "Обман": "deception", "Deception": "deception", "Дипломатия": "diplomacy", "Diplomacy": "diplomacy",
        "Запугивание": "intimidation", "Intimidation": "intimidation", "Медицина": "medicine", "Medicine": "medicine", "Природа": "nature", "Nature": "nature",
        "Оккультизм": "occultism", "Occultism": "occultism", "Выступление": "performance", "Performance": "performance", "Религия": "religion", "Religion": "religion",
        "Общество": "society", "Society": "society", "Скрытность": "stealth", "Stealth": "stealth", "Выживание": "survival", "Survival": "survival", "Воровство": "thievery", "Thievery": "thievery"
    },
    RANK_MAP: {
        "Экстремальный": "extreme", "Extreme": "extreme", "Высокий": "high", "Высокая": "high", "High": "high",
        "Средний": "moderate", "Средняя": "moderate", "Moderate": "moderate", "Низкий": "low", "Низкая": "low", "Low": "low"
    },
    parseDescription: function(htmlString) {
        const stats = {};
        const lores = [];
        const regex = /<strong>\s*(Высокий|Высокая|High|Средний|Средняя|Moderate|Низкий|Низкая|Low)\s*:?\s*<\/strong>\s*([^<]+)/gi;
        let match;
        while ((match = regex.exec(htmlString)) !== null) {
            const rankText = match[1].trim();
            const content = match[2].trim();
            let rankId = null;
            for (const [key, val] of Object.entries(this.RANK_MAP)) {
                if (key.toLowerCase() === rankText.toLowerCase()) { rankId = val; break; }
            }
            if (!rankId) continue;
            const items = content.split(/,|;/).map(s => s.trim());
            items.forEach(itemStr => {
                let foundKey = null;
                const cleanStr = itemStr.replace(/Lore|Знание/i, "").trim();
                for (const [name, id] of Object.entries(this.KEY_MAP)) {
                    if (itemStr.toLowerCase() === name.toLowerCase() || cleanStr.toLowerCase() === name.toLowerCase()) {
                        foundKey = id;
                        break;
                    }
                }
                if (foundKey) stats[foundKey] = rankId;
                else {
                    let cleanLore = itemStr.replace(/\.$/, "").trim(); 
                    if (cleanLore.length > 2) lores.push(cleanLore);
                }
            });
        }
        return { stats, lores };
    }
};

const PROFICIENCY_RANKS = ["none", "terrible", "low", "moderate", "high", "extreme"];
const PROFICIENCY_LABELS = { extreme: "Экстремальный", high: "Высокий", moderate: "Средний", low: "Низкий", terrible: "Ужасный", abysmal: "Ничтожный", none: "Нет" };
const SKILL_LIST = { acrobatics: "Акробатика", arcana: "Аркана", athletics: "Атлетика", crafting: "Ремесло", deception: "Обман", diplomacy: "Дипломатия", intimidation: "Запугивание", medicine: "Медицина", nature: "Природа", occultism: "Оккультизм", performance: "Выступление", religion: "Религия", society: "Общество", stealth: "Скрытность", survival: "Выживание", thievery: "Воровство" };

const MONSTER_TEMPLATES = {
    brute: { label: "Громила", stats: { perception: "low", str: "extreme", con: "high", dex: "low", int: "low", wis: "low", cha: "low", ac: "low", fort: "high", ref: "low", wil: "low", hp: "high", strikeBonus: "moderate", strikeDamage: "extreme" }},
    magicalStriker: { label: "Магический ударник", stats: { strikeBonus: "high", strikeDamage: "high", spellcasting: "high" }},
    skirmisher: { label: "Застрельщик", stats: { dex: "high", fort: "low", ref: "high" }},
    sniper: { label: "Снайпер", stats: { perception: "high", dex: "high", fort: "low", ref: "high", hp: "low", strikeBonus: "high", strikeDamage: "high" }},
    soldier: { label: "Солдат", stats: { str: "high", ac: "high", fort: "high", strikeBonus: "high", strikeDamage: "high" }},
    spellcaster: { label: "Заклинатель", stats: { int: "high", wis: "high", cha: "high", fort: "low", wil: "high", hp: "low", strikeBonus: "low", strikeDamage: "low", spellcasting: "high" }}
};

const CONSTRUCTED_CREATURE_TEMPLATE = `
<div class="constructed-creature-wrapper">
    <nav class="sheet-tabs tabs" data-group="primary">
        <a class="item tab-link-template" data-tab="template">Шаблон</a>
        <a class="item tab-link-class" data-tab="class">Класс</a>
        <a class="item tab-link-ancestry" data-tab="ancestry">Родословная</a>
        <a class="item" data-tab="spells">Заклинания</a>
        <a class="item" data-tab="equipment">Снаряжение</a>
        <a class="item" data-tab="other">Другое</a>
    </nav>
    <div class="global-controls">
        <div class="form-group-row">
            <div class="form-group"><label>Имя существа</label><input type="text" name="creatureName" value="Новое Существо" /></div>
            <div class="form-group"><label>Уровень</label><select name="level" id="mm-level-select"><option value="-1">-1</option><option value="0">0</option><option value="1" selected>1</option>${Array.from({length: 23}, (_, i) => `<option value="${i+2}">${i+2}</option>`).join('')}</select></div>
            <div class="form-group" style="flex:0 0 auto; display:flex; align-items:flex-end;">
                <button type="button" id="mm-reset-btn" class="reset-btn-small" title="Сбросить все"><i class="fas fa-undo"></i></button>
            </div>
        </div>
    </div>
    <section class="sheet-body">
        <div class="tab tab-content-template" data-tab="template">
            <div class="monster-maker-container">
                <p class="flavor-text">
                    <span style="color:#2c5aa0;font-weight:bold;">Синий</span> = Шаблон. 
                    <span style="color:#a02c2c;font-weight:bold;">Красный</span> = Класс. 
                    <span style="color:#6f42c1;font-weight:bold;">Фиолетовый</span> = Родословная.
                    <span style="color:#b8256e;font-weight:bold;">Розовый</span> = Подкласс.
                </p>
                <div class="form-group"><label>Роль</label><select id="mm-template-select"><option value="none">-- Выберите --</option>${Object.entries(MONSTER_TEMPLATES).map(([key, val]) => `<option value="${key}">${val.label}</option>`).join('')}</select></div>
                <hr>
                <div class="stats-container">${_generateStatBlockHTML('tpl')}</div>
            </div>
        </div>
        <div class="tab tab-content-class" data-tab="class">
            <div class="monster-maker-container">
                <p class="flavor-text">Класс и Подкласс.</p>
                <div class="form-group"><label>Класс</label><select id="mm-class-select"><option value="none">-- Выберите --</option></select></div>
                <div id="class-options-container"></div>
            </div>
        </div>
        <div class="tab" data-tab="ancestry"><div id="ancestry-tab-content"></div></div>
        <div class="tab" data-tab="equipment"><div id="equipment-tab-content"></div></div>
        <div class="tab" data-tab="spells"><p>Заклинания (WIP)</p></div>
        <div class="tab" data-tab="other"><p>Другое (WIP)</p></div>
    </section>
    
    <div class="form-footer">
        <button type="button" id="mm-create-btn"><i class="fas fa-check"></i> СОЗДАТЬ СУЩЕСТВО</button>
    </div>

    <style>
        .constructed-creature-wrapper { height: 100%; display: flex; flex-direction: column; }
        .constructed-creature-wrapper .sheet-tabs { flex: 0 0 40px; border-bottom: 1px solid var(--color-border-light-2); margin-bottom: 5px; }
        .tab-content-template { background-color: rgba(44, 90, 160, 0.05); }
        .select-highlight-tpl { border: 2px solid #2c5aa0 !important; background-color: #e8f0ff !important; }
        .select-highlight-cls { border: 2px solid #a02c2c !important; background-color: #ffe8e8 !important; }
        .select-highlight-anc { border: 2px solid #6f42c1 !important; background-color: #f0ebf8 !important; }
        .select-highlight-sub { border: 2px solid #e05297 !important; background-color: #fcebf3 !important; }
        
        .global-controls { padding: 5px 10px; background: rgba(0,0,0,0.03); border-bottom: 1px solid var(--color-border-light-2); }
        .form-group-row { display: flex; gap: 10px; align-items: flex-end; }
        .form-group { flex: 1; margin-bottom: 5px; }
        .form-group label { font-weight: bold; display: block; font-size: 0.9em;}
        .form-group input, .form-group select { width: 100%; height: 26px; }
        
        .reset-btn-small { 
            width: 26px; height: 26px; 
            padding: 0; 
            display: flex; align-items: center; justify-content: center;
            border: 1px solid #999; border-radius: 3px; cursor: pointer;
        }

        .stats-container { display: flex; gap: 10px; flex-wrap: wrap; }
        .stat-block { flex: 1; min-width: 200px; border: 1px solid rgba(0,0,0,0.1); padding: 5px; border-radius: 5px; background: rgba(255,255,255,0.5); }
        .stat-block h4 { text-align: center; margin: 0 0 5px 0; border-bottom: 1px solid rgba(0,0,0,0.1); font-size: 1em; }
        .stat-block label { display: flex; justify-content: space-between; font-size: 0.85em; align-items: center; margin-bottom: 2px; }
        .stat-select { width: 55% !important; height: 20px; font-size: 0.8em; }
        
        /* Исправленная верстка навыков - 3 колонки */
        .skills-block-wrapper { width: 100%; margin-top: 10px; border: 1px solid rgba(0,0,0,0.1); padding: 5px; border-radius: 5px; background: rgba(255,255,255,0.3); }
        .skills-grid { 
            display: grid; 
            grid-template-columns: 1fr 1fr 1fr; 
            gap: 5px 15px; 
        }
        .skill-label { 
            display: flex; 
            justify-content: space-between; 
            font-size: 0.8em; 
            align-items: center; 
            white-space: nowrap;
        }
        .skill-label select { width: 60px !important; }

        /* Lore */
        .lore-row { grid-column: 1 / -1; margin-top: 5px; padding-top: 5px; display: flex; flex-wrap: wrap; gap: 10px; background: rgba(111, 66, 193, 0.05); padding: 5px; border-radius: 3px; }
        .lore-item { width: 32%; display: flex; justify-content: space-between; align-items: center; font-size: 0.8em; }
        
        /* Описание с кнопками UUID */
        .enriched-desc { margin-top: 10px; font-size: 0.9em; color: #444; max-height: 200px; overflow-y: auto; border: 1px solid #ddd; padding: 8px; background: rgba(255,255,255,0.8); border-radius: 4px; }
        .enriched-desc .content-link { background: #eee; padding: 1px 4px; border-radius: 3px; text-decoration: none; color: #333; border: 1px solid #bbb; }

        .form-footer { padding: 15px; border-top: 1px solid #ccc; text-align: center; background: #f0f0f0; margin-top: auto; }
        #mm-create-btn { padding: 12px 30px; background: #2e7d32; color: white; border: none; font-size: 1.2em; font-weight: bold; cursor: pointer; border-radius: 5px; width: 100%; }
        #mm-create-btn:hover { background: #1b5e20; }
    </style>
</div>`;

function _generateStatBlockHTML(prefix) {
    const selects = (lbl, name) => `<label>${lbl}: <select class="stat-select ${prefix}-stat" name="${name}"></select></label>`;
    return `
    <div class="stat-block"><h4>Характеристики</h4>${selects('Сила','str')}${selects('Ловкость','dex')}${selects('Телосложение','con')}${selects('Интеллект','int')}${selects('Мудрость','wis')}${selects('Харизма','cha')}</div>
    <div class="stat-block"><h4>Защита</h4>${selects('AC','ac')}${selects('HP','hp')}${selects('Стойкость','fort')}${selects('Рефлекс','ref')}${selects('Воля','wil')}${selects('Восприятие','perception')}</div>
    <div class="stat-block"><h4>Атака</h4>${selects('Атака','strikeBonus')}${selects('Урон','strikeDamage')}${selects('Закл. DC','spellcasting')}</div>
    <div class="skills-block-wrapper"><h4>Навыки</h4><div class="skills-grid">${Object.entries(SKILL_LIST).map(([k,l])=>`<label class="skill-label"><span>${l}</span><select class="stat-select skill-select ${prefix}-stat" name="${k}"></select></label>`).join('')}<div id="lore-skills-container" class="lore-row" style="display:none;"></div></div></div>
    `;
}

class ConstructedCreatureApp extends Application {
    static get defaultOptions() { return mergeObject(super.defaultOptions, { id: "constructed-creature-app", title: "Конструктор Существ", width: 900, height: 950, resizable: true, tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "template" }], classes: ["pf2e", "sheet"] }); }

    async _renderInner(data) {
        const $html = $(CONSTRUCTED_CREATURE_TEMPLATE);
        this._populateSelects($html);
        if (window.ConstructedCreatureClass) $html.find("#mm-class-select").append(Object.entries(window.ConstructedCreatureClass.TEMPLATES).map(([k,v])=>`<option value="${k}">${v.label}</option>`).join(''));
        if (window.ConstructedCreatureAncestry) $html.find("#ancestry-tab-content").html(window.ConstructedCreatureAncestry.getTabHTML());
        if (window.ConstructedCreatureEquipment) $html.find("#equipment-tab-content").html(window.ConstructedCreatureEquipment.getTabHTML());
        return $html;
    }

    _populateSelects($html) {
        const opts = Object.entries(PROFICIENCY_LABELS).map(([k,v])=>`<option value="${k}">${v}</option>`).join('');
        $html.find(".stat-select").each(function() {
            $(this).html(opts);
            $(this).val(($(this).hasClass("skill-select") || this.name==="spellcasting") ? "none" : "moderate");
        });
    }

    activateListeners(html) {
        super.activateListeners(html);
        const refresh = async () => { await this._updateStatsUI(html); };

        html.find("#mm-template-select").change(refresh);
        html.find("#mm-class-select").change(ev => {
            const cls = ev.target.value;
            const $cont = html.find("#class-options-container").empty();
            if (window.ConstructedCreatureClass && cls!=='none') {
                $cont.html(window.ConstructedCreatureClass.getOptionsHTML(cls));
                window.ConstructedCreatureClass.activateListeners($cont, refresh);
            }
            refresh();
        });
        if (window.ConstructedCreatureAncestry) window.ConstructedCreatureAncestry.activateListeners(html, refresh);
        
        html.find("#mm-create-btn").click(async (e) => { e.preventDefault(); await this._createCreature(html); });
        html.find("#mm-reset-btn").click(()=>{
            html.find("select").not("#mm-level-select").val("none");
            html.find("#class-options-container").empty();
            html.find("#mm-ancestry-enable").prop("checked",false).trigger("change");
            refresh();
        });
    }

    async _updateStatsUI(html) {
        html.find('.stat-select').removeClass('select-highlight-tpl select-highlight-cls select-highlight-sub select-highlight-anc');

        const tplKey = html.find("#mm-template-select").val();
        const tplStats = (tplKey !== "none" && MONSTER_TEMPLATES[tplKey]) ? MONSTER_TEMPLATES[tplKey].stats : {};

        const clsKey = html.find("#mm-class-select").val();
        let clsStats = {};
        if (clsKey !== "none" && window.ConstructedCreatureClass) clsStats = window.ConstructedCreatureClass.TEMPLATES[clsKey].stats;

        let subStats = {}, ancStats = {}, ancLores = [];
        if (window.ConstructedCreatureClass) {
            const subData = await window.ConstructedCreatureClass.getSubclassParsedData(clsKey, html.find("#mm-rogue-racket").val());
            subStats = subData.stats || {};
        }
        if (window.ConstructedCreatureAncestry && html.find("#mm-ancestry-enable").is(":checked")) {
             const key = html.find("#mm-ancestry-select").val();
             const ancData = await window.ConstructedCreatureAncestry.getParsedData(key);
             ancStats = ancData.stats || {};
             ancLores = ancData.lores || [];
        }

        const loreCont = html.find("#lore-skills-container").empty().hide();
        if (ancLores.length > 0) {
            loreCont.show();
            const opts = Object.entries(PROFICIENCY_LABELS).map(([k,v])=>`<option value="${k}">${v}</option>`).join('');
            ancLores.forEach(lore => {
                loreCont.append(`<div class="lore-item"><span>${lore} Lore</span><select class="stat-select select-highlight-anc lore-stat" name="lore_${lore}" style="height:20px;">${opts}</select></div>`);
            });
            loreCont.find("select").val("high");
        }

        html.find(".stat-select.tpl-stat").each(function() {
            const name = this.name;
            const isSkill = $(this).hasClass("skill-select");
            const isSpell = this.name === "spellcasting";
            const defVal = (isSkill || isSpell) ? "none" : "moderate";

            const vTpl = tplStats[name] || defVal;
            const vCls = clsStats[name] || "none";
            const vAnc = ancStats[name] || "none";
            const vSub = subStats[name] || "none";

            const rTpl = PROFICIENCY_RANKS.indexOf(vTpl);
            const rCls = PROFICIENCY_RANKS.indexOf(vCls);
            const rAnc = PROFICIENCY_RANKS.indexOf(vAnc);
            const rSub = PROFICIENCY_RANKS.indexOf(vSub);

            let final = vTpl;
            let css = "";
            if (rSub > rAnc && rSub > rCls && rSub > rTpl) { final = vSub; css = "select-highlight-sub"; }
            else if (rAnc > rCls && rAnc > rTpl) { final = vAnc; css = "select-highlight-anc"; }
            else if (rCls > rTpl) { final = vCls; css = "select-highlight-cls"; }
            else { if (tplStats[name]) css = "select-highlight-tpl"; }

            $(this).val(final);
            if (css) $(this).addClass(css);
        });
    }

    async _createCreature(html) {
        const name = html.find("input[name='creatureName']").val() || "Monster";
        const level = html.find("select[name='level']").val();
        const MONSTER_STATS = window.CC_MONSTER_STATS;
        if (!MONSTER_STATS) return;

        const finalStats = {};
        html.find(".stat-select.tpl-stat").each(function() { finalStats[this.name] = $(this).val(); });

        const getVal = (t, k) => { const r = finalStats[k]; if(!r||r==="none")return null; return MONSTER_STATS[t]?.[level]?.[r]; };
        
        const strMod = getVal("abilityScores", "str") || 0;
        const dexMod = getVal("abilityScores", "dex") || 0;
        const conMod = getVal("abilityScores", "con") || 0;
        const intMod = getVal("abilityScores", "int") || 0;
        const wisMod = getVal("abilityScores", "wis") || 0;
        const chaMod = getVal("abilityScores", "cha") || 0;
        const hpMax = getVal("hitPoints", "hp") || 10;
        const acVal = getVal("armorClass", "ac") || 10;
        const fortVal = getVal("perceptionSaves", "fort") || 0;
        const refVal = getVal("perceptionSaves", "ref") || 0;
        const willVal = getVal("perceptionSaves", "wil") || 0;
        const perVal = getVal("perceptionSaves", "perception") || 0;

        let ancestryTraits = [];
        let itemsToCreate = [];

        // Получаем черты и предметы Родословной
        if (window.ConstructedCreatureAncestry && html.find("#mm-ancestry-enable").is(":checked")) {
            const key = html.find("#mm-ancestry-select").val();
            const ancData = await window.ConstructedCreatureAncestry.getParsedData(key);
            ancestryTraits = ancData.traits || [];
            if (ancData.items) itemsToCreate = itemsToCreate.concat(ancData.items);
        }

        const actorData = {
            name: name, type: "npc",
            system: {
                details: { level: { value: parseInt(level) }, publication: { title: "Constructed Creature", authors: "", license: "OGL", remaster: true } },
                abilities: { str: { mod: strMod }, dex: { mod: dexMod }, con: { mod: conMod }, int: { mod: intMod }, wis: { mod: wisMod }, cha: { mod: chaMod } },
                attributes: { hp: { value: hpMax, max: hpMax }, ac: { value: acVal } },
                saves: { fortitude: { value: fortVal }, reflex: { value: refVal }, will: { value: willVal } },
                perception: { mod: perVal },
                skills: {},
                traits: { value: ancestryTraits }
            }
        };

        const actor = await Actor.create(actorData);
        if (!actor) return;

        // Навыки (Обычные)
        const skillsUpdate = {};
        for (const k of Object.keys(SKILL_LIST)) {
            const rank = finalStats[k];
            if (rank && rank !== "none") {
                const val = MONSTER_STATS["skills"]?.[level]?.[rank];
                if (val !== undefined) skillsUpdate[`system.skills.${k}.base`] = Number(val);
            }
        }
        if (Object.keys(skillsUpdate).length > 0) await actor.update(skillsUpdate);

        // Lore Skills (Это Предметы)
        html.find(".lore-stat").each(function() {
            const loreName = this.name.replace("lore_", "");
            const rank = $(this).val();
            if (rank && rank !== "none") {
                const val = MONSTER_STATS["skills"]?.[level]?.[rank];
                if (val !== undefined) {
                    itemsToCreate.push({
                        name: loreName + " Lore",
                        type: "lore",
                        system: { mod: { value: Number(val) } }
                    });
                }
            }
        });

        // Strikes & Spells
        const sBonus = getVal("strikeBonus", "strikeBonus");
        const sDmg = getVal("strikeDamage", "strikeDamage");
        if (sBonus && sDmg) itemsToCreate.push({ name: "Удар", type: "melee", system: { bonus: { value: sBonus }, damageRolls: { "0": { damage: sDmg, damageType: "bludgeoning" } }, weaponType: { value: "melee" } } });
        
        const spellDC = getVal("spellcasting", "spellcasting");
        if (spellDC) itemsToCreate.push({ name: "Заклинания", type: "spellcastingEntry", system: { spelldc: { value: spellDC, dc: spellDC+10 }, tradition: "arcane", prepared: { value: "innate" }, showUnpreparedSpells: { value: true } } });

        // Предметы Класса / Подкласса
        if (window.ConstructedCreatureClass) {
            const cName = html.find("#mm-class-select").val();
            const classItems = await window.ConstructedCreatureClass.getClassItems(html, cName); // Это заглушка, но логика подкласса ниже
            
            // Subclass Items (Плут и др.)
            const subKey = html.find("#mm-rogue-racket").val();
            if(subKey && subKey !== 'none') {
                 const subData = await window.ConstructedCreatureClass.getSubclassParsedData('rogue', subKey);
                 if(subData.items) itemsToCreate = itemsToCreate.concat(subData.items);
            }
        }
        // Снаряжение
        if (window.ConstructedCreatureEquipment) itemsToCreate = itemsToCreate.concat(await window.ConstructedCreatureEquipment.getEquipmentItems(html));

        if (itemsToCreate.length > 0) await actor.createEmbeddedDocuments("Item", itemsToCreate);
        
        this.close();
        actor.sheet.render(true);
        ui.notifications.info(`Существо "${name}" успешно создано!`);
    }
}

Hooks.on("renderActorDirectory", (app, html, data) => {
    const $html = $(html);
    const footer = $html.find(".directory-footer");
    if (footer.length === 0) return;
    if ($html.find(".constructed-creature-btn").length > 0) return;
    const myButton = $(`<button type="button" class="constructed-creature-btn"><i class="fas fa-book"></i> Конструктор Существ</button>`);
    myButton.on("click", (e) => { e.preventDefault(); new ConstructedCreatureApp().render(true); });
    const compendiumBtn = footer.find("[data-action='openCompendiumBrowser']");
    if (compendiumBtn.length > 0) compendiumBtn.before(myButton); else footer.append(myButton);
});