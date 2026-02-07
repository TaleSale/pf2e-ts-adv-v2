// constructed-creature.js

// Порядок важности (чем выше индекс, тем сильнее значение)
const PROFICIENCY_RANKS = ["none", "terrible", "low", "moderate", "high", "extreme"];

const PROFICIENCY_LABELS = {
    extreme: "Экстремальный",
    high: "Высокий",
    moderate: "Средний",
    low: "Низкий",
    terrible: "Ужасный",
    abysmal: "Ничтожный",
    none: "Нет"
};

// ID навыков должны точно совпадать с системными ключами PF2e
const SKILL_LIST = {
    acr: "Акробатика", arc: "Аркана", ath: "Атлетика", cra: "Ремесло",
    dec: "Обман", dip: "Дипломатия", int: "Запугивание", med: "Медицина",
    nat: "Природа", occ: "Оккультизм", per: "Выступление", rel: "Религия",
    soc: "Общество", ste: "Скрытность", sur: "Выживание", thi: "Воровство"
};

// --- ДАННЫЕ ШАБЛОНОВ ---
const MONSTER_TEMPLATES = {
    brute: {
        label: "Громила (Brute)",
        stats: { per: "low", str: "extreme", con: "high", dex: "low", int: "low", wis: "low", cha: "low", ac: "low", fort: "high", ref: "low", wil: "low", hp: "high", strikeBonus: "moderate", strikeDamage: "extreme" }
    },
    magicalStriker: {
        label: "Магический ударник",
        stats: { strikeBonus: "high", strikeDamage: "high", spellcasting: "high" }
    },
    skirmisher: {
        label: "Застрельщик",
        stats: { dex: "high", fort: "low", ref: "high" }
    },
    sniper: {
        label: "Снайпер",
        stats: { per: "high", dex: "high", fort: "low", ref: "high", hp: "low", strikeBonus: "high", strikeDamage: "high" }
    },
    soldier: {
        label: "Солдат",
        stats: { str: "high", ac: "high", fort: "high", strikeBonus: "high", strikeDamage: "high" }
    },
    spellcaster: {
        label: "Заклинатель",
        stats: { int: "high", wis: "high", cha: "high", fort: "low", wil: "high", hp: "low", strikeBonus: "low", strikeDamage: "low", spellcasting: "high" }
    }
};

// --- ДАННЫЕ КЛАССОВ ---
const CLASS_TEMPLATES = {
    alchemist: {
        label: "Алхимик",
        stats: { per: "low", cra: "high", int: "high", dex: "moderate", str: "moderate", hp: "moderate", strikeBonus: "moderate", strikeDamage: "moderate" }
    },
    barbarian: {
        label: "Варвар",
        stats: { ath: "high", str: "high", con: "high", ac: "high", fort: "high", hp: "high", strikeBonus: "moderate", strikeDamage: "extreme" }
    },
    bard: {
        label: "Бард",
        stats: { occ: "moderate", per: "high", cha: "high", fort: "low", wil: "high", hp: "moderate", strikeBonus: "low", spellcasting: "high" }
    },
    champion: {
        label: "Чемпион",
        stats: { rel: "moderate", per: "low", str: "high", cha: "moderate", ac: "extreme", ref: "low", strikeBonus: "moderate", strikeDamage: "high" }
    },
    cleric: {
        label: "Жрец",
        stats: { rel: "high", per: "high", wis: "high", ac: "low", fort: "low", wil: "high", hp: "moderate", strikeBonus: "low", spellcasting: "high" }
    },
    druid: {
        label: "Друид",
        stats: { nat: "high", per: "high", wis: "high", wil: "high", hp: "moderate", strikeBonus: "low", spellcasting: "high" }
    },
    fighter: {
        label: "Воин",
        stats: { ath: "high", str: "high", ac: "high", wil: "low", strikeBonus: "high", strikeDamage: "high" }
    },
    investigator: {
        label: "Следователь",
        stats: { soc: "high", per: "high", int: "high", fort: "low", wil: "high", hp: "moderate", strikeBonus: "moderate", strikeDamage: "moderate" }
    },
    monk: {
        label: "Монах",
        stats: { ath: "high", dex: "high", wis: "moderate", ac: "high", strikeBonus: "moderate", strikeDamage: "high" }
    },
    ranger: {
        label: "Следопыт",
        stats: { nat: "moderate", sur: "moderate", per: "high", str: "high", ac: "high", strikeBonus: "moderate", strikeDamage: "high" }
    },
    rogue: {
        label: "Плут",
        stats: { ste: "high", thi: "high", per: "high", dex: "high", ac: "high", fort: "low", ref: "high", hp: "moderate", strikeBonus: "moderate", strikeDamage: "high" }
    },
    sorcerer: {
        label: "Чародей",
        stats: { per: "low", cha: "high", ac: "low", fort: "low", hp: "low", strikeBonus: "low", spellcasting: "high" }
    },
    wizard: {
        label: "Волшебник",
        stats: { arc: "high", per: "low", int: "high", ac: "low", fort: "low", hp: "low", strikeBonus: "low", spellcasting: "high" }
    }
};

/**
 * HTML ШАБЛОН
 */
const CONSTRUCTED_CREATURE_TEMPLATE = `
<div class="constructed-creature-wrapper">
    <nav class="sheet-tabs tabs" data-group="primary">
        <a class="item tab-link-template" data-tab="template">Шаблон</a>
        <a class="item tab-link-class" data-tab="class">Класс</a>
        <a class="item tab-link-ancestry" data-tab="ancestry">Родословная</a>
        <a class="item" data-tab="society">Общество</a>
        <a class="item" data-tab="spells">Заклинания</a>
        <a class="item" data-tab="unarmed">Безоружные</a>
        <a class="item" data-tab="equipment">Снаряжение</a>
    </nav>

    <div class="global-controls">
        <div class="form-group-row">
            <div class="form-group">
                <label>Имя существа</label>
                <input type="text" name="creatureName" value="Новое Существо" />
            </div>
            <div class="form-group">
                <label>Уровень</label>
                <select name="level" id="mm-level-select">
                    <option value="-1">-1</option>
                    <option value="0">0</option>
                    <option value="1" selected>1</option>
                    ${Array.from({length: 23}, (_, i) => `<option value="${i+2}">${i+2}</option>`).join('')}
                </select>
            </div>
            <div class="form-group" style="flex: 0 0 auto; display: flex; align-items: flex-end;">
                 <button type="button" id="mm-reset-btn" title="Сбросить все настройки"><i class="fas fa-undo"></i></button>
            </div>
        </div>
    </div>

    <section class="sheet-body">
        
        <!-- ВКЛАДКА: ШАБЛОН (Синяя) -->
        <div class="tab tab-content-template" data-tab="template">
            <div class="monster-maker-container">
                <p class="flavor-text">Базовый шаблон существа. Значения, подсвеченные <span style="color:#a02c2c; font-weight:bold;">Красным</span>, улучшены выбранным Классом.</p>
                
                <div class="form-group">
                    <label>Роль (Template)</label>
                    <select id="mm-template-select">
                        <option value="none">-- Выберите роль --</option>
                        ${Object.entries(MONSTER_TEMPLATES).map(([key, val]) => `<option value="${key}">${val.label}</option>`).join('')}
                    </select>
                </div>

                <hr>
                <div class="stats-container" id="template-stats-container">
                    ${_generateStatBlockHTML('tpl')}
                </div>
            </div>
        </div>

        <!-- ВКЛАДКА: КЛАСС (Красная) -->
        <div class="tab tab-content-class" data-tab="class">
            <div class="monster-maker-container">
                <p class="flavor-text">Выберите класс. Класс усиливает характеристики шаблона. Настройки здесь влияют на итоговый результат.</p>

                <div class="form-group">
                    <label>Класс (Class)</label>
                    <select id="mm-class-select">
                        <option value="none">-- Выберите класс --</option>
                        ${Object.entries(CLASS_TEMPLATES).map(([key, val]) => `<option value="${key}">${val.label}</option>`).join('')}
                    </select>
                </div>

                <hr>
                <div class="stats-container" id="class-stats-container">
                     ${_generateStatBlockHTML('cls')}
                </div>
            </div>
        </div>

        <!-- Заглушки для других вкладок -->
        <div class="tab" data-tab="ancestry"><h3>Вкладка: Родословная</h3></div>
        <div class="tab" data-tab="society"><h3>Вкладка: Общество</h3></div>
        <div class="tab" data-tab="spells"><h3>Вкладка: Заклинания</h3></div>
        <div class="tab" data-tab="unarmed"><h3>Вкладка: Безоружные</h3></div>
        <div class="tab" data-tab="equipment"><h3>Вкладка: Снаряжение</h3></div>

    </section>

    <div class="form-footer">
        <button type="button" id="mm-create-btn"><i class="fas fa-check"></i> Создать Существо</button>
    </div>

    <style>
        .constructed-creature-wrapper { height: 100%; display: flex; flex-direction: column; }
        .constructed-creature-wrapper .sheet-tabs { flex: 0 0 40px; border-bottom: 1px solid var(--color-border-light-2); margin-bottom: 5px; }
        
        /* Цвета вкладок */
        .tab-link-template.active { color: #2c5aa0 !important; border-bottom-color: #2c5aa0 !important; }
        .tab-link-class.active { color: #a02c2c !important; border-bottom-color: #a02c2c !important; }
        
        /* Стили контейнеров */
        .tab-content-template { background-color: rgba(44, 90, 160, 0.05); padding: 10px; border-radius: 5px; height: 100%; overflow-y: auto;}
        .tab-content-class { background-color: rgba(160, 44, 44, 0.05); padding: 10px; border-radius: 5px; height: 100%; overflow-y: auto;}
        
        /* Highlight changed inputs */
        .select-highlight-tpl { border: 2px solid #2c5aa0 !important; background-color: #e8f0ff; }
        .select-highlight-cls { border: 2px solid #a02c2c !important; background-color: #ffe8e8; }
        
        /* Класс перебивает шаблон (визуально в шаблоне) */
        .overridden-by-class { 
            border: 2px solid #a02c2c !important; 
            background-color: #fff0f0 !important;
            box-shadow: 0 0 5px rgba(160, 44, 44, 0.3);
        }

        /* General UI */
        .global-controls { padding: 5px 10px; background: rgba(0,0,0,0.03); border-bottom: 1px solid var(--color-border-light-2); }
        .monster-maker-container { padding-bottom: 50px; }
        .flavor-text { font-style: italic; opacity: 0.8; margin-bottom: 10px; font-size: 0.9em; border-left: 3px solid #666; padding-left: 8px;}
        .form-group-row { display: flex; gap: 10px; align-items: flex-end; }
        .form-group { flex: 1; margin-bottom: 5px; }
        .form-group label { font-weight: bold; display: block; font-size: 0.9em;}
        .form-group input, .form-group select { width: 100%; height: 26px; }

        /* Stats Grid */
        .stats-container { display: flex; gap: 10px; flex-wrap: wrap; }
        .stat-block { flex: 1; min-width: 200px; border: 1px solid rgba(0,0,0,0.1); padding: 5px; border-radius: 5px; background: rgba(255,255,255,0.5); }
        .stat-block h4 { text-align: center; margin: 0 0 5px 0; border-bottom: 1px solid rgba(0,0,0,0.1); font-size: 1em; }
        .stat-block label { display: flex; justify-content: space-between; font-size: 0.85em; align-items: center; margin-bottom: 2px; }
        .stat-select { width: 55% !important; height: 20px; font-size: 0.8em; }

        /* Skills Grid */
        .skills-block-wrapper { margin-top: 10px; border: 1px solid rgba(0,0,0,0.1); padding: 5px; border-radius: 5px; background: rgba(255,255,255,0.3); width: 100%; }
        .skills-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 2px 10px; }
        .skill-label { display: flex; justify-content: space-between; font-size: 0.8em; align-items: center; }

        .form-footer { padding: 10px; border-top: 1px solid var(--color-border-light-2); text-align: center; }
        #mm-create-btn { padding: 8px 20px; background: #333; color: white; border: none; font-size: 1.1em; cursor: pointer; border-radius: 3px; }
        #mm-create-btn:hover { background: #000; }
        #mm-reset-btn { width: 30px; height: 26px; cursor: pointer; }
    </style>
</div>
`;

// Генерация HTML блоков
function _generateStatBlockHTML(prefix) {
    return `
    <div class="stat-block">
        <h4>Характеристики</h4>
        <label>Сила: <select class="stat-select ${prefix}-stat" name="str"></select></label>
        <label>Ловкость: <select class="stat-select ${prefix}-stat" name="dex"></select></label>
        <label>Телосложение: <select class="stat-select ${prefix}-stat" name="con"></select></label>
        <label>Интеллект: <select class="stat-select ${prefix}-stat" name="int"></select></label>
        <label>Мудрость: <select class="stat-select ${prefix}-stat" name="wis"></select></label>
        <label>Харизма: <select class="stat-select ${prefix}-stat" name="cha"></select></label>
    </div>
    <div class="stat-block">
        <h4>Защита</h4>
        <label>AC: <select class="stat-select ${prefix}-stat" name="ac"></select></label>
        <label>HP: <select class="stat-select ${prefix}-stat" name="hp"></select></label>
        <label>Стойкость: <select class="stat-select ${prefix}-stat" name="fort"></select></label>
        <label>Рефлекс: <select class="stat-select ${prefix}-stat" name="ref"></select></label>
        <label>Воля: <select class="stat-select ${prefix}-stat" name="wil"></select></label>
        <label>Восприятие: <select class="stat-select ${prefix}-stat" name="per"></select></label>
    </div>
    <div class="stat-block">
        <h4>Атака / Магия</h4>
        <label>Атака: <select class="stat-select ${prefix}-stat" name="strikeBonus"></select></label>
        <label>Урон: <select class="stat-select ${prefix}-stat" name="strikeDamage"></select></label>
        <label>Заклинания DC: <select class="stat-select ${prefix}-stat" name="spellcasting"></select></label>
    </div>
    <div class="skills-block-wrapper">
        <h4>Навыки</h4>
        <div class="skills-grid">
            ${Object.entries(SKILL_LIST).map(([key, label]) => `
                <label class="skill-label">
                    <span>${label}</span>
                    <select class="stat-select skill-select ${prefix}-stat" name="${key}"></select>
                </label>
            `).join('')}
        </div>
    </div>
    `;
}

class ConstructedCreatureApp extends Application {
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            id: "constructed-creature-app",
            title: "Конструктор Существ",
            width: 850,
            height: 900,
            resizable: true,
            tabs: [{
                navSelector: ".sheet-tabs",
                contentSelector: ".sheet-body",
                initial: "template"
            }],
            classes: ["pf2e", "sheet"]
        });
    }

    async _renderInner(data) {
        const $html = $(CONSTRUCTED_CREATURE_TEMPLATE);
        this._populateSelects($html);
        return $html;
    }

    /**
     * Заполнение селектов
     * По умолчанию: Навыки/Магия = NONE, Остальное = MODERATE
     */
    _populateSelects($html) {
        const optionsHtml = Object.entries(PROFICIENCY_LABELS)
            .map(([key, label]) => `<option value="${key}">${label}</option>`)
            .join("");
        
        $html.find(".stat-select").each(function() {
            $(this).html(optionsHtml);
            
            const isSkill = $(this).hasClass("skill-select");
            const isSpell = this.name === "spellcasting";

            if (isSkill || isSpell) {
                $(this).val("none");
            } else {
                $(this).val("moderate");
            }
        });
    }

    activateListeners(html) {
        super.activateListeners(html);

        // 1. Выбор ШАБЛОНА
        html.find("#mm-template-select").change(ev => {
            const roleKey = ev.target.value;
            // Сброс к дефолту перед применением
            this._resetInputs(html, 'tpl'); 
            
            if (roleKey !== "none" && MONSTER_TEMPLATES[roleKey]) {
                const stats = MONSTER_TEMPLATES[roleKey].stats;
                this._applyStatsToInputs(html, stats, 'tpl');
            }
            this._updateVisualOverlaps(html);
        });

        // 2. Выбор КЛАССА
        html.find("#mm-class-select").change(ev => {
            const classKey = ev.target.value;
            this._resetInputs(html, 'cls');

            if (classKey !== "none" && CLASS_TEMPLATES[classKey]) {
                const stats = CLASS_TEMPLATES[classKey].stats;
                this._applyStatsToInputs(html, stats, 'cls');
            }
            this._updateVisualOverlaps(html);
        });

        // Слушатель на ручное изменение селектов, чтобы обновлять подсветку
        html.find(".stat-select").change(() => {
            this._updateVisualOverlaps(html);
        });

        // 3. Кнопка СБРОСА
        html.find("#mm-reset-btn").click(() => {
            html.find("#mm-template-select").val("none");
            html.find("#mm-class-select").val("none");
            html.find('#mm-level-select').val("1");
            
            // Сброс всех селектов к дефолтам
            this._populateSelects(html);
            
            // Убираем все классы подсветки
            html.find('.stat-select').removeClass('select-highlight-tpl select-highlight-cls overridden-by-class');
        });

        // 4. СОЗДАНИЕ
        html.find("#mm-create-btn").click(async (ev) => {
            ev.preventDefault();
            await this._createCreature(html);
        });
    }

    _applyStatsToInputs(html, stats, prefix) {
        const highlightClass = prefix === 'tpl' ? 'select-highlight-tpl' : 'select-highlight-cls';
        
        for (const [key, value] of Object.entries(stats)) {
            const selector = `.stat-select.${prefix}-stat[name='${key}']`;
            const el = html.find(selector);
            if (el.length) {
                el.val(value);
                if (value !== "none") {
                    el.addClass(highlightClass);
                }
            }
        }
    }

    _resetInputs(html, prefix) {
        const highlightClass = prefix === 'tpl' ? 'select-highlight-tpl' : 'select-highlight-cls';
        // Возвращаем дефолты
        html.find(`.${prefix}-stat`).each(function() {
            const isSkill = $(this).hasClass("skill-select");
            const isSpell = this.name === "spellcasting";
            $(this).val((isSkill || isSpell) ? "none" : "moderate");
            $(this).removeClass(highlightClass);
        });
    }

    /**
     * Визуализация "Победы" класса над шаблоном
     * Сравнивает значения в Template и Class. Если Class > Template, красит инпут в Template красным.
     */
    _updateVisualOverlaps(html) {
        html.find('.stat-select.tpl-stat').each((i, el) => {
            const $tplEl = $(el);
            const name = $tplEl.attr('name');
            const $clsEl = html.find(`.stat-select.cls-stat[name='${name}']`);
            
            const tplVal = $tplEl.val();
            const clsVal = $clsEl.val();

            $tplEl.removeClass('overridden-by-class');

            const tplRank = PROFICIENCY_RANKS.indexOf(tplVal);
            const clsRank = PROFICIENCY_RANKS.indexOf(clsVal);

            // Если Класс дает больше чем Шаблон, подсвечиваем инпут в Шаблоне
            if (clsRank > tplRank) {
                $tplEl.addClass('overridden-by-class');
            }
        });
    }

    // Вспомогательная: возвращает лучший ранг
    _getMaxRank(rank1, rank2) {
        const idx1 = PROFICIENCY_RANKS.indexOf(rank1) !== -1 ? PROFICIENCY_RANKS.indexOf(rank1) : 0;
        const idx2 = PROFICIENCY_RANKS.indexOf(rank2) !== -1 ? PROFICIENCY_RANKS.indexOf(rank2) : 0;
        return idx1 >= idx2 ? rank1 : rank2;
    }

    async _createCreature(html) {
        const name = html.find("input[name='creatureName']").val() || "Monster";
        const level = html.find("select[name='level']").val();
        const MONSTER_STATS = window.CC_MONSTER_STATS;

        if (!MONSTER_STATS) {
            ui.notifications.error("Ошибка: Таблицы характеристик не найдены!");
            return;
        }

        // --- СЛИЯНИЕ ДАННЫХ ---
        const finalStats = {};
        const allKeys = [
            "str", "dex", "con", "int", "wis", "cha",
            "ac", "hp", "fort", "ref", "wil", "per",
            "strikeBonus", "strikeDamage", "spellcasting",
            ...Object.keys(SKILL_LIST)
        ];

        allKeys.forEach(key => {
            const tplVal = html.find(`.stat-select.tpl-stat[name='${key}']`).val();
            const clsVal = html.find(`.stat-select.cls-stat[name='${key}']`).val();
            
            // Логика: если в одном none, берем другое. Если оба есть, берем максимальное.
            let bestVal = "none";
            if (!tplVal || tplVal === "none") bestVal = clsVal;
            else if (!clsVal || clsVal === "none") bestVal = tplVal;
            else bestVal = this._getMaxRank(tplVal, clsVal);

            finalStats[key] = bestVal;
        });

        // --- ПОЛУЧЕНИЕ ЧИСЕЛ ---
        const getVal = (table, key) => {
            const rank = finalStats[key];
            if (!rank || rank === "none") return null;
            return MONSTER_STATS[table]?.[level]?.[rank];
        };

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
        const perVal = getVal("perceptionSaves", "per") || 0;

        // --- ПОДГОТОВКА НАВЫКОВ ---
        // Формируем объект навыков ДО создания актера
        const skillsObject = {};
        for (const skillKey of Object.keys(SKILL_LIST)) {
            const skillRank = finalStats[skillKey];
            if (skillRank && skillRank !== "none") {
                const skillValue = MONSTER_STATS["skills"]?.[level]?.[skillRank];
                if (skillValue !== undefined) {
                    skillsObject[skillKey] = { base: skillValue };
                }
            }
        }

        // --- СОЗДАНИЕ ДАННЫХ АКТЕРА ---
        const actorData = {
            name: name,
            type: "npc",
            system: {
                details: {
                    level: { value: parseInt(level) },
                    publication: { title: "Constructed Creature", authors: "", license: "OGL", remaster: true }
                },
                abilities: {
                    str: { mod: strMod }, dex: { mod: dexMod }, con: { mod: conMod },
                    int: { mod: intMod }, wis: { mod: wisMod }, cha: { mod: chaMod },
                },
                attributes: {
                    hp: { value: hpMax, max: hpMax },
                    ac: { value: acVal },
                },
                saves: {
                    fortitude: { value: fortVal },
                    reflex: { value: refVal },
                    will: { value: willVal }
                },
                perception: { mod: perVal },
                skills: skillsObject // Вставляем навыки сразу
            }
        };

        const actor = await Actor.create(actorData);
        if (!actor) return;

        // --- ПРЕДМЕТЫ ---
        const itemsToCreate = [];

        // Удар
        const strikeBonus = getVal("strikeBonus", "strikeBonus");
        const strikeDamageDice = getVal("strikeDamage", "strikeDamage");
        if (strikeBonus && strikeDamageDice) {
            itemsToCreate.push({
                name: "Удар",
                type: "melee",
                system: {
                    bonus: { value: strikeBonus },
                    damageRolls: { "0": { damage: strikeDamageDice, damageType: "bludgeoning" } },
                    weaponType: { value: "melee" }
                }
            });
        }

        // Заклинания
        const dcVal = getVal("spellcasting", "spellcasting");
        if (dcVal) {
            itemsToCreate.push({
                name: "Заклинания",
                type: "spellcastingEntry",
                system: {
                    spelldc: { value: dcVal, dc: dcVal + 10 },
                    tradition: { value: "arcane" },
                    prepared: { value: "innate" },
                    showUnpreparedSpells: { value: true }
                }
            });
        }

        if (itemsToCreate.length > 0) {
            await actor.createEmbeddedDocuments("Item", itemsToCreate);
        }

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

    const myButton = $(`
        <button type="button" class="constructed-creature-btn">
            <i class="fas fa-book"></i> Конструктор Существ
        </button>
    `);

    myButton.on("click", (event) => {
        event.preventDefault();
        new ConstructedCreatureApp().render(true);
    });

    const compendiumBtn = footer.find("[data-action='openCompendiumBrowser']");
    if (compendiumBtn.length > 0) {
        compendiumBtn.before(myButton);
    } else {
        footer.append(myButton);
    }
});