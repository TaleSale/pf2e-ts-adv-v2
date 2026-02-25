// ==================================================================
// 1. ПАРСЕР ОПИСАНИЙ (Utility)
// ==================================================================
window.ConstructedCreatureParser = {
    KEY_MAP: {
        // Характеристики
        "Сила": "str", "Strength": "str", "Ловкость": "dex", "Dexterity": "dex", "Телосложение": "con", "Constitution": "con",
        "Интеллект": "int", "Intelligence": "int", "Мудрость": "wis", "Wisdom": "wis", "Харизма": "cha", "Charisma": "cha",

        // Защита
        "КБ": "ac", "AC": "ac", "Класс Брони": "ac", "Armor Class": "ac",
        "Стойкость": "fort", "Fortitude": "fort", "Рефлекс": "ref", "Reflex": "ref", "Воля": "wil", "Will": "wil",
        "Восприятие": "perception", "Perception": "perception", "ОЗ": "hp", "HP": "hp", "Здоровье": "hp", "Hit Points": "hp",

        // Магия
        "Закл DC": "spellcasting", "Закл. DC": "spellcasting", "Spell DC": "spellcasting", "Spellcasting DC": "spellcasting", "Spellcasting": "spellcasting",

        // Навыки
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
    parseDescription: function (htmlString) {
        const stats = {};
        const lores = [];
        // Регулярка ищет: <strong>Ранг:</strong> Значения
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
                // Убираем суффиксы для чистого поиска
                const cleanStr = itemStr.replace(/Lore|Знание/i, "").trim();

                for (const [name, id] of Object.entries(this.KEY_MAP)) {
                    if (itemStr.toLowerCase() === name.toLowerCase() || cleanStr.toLowerCase() === name.toLowerCase()) {
                        foundKey = id;
                        break;
                    }
                }

                if (foundKey) {
                    stats[foundKey] = rankId;
                } else {
                    // Если это не системный навык/стат, считаем это Lore
                    let cleanLore = itemStr.replace(/\.$/, "").trim();
                    if (cleanLore.length > 2) {
                        lores.push(cleanLore);
                    }
                }
            });
        }
        return { stats, lores };
    }
};

// ==================================================================
// 2. КОНСТАНТЫ И ДАННЫЕ
// ==================================================================
const PROFICIENCY_RANKS = ["none", "terrible", "low", "moderate", "high", "extreme"];
const PROFICIENCY_LABELS = { extreme: "Экстремальный", high: "Высокий", moderate: "Средний", low: "Низкий", terrible: "Ужасный", abysmal: "Ничтожный", none: "Нет" };
const SKILL_LIST = { acrobatics: "Акробатика", arcana: "Аркана", athletics: "Атлетика", crafting: "Ремесло", deception: "Обман", diplomacy: "Дипломатия", intimidation: "Запугивание", medicine: "Медицина", nature: "Природа", occultism: "Оккультизм", performance: "Выступление", religion: "Религия", society: "Общество", stealth: "Скрытность", survival: "Выживание", thievery: "Воровство" };

const MONSTER_TEMPLATES = {
    brute: { label: "Громила", stats: { perception: "low", str: "extreme", con: "high", dex: "low", int: "low", wis: "low", cha: "low", ac: "low", fort: "high", ref: "low", wil: "low", hp: "high", strikeBonus: "moderate", strikeDamage: "extreme" } },
    magicalStriker: { label: "Магический ударник", stats: { strikeBonus: "high", strikeDamage: "high", spellcasting: "high" } },
    skirmisher: { label: "Застрельщик", stats: { dex: "high", fort: "low", ref: "high" } },
    sniper: { label: "Снайпер", stats: { perception: "high", dex: "high", fort: "low", ref: "high", hp: "low", strikeBonus: "high", strikeDamage: "high" } },
    soldier: { label: "Солдат", stats: { str: "high", ac: "high", fort: "high", strikeBonus: "high", strikeDamage: "high" } },
    spellcaster: { label: "Заклинатель", stats: { int: "high", wis: "high", cha: "high", fort: "low", wil: "high", hp: "low", strikeBonus: "low", spellcasting: "high" } }
};

// ==================================================================
// 3. HTML ШАБЛОН
// ==================================================================
const CONSTRUCTED_CREATURE_TEMPLATE = `
<div class="constructed-creature-wrapper">
    <nav class="sheet-tabs tabs" data-group="primary">
        <a class="item tab-link-source" data-tab="source">Источник</a>
        <a class="item tab-link-template" data-tab="template">Шаблон</a>
        <a class="item tab-link-class" data-tab="class">Класс</a>
        <a class="item tab-link-ancestry" data-tab="ancestry">Родословная</a>
        <a class="item" data-tab="equipment">Снаряжение</a>
        <a class="item" data-tab="other">Другое</a>
    </nav>
    <div class="global-controls">
        <div class="form-group-row">
            <div class="form-group"><label>Имя существа</label><input type="text" name="creatureName" value="Новое Существо" /></div>
            <div class="form-group"><label>Уровень</label><select name="level" id="mm-level-select"><option value="-1">-1</option><option value="0">0</option><option value="1" selected>1</option>${Array.from({ length: 23 }, (_, i) => `<option value="${i + 2}">${i + 2}</option>`).join('')}</select></div>
            <div class="form-group" style="flex:0 0 auto; display:flex; align-items:flex-end;">
                <button type="button" id="mm-reset-btn" class="reset-btn-small" title="Сбросить все"><i class="fas fa-undo"></i></button>
            </div>
        </div>
    </div>
    <section class="sheet-body">
        <div class="tab tab-content-source" data-tab="source"><div id="source-tab-content" style="height:100%;"></div></div>
        <div class="tab tab-content-template" data-tab="template">
            <div class="monster-maker-container">
                <p class="flavor-text">
                    <span style="color:#2c5aa0;font-weight:bold;">Синий</span> = Шаблон. 
                    <span style="color:#a02c2c;font-weight:bold;">Красный</span> = Класс. 
                    <span style="color:#6f42c1;font-weight:bold;">Фиолетовый</span> = Родословная.
                    <span style="color:#b8256e;font-weight:bold;">Розовый</span> = Подкласс.
                    <span style="color:#b58900;font-weight:bold;">Жёлтый</span> = Источник.
                    <span style="color:#2ea043;font-weight:bold;">Зелёный</span> = Другое.
                </p>
                <div class="form-group"><label>Роль</label><select id="mm-template-select"><option value="none">-- Выберите --</option>${Object.entries(MONSTER_TEMPLATES).map(([key, val]) => `<option value="${key}">${val.label}</option>`).join('')}</select></div>
                <hr>
                <div class="stats-container">${_generateStatBlockHTML('tpl')}</div>
            </div>
        </div>
        <div class="tab tab-content-class" data-tab="class">
            <div class="monster-maker-container">
                <div class="form-group"><label>Класс</label><select id="mm-class-select"><option value="none">-- Выберите --</option></select></div>
                <div id="class-options-container" style="display:flex; flex-direction:column; flex:1; height:100%;"></div>
            </div>
        </div>
        <div class="tab tab-content-ancestry" data-tab="ancestry"><div id="ancestry-tab-content" style="height:100%;"></div></div>
        <div class="tab" data-tab="equipment"><div id="equipment-tab-content" style="height:100%;"></div></div>
        <div class="tab" data-tab="other"><div id="other-tab-content" style="height:100%;"></div></div>
    </section>
    <div class="form-footer">
        <button type="button" id="mm-create-btn"><i class="fas fa-check"></i> СОЗДАТЬ СУЩЕСТВО</button>
    </div>
</div>`;

function _generateStatBlockHTML(prefix) {
    const selects = (lbl, name) => `<label>${lbl}: <select class="stat-select ${prefix}-stat" name="${name}"></select></label>`;
    return `
    <div class="stat-block"><h4>Характеристики</h4>${selects('Сила', 'str')}${selects('Ловкость', 'dex')}${selects('Телосложение', 'con')}${selects('Интеллект', 'int')}${selects('Мудрость', 'wis')}${selects('Харизма', 'cha')}</div>
    <div class="stat-block"><h4>Защита</h4>${selects('AC', 'ac')}${selects('HP', 'hp')}${selects('Стойкость', 'fort')}${selects('Рефлекс', 'ref')}${selects('Воля', 'wil')}${selects('Восприятие', 'perception')}</div>
    <div class="stat-block"><h4>Атака</h4>${selects('Атака', 'strikeBonus')}${selects('Урон', 'strikeDamage')}${selects('Закл. DC', 'spellcasting')}</div>
    <div class="skills-block-wrapper">
        <h4>Навыки</h4>
        <div class="skills-grid">
            ${Object.entries(SKILL_LIST).map(([k, l]) => `
                <div class="skill-cell">
                    <span>${l}</span>
                    <select class="stat-select skill-select ${prefix}-stat" name="${k}"></select>
                </div>
            `).join('')}
            <div id="lore-skills-container" class="lore-row" style="display:none;"></div>
        </div>
    </div>
    `;
}

// ==================================================================
// 4. ПРИЛОЖЕНИЕ (Application Class)
// ==================================================================
class ConstructedCreatureApp extends Application {
    static get defaultOptions() { return mergeObject(super.defaultOptions, { id: "constructed-creature-app", title: "Конструктор Существ", width: 900, height: 850, resizable: true, tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "source" }], classes: ["pf2e", "sheet"] }); }

    async _renderInner(data) {
        // Подключаем CSS если нет
        if (!document.getElementById("constructed-creature-css")) {
            const link = document.createElement("link");
            link.id = "constructed-creature-css";
            link.rel = "stylesheet";
            link.href = "modules/pf2e-ts-adv-v2/scripts/constructed-creature.css";
            document.head.appendChild(link);
        }
        const $html = $(CONSTRUCTED_CREATURE_TEMPLATE);
        this._populateSelects($html);

        if (window.ConstructedCreatureSource) {
            // Do not carry a stale Source actor across app openings
            window.ConstructedCreatureSource.sourceActor = null;
            window.ConstructedCreatureSource.analyzedData = {};
            $html.find("#source-tab-content").html(window.ConstructedCreatureSource.getTabHTML());
        }

        // Заполняем списки классов
        if (window.ConstructedCreatureClass) $html.find("#mm-class-select").append(Object.entries(window.ConstructedCreatureClass.TEMPLATES).map(([k, v]) => `<option value="${k}">${v.label}</option>`).join(''));
        // Заполняем вкладки из других модулей
        if (window.ConstructedCreatureAncestry) $html.find("#ancestry-tab-content").html(window.ConstructedCreatureAncestry.getTabHTML());
        if (window.ConstructedCreatureEquipment) {
            window.ConstructedCreatureEquipment.clearManualItems?.();
            $html.find("#equipment-tab-content").html(
                window.ConstructedCreatureEquipment.getTabHTML([], 1, {
                    emptyHint: "Выберите подкласс или корректировку со снаряжением."
                })
            );
        }

        // Заполняем вкладку «Другое» (корректировки)
        if (window.ConstructedCreatureOther) {
            const otherHTML = await window.ConstructedCreatureOther.getTabHTML();
            $html.find("#other-tab-content").html(otherHTML);
        }

        return $html;
    }

    _populateSelects($html) {
        const opts = Object.entries(PROFICIENCY_LABELS).map(([k, v]) => `<option value="${k}">${v}</option>`).join('');
        $html.find(".stat-select").each(function () {
            $(this).html(opts);
            $(this).val(($(this).hasClass("skill-select") || this.name === "spellcasting") ? "none" : "moderate");
        });
    }

    activateListeners(html) {
        super.activateListeners(html);
        const refresh = async () => { await this._updateStatsUI(html); };

        if (window.ConstructedCreatureSource) {
            this._activateSourceListeners(html, refresh);
            html.on("change", "#mm-source-keep-equipment", async () => {
                await this._updateEquipmentUI(html);
            });
        }

        html.find("#mm-template-select").change(refresh);
        html.find("#mm-class-select").change(ev => {
            const cls = ev.target.value;
            const $cont = html.find("#class-options-container").empty();
            if (window.ConstructedCreatureClass && cls !== 'none') {
                $cont.html(window.ConstructedCreatureClass.getOptionsHTML(cls));
                window.ConstructedCreatureClass.activateListeners($cont, refresh);
            }
            refresh();
        });

        if (window.ConstructedCreatureAncestry) window.ConstructedCreatureAncestry.activateListeners(html, refresh);
        if (window.ConstructedCreatureOther) window.ConstructedCreatureOther.activateListeners(html, refresh);
        if (window.ConstructedCreatureEquipment) window.ConstructedCreatureEquipment.activateListeners(html);

        // Обновление снаряжения при смене уровня
        html.find("#mm-level-select").change(() => {
            this._updateEquipmentUI(html);
        });

        html.find("#mm-create-btn").click(async (e) => { e.preventDefault(); await this._createCreature(html); });
        html.find("#mm-reset-btn").click(() => {
            html.find("select").not("#mm-level-select").val("none");
            html.find("#class-options-container").empty();
            html.find("#mm-ancestry-family").val("none").trigger("change");
            html.find("#mm-source-keep-equipment, #mm-source-keep-traits, #mm-source-keep-speed-types, #mm-source-keep-avatar, #mm-source-priority-description").prop("checked", true);
            if (window.ConstructedCreatureEquipment) {
                window.ConstructedCreatureEquipment.clearManualItems?.();
            }
            if (window.ConstructedCreatureSource) {
                window.ConstructedCreatureSource.sourceActor = null;
                window.ConstructedCreatureSource.analyzedData = {};
                const sourceInfo = html.find("#mm-source-info");
                const sourceLabel = html.find("#mm-source-label");
                const sourceAnalysis = html.find("#mm-source-analysis");
                sourceInfo.hide();
                sourceAnalysis.hide();
                sourceLabel.text("Перетащите NPC сюда");
            }
            refresh();
        });
    }

    formatLoreLabel(rawLore) {
        let name = rawLore.replace(/-/g, " ");
        name = name.replace(/lore/gi, "").trim();
        if (name.length > 0) {
            name = name.charAt(0).toUpperCase() + name.slice(1);
        }
        return name + " Lore";
    }

    _isDefaultFistStrike(item) {
        if (!item?.isOfType?.("melee")) return false;
        const slug = String(item.system?.slug ?? "").trim().toLowerCase();
        const name = String(item.name ?? "").trim().toLowerCase();
        if (slug === "fist") return true;
        return /^(fist|кулак|удар кулаком|fist strike)$/.test(name);
    }

    async _normalizeDefaultFistAttack(actor, targetBonus) {
        if (!actor?.itemTypes?.melee?.length) return;
        const numericTarget = Number(targetBonus);
        if (!Number.isFinite(numericTarget)) return;

        const updates = [];
        for (const item of actor.itemTypes.melee) {
            if (!this._isDefaultFistStrike(item)) continue;

            const bonus = Number(item.system?.bonus?.value ?? item.system?.toHit?.value);
            if (Number.isFinite(bonus) && bonus === numericTarget) continue;

            const update = {
                _id: item.id,
                system: {
                    bonus: { value: Math.trunc(numericTarget) }
                }
            };
            if (item.system?.toHit) {
                update.system.toHit = { value: Math.trunc(numericTarget) };
            }
            updates.push(update);
        }

        if (updates.length > 0) {
            await actor.updateEmbeddedDocuments("Item", updates);
        }
    }

    async _normalizeSpellcastingEntries(actor, targetAttack) {
        if (!actor?.itemTypes?.spellcastingEntry?.length) return;
        const numericAttack = Number(targetAttack);
        if (!Number.isFinite(numericAttack)) return;

        const fallbackAttack = Math.trunc(numericAttack);
        const fallbackDc = fallbackAttack + 8;
        const updates = [];

        for (const entry of actor.itemTypes.spellcastingEntry) {
            const rawAttack = Number(entry.system?.spelldc?.value);
            const rawDc = Number(entry.system?.spelldc?.dc);
            const hasAttack = Number.isFinite(rawAttack) && rawAttack > 0;
            const hasDc = Number.isFinite(rawDc) && rawDc > 0;
            if (hasAttack && hasDc) continue;

            const nextAttack = hasAttack ? Math.trunc(rawAttack) : fallbackAttack;
            const nextDc = hasDc ? Math.trunc(rawDc) : (hasAttack ? Math.trunc(rawAttack) + 8 : fallbackDc);

            updates.push({
                _id: entry.id,
                system: {
                    spelldc: {
                        ...(entry.system?.spelldc ?? {}),
                        value: nextAttack,
                        dc: nextDc
                    }
                }
            });
        }

        if (updates.length > 0) {
            await actor.updateEmbeddedDocuments("Item", updates);
        }
    }

    _activateSourceListeners(html, refresh) {
        const source = window.ConstructedCreatureSource;
        const dropZone = html.find("#mm-source-drop-zone");
        const sourceLabel = html.find("#mm-source-label");
        const sourceInfo = html.find("#mm-source-info");
        const sourceImg = html.find("#mm-source-img");
        const sourceName = html.find("#mm-source-name");
        const sourceLevel = html.find("#mm-source-level");
        const sourceAnalysis = html.find("#mm-source-analysis");
        const analysisList = html.find("#mm-analysis-list");
        const sourcePriorityDescription = html.find("#mm-source-priority-description");

        const parseDropData = (event) => {
            const raw = event.originalEvent?.dataTransfer?.getData("text/plain")
                ?? event.dataTransfer?.getData("text/plain")
                ?? "";
            if (!raw) return null;
            try {
                return JSON.parse(raw);
            } catch (_e) {
                return null;
            }
        };

        const isDescriptionPriority = () => sourcePriorityDescription.prop("checked") !== false;

        const renderAnalysis = async (actor) => {
            if (!actor) return;

            const analyzed = source.analyzeCreature(actor, { preferDescription: isDescriptionPriority() }) || {};
            analysisList.empty();
            for (const [key, rank] of Object.entries(analyzed)) {
                const statLabel = source.getStatLabel ? source.getStatLabel(key) : key;
                const rankLabel = PROFICIENCY_LABELS[rank] || rank;
                analysisList.append(`<li>${statLabel}: <strong>${rankLabel}</strong></li>`);
            }
            sourceAnalysis.show();
            await refresh();
        };

        html.on("change", "#mm-source-priority-description", async () => {
            if (!source.sourceActor) return;
            await renderAnalysis(source.sourceActor);
        });

        dropZone.on("dragover", (event) => {
            event.preventDefault();
            dropZone.css({ borderColor: "#4a90e2", background: "rgba(74,144,226,0.08)" });
        });

        dropZone.on("dragleave", (event) => {
            event.preventDefault();
            dropZone.css({ borderColor: "#ccc", background: "rgba(0,0,0,0.02)" });
        });

        dropZone.on("drop", async (event) => {
            event.preventDefault();
            dropZone.css({ borderColor: "#ccc", background: "rgba(0,0,0,0.02)" });

            const data = parseDropData(event);
            if (!data) return;

            const actor = await source.handleDrop(data);
            if (!actor) return;

            sourceImg.attr("src", actor.img || "");
            sourceName.text(actor.name || "NPC");
            sourceLevel.text(`Уровень ${actor.system?.details?.level?.value ?? "?"}`);
            sourceLabel.text("Источник загружен");
            sourceInfo.show();

            html.find("input[name='creatureName']").val(actor.name || "Monster");
            await renderAnalysis(actor);
        });
    }
    // --- ОБНОВЛЕНИЕ UI (СТАТЫ И ЦВЕТА) ---
    async _updateStatsUI(html) {
        html.find('.stat-select').removeClass('select-highlight-tpl select-highlight-cls select-highlight-sub select-highlight-anc select-highlight-oth select-highlight-src');
        const sourceStats = window.ConstructedCreatureSource?.sourceActor
            ? (window.ConstructedCreatureSource.analyzedData || {})
            : {};
        const tplKey = html.find("#mm-template-select").val();
        const tplStats = (tplKey !== "none" && MONSTER_TEMPLATES[tplKey]) ? MONSTER_TEMPLATES[tplKey].stats : {};
        const clsKey = html.find("#mm-class-select").val();
        let clsStats = {};
        if (clsKey !== "none" && window.ConstructedCreatureClass) clsStats = window.ConstructedCreatureClass.TEMPLATES[clsKey].stats;

        let subStats = {}, ancStats = {}, ancLores = [], ancData = {}, othStats = {}, othLores = [];
        // Subclass
        if (window.ConstructedCreatureClass) {
            const subKey = html.find("#mm-subclass-select").val();
            if (subKey && subKey !== 'none') {
                const subData = await window.ConstructedCreatureClass.getSubclassParsedData(clsKey, subKey);
                subStats = subData.stats || {};
            }
        }

        // Ancestry
        if (window.ConstructedCreatureAncestry) {
            const ancUuid = window.ConstructedCreatureAncestry.getSelectedUUID(html);
            if (ancUuid) {
                ancData = await window.ConstructedCreatureAncestry.getParsedData(ancUuid);
                ancStats = ancData.stats || {};
                ancLores = ancData.lores || [];
            }
        }

        // Other (Корректировки) — парсим статы из выбранных корректировок
        if (window.ConstructedCreatureOther) {
            const othData = await window.ConstructedCreatureOther.getAllParsedStats(html);
            othStats = othData.stats || {};
            othLores = othData.lores || [];
        }

        // Рендеринг Lores (объединяем из Родословной и Корректировок)
        const allLores = [...ancLores];
        for (const lore of othLores) {
            if (!allLores.includes(lore)) allLores.push(lore);
        }
        const loreCont = html.find("#lore-skills-container").empty().hide();
        if (allLores.length > 0) {
            loreCont.show();
            const opts = Object.entries(PROFICIENCY_LABELS).map(([k, v]) => `<option value="${k}">${v}</option>`).join('');
            allLores.forEach(lore => {
                const displayName = this.formatLoreLabel(lore);
                const highlightCss = ancLores.includes(lore) ? 'select-highlight-anc' : 'select-highlight-oth';
                loreCont.append(`
                    <div class="lore-item">
                        <span>${displayName}</span>
                        <select class="stat-select ${highlightCss} lore-stat" name="lore_${lore}">${opts}</select>
                    </div>
                `);
            });
            loreCont.find("select").val("high");
        }

        // Рендеринг Статов
        html.find(".stat-select.tpl-stat").each(function () {
            const name = this.name;
            const isSkill = $(this).hasClass("skill-select");
            const isSpell = this.name === "spellcasting";
            const defVal = (isSkill || isSpell) ? "none" : "moderate";
            const vSrc = sourceStats[name] || "none";
            const baseVal = vSrc !== "none" ? vSrc : defVal;
            const vTpl = tplStats[name] || baseVal;
            const vCls = clsStats[name] || "none";
            const vAnc = ancStats[name] || "none";
            const vSub = subStats[name] || "none";
            const vOth = othStats[name] || "none";

            const rTpl = PROFICIENCY_RANKS.indexOf(vTpl);
            const rCls = PROFICIENCY_RANKS.indexOf(vCls);
            const rAnc = PROFICIENCY_RANKS.indexOf(vAnc);
            const rSub = PROFICIENCY_RANKS.indexOf(vSub);
            const rOth = PROFICIENCY_RANKS.indexOf(vOth);

            let final = vTpl;
            let css = "";

            // ЛОГИКА: Если есть врожденные заклинания ИЛИ подкласс дает магию
            if (isSpell) {
                if (rSub > 0) {
                    final = vSub;
                    css = "select-highlight-sub";
                } else if (ancData.hasInnateSpells && rTpl === 0 && rCls === 0) {
                    final = "moderate";
                    css = "select-highlight-anc";
                } else {
                    if (rOth > rCls && rOth > rTpl) { final = vOth; css = "select-highlight-oth"; }
                    else if (rCls > rTpl) { final = vCls; css = "select-highlight-cls"; }
                    else {
                        if (tplStats[name]) css = "select-highlight-tpl";
                        else if (vSrc !== "none") css = "select-highlight-src";
                    }
                }
            } else {
                if (rOth > rSub && rOth > rAnc && rOth > rCls && rOth > rTpl) { final = vOth; css = "select-highlight-oth"; }
                else if (rSub > rAnc && rSub > rCls && rSub > rTpl) { final = vSub; css = "select-highlight-sub"; }
                else if (rAnc > rCls && rAnc > rTpl) { final = vAnc; css = "select-highlight-anc"; }
                else if (rCls > rTpl) { final = vCls; css = "select-highlight-cls"; }
                else {
                    if (tplStats[name]) css = "select-highlight-tpl";
                    else if (vSrc !== "none") css = "select-highlight-src";
                }
            }

            $(this).val(final);
            if (css) $(this).addClass(css);
        });

        // Обновляем снаряжение после статов
        await this._updateEquipmentUI(html);
    }

    // --- ОБНОВЛЕНИЕ СНАРЯЖЕНИЯ ---
    async _updateEquipmentUI(html) {
        if (!window.ConstructedCreatureEquipment) return;

        const level = html.find("#mm-level-select").val();
        const sourceModule = window.ConstructedCreatureSource;
        const sourceActor = sourceModule?.sourceActor?.type === "npc" ? sourceModule.sourceActor : null;
        const keepEquipment = html.find("#mm-source-keep-equipment").prop("checked") !== false;
        const preferSourceEquipment = sourceModule?.shouldPreferSourceEquipment
            ? sourceModule.shouldPreferSourceEquipment(sourceActor, keepEquipment)
            : false;

        if (preferSourceEquipment) {
            const noticeHtml = sourceModule?.getSourceEquipmentNoticeHTML?.()
                ?? "<p style='padding:10px;'>Используется снаряжение из источника. Классовое снаряжение не будет применено.</p>";
            const eqHtml = window.ConstructedCreatureEquipment.getTabHTML([], level, {
                sourceNoticeHtml: noticeHtml,
                emptyHint: "Рекомендованное снаряжение отключено, так как используется источник."
            });
            html.find("#equipment-tab-content").html(eqHtml);
            return;
        }

        let classEquipment = [];
        let otherEquipment = [];

        // Снаряжение от подкласса
        if (window.ConstructedCreatureClass) {
            const clsName = html.find("#mm-class-select").val();
            const subKey = html.find("#mm-subclass-select").val();
            if (clsName && subKey && subKey !== "none") {
                const desc = await window.ConstructedCreatureClass.getSubclassRawDescription(clsName, subKey);
                classEquipment = window.ConstructedCreatureEquipment.parseEquipmentFromDescription(desc);
            }
        }

        // Снаряжение от корректировок (Другое) — приоритетнее
        if (window.ConstructedCreatureOther) {
            otherEquipment = await window.ConstructedCreatureOther.getAllParsedEquipment(html);
        }

        // Объединяем: Other перезаписывает одноимённые категории из класса
        const mergedMap = new Map();
        for (const row of classEquipment) {
            mergedMap.set(row.category, row);
        }
        for (const row of otherEquipment) {
            mergedMap.set(row.category, row); // перезаписывает если категория совпадает
        }
        const mergedEquipment = [...mergedMap.values()];

        const eqHtml = window.ConstructedCreatureEquipment.getTabHTML(mergedEquipment, level, {
            emptyHint: "Выберите подкласс или корректировку со снаряжением."
        });
        html.find("#equipment-tab-content").html(eqHtml);
    }

    // ==================================================================
    // 5. СОЗДАНИЕ СУЩЕСТВА (Final Logic)
    // ==================================================================
    async _createCreature(html) {
        const name = html.find("input[name='creatureName']").val() || "Monster";
        const level = html.find("select[name='level']").val();
        const MONSTER_STATS = window.CC_MONSTER_STATS;
        if (!MONSTER_STATS) return;
        const sourceModule = window.ConstructedCreatureSource;
        const sourceActor = sourceModule?.sourceActor?.type === "npc" ? sourceModule.sourceActor : null;
        const keepSourceEquipment = html.find("#mm-source-keep-equipment").prop("checked") !== false;
        const keepSourceTraits = html.find("#mm-source-keep-traits").prop("checked") !== false;
        const keepSourceSpeedTypes = html.find("#mm-source-keep-speed-types").prop("checked") !== false;
        const keepSourceAvatar = html.find("#mm-source-keep-avatar").prop("checked") !== false;
        const preferSourceEquipment = sourceModule?.shouldPreferSourceEquipment
            ? sourceModule.shouldPreferSourceEquipment(sourceActor, keepSourceEquipment)
            : false;
        const cloneData = (value) => {
            if (value === null || value === undefined) return value;
            if (globalThis.foundry?.utils?.deepClone) return foundry.utils.deepClone(value);
            return JSON.parse(JSON.stringify(value));
        };
        const moduleFlagKey = "pf2e-ts-adv-v2";
        const normalizeToken = (value) => String(value ?? "")
            .toLowerCase()
            .replace(/ё/g, "е")
            .replace(/[^a-zа-я0-9]+/gi, " ")
            .replace(/\s+/g, " ")
            .trim();
        const addToken = (set, value) => {
            const token = normalizeToken(value);
            if (token) set.add(token);
        };
        const markItemOrigin = (itemData, category, details = {}) => {
            const prepared = cloneData(itemData) ?? itemData;
            if (!prepared || typeof prepared !== "object") return prepared;
            prepared.flags = prepared.flags && typeof prepared.flags === "object" ? prepared.flags : {};
            const moduleFlags = prepared.flags[moduleFlagKey] && typeof prepared.flags[moduleFlagKey] === "object"
                ? prepared.flags[moduleFlagKey]
                : {};
            moduleFlags.constructedOrigin = {
                ...(moduleFlags.constructedOrigin && typeof moduleFlags.constructedOrigin === "object" ? moduleFlags.constructedOrigin : {}),
                category,
                ...details
            };
            prepared.flags[moduleFlagKey] = moduleFlags;
            return prepared;
        };
        const markItemsOrigin = (items, category, details = {}) => {
            if (!Array.isArray(items)) return [];
            return items.map((itemData) => markItemOrigin(itemData, category, details));
        };
        const isAdjustmentItemData = (itemData) => {
            if (!itemData || typeof itemData !== "object") return false;
            const name = String(itemData?.name ?? "").toLowerCase();
            const slug = String(itemData?.system?.slug ?? "").toLowerCase();
            if (/корректировк|adjustment/.test(name)) return true;
            if (/корректировк|adjustment/.test(slug)) return true;
            const traits = itemData?.system?.traits?.value;
            if (Array.isArray(traits) && traits.some((trait) => /корректировк|adjustment/i.test(String(trait)))) {
                return true;
            }
            return false;
        };
        const getSourceImportId = (itemData) => {
            const sourceId = itemData?.flags?.["pf2e-ts-adv-v2"]?.sourceImport?.sourceItemId;
            return (typeof sourceId === "string" && sourceId.length > 0) ? sourceId : null;
        };
        const getGrantedByIdFromData = (itemData) => {
            const directId = itemData?.grantedBy?.id
                ?? itemData?.flags?.pf2e?.grantedBy?.id
                ?? itemData?.system?.context?.grantedBy?.id
                ?? null;
            if (typeof directId === "string" && directId.length > 0) return directId;

            const uuid = itemData?.flags?.pf2e?.grantedBy?.uuid
                ?? itemData?.system?.context?.grantedBy?.uuid
                ?? null;
            if (typeof uuid !== "string" || uuid.length === 0) return null;

            const lastSegment = uuid.split(".").pop();
            return (typeof lastSegment === "string" && lastSegment.length > 0) ? lastSegment : null;
        };
        const selectedTemplateKey = String(html.find("#mm-template-select").val() ?? "none");
        const selectedClassKey = String(html.find("#mm-class-select").val() ?? "none");
        const selectedSubclassRaw = html.find("#mm-subclass-select").val();
        const selectedSubclassKey = String(selectedSubclassRaw ?? "none");
        const selectedAncestryFamily = String(html.find("#mm-ancestry-family").val() ?? "none");

        const replaceCategories = new Set();
        if (selectedTemplateKey !== "none") replaceCategories.add("template");
        if (selectedClassKey !== "none") replaceCategories.add("class");
        if (selectedSubclassKey !== "none") replaceCategories.add("subclass");
        if (selectedAncestryFamily !== "none") replaceCategories.add("ancestry");

        const ancestryTokens = new Set();
        const classTokens = new Set();
        const subclassTokens = new Set();
        const templateTokens = new Set();
        const ancestryTraitTokens = new Set();
        const classTraitTokens = new Set();

        if (window.ConstructedCreatureAncestry?.DATA) {
            for (const [key, data] of Object.entries(window.ConstructedCreatureAncestry.DATA)) {
                addToken(ancestryTokens, key);
                addToken(ancestryTokens, data?.label);
                addToken(ancestryTraitTokens, key);
                if (data?.items && typeof data.items === "object") {
                    for (const item of Object.values(data.items)) {
                        addToken(ancestryTokens, item?.name);
                    }
                }
            }
        }
        if (window.ConstructedCreatureClass?.TEMPLATES) {
            for (const [key, data] of Object.entries(window.ConstructedCreatureClass.TEMPLATES)) {
                addToken(classTokens, key);
                addToken(classTokens, data?.label);
                addToken(classTraitTokens, key);
            }
        }
        const subclassCollections = [
            window.ConstructedCreatureClass?.ROGUE_RACKETS,
            window.ConstructedCreatureClass?.FIGHTER_STYLES,
            window.ConstructedCreatureClass?.SORCERER_BLOODLINES
        ];
        for (const collection of subclassCollections) {
            if (!collection || typeof collection !== "object") continue;
            for (const [key, data] of Object.entries(collection)) {
                addToken(subclassTokens, key);
                addToken(subclassTokens, data?.name);
            }
        }
        for (const [key, data] of Object.entries(MONSTER_TEMPLATES)) {
            addToken(templateTokens, key);
            addToken(templateTokens, data?.label);
        }

        const tokenSetContains = (tokenSet, haystack) => {
            for (const token of tokenSet) {
                if (!token) continue;
                if (haystack.includes(token)) return true;
            }
            return false;
        };

        const classifySourceCategory = (itemData) => {
            const explicitCategory = itemData?.flags?.[moduleFlagKey]?.constructedOrigin?.category;
            if (["template", "class", "subclass", "ancestry"].includes(explicitCategory)) {
                return explicitCategory;
            }

            const type = String(itemData?.type ?? "").toLowerCase();
            const mayBeAdjustment = ["action", "feat", "effect", "passive", "lore"].includes(type) || isAdjustmentItemData(itemData);
            if (!mayBeAdjustment) return null;

            const traits = Array.isArray(itemData?.system?.traits?.value)
                ? itemData.system.traits.value.map((value) => normalizeToken(value))
                : [];
            for (const trait of traits) {
                if (ancestryTraitTokens.has(trait)) return "ancestry";
            }
            for (const trait of traits) {
                if (classTraitTokens.has(trait)) return "class";
            }

            const haystack = normalizeToken([
                itemData?.name ?? "",
                itemData?.system?.slug ?? "",
                ...(Array.isArray(itemData?.system?.traits?.value) ? itemData.system.traits.value : [])
            ].join(" "));

            if (tokenSetContains(ancestryTokens, haystack)) return "ancestry";
            if (tokenSetContains(subclassTokens, haystack)) return "subclass";
            if (tokenSetContains(classTokens, haystack)) return "class";
            if (tokenSetContains(templateTokens, haystack)) return "template";
            return null;
        };
        const sourceActorData = sourceActor ? sourceActor.toObject() : null;
        const sourceSpeed = sourceActorData ? cloneData(sourceActorData.system?.attributes?.speed) : null;
        const sourceSenses = sourceActorData ? cloneData(sourceActorData.system?.perception?.senses) : null;
        const sourceDetailsLanguages = sourceActorData ? cloneData(sourceActorData.system?.details?.languages) : null;
        const sourceTraitsLanguages = sourceActorData ? cloneData(sourceActorData.system?.traits?.languages) : null;
        const sourceTraitsValue = sourceActorData ? cloneData(sourceActorData.system?.traits?.value) : null;
        const sourceTraitsRarity = sourceActorData ? cloneData(sourceActorData.system?.traits?.rarity) : null;
        const sourceAvatar = sourceActorData?.img ?? sourceActor?.img ?? null;
        const sourceTokenAvatar = sourceActorData?.prototypeToken?.texture?.src
            ?? sourceActor?.prototypeToken?.texture?.src
            ?? sourceActorData?.prototypeToken?.img
            ?? sourceActor?.prototypeToken?.img
            ?? sourceAvatar
            ?? null;

        const finalStats = {};
        html.find(".stat-select.tpl-stat").each(function () { finalStats[this.name] = $(this).val(); });
        const getVal = (t, k) => { const r = finalStats[k]; if (!r || r === "none") return null; return MONSTER_STATS[t]?.[level]?.[r]; };

        // 1. АТРИБУТЫ
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

        // 2. РОДОСЛОВНАЯ (Traits + Items)
        let ancestryTraits = [];
        let itemsToCreate = [];
        let sourceItemsToCreate = [];

        if (window.ConstructedCreatureAncestry) {
            const ancUuid = window.ConstructedCreatureAncestry.getSelectedUUID(html);
            if (ancUuid) {
                const ancData = await window.ConstructedCreatureAncestry.getParsedData(ancUuid);
                ancestryTraits = ancData.traits || [];
                if (ancData.items && ancData.items.length) {
                    itemsToCreate.push(...markItemsOrigin(ancData.items, "ancestry", {
                        family: selectedAncestryFamily,
                        uuid: ancUuid
                    }));
                }
            }
        }

        const mergedTraits = Array.isArray(ancestryTraits) ? [...ancestryTraits] : [];
        if (keepSourceTraits && Array.isArray(sourceTraitsValue)) {
            for (const trait of sourceTraitsValue) {
                if (!trait || mergedTraits.includes(trait)) continue;
                mergedTraits.push(trait);
            }
        }

        const actorData = {
            name: name, type: "npc",
            ...(keepSourceAvatar && sourceAvatar ? { img: sourceAvatar } : {}),
            ...(keepSourceAvatar && sourceTokenAvatar ? { prototypeToken: { texture: { src: sourceTokenAvatar } } } : {}),
            system: {
                details: {
                    level: { value: parseInt(level) },
                    publication: { title: "Constructed Creature", authors: "", license: "OGL", remaster: true },
                    ...(sourceDetailsLanguages ? { languages: sourceDetailsLanguages } : {})
                },
                abilities: { str: { mod: strMod }, dex: { mod: dexMod }, con: { mod: conMod }, int: { mod: intMod }, wis: { mod: wisMod }, cha: { mod: chaMod } },
                attributes: { hp: { value: hpMax, max: hpMax }, ac: { value: acVal }, speed: (keepSourceSpeedTypes && sourceSpeed) ? sourceSpeed : { value: 25 } },
                saves: { fortitude: { value: fortVal }, reflex: { value: refVal }, will: { value: willVal } },
                perception: { mod: perVal, senses: sourceSenses ?? [] },
                skills: {},
                traits: {
                    value: mergedTraits,
                    ...(sourceTraitsLanguages ? { languages: sourceTraitsLanguages } : {}),
                    ...(keepSourceTraits && sourceTraitsRarity ? { rarity: sourceTraitsRarity } : {})
                }
            }
        };

        const actor = await Actor.create(actorData);
        if (!actor) return;

        // Compatibility pass: ensure languages are copied regardless of PF2e data path version
        if (sourceActor) {
            const langUpdates = {};
            if (sourceDetailsLanguages !== null && sourceDetailsLanguages !== undefined) {
                langUpdates["system.details.languages"] = cloneData(sourceDetailsLanguages);
            }
            if (sourceTraitsLanguages !== null && sourceTraitsLanguages !== undefined) {
                langUpdates["system.traits.languages"] = cloneData(sourceTraitsLanguages);
            }
            if (Object.keys(langUpdates).length > 0) {
                await actor.update(langUpdates);
            }
        }

        // 3. НАВЫКИ
        const skillsUpdate = {};
        for (const k of Object.keys(SKILL_LIST)) {
            const rank = finalStats[k];
            if (rank && rank !== "none") {
                const val = MONSTER_STATS["skills"]?.[level]?.[rank];
                if (val !== undefined) skillsUpdate[`system.skills.${k}.base`] = Number(val);
            }
        }
        if (Object.keys(skillsUpdate).length > 0) await actor.update(skillsUpdate);

        // 4. LORE ПРЕДМЕТЫ
        html.find(".lore-stat").each((i, el) => {
            const rawLore = el.name.replace("lore_", "");
            const niceName = this.formatLoreLabel(rawLore);
            const rank = $(el).val();
            if (rank && rank !== "none") {
                const val = MONSTER_STATS["skills"]?.[level]?.[rank];
                if (val !== undefined) {
                    itemsToCreate.push({
                        name: niceName,
                        type: "lore",
                        img: "systems/pf2e/icons/default-icons/lore.svg",
                        system: { mod: { value: Number(val) }, proficient: { value: 0 } }
                    });
                }
            }
        });

        // 5. SOURCE ITEMS
        if (sourceActor && sourceModule?.prepareSourceItems) {
            sourceItemsToCreate = sourceModule.prepareSourceItems(sourceActor, Number(level), { includeEquipment: keepSourceEquipment });
        }



        // 5. STRIKES & SPELLS
        if (!sourceActor) {
            const sBonus = getVal("strikeBonus", "strikeBonus");
            const sDmg = getVal("strikeDamage", "strikeDamage");
            if (sBonus && sDmg) itemsToCreate.push({ name: "Удар", type: "melee", system: { bonus: { value: sBonus }, damageRolls: { "0": { damage: sDmg, damageType: "bludgeoning" } }, weaponType: { value: "melee" } } });

            const spellDC = getVal("spellcasting", "spellcasting");
            if (spellDC) itemsToCreate.push({ name: "Заклинания", type: "spellcastingEntry", system: { spelldc: { value: spellDC, dc: spellDC + 8 }, tradition: "arcane", prepared: { value: "innate" }, showUnpreparedSpells: { value: true } } });
        }

        // 6. ПОДКЛАССЫ
        if (window.ConstructedCreatureClass) {
            const clsName = html.find("#mm-class-select").val();
            const subKey = html.find("#mm-subclass-select").val();
            if (subKey && subKey !== 'none') {
                const subData = await window.ConstructedCreatureClass.getSubclassParsedData(clsName, subKey);
                if (subData.items && subData.items.length) {
                    const filteredSubclassItems = preferSourceEquipment
                        ? (sourceModule?.filterOutPhysicalItems?.(subData.items) ?? subData.items)
                        : subData.items;
                    if (filteredSubclassItems.length > 0) {
                        itemsToCreate.push(...markItemsOrigin(filteredSubclassItems, "subclass", {
                            classKey: clsName,
                            subclassKey: subKey
                        }));
                    }
                }
            }
        }

        // 7. СНАРЯЖЕНИЕ
        if (window.ConstructedCreatureEquipment) {
            const eqItems = await window.ConstructedCreatureEquipment.getFinalItems(html.find("#equipment-tab-content"), level, {
                includeRecommended: !preferSourceEquipment,
                includeManual: true
            });
            if (eqItems.length > 0) itemsToCreate.push(...eqItems);
        }

        // 8. ДОПОЛНИТЕЛЬНЫЕ КОРРЕКТИРОВКИ (Другое)
        if (window.ConstructedCreatureOther) {
            const otherItems = await window.ConstructedCreatureOther.getSelectedItems(html);
            if (otherItems.length > 0) itemsToCreate.push(...otherItems);
        }

        if (sourceItemsToCreate.length > 0 && replaceCategories.size > 0) {
            const sourceById = new Map();
            for (const itemData of sourceItemsToCreate) {
                const sourceId = getSourceImportId(itemData);
                if (sourceId) sourceById.set(sourceId, itemData);
            }

            const removedSourceIds = new Set();
            for (const itemData of sourceItemsToCreate) {
                const category = classifySourceCategory(itemData);
                if (!category || !replaceCategories.has(category)) continue;
                const sourceId = getSourceImportId(itemData);
                if (sourceId) removedSourceIds.add(sourceId);
            }

            let changed = true;
            while (changed) {
                changed = false;
                for (const [sourceId, itemData] of sourceById.entries()) {
                    if (removedSourceIds.has(sourceId)) continue;
                    const grantedById = getGrantedByIdFromData(itemData);
                    if (grantedById && removedSourceIds.has(grantedById)) {
                        removedSourceIds.add(sourceId);
                        changed = true;
                    }
                }
            }

            if (removedSourceIds.size > 0) {
                sourceItemsToCreate = sourceItemsToCreate.filter((itemData) => {
                    const sourceId = getSourceImportId(itemData);
                    return !sourceId || !removedSourceIds.has(sourceId);
                });
            }
        }

        if (itemsToCreate.length > 0) {
            await actor.createEmbeddedDocuments("Item", itemsToCreate);
        }

        // Source import is applied separately so it cannot block class/equipment import
        if (sourceItemsToCreate.length > 0) {
            let imported = 0;
            let failed = 0;

            const getSourceImportMeta = (itemData) => itemData?.flags?.["pf2e-ts-adv-v2"]?.sourceImport ?? null;
            const clearSourceImportMeta = (itemData) => {
                const allFlags = itemData?.flags;
                if (!allFlags || typeof allFlags !== "object") return;
                const moduleFlags = allFlags["pf2e-ts-adv-v2"];
                if (!moduleFlags || typeof moduleFlags !== "object") return;
                delete moduleFlags.sourceImport;
                if (Object.keys(moduleFlags).length === 0) delete allFlags["pf2e-ts-adv-v2"];
                if (Object.keys(allFlags).length === 0) delete itemData.flags;
            };

            const sourceEntryIdMap = new Map();
            const sourceSpellIdMap = new Map();
            const sourceEntrySlotsMap = new Map();
            const nonSpellItems = sourceItemsToCreate.filter((itemData) => itemData?.type !== "spell");
            const spellItems = sourceItemsToCreate.filter((itemData) => itemData?.type === "spell");

            for (const itemData of nonSpellItems) {
                try {
                    const importMeta = getSourceImportMeta(itemData);
                    if (itemData?.type === "spellcastingEntry") {
                        const sourceEntryId = importMeta?.sourceItemId;
                        const sourceSlots = itemData?.system?.slots;
                        if (typeof sourceEntryId === "string" && sourceEntryId.length > 0 && sourceSlots && typeof sourceSlots === "object") {
                            sourceEntrySlotsMap.set(sourceEntryId, foundry.utils.deepClone(sourceSlots));
                        }
                    }
                    clearSourceImportMeta(itemData);
                    const createdDocs = await actor.createEmbeddedDocuments("Item", [itemData]);
                    const created = createdDocs?.[0];

                    if (created?.type === "spellcastingEntry") {
                        const sourceEntryId = importMeta?.sourceItemId;
                        if (typeof sourceEntryId === "string" && sourceEntryId.length > 0) {
                            sourceEntryIdMap.set(sourceEntryId, created.id);
                        }
                    }
                    imported += 1;
                } catch (error) {
                    failed += 1;
                    console.error("Constructed Creature | Source item import failed", itemData?.name, error);
                }
            }

            for (const itemData of spellItems) {
                try {
                    const importMeta = getSourceImportMeta(itemData);
                    const sourceSpellId = importMeta?.sourceItemId;
                    const sourceEntryId = importMeta?.sourceSpellcastingEntryId;
                    const mappedEntryId = typeof sourceEntryId === "string" ? sourceEntryIdMap.get(sourceEntryId) : null;

                    if (mappedEntryId) {
                        itemData.system = itemData.system ?? {};
                        itemData.system.location = { ...(itemData.system.location ?? {}), value: mappedEntryId };
                    } else if (itemData?.system?.location) {
                        itemData.system.location = { ...(itemData.system.location ?? {}), value: null };
                    }

                    clearSourceImportMeta(itemData);
                    const createdDocs = await actor.createEmbeddedDocuments("Item", [itemData]);
                    const created = createdDocs?.[0];
                    if (created?.id && typeof sourceSpellId === "string" && sourceSpellId.length > 0) {
                        sourceSpellIdMap.set(sourceSpellId, created.id);
                    }
                    imported += 1;
                } catch (error) {
                    failed += 1;
                    console.error("Constructed Creature | Source spell import failed", itemData?.name, error);
                }
            }

            for (const [sourceEntryId, createdEntryId] of sourceEntryIdMap.entries()) {
                const sourceSlots = sourceEntrySlotsMap.get(sourceEntryId);
                if (!sourceSlots || typeof sourceSlots !== "object") continue;

                const entry = actor.items.get(createdEntryId);
                if (!entry) continue;

                const entryUpdate = {};
                let preparedSlotsTouched = 0;

                for (const [slotKey, slotData] of Object.entries(sourceSlots)) {
                    const prepared = slotData?.prepared;
                    if (!prepared || typeof prepared !== "object") continue;

                    const remappedPrepared = {};
                    for (const [preparedKey, preparedData] of Object.entries(prepared)) {
                        const oldSpellId = preparedData?.id;
                        if (typeof oldSpellId !== "string" || oldSpellId.length === 0) continue;
                        const newSpellId = sourceSpellIdMap.get(oldSpellId);
                        if (!newSpellId) continue;
                        remappedPrepared[preparedKey] = { ...(preparedData ?? {}), id: newSpellId };
                    }

                    entryUpdate[`system.slots.${slotKey}.prepared`] = remappedPrepared;
                    preparedSlotsTouched += 1;
                }

                if (preparedSlotsTouched > 0) {
                    await entry.update(entryUpdate);
                }
            }

            if (failed > 0) {
                ui.notifications.warn(`Источник: импортировано ${imported}, с ошибками ${failed}.`);
            }
        }

        if (sourceActor && sourceModule?.showReport) sourceModule.showReport();

        const normalizedStrikeBonus = getVal("strikeBonus", "strikeBonus")
            ?? MONSTER_STATS["strikeBonus"]?.[level]?.moderate
            ?? null;
        const normalizedSpellAttack = getVal("spellcasting", "spellcasting")
            ?? MONSTER_STATS["spellcasting"]?.[level]?.moderate
            ?? null;
        await this._normalizeDefaultFistAttack(actor, normalizedStrikeBonus);
        await this._normalizeSpellcastingEntries(actor, normalizedSpellAttack);

        this.close();
        actor.sheet.render(true);
        ui.notifications.info(`Существо "${name}" успешно создано!`);
    }
}

// ==================================================================
// 6. HOOK
// ==================================================================
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


