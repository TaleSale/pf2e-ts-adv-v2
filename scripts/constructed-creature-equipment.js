// constructed-creature-equipment.js

window.ConstructedCreatureEquipment = {

    // Fundamental runes by creature level (GMG Table 2-4)
    RUNES_TABLE: {
        weapon: {
            6: { potency: 1, striking: 0 },
            8: { potency: 1, striking: 1 },
            14: { potency: 2, striking: 1 },
            16: { potency: 2, striking: 2 },
            20: { potency: 3, striking: 2 },
            23: { potency: 3, striking: 3 }
        },
        armor: {
            9: { potency: 1, resilient: 0 },
            12: { potency: 1, resilient: 1 },
            15: { potency: 2, resilient: 1 },
            18: { potency: 2, resilient: 2 },
            22: { potency: 3, resilient: 2 },
            24: { potency: 3, resilient: 3 }
        }
    },

    RUNE_LABELS: {
        weapon: {
            potency: { 0: "-", 1: "+1 Weapon Potency", 2: "+2 Weapon Potency", 3: "+3 Weapon Potency" },
            striking: { 0: "-", 1: "Striking", 2: "Greater Striking", 3: "Major Striking" }
        },
        armor: {
            potency: { 0: "-", 1: "+1 Armor Potency", 2: "+2 Armor Potency", 3: "+3 Armor Potency" },
            resilient: { 0: "-", 1: "Resilient", 2: "Greater Resilient", 3: "Major Resilient" }
        }
    },

    _parsedEquipmentCache: [],
    _manualItems: [],
    MANUAL_ALLOWED_TYPES: ["equipment", "weapon", "armor", "shield", "consumable", "treasure", "backpack", "book", "kit"],

    clearManualItems: function () {
        this._manualItems = [];
    },

    _escapeHtml: function (value) {
        const text = String(value ?? "");
        if (globalThis.foundry?.utils?.escapeHTML) {
            return foundry.utils.escapeHTML(text);
        }
        return text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/\"/g, "&quot;")
            .replace(/'/g, "&#039;");
    },

    parseEquipmentFromDescription: function (htmlString) {
        const foundItems = [];

        const sectionRegex = /<h2>\s*(Снаряжение|Equipment).*?<\/h2>([\s\S]*?)(?=<h2>|$)/i;
        const match = htmlString.match(sectionRegex);

        if (!match) return [];
        const content = match[2];

        const lines = content.split(/<\/p>/i);

        lines.forEach(line => {
            const categoryMatch = line.match(/<strong>\s*(.*?)\s*:?\s*<\/strong>/i);
            const categoryName = categoryMatch ? categoryMatch[1].replace(":", "").trim() : "Предмет";

            const uuidRegex = /@UUID\[([^\]]+)\](?:\{([^}]+)\})?/g;
            let itemMatch;
            const rowItems = [];

            while ((itemMatch = uuidRegex.exec(line)) !== null) {
                rowItems.push({
                    uuid: itemMatch[1],
                    name: itemMatch[2] || "Unknown Item",
                    type: this._guessType(itemMatch[1])
                });
            }

            if (rowItems.length > 0) {
                foundItems.push({
                    category: categoryName,
                    options: rowItems
                });
            }
        });

        return foundItems;
    },

    _guessType: function (uuid) {
        if (uuid.includes("equipment")) return "equipment";
        return "item";
    },

    _getRuneSummaryHTML: function (level) {
        const lvl = parseInt(level);
        const wRunes = this.getRuneStats(lvl, "weapon");
        const aRunes = this.getRuneStats(lvl, "armor");

        const parts = [];

        const wParts = [];
        if (wRunes.potency > 0) wParts.push(this.RUNE_LABELS.weapon.potency[wRunes.potency]);
        if (wRunes.striking > 0) wParts.push(this.RUNE_LABELS.weapon.striking[wRunes.striking]);
        if (wParts.length > 0) parts.push(`<b>Weapon:</b> ${wParts.join(", ")}`);

        const aParts = [];
        if (aRunes.potency > 0) aParts.push(this.RUNE_LABELS.armor.potency[aRunes.potency]);
        if (aRunes.resilient > 0) aParts.push(this.RUNE_LABELS.armor.resilient[aRunes.resilient]);
        if (aParts.length > 0) parts.push(`<b>Armor:</b> ${aParts.join(", ")}`);

        if (parts.length === 0) return `<span style="color:#999;">Нет рун для уровня ${lvl}</span>`;
        return parts.join("<br>");
    },

    _getManualItemsListHTML: function () {
        if (!Array.isArray(this._manualItems) || this._manualItems.length === 0) {
            return `<div style="padding:8px 10px; border:1px dashed #bbb; border-radius:4px; color:#777; font-style:italic;">Перетащите сюда предмет из компедиума, списка предметов или листа актера.</div>`;
        }

        return this._manualItems.map((entry, index) => {
            const name = this._escapeHtml(entry.name || "Предмет");
            const img = this._escapeHtml(entry.img || "systems/pf2e/icons/default-icons/physical-item.svg");
            const quantity = Math.max(1, Number(entry.quantity) || 1);
            return `
                <div class="mm-manual-equipment-row" style="display:flex; align-items:center; justify-content:space-between; gap:8px; padding:4px 6px; border:1px solid #d2d2d2; border-radius:4px; margin-bottom:4px; background:rgba(0,0,0,0.02);">
                    <div style="display:flex; align-items:center; gap:8px; min-width:0; flex:1 1 auto;">
                        <img src="${img}" style="width:20px; height:20px; border:1px solid #aaa; border-radius:3px; flex:0 0 auto;" />
                        <span style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${name}</span>
                    </div>
                    <div style="display:flex; align-items:center; gap:4px; flex:0 0 auto;">
                        <button type="button" class="mm-manual-equipment-qty-dec" data-index="${index}" style="width:auto; min-width:24px; height:24px; line-height:1; padding:0 6px; margin:0;">-</button>
                        <span style="min-width:24px; text-align:center; font-weight:bold;">${quantity}</span>
                        <button type="button" class="mm-manual-equipment-qty-inc" data-index="${index}" style="width:auto; min-width:24px; height:24px; line-height:1; padding:0 6px; margin:0;">+</button>
                        <button type="button" class="mm-manual-equipment-remove" data-index="${index}" style="width:auto; min-width:62px; height:24px; line-height:1; padding:0 8px; margin:0;">Удалить</button>
                    </div>
                </div>
            `;
        }).join("");
    },

    getManualSectionHTML: function () {
        return `
            <div style="margin-top:12px; border-top:1px solid #ddd; padding-top:10px;">
                <div style="display:flex; align-items:center; justify-content:space-between; gap:8px; margin-bottom:6px;">
                    <strong>Дополнительно</strong>
                    <button type="button" id="mm-equipment-manual-clear">Очистить</button>
                </div>
                <div id="mm-equipment-manual-drop-zone" style="border:2px dashed #bbb; border-radius:8px; padding:12px; text-align:center; background:rgba(0,0,0,0.015); transition:all 0.2s;">
                    Перетащите предмет сюда
                </div>
                <div id="mm-equipment-manual-list" style="margin-top:8px;">
                    ${this._getManualItemsListHTML()}
                </div>
            </div>
        `;
    },

    getTabHTML: function (parsedItems, level, options = {}) {
        const sourceNoticeHtml = options.sourceNoticeHtml || "";
        const emptyHint = options.emptyHint || "Нет рекомендованного снаряжения для выбранного подкласса.";
        const hasRecommended = Array.isArray(parsedItems) && parsedItems.length > 0;

        let html = `
        <div class="monster-maker-container">
            <div class="header-row">
                <h3>Снаряжение (Уровень ${level})</h3>
            </div>
            ${sourceNoticeHtml}
        `;

        if (hasRecommended) {
            const runeSummary = this._getRuneSummaryHTML(level);
            html += `
            <div style="margin: 5px 0 10px; padding: 6px 10px; background: rgba(111, 66, 193, 0.08); border-left: 3px solid #6f42c1; border-radius: 3px; font-size: 0.9em;">
                <div style="font-weight:bold; margin-bottom:3px;">Фундаментальные руны:</div>
                ${runeSummary}
            </div>
            <div class="equipment-list" style="margin-top:10px;">
            `;

            parsedItems.forEach((row, index) => {
                html += `
                <div class="form-group" style="background: rgba(0,0,0,0.03); padding: 5px; border-radius: 3px; border: 1px solid #ccc; margin-bottom: 5px;">
                    <label>${row.category}</label>
                    <select name="equipment_row_${index}" class="equipment-select" style="width:100%;">
                `;

                row.options.forEach(opt => {
                    html += `<option value="${opt.uuid}">${opt.name}</option>`;
                });

                html += `</select></div>`;
            });

            html += `</div>`;
        } else {
            html += `<p style="padding:10px; font-style:italic; color:#777;">${emptyHint}</p>`;
        }

        html += this.getManualSectionHTML();
        html += `</div>`;
        return html;
    },

    _renderManualItemsList: function (html) {
        const list = html.find("#mm-equipment-manual-list");
        if (!list.length) return;
        list.html(this._getManualItemsListHTML());
    },

    _parseDropData: function (event) {
        const raw = event.originalEvent?.dataTransfer?.getData("text/plain")
            ?? event.dataTransfer?.getData("text/plain")
            ?? "";
        if (!raw) return null;
        try {
            return JSON.parse(raw);
        } catch (_e) {
            return null;
        }
    },

    _resolveDroppedItem: async function (dropData) {
        if (!dropData || dropData.type !== "Item") return null;

        if (dropData.uuid) {
            const byUuid = await fromUuid(dropData.uuid);
            if (byUuid) return byUuid;
        }

        if (dropData.pack && dropData.id) {
            const pack = game.packs.get(dropData.pack);
            if (pack) {
                const byPack = await pack.getDocument(dropData.id);
                if (byPack) return byPack;
            }
        }

        if (dropData.id && game.items?.get(dropData.id)) {
            return game.items.get(dropData.id);
        }

        return null;
    },

    addManualItemFromDrop: async function (dropData) {
        const item = await this._resolveDroppedItem(dropData);
        if (!item) return { ok: false, reason: "invalid" };
        const isPhysical = item?.isOfType?.("physical") || this.MANUAL_ALLOWED_TYPES.includes(item.type);
        if (!isPhysical) return { ok: false, reason: "notPhysical" };

        const uuid = item.uuid || dropData?.uuid || null;
        if (!uuid) return { ok: false, reason: "invalid" };

        const existing = this._manualItems.find((entry) => entry.uuid === uuid);
        if (existing) {
            existing.quantity = Math.max(1, Number(existing.quantity) || 1) + 1;
            return { ok: true, stacked: true, item: existing };
        }

        this._manualItems.push({
            uuid,
            name: item.name || "Предмет",
            img: item.img || "systems/pf2e/icons/default-icons/physical-item.svg",
            type: item.type || "item",
            quantity: 1
        });

        return { ok: true, stacked: false };
    },

    removeManualItem: function (index) {
        const idx = Number(index);
        if (!Number.isInteger(idx) || idx < 0 || idx >= this._manualItems.length) return;
        this._manualItems.splice(idx, 1);
    },

    adjustManualItemQuantity: function (index, delta) {
        const idx = Number(index);
        if (!Number.isInteger(idx) || idx < 0 || idx >= this._manualItems.length) return;

        const entry = this._manualItems[idx];
        const current = Math.max(1, Number(entry.quantity) || 1);
        const next = current + Number(delta || 0);

        if (next <= 0) {
            this._manualItems.splice(idx, 1);
            return;
        }

        entry.quantity = next;
    },

    activateListeners: function (html) {
        if (!html?.length) return;

        html.off(".mmManualEquipment");

        html.on("dragover.mmManualEquipment", "#mm-equipment-manual-drop-zone", (event) => {
            event.preventDefault();
            const zone = $(event.currentTarget);
            zone.css({ borderColor: "#4a90e2", background: "rgba(74,144,226,0.08)" });
        });

        html.on("dragleave.mmManualEquipment", "#mm-equipment-manual-drop-zone", (event) => {
            event.preventDefault();
            const zone = $(event.currentTarget);
            zone.css({ borderColor: "#bbb", background: "rgba(0,0,0,0.015)" });
        });

        html.on("drop.mmManualEquipment", "#mm-equipment-manual-drop-zone", async (event) => {
            event.preventDefault();
            const zone = $(event.currentTarget);
            zone.css({ borderColor: "#bbb", background: "rgba(0,0,0,0.015)" });

            const dropData = this._parseDropData(event);
            const result = await this.addManualItemFromDrop(dropData);
            if (!result.ok) {
                if (result.reason === "notPhysical") {
                    ui.notifications.warn("Можно добавлять только физические предметы.");
                } else {
                    ui.notifications.warn("Перетащите сюда предмет.");
                }
                return;
            }

            this._renderManualItemsList(html);
        });

        html.on("click.mmManualEquipment", ".mm-manual-equipment-remove", (event) => {
            event.preventDefault();
            const idx = $(event.currentTarget).data("index");
            this.removeManualItem(idx);
            this._renderManualItemsList(html);
        });

        html.on("click.mmManualEquipment", ".mm-manual-equipment-qty-inc", (event) => {
            event.preventDefault();
            const idx = $(event.currentTarget).data("index");
            this.adjustManualItemQuantity(idx, 1);
            this._renderManualItemsList(html);
        });

        html.on("click.mmManualEquipment", ".mm-manual-equipment-qty-dec", (event) => {
            event.preventDefault();
            const idx = $(event.currentTarget).data("index");
            this.adjustManualItemQuantity(idx, -1);
            this._renderManualItemsList(html);
        });

        html.on("click.mmManualEquipment", "#mm-equipment-manual-clear", (event) => {
            event.preventDefault();
            this.clearManualItems();
            this._renderManualItemsList(html);
        });
    },

    getRuneStats: function (level, type) {
        const table = this.RUNES_TABLE[type];
        if (!table) return { potency: 0, striking: 0, resilient: 0 };

        let best = { potency: 0, striking: 0, resilient: 0 };
        const lvl = parseInt(level);

        for (const [l, data] of Object.entries(table)) {
            if (lvl >= parseInt(l)) {
                if (data.potency !== undefined) best.potency = data.potency;
                if (data.striking !== undefined) best.striking = data.striking;
                if (data.resilient !== undefined) best.resilient = data.resilient;
            }
        }
        return best;
    },

    _applyRunesToItemData: function (itemData, level) {
        if (!itemData || !itemData.type) return itemData;

        if (itemData.type === "weapon") {
            const runes = this.getRuneStats(level, "weapon");
            itemData.system.runes = {
                potency: runes.potency,
                striking: runes.striking,
                property: itemData.system.runes?.property || []
            };
        }
        else if (itemData.type === "armor") {
            const runes = this.getRuneStats(level, "armor");
            itemData.system.runes = {
                potency: runes.potency,
                resilient: runes.resilient,
                property: itemData.system.runes?.property || []
            };
        }

        return itemData;
    },

    _loadItemDataByUuid: async function (uuid, level) {
        if (!uuid) return null;
        try {
            const item = await fromUuid(uuid);
            if (!item) return null;
            const itemData = item.toObject();
            return this._applyRunesToItemData(itemData, level);
        } catch (e) {
            console.error(`Error loading equipment ${uuid}:`, e);
            return null;
        }
    },

    getFinalItems: async function (html, level, options = {}) {
        const items = [];
        const includeRecommended = options.includeRecommended !== false;
        const includeManual = options.includeManual !== false;

        if (includeRecommended) {
            const selects = html.find(".equipment-select");
            for (let i = 0; i < selects.length; i++) {
                const uuid = $(selects[i]).val();
                const itemData = await this._loadItemDataByUuid(uuid, level);
                if (itemData) items.push(itemData);
            }
        }

        if (includeManual) {
            const cloneData = (value) => {
                if (value === null || value === undefined) return value;
                if (globalThis.foundry?.utils?.deepClone) return foundry.utils.deepClone(value);
                return JSON.parse(JSON.stringify(value));
            };

            for (const entry of this._manualItems) {
                const itemData = await this._loadItemDataByUuid(entry.uuid, level);
                if (!itemData) continue;

                const quantity = Math.max(1, Number(entry.quantity) || 1);
                for (let i = 0; i < quantity; i++) {
                    items.push(cloneData(itemData));
                }
            }
        }

        return items;
    }
};
