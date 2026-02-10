// constructed-creature-equipment.js

window.ConstructedCreatureEquipment = {
    
    // Таблица рун (GMG 2-4)
    RUNES_TABLE: {
        weapon: {
            2: { potency: 1, striking: "" },
            4: { potency: 1, striking: "striking" },
            10: { potency: 2, striking: "striking" },
            12: { potency: 2, striking: "greaterStriking" },
            16: { potency: 3, striking: "greaterStriking" },
            19: { potency: 3, striking: "majorStriking" }
        },
        armor: {
            5: { potency: 1, resilient: "" },
            8: { potency: 1, resilient: "resilient" },
            11: { potency: 2, resilient: "resilient" },
            14: { potency: 2, resilient: "greaterResilient" },
            18: { potency: 3, resilient: "greaterResilient" },
            20: { potency: 3, resilient: "majorResilient" }
        }
    },

    // Кэш для распарсенных предметов (чтобы не парсить каждый раз при ререндере)
    _parsedEquipmentCache: [],

    /**
     * Парсит HTML описание подкласса и ищет секцию снаряжения
     */
    parseEquipmentFromDescription: function(htmlString) {
        const foundItems = [];
        
        // 1. Находим секцию "Снаряжение" (Equipment)
        // Ищем от <h2>Снаряжение...</h2> до следующего <h2> или конца
        const sectionRegex = /<h2>\s*(Снаряжение|Equipment).*?<\/h2>([\s\S]*?)(?=<h2>|$)/i;
        const match = htmlString.match(sectionRegex);
        
        if (!match) return [];
        const content = match[2];

        // 2. Разбиваем на строки <p>
        const lines = content.split(/<\/p>/i);

        lines.forEach(line => {
            // Ищем категорию (жирный текст в начале строки)
            // <strong>Оружие:</strong> ...
            const categoryMatch = line.match(/<strong>\s*(.*?)\s*:?\s*<\/strong>/i);
            const categoryName = categoryMatch ? categoryMatch[1].replace(":", "").trim() : "Предмет";

            // Ищем все UUID в этой строке
            const uuidRegex = /@UUID\[([^\]]+)\](?:\{([^}]+)\})?/g;
            let itemMatch;
            const rowItems = [];

            while ((itemMatch = uuidRegex.exec(line)) !== null) {
                rowItems.push({
                    uuid: itemMatch[1],
                    name: itemMatch[2] || "Unknown Item",
                    type: this._guessType(itemMatch[1]) // Пытаемся угадать тип по контексту или загрузке
                });
            }

            if (rowItems.length > 0) {
                foundItems.push({
                    category: categoryName,
                    options: rowItems // Массив вариантов (если было "или")
                });
            }
        });

        return foundItems;
    },

    _guessType: function(uuid) {
        // Простая эвристика, реальный тип получим при загрузке
        if (uuid.includes("equipment")) return "equipment";
        return "item";
    },

    /**
     * Генерирует HTML для вкладки
     */
    getTabHTML: function(parsedItems, level) {
        if (!parsedItems || parsedItems.length === 0) {
            return `<div class="monster-maker-container">
                <div class="header-row"><h3>Снаряжение</h3></div>
                <p style="padding:10px; font-style:italic; color:#777;">Нет рекомендованного снаряжения для выбранного подкласса.</p>
            </div>`;
        }

        let html = `
        <div class="monster-maker-container">
            <div class="header-row">
                <h3>Снаряжение (Уровень ${level})</h3>
                <p class="flavor-text">Автоматически добавляет руны согласно уровню существа.</p>
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

        html += `</div></div>`;
        return html;
    },

    /**
     * Получает актуальные данные рун для уровня
     */
    getRuneStats: function(level, type) {
        const table = this.RUNES_TABLE[type];
        if (!table) return null;

        let best = { potency: 0, striking: "", resilient: "" };
        const lvl = parseInt(level);

        for (const [l, data] of Object.entries(table)) {
            if (lvl >= parseInt(l)) {
                if (data.potency) best.potency = data.potency;
                if (data.striking) best.striking = data.striking;
                if (data.resilient) best.resilient = data.resilient;
            }
        }
        return best;
    },

    /**
     * Основная функция для получения готовых предметов
     */
    getFinalItems: async function(html, level) {
        const items = [];
        const selects = html.find(".equipment-select");
        
        for (let i = 0; i < selects.length; i++) {
            const uuid = $(selects[i]).val();
            if (!uuid) continue;

            try {
                const item = await fromUuid(uuid);
                if (item) {
                    const itemData = item.toObject();
                    
                    // Применяем руны
                    if (itemData.type === "weapon") {
                        const runes = this.getRuneStats(level, "weapon");
                        if (runes.potency > 0) itemData.system.potencyRune = { value: runes.potency };
                        if (runes.striking) itemData.system.strikingRune = { value: runes.striking };
                    } 
                    else if (itemData.type === "armor") {
                        const runes = this.getRuneStats(level, "armor");
                        if (runes.potency > 0) itemData.system.potencyRune = { value: runes.potency };
                        if (runes.resilient) itemData.system.resiliencyRune = { value: runes.resilient };
                    }

                    items.push(itemData);
                }
            } catch (e) {
                console.error(`Error loading equipment ${uuid}:`, e);
            }
        }
        
        return items;
    }
};