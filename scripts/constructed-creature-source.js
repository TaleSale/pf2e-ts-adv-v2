// constructed-creature-source.js

window.ConstructedCreatureSource = {
    sourceActor: null,
    analyzedData: {},
    conversionLog: [],
    EQUIPMENT_TYPES: ["equipment", "weapon", "armor", "shield", "consumable", "treasure", "backpack", "book", "kit"],

    DC_FALLBACK: {
        "-1": { low: 11, moderate: 13, high: 16, extreme: 19 },
        "0": { low: 11, moderate: 13, high: 16, extreme: 19 },
        "1": { low: 12, moderate: 14, high: 17, extreme: 20 },
        "2": { low: 13, moderate: 15, high: 18, extreme: 22 },
        "3": { low: 15, moderate: 17, high: 20, extreme: 23 },
        "4": { low: 16, moderate: 18, high: 21, extreme: 25 },
        "5": { low: 17, moderate: 19, high: 22, extreme: 26 },
        "6": { low: 19, moderate: 21, high: 24, extreme: 27 },
        "7": { low: 20, moderate: 22, high: 25, extreme: 29 },
        "8": { low: 21, moderate: 23, high: 26, extreme: 30 },
        "9": { low: 23, moderate: 25, high: 28, extreme: 32 },
        "10": { low: 24, moderate: 26, high: 29, extreme: 33 },
        "11": { low: 25, moderate: 27, high: 30, extreme: 34 },
        "12": { low: 27, moderate: 29, high: 32, extreme: 36 },
        "13": { low: 28, moderate: 30, high: 33, extreme: 37 },
        "14": { low: 29, moderate: 31, high: 34, extreme: 39 },
        "15": { low: 31, moderate: 33, high: 36, extreme: 40 },
        "16": { low: 32, moderate: 34, high: 37, extreme: 41 },
        "17": { low: 33, moderate: 35, high: 38, extreme: 43 },
        "18": { low: 35, moderate: 37, high: 40, extreme: 44 },
        "19": { low: 36, moderate: 38, high: 41, extreme: 46 },
        "20": { low: 37, moderate: 39, high: 42, extreme: 47 },
        "21": { low: 39, moderate: 41, high: 44, extreme: 48 },
        "22": { low: 40, moderate: 42, high: 45, extreme: 50 },
        "23": { low: 41, moderate: 43, high: 46, extreme: 51 },
        "24": { low: 43, moderate: 45, high: 48, extreme: 52 }
    },

    getTabHTML: function() {
        return `
        <div class="monster-maker-container" style="height: 100%; display: flex; flex-direction: column;">
            <div class="header-row">
                <h3>Источник существа</h3>
                <p class="flavor-text">Перетащите NPC сюда. Статы и способности будут конвертированы в V-токены и масштабированы helper-скриптами монстров.</p>
                <label style="display:flex; align-items:center; gap:6px; margin-top:6px;">
                    <input type="checkbox" id="mm-source-keep-equipment" checked />
                    Сохранить снаряжение
                </label>
                <label style="display:flex; align-items:center; gap:6px; margin-top:4px;">
                    <input type="checkbox" id="mm-source-keep-traits" checked />
                    Сохранить трейты
                </label>
                <label style="display:flex; align-items:center; gap:6px; margin-top:4px;">
                    <input type="checkbox" id="mm-source-keep-speed-types" checked />
                    Сохранить виды скорости
                </label>
                <label style="display:flex; align-items:center; gap:6px; margin-top:4px;">
                    <input type="checkbox" id="mm-source-keep-avatar" checked />
                    Сохранить аватарку и токен
                </label>
                <label style="display:flex; align-items:center; gap:6px; margin-top:4px;">
                    <input type="checkbox" id="mm-source-priority-description" checked />
                    Приоритет статов из описания (заметки)
                </label>
            </div>

            <div id="mm-source-drop-zone" style="
                flex: 1;
                border: 3px dashed #ccc;
                border-radius: 10px;
                display: flex;
                align-items: center;
                justify-content: center;
                flex-direction: column;
                margin: 10px 0;
                background: rgba(0,0,0,0.02);
                transition: all 0.2s;
                min-height: 150px;
            ">
                <i class="fas fa-dragon" style="font-size: 3em; color: #ccc; margin-bottom: 10px;"></i>
                <span id="mm-source-label" style="color: #666; font-weight: bold;">Перетащите NPC сюда</span>
                <div id="mm-source-info" style="margin-top: 10px; text-align: center; display: none;">
                    <img id="mm-source-img" src="" style="width: 64px; height: 64px; border: 1px solid #000; display: block; margin: 0 auto 5px;" />
                    <strong id="mm-source-name" style="display:block; font-size: 1.1em;"></strong>
                    <span id="mm-source-level" style="font-size: 0.9em; color: #444;"></span>
                </div>
            </div>

            <div id="mm-source-analysis" style="
                border: 1px solid var(--color-border-light-2);
                padding: 10px;
                border-radius: 5px;
                background: rgba(255,255,255,0.5);
                display: none;
                font-size: 0.85em;
                max-height: 200px;
                overflow-y: auto;
            ">
                <strong>Анализ параметров:</strong>
                <ul id="mm-analysis-list" style="columns: 2; list-style: none; padding: 0; margin-top: 5px;"></ul>
            </div>
        </div>
        `;
    },

    handleDrop: async function(data) {
        if (!data || data.type !== "Actor") return null;
        const actor = await fromUuid(data.uuid);
        if (!actor || actor.type !== "npc") {
            ui.notifications.warn("Используйте NPC как источник.");
            return null;
        }
        this.sourceActor = actor;
        return actor;
    },

    isPhysicalItemType: function(type) {
        return this.EQUIPMENT_TYPES.includes(type);
    },

    hasPhysicalEquipment: function(actor) {
        if (!actor?.items) return false;
        return actor.items.some((item) => item?.isOfType?.("physical") || this.isPhysicalItemType(item?.type));
    },

    shouldPreferSourceEquipment: function(actor, keepEquipment) {
        return !!(actor && keepEquipment !== false && this.hasPhysicalEquipment(actor));
    },

    filterOutPhysicalItems: function(items) {
        if (!Array.isArray(items)) return [];
        return items.filter((item) => !this.isPhysicalItemType(item?.type));
    },

    getSourceEquipmentNoticeHTML: function() {
        return `
            <div class='monster-maker-container'>
                <p style='padding:10px;'>
                    Используется снаряжение из источника. Классовое снаряжение не будет применено.
                </p>
            </div>
        `;
    },

    localizeMaybe: function(value) {
        if (typeof value !== "string" || !value.length) return value;
        const i18n = game?.i18n;
        if (i18n?.has?.(value)) return i18n.localize(value);
        return value;
    },

    getStatLabel: function(key) {
        const fallbackMap = {
            str: "Сила",
            dex: "Ловкость",
            con: "Телосложение",
            int: "Интеллект",
            wis: "Мудрость",
            cha: "Харизма",
            ac: "КБ",
            hp: "ОЗ",
            fort: "Стойкость",
            ref: "Рефлекс",
            wil: "Воля",
            perception: "Восприятие",
            strikeBonus: "Атака",
            strikeDamage: "Урон",
            spellcasting: "Закл. DC"
        };

        const ability = CONFIG?.PF2E?.abilities?.[key];
        if (ability) return this.localizeMaybe(ability);

        const skill = CONFIG?.PF2E?.skills?.[key];
        if (skill) {
            if (typeof skill === "string") return this.localizeMaybe(skill);
            if (typeof skill.label === "string") return this.localizeMaybe(skill.label);
        }

        const saveSlug = key === "fort" ? "fortitude" : key === "ref" ? "reflex" : key === "wil" ? "will" : key;
        const save = CONFIG?.PF2E?.saves?.[saveSlug];
        if (save) return this.localizeMaybe(save);

        const directKeys = {
            perception: "PF2E.PerceptionLabel",
            ac: "PF2E.ArmorClassShortLabel",
            hp: "PF2E.HitPointsHeader",
            spellcasting: "PF2E.SpellDCLabel",
            strikeDamage: "PF2E.DamageLabel"
        };
        if (directKeys[key]) return this.localizeMaybe(directKeys[key]);

        return fallbackMap[key] || key;
    },

    calculateAverageDamage: function(formula) {
        if (!formula || typeof formula !== "string") return 0;

        try {
            let work = formula;
            work = work.replace(/\[[^\]]*\]/g, "");
            work = work.replace(/\{[^}]*\}/g, "");
            work = work.replace(/\s+/g, "");

            let avg = 0;
            const parts = work.split(/([+-])/);
            let sign = 1;

            for (const part of parts) {
                if (!part) continue;
                if (part === "+") {
                    sign = 1;
                    continue;
                }
                if (part === "-") {
                    sign = -1;
                    continue;
                }

                const diceMatch = /^(\d+)d(\d+)$/i.exec(part);
                if (diceMatch) {
                    const count = Number(diceMatch[1]);
                    const size = Number(diceMatch[2]);
                    avg += sign * (count * (size + 1) / 2);
                    continue;
                }

                const num = Number(part);
                if (Number.isFinite(num)) {
                    avg += sign * num;
                }
            }

            return avg;
        } catch (e) {
            console.warn("Source conversion | damage parse failed", formula, e);
            return 0;
        }
    },

    findRank: function(table, level, val, isDamage = false) {
        if (val === undefined || val === null) return "moderate";
        const row = window.CC_MONSTER_STATS?.[table]?.[String(level)];
        if (!row) return "moderate";

        const thresholds = {};
        if (isDamage) {
            for (const [rank, formula] of Object.entries(row)) {
                thresholds[rank] = this.calculateAverageDamage(formula);
            }
        } else {
            for (const [rank, numberValue] of Object.entries(row)) {
                thresholds[rank] = Number(numberValue);
            }
        }

        if (val >= thresholds.extreme) return "extreme";
        if (val >= thresholds.high) return "high";
        if (val >= thresholds.moderate) return "moderate";
        if (val >= thresholds.low) return "low";
        return "terrible";
    },

    rankToVariant: function(rank) {
        if (rank === "extreme") return "V3";
        if (rank === "high") return "V2";
        if (rank === "moderate") return "V1";
        return "V0";
    },

    getDcByTier: function(level, tier) {
        if (typeof globalThis.MonsterDC === "function") {
            const value = globalThis.MonsterDC(level, tier);
            if (Number.isFinite(Number(value))) return Number(value);
        }
        return Number(this.DC_FALLBACK?.[String(level)]?.[tier] ?? NaN);
    },

    findDcVariant: function(level, dc) {
        const numericDc = Number(dc);
        if (!Number.isFinite(numericDc)) return "V1";

        const low = this.getDcByTier(level, "low");
        const moderate = this.getDcByTier(level, "moderate");
        const high = this.getDcByTier(level, "high");
        const extreme = this.getDcByTier(level, "extreme");

        if (!Number.isFinite(low) || !Number.isFinite(moderate) || !Number.isFinite(high) || !Number.isFinite(extreme)) {
            return "V1";
        }

        const points = [
            { variant: "V0", value: low },
            { variant: "V1", value: moderate },
            { variant: "V2", value: high },
            { variant: "V3", value: extreme }
        ];

        let best = points[0];
        let bestDistance = Math.abs(numericDc - best.value);

        for (let i = 1; i < points.length; i += 1) {
            const candidate = points[i];
            const distance = Math.abs(numericDc - candidate.value);
            if (distance < bestDistance || (distance === bestDistance && candidate.value > best.value)) {
                best = candidate;
                bestDistance = distance;
            }
        }

        return best.variant;
    },

    getDcTierByVariant: function(variant) {
        const normalized = String(variant ?? "").trim().toUpperCase();
        if (normalized === "V0") return "low";
        if (normalized === "V2") return "high";
        if (normalized === "V3") return "extreme";
        return "moderate";
    },

    resolveAttackTokenForLevel: function(level, token) {
        const actor = this.buildSyntheticNpcActor(level);
        const tokenText = String(token ?? "").trim().toUpperCase();
        if (!tokenText) return NaN;

        if (actor && typeof globalThis.MonsterAttackReplace === "function") {
            const replaced = Number(globalThis.MonsterAttackReplace(tokenText, actor));
            if (Number.isFinite(replaced)) return replaced;
        }

        const match = /^V([0-3])([+-]\d+)?$/i.exec(tokenText);
        if (!match) return NaN;

        const tier = Number(match[1]);
        const delta = match[2] ? Number(match[2]) : 0;
        const row = window.CC_MONSTER_STATS?.strikeBonus?.[String(level)];
        if (!row) return NaN;

        const base = tier === 0
            ? Number(row.low)
            : tier === 1
                ? Number(row.moderate)
                : tier === 2
                    ? Number(row.high)
                    : Number(row.extreme);
        if (!Number.isFinite(base)) return NaN;
        return base + delta;
    },

    buildAttackTokenFromValue: function(level, attackValue) {
        const numericAttack = Number(attackValue);
        if (!Number.isFinite(numericAttack)) return null;

        const points = [];
        for (const variant of ["V0", "V1", "V2", "V3"]) {
            const value = this.resolveAttackTokenForLevel(level, variant);
            if (Number.isFinite(value)) points.push({ variant, value });
        }
        if (!points.length) return null;

        let best = points[0];
        let bestDistance = Math.abs(numericAttack - best.value);
        for (let i = 1; i < points.length; i += 1) {
            const candidate = points[i];
            const distance = Math.abs(numericAttack - candidate.value);
            if (distance < bestDistance || (distance === bestDistance && candidate.value > best.value)) {
                best = candidate;
                bestDistance = distance;
            }
        }

        const delta = Math.trunc(numericAttack - best.value);
        const token = `${best.variant}${delta === 0 ? "" : delta > 0 ? `+${delta}` : `${delta}`}`;
        return { token, variant: best.variant, base: best.value, delta };
    },

    convertSpellcastingEntryDcToTargetLevel: function(itemData, sourceLevel, targetLevel) {
        if (itemData?.type !== "spellcastingEntry") return null;

        const rawDc = Number(itemData?.system?.spelldc?.dc);
        const rawAttack = Number(itemData?.system?.spelldc?.value);
        const sourceDc = Number.isFinite(rawDc) ? rawDc : (Number.isFinite(rawAttack) ? rawAttack + 10 : NaN);
        const resultParts = [];

        let attack = NaN;
        if (Number.isFinite(rawAttack)) {
            const tokenInfo = this.buildAttackTokenFromValue(sourceLevel, rawAttack);
            const targetAttack = tokenInfo ? this.resolveAttackTokenForLevel(targetLevel, tokenInfo.token) : NaN;
            if (Number.isFinite(targetAttack)) {
                attack = Math.trunc(targetAttack);
                resultParts.push(`atk ${Math.trunc(rawAttack)} (${tokenInfo.token}) -> ${attack} (ур. ${targetLevel})`);
            }
        }

        let dc = NaN;
        if (Number.isFinite(sourceDc)) {
            const variant = this.findDcVariant(sourceLevel, sourceDc);
            const tier = this.getDcTierByVariant(variant);
            let targetDc = this.getDcByTier(targetLevel, tier);
            if (!Number.isFinite(targetDc)) targetDc = this.getDcByTier(targetLevel, "moderate");
            if (Number.isFinite(targetDc)) {
                dc = Math.trunc(targetDc);
                resultParts.push(`dc ${Math.trunc(sourceDc)} (${variant}) -> ${dc} (ур. ${targetLevel})`);
            }
        }

        if (!Number.isFinite(attack) && Number.isFinite(dc)) attack = dc - 10;
        if (!Number.isFinite(dc) && Number.isFinite(attack)) dc = attack + 10;
        if (!Number.isFinite(attack) && !Number.isFinite(dc)) return null;

        itemData.system = itemData.system ?? {};
        itemData.system.spelldc = {
            ...(itemData.system.spelldc ?? {}),
            ...(Number.isFinite(dc) ? { dc } : {}),
            ...(Number.isFinite(attack) ? { value: attack } : {})
        };

        return resultParts.join(", ");
    },

    isSaveType: function(slug) {
        if (!slug) return false;
        const normalized = String(slug).trim().toLowerCase();
        return normalized === "will" || normalized === "fortitude" || normalized === "reflex" ||
            normalized === "wil" || normalized === "fort" || normalized === "ref";
    },

    parseDcNumber: function(rawValue) {
        if (rawValue === undefined || rawValue === null) return null;
        const match = String(rawValue).match(/-?\d+/);
        if (!match) return null;
        const parsed = Number(match[0]);
        return Number.isFinite(parsed) ? parsed : null;
    },

    getCheckSaveTarget: function(parts) {
        for (let i = 0; i < parts.length; i += 1) {
            const part = parts[i];
            const colonIndex = part.indexOf(":");
            if (colonIndex === -1) continue;
            const key = part.slice(0, colonIndex).trim().toLowerCase();
            const value = part.slice(colonIndex + 1).trim();
            if ((key === "type" || key === "against" || key === "save" || key === "defense") && this.isSaveType(value)) {
                return { target: value, anchorIndex: i };
            }
        }

        for (let i = 0; i < parts.length; i += 1) {
            const part = parts[i].trim();
            if (!part || part.includes(":")) continue;
            if (/^V[0-3](?:[+-]\d+)?$/i.test(part)) continue;
            if (this.isSaveType(part)) {
                return { target: part, anchorIndex: i };
            }
        }

        return { target: null, anchorIndex: -1 };
    },

    convertCheckTagsToVariants: function(text, sourceLevel) {
        if (!text) return { text: "", changed: false };

        let changed = false;
        const updated = text.replace(/@Check\[([^\]]+)\]/gi, (_full, rawInner) => {
            const parts = String(rawInner).split("|").map((part) => part.trim()).filter(Boolean);
            if (!parts.length) return _full;

            let dcValue = null;
            const { target, anchorIndex } = this.getCheckSaveTarget(parts);
            if (!target) return _full;

            for (let i = 0; i < parts.length; i += 1) {
                const part = parts[i];
                const colonIndex = part.indexOf(":");
                if (colonIndex === -1) continue;
                const key = part.slice(0, colonIndex).trim().toLowerCase();
                const value = part.slice(colonIndex + 1).trim();
                if (key === "dc") {
                    const parsed = this.parseDcNumber(value);
                    if (parsed !== null) dcValue = parsed;
                }
            }

            if (!Number.isFinite(dcValue)) return _full;

            const variant = this.findDcVariant(sourceLevel, dcValue);
            const cleanParts = parts.filter((part) => !/^V[0-3](?:[+-]\d+)?$/i.test(part));

            let hasDc = false;
            for (let i = 0; i < cleanParts.length; i += 1) {
                if (/^dc\s*:/i.test(cleanParts[i])) {
                    cleanParts[i] = "dc:0";
                    hasDc = true;
                    break;
                }
            }
            if (!hasDc) cleanParts.push("dc:0");

            const filteredAnchorIndex = anchorIndex >= 0
                ? parts
                    .slice(0, anchorIndex + 1)
                    .filter((part) => !/^V[0-3](?:[+-]\d+)?$/i.test(part))
                    .length - 1
                : -1;

            const insertAfter = filteredAnchorIndex >= 0 ? Math.min(filteredAnchorIndex + 1, cleanParts.length) : 0;
            cleanParts.splice(insertAfter, 0, variant);

            const rebuilt = `@Check[${cleanParts.join("|")}]`;
            if (rebuilt !== _full) changed = true;
            return rebuilt;
        });

        return { text: updated, changed };
    },

    isLimitedAreaDamage: function(itemData, desc) {
        const fromFrequency = Number(itemData?.system?.frequency?.max ?? 0) > 0;
        const text = String(desc ?? "");
        const fromText = /перезаряд|recharge|частот|frequency|cooldown|per round|per minute|rounds?|minutes?/i.test(text);
        return fromFrequency || fromText;
    },

    replaceFirstDamageExpression: function(formula, token) {
        const src = String(formula ?? "");
        const replaced = src.replace(/(\b\d+d\d+(?:[+-]\d+)?\b|\b\d+\b)/i, token);
        if (replaced !== src) return replaced;
        return src;
    },

    normalizeDamageTokenParens: function(formula) {
        return String(formula ?? "").replace(
            /\b(V[0-3](?:\((?:d)?\d+\))?(?:[+-]\d+)?|VAL|VAU)\b(?=\[[^\]]+\])/gi,
            "($1)"
        );
    },

    tokenizeDamageFormula: function(formula, sourceLevel, options = {}) {
        const hasTemplate = !!options.hasTemplate;
        const isLimited = !!options.isLimited;
        const forceStrike = !!options.forceStrike;

        let token = "V1";
        if (!forceStrike && hasTemplate) {
            token = isLimited ? "VAL" : "VAU";
        } else {
            const avg = this.calculateAverageDamage(formula);
            const rank = this.findRank("strikeDamage", sourceLevel, avg, true);
            token = this.rankToVariant(rank);
        }

        return this.replaceFirstDamageExpression(formula, token);
    },

    convertDescriptionDamage: function(desc, sourceLevel, itemData, options = {}) {
        const hasTemplate = !!options.hasTemplate;
        const isLimited = !!options.isLimited;
        let replacedCount = 0;

        const updated = String(desc ?? "").replace(/@Damage\[((?:[^\[\]]+|\[[^\]]*\])*)\]/gi, (_full, inside) => {
            const tokenized = this.tokenizeDamageFormula(inside, sourceLevel, { hasTemplate, isLimited, forceStrike: false });
            const normalized = this.normalizeDamageTokenParens(tokenized);
            if (normalized !== inside) replacedCount += 1;
            return `@Damage[${normalized}]`;
        });

        return { text: updated, count: replacedCount };
    },

    convertMeleeBonusToVariant: function(itemData, sourceLevel, targetLevel) {
        const bonusRaw = itemData?.system?.bonus?.value ?? itemData?.system?.toHit?.value;
        const bonus = Number(bonusRaw);
        if (!Number.isFinite(bonus)) return null;

        const rank = this.findRank("strikeBonus", sourceLevel, bonus, false);
        const row = window.CC_MONSTER_STATS?.strikeBonus?.[String(targetLevel)];
        const sourceRow = window.CC_MONSTER_STATS?.strikeBonus?.[String(sourceLevel)];
        if (!row) return null;

        let scaledValue = Number(row[rank]);
        if (!Number.isFinite(scaledValue) && (rank === "terrible" || rank === "abysmal" || rank === "none")) {
            const srcLow = Number(sourceRow?.low);
            const tgtLow = Number(row.low);
            if (Number.isFinite(srcLow) && Number.isFinite(tgtLow)) {
                // Preserve how far below low the source attack is (e.g. 6 at level 3 stays 6 at level 3).
                scaledValue = tgtLow + (bonus - srcLow);
            }
        }
        if (!Number.isFinite(scaledValue)) {
            scaledValue = Number(row.low ?? row.moderate ?? row.high);
        }
        if (!Number.isFinite(scaledValue)) return null;

        if (itemData?.system?.bonus) itemData.system.bonus.value = Math.trunc(scaledValue);
        if (itemData?.system?.toHit) itemData.system.toHit.value = Math.trunc(scaledValue);
        return `${bonus} (${rank}) -> ${Math.trunc(scaledValue)} (ур. ${targetLevel})`;
    },

    convertDamageRollsToTokens: function(itemData, sourceLevel, options = {}) {
        const rolls = itemData?.system?.damageRolls;
        if (!rolls) return 0;

        const hasTemplate = !!options.hasTemplate;
        const isLimited = !!options.isLimited;
        const forceStrike = !!options.forceStrike;
        let changed = 0;

        for (const key of Object.keys(rolls)) {
            const rollEntry = rolls[key];
            if (!rollEntry) continue;
            const original = rollEntry.damage ?? rollEntry.formula;
            if (typeof original !== "string") continue;

            const tokenized = this.tokenizeDamageFormula(original, sourceLevel, { hasTemplate, isLimited, forceStrike });
            if (tokenized === original) continue;

            if (rollEntry.damage !== undefined) rollEntry.damage = tokenized;
            if (rollEntry.formula !== undefined) rollEntry.formula = tokenized;
            changed += 1;
        }

        return changed;
    },

    buildSyntheticNpcActor: function(level) {
        const numericLevel = Number(level);
        if (!Number.isFinite(numericLevel)) return null;
        return {
            type: "npc",
            system: { details: { level: { value: numericLevel } } },
            isOfType: (...types) => types.includes("npc")
        };
    },

    resolveAttackTokensToTargetLevel: function(itemData, targetLevel, syntheticActor = null) {
        const replaceAttack = globalThis.MonsterAttackReplace;
        if (typeof replaceAttack !== "function") return 0;

        const actor = syntheticActor || this.buildSyntheticNpcActor(targetLevel);
        if (!actor) return 0;

        let changed = 0;
        const fields = [
            ["bonus", "value"],
            ["toHit", "value"]
        ];

        for (const [containerKey, valueKey] of fields) {
            const value = itemData?.system?.[containerKey]?.[valueKey];
            if (typeof value !== "string") continue;
            if (!/^V[0-3](?:[+-]\d+)?$/i.test(value.trim())) continue;

            const replaced = replaceAttack(value, actor);
            const numeric = Number(replaced);
            if (!Number.isFinite(numeric)) continue;

            itemData.system[containerKey][valueKey] = numeric;
            changed += 1;
        }

        return changed;
    },

    resolveDamageRollTokensToTargetLevel: function(itemData, targetLevel, syntheticActor = null) {
        const replaceDamage = globalThis.MonsterDamageReplace;
        if (typeof replaceDamage !== "function") return 0;

        const actor = syntheticActor || this.buildSyntheticNpcActor(targetLevel);
        if (!actor) return 0;

        const rolls = itemData?.system?.damageRolls;
        if (!rolls) return 0;

        let changed = 0;
        for (const key of Object.keys(rolls)) {
            const rollEntry = rolls[key];
            if (!rollEntry) continue;

            const original = rollEntry.damage ?? rollEntry.formula;
            if (typeof original !== "string") continue;
            if (!/(V[0-3]|VAL|VAU)/i.test(original)) continue;

            const replaced = replaceDamage(original, actor);
            if (typeof replaced !== "string" || replaced === original) continue;

            if (rollEntry.damage !== undefined) rollEntry.damage = replaced;
            if (rollEntry.formula !== undefined) rollEntry.formula = replaced;
            changed += 1;
        }

        return changed;
    },

    applyLevelRunes: function(itemData, targetLevel) {
        if (!itemData || !itemData.system) return false;
        const equipmentApi = window.ConstructedCreatureEquipment;
        if (!equipmentApi?.getRuneStats) return false;

        const level = Number(targetLevel);
        if (!Number.isFinite(level)) return false;

        if (itemData.type === "weapon") {
            const runes = equipmentApi.getRuneStats(level, "weapon");
            itemData.system.runes = {
                potency: runes.potency,
                striking: runes.striking,
                property: itemData.system.runes?.property || []
            };
            return true;
        }

        if (itemData.type === "armor") {
            const runes = equipmentApi.getRuneStats(level, "armor");
            itemData.system.runes = {
                potency: runes.potency,
                resilient: runes.resilient,
                property: itemData.system.runes?.property || []
            };
            return true;
        }

        return false;
    },

    getSourceDescriptionText: function(actor) {
        const details = actor?.system?.details ?? {};
        const unique = new Set();
        const out = [];

        const addText = (value) => {
            if (typeof value !== "string") return;
            const text = value.trim();
            if (!text || unique.has(text)) return;
            unique.add(text);
            out.push(text);
        };

        const readCandidate = (value) => {
            if (typeof value === "string") {
                addText(value);
                return;
            }
            if (!value || typeof value !== "object") return;
            if (Array.isArray(value)) {
                for (const entry of value) readCandidate(entry);
                return;
            }
            addText(value.value);
            addText(value.public);
            addText(value.gm);
        };

        const candidates = [
            details.description,
            details.description?.value,
            details.blurb,
            details.blurb?.value,
            details.publicNotes,
            details.privateNotes,
            details.notes,
            details.notes?.value,
            details.notes?.public,
            details.notes?.gm,
            details.notes?.description,
            details.biography,
            details.biography?.value
        ];

        for (const candidate of candidates) readCandidate(candidate);
        return out.join("\n");
    },

    getDescriptionStats: function(actor) {
        const parser = window.ConstructedCreatureParser;
        if (!parser?.parseDescription) return {};
        const description = this.getSourceDescriptionText(actor);
        if (!description) return {};
        const parsed = parser.parseDescription(description);
        return parsed?.stats && typeof parsed.stats === "object" ? parsed.stats : {};
    },

    mergeAnalyzedStats: function(originalStats, descriptionStats, preferDescription = true) {
        const merged = { ...(originalStats || {}) };
        const parsed = descriptionStats && typeof descriptionStats === "object" ? descriptionStats : {};

        if (preferDescription) {
            for (const [key, rank] of Object.entries(parsed)) {
                if (typeof rank === "string" && rank.length > 0) merged[key] = rank;
            }
            return merged;
        }

        for (const [key, rank] of Object.entries(parsed)) {
            if (merged[key] === undefined || merged[key] === null || merged[key] === "") {
                merged[key] = rank;
            }
        }
        return merged;
    },

    analyzeCreature: function(actor, options = {}) {
        if (!window.CC_MONSTER_STATS) return null;
        const preferDescription = options.preferDescription !== false;
        const level = actor.system.details.level.value;
        const originalStats = {};

        for (const abi of ["str", "dex", "con", "int", "wis", "cha"]) {
            originalStats[abi] = this.findRank("abilityScores", level, actor.system.abilities[abi].mod);
        }
        originalStats.ac = this.findRank("armorClass", level, actor.system.attributes.ac.value);
        originalStats.hp = this.findRank("hitPoints", level, actor.system.attributes.hp.max);
        originalStats.fort = this.findRank("perceptionSaves", level, actor.system.saves.fortitude.value);
        originalStats.ref = this.findRank("perceptionSaves", level, actor.system.saves.reflex.value);
        originalStats.wil = this.findRank("perceptionSaves", level, actor.system.saves.will.value);
        originalStats.perception = this.findRank("perceptionSaves", level, actor.system.perception.mod);

        const skillKeys = Object.keys(window.ConstructedCreatureSkillList || actor.system?.skills || {});
        for (const skillKey of skillKeys) {
            const actorSkill = actor.system.skills[skillKey];
            if (actorSkill && actorSkill.base > 0) {
                originalStats[skillKey] = this.findRank("skills", level, actorSkill.base);
            } else {
                originalStats[skillKey] = "none";
            }
        }

        let maxAttack = 0;
        actor.itemTypes.melee.forEach((item) => {
            const value = Number(item?.system?.bonus?.value ?? 0);
            if (value > maxAttack) maxAttack = value;
        });
        originalStats.strikeBonus = maxAttack > 0 ? this.findRank("strikeBonus", level, maxAttack) : "moderate";
        originalStats.strikeDamage = originalStats.strikeBonus;

        let maxDC = 0;
        actor.itemTypes.spellcastingEntry.forEach((item) => {
            const value = Number(item?.system?.spelldc?.dc ?? 0);
            if (value > maxDC) maxDC = value;
        });
        originalStats.spellcasting = maxDC > 0 ? this.findRank("spellcasting", level, maxDC) : "none";

        const descriptionStats = this.getDescriptionStats(actor);
        const result = this.mergeAnalyzedStats(originalStats, descriptionStats, preferDescription);

        this.analyzedData = result;
        return result;
    },

    processDescription: function(text, sourceLevel) {
        return this.convertCheckTagsToVariants(text, sourceLevel);
    },

    prepareSourceItems: function(actor, targetLevel, options = {}) {
        this.conversionLog = [];
        const items = [];
        const sourceLevel = Number(actor?.system?.details?.level?.value ?? 0);
        const syntheticTargetActor = this.buildSyntheticNpcActor(targetLevel);
        const includeEquipment = options.includeEquipment !== false;
        this.conversionLog.push(`<li><strong>Источник:</strong> перенос снаряжения ${includeEquipment ? "включен" : "выключен"}</li>`);
        const baseTypes = ["action", "feat", "spellcastingEntry", "effect", "passive", "melee", "spell", "lore"];

        for (const item of actor.items) {
            const keepBase = baseTypes.includes(item.type);
            const isPhysical = item.isOfType?.("physical") || this.isPhysicalItemType(item.type);
            if (!keepBase && !(includeEquipment && isPhysical)) continue;

            const itemData = item.toObject();
            itemData.flags = itemData.flags && typeof itemData.flags === "object" ? itemData.flags : {};
            const moduleFlags = itemData.flags["pf2e-ts-adv-v2"] && typeof itemData.flags["pf2e-ts-adv-v2"] === "object"
                ? itemData.flags["pf2e-ts-adv-v2"]
                : {};
            moduleFlags.sourceImport = {
                ...(moduleFlags.sourceImport && typeof moduleFlags.sourceImport === "object" ? moduleFlags.sourceImport : {}),
                sourceItemId: item.id
            };
            if (itemData.type === "spell") {
                const sourceEntryId = itemData?.system?.location?.value;
                if (typeof sourceEntryId === "string" && sourceEntryId.length > 0) {
                    moduleFlags.sourceImport.sourceSpellcastingEntryId = sourceEntryId;
                }
            }
            itemData.flags["pf2e-ts-adv-v2"] = moduleFlags;
            let desc = itemData.system?.description?.value || "";
            const changes = [];

            if (itemData.type === "spellcastingEntry") {
                const spellDcChange = this.convertSpellcastingEntryDcToTargetLevel(itemData, sourceLevel, targetLevel);
                if (spellDcChange) changes.push(`Spell DC: ${spellDcChange}`);
            }

            const checkResult = this.processDescription(desc, sourceLevel);
            if (checkResult.changed) {
                desc = checkResult.text;
                changes.push("Checks -> V-token");
            }

            const hasTemplate = /@Template\[/i.test(desc);
            const isLimited = this.isLimitedAreaDamage(itemData, desc);

            const damageResult = this.convertDescriptionDamage(desc, sourceLevel, itemData, { hasTemplate, isLimited });
            if (damageResult.count > 0) {
                desc = damageResult.text;
                if (hasTemplate) {
                    changes.push(`Damage -> ${isLimited ? "VAL" : "VAU"}`);
                } else {
                    changes.push("Damage -> V-token");
                }
            }

            if (itemData.type === "melee") {
                const attackChange = this.convertMeleeBonusToVariant(itemData, sourceLevel, targetLevel);
                if (attackChange) changes.push(`Attack: ${attackChange}`);
            }

            const forceStrike = itemData.type === "melee" || itemData.type === "weapon";
            const damageRollsChanged = this.convertDamageRollsToTokens(itemData, sourceLevel, {
                hasTemplate,
                isLimited,
                forceStrike
            });
            if (damageRollsChanged > 0) {
                if (forceStrike) changes.push("Strike damage rolls -> V-token");
                else if (hasTemplate) changes.push(`Damage rolls -> ${isLimited ? "VAL" : "VAU"}`);
                else changes.push("Damage rolls -> V-token");
            }

            const resolvedAttackCount = this.resolveAttackTokensToTargetLevel(itemData, targetLevel, syntheticTargetActor);
            if (resolvedAttackCount > 0) {
                changes.push("Attack V-token -> value");
            }

            const resolvedDamageCount = this.resolveDamageRollTokensToTargetLevel(itemData, targetLevel, syntheticTargetActor);
            if (resolvedDamageCount > 0) {
                changes.push("Damage rolls V-token -> value");
            }

            if (itemData.system?.description) {
                itemData.system.description.value = desc;
            }

            if (includeEquipment && this.applyLevelRunes(itemData, targetLevel)) {
                changes.push(`Руны -> уровень ${targetLevel}`);
            }

            // Prevent create failures on target actor caused by stale source metadata/containers
            delete itemData._id;
            delete itemData.folder;
            delete itemData.sort;
            delete itemData.ownership;
            if (itemData.system?.containerId) itemData.system.containerId = null;

            items.push(itemData);

            if (changes.length > 0) {
                this.conversionLog.push(`<li><strong>${item.name}</strong> <em>(${item.type})</em>: ${changes.join(", ")}</li>`);
            }
        }

        return items;
    },

    showReport: function() {
        if (!this.conversionLog.length) return;

        const content = `
            <div class="monster-maker-report">
                <p>Отчет конвертации источника:</p>
                <ul>${this.conversionLog.join("")}</ul>
            </div>
        `;

        new Dialog({
            title: "Конвертация источника",
            content,
            buttons: {
                ok: { label: "OK" }
            }
        }).render(true);
    }
};

