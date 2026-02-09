// constructed-creature-ancestries.js

window.ConstructedCreatureAncestry = {
    ANCESTRIES: {
        human_default: { label: "Человек (Стандарт)", uuid: null, traits: ["human", "humanoid"] },
        human_nidal: { label: "Человек (Нидал)", uuid: "Compendium.pf2e-ts-adv-v2.Build.Item.OYlAwOr6qFtOsftA", traits: ["human", "humanoid", "nidalese"] },
        human_cheliax: { label: "Человек (Челиакс)", uuid: "Compendium.pf2e-ts-adv-v2.Build.Item.vomHHX1LK4jOUVfX", traits: ["human", "humanoid", "chelaxian"] },
        dwarf: { label: "Дварф", uuid: "Compendium.pf2e-ts-adv-v2.Build.Item.W3Z9QerxUxdBIb1r", traits: ["dwarf", "humanoid"] },
        tengu: { label: "Тэнгу", uuid: "Compendium.pf2e-ts-adv-v2.Build.Item.Dw7Awdfgj1Z2OfK1", traits: ["tengu", "humanoid"] }
    },

    _cache: {},

    getTabHTML: function() {
        const options = Object.entries(this.ANCESTRIES).map(([key, val]) => {
            return `<option value="${key}">${val.label}</option>`;
        }).join("");

        return `
        <div class="monster-maker-container">
            <div class="header-row">
                <p class="flavor-text">Включение родословной добавит черты (traits) и уникальные способности.</p>
            </div>
            <div class="form-group-row" style="align-items: center; margin-top: 10px; margin-bottom: 10px;">
                <div class="form-group" style="display: flex; align-items: center; gap: 10px;">
                    <input type="checkbox" id="mm-ancestry-enable" style="width: 20px; height: 20px;">
                    <label for="mm-ancestry-enable" style="margin: 0; cursor: pointer; font-weight: bold;">Включить Родословные</label>
                </div>
            </div>
            <div id="ancestry-selection-block" style="opacity: 0.5; pointer-events: none;">
                <div class="form-group">
                    <label>Выберите родословную:</label>
                    <select id="mm-ancestry-select" disabled>
                        ${options}
                    </select>
                </div>
                <div id="ancestry-loading" style="display:none; color: #666; font-style:italic;">Загрузка данных...</div>
                <div id="ancestry-description-preview" class="enriched-desc" style="display:none;"></div>
            </div>
        </div>
        `;
    },

    activateListeners: function(html, updateCallback) {
        const checkbox = html.find("#mm-ancestry-enable");
        const block = html.find("#ancestry-selection-block");
        const select = html.find("#mm-ancestry-select");
        const preview = html.find("#ancestry-description-preview");
        const loader = html.find("#ancestry-loading");

        const handleUpdate = async () => {
            if (!checkbox.is(":checked")) {
                preview.hide().html("");
                if (updateCallback) updateCallback();
                return;
            }

            const key = select.val();
            loader.show();
            preview.hide();
            
            const data = await this.getParsedData(key);
            
            loader.hide();
            const enriched = await TextEditor.enrichHTML(data.desc, {async: true});
            preview.show().html(enriched || "Нет описания.");

            if (updateCallback) updateCallback();
        };

        checkbox.change(function() {
            if ($(this).is(":checked")) {
                block.css("opacity", "1").css("pointer-events", "auto");
                select.prop("disabled", false);
                handleUpdate();
            } else {
                block.css("opacity", "0.5").css("pointer-events", "none");
                select.prop("disabled", true);
                preview.hide();
                if (updateCallback) updateCallback();
            }
        });

        select.change(() => {
            handleUpdate();
        });
    },

    getParsedData: async function(key) {
        if (this._cache[key]) return this._cache[key];

        const entry = this.ANCESTRIES[key];
        if (!entry) return { stats: {}, lores: [], traits: [], desc: "", items: [] };

        let result = {
            stats: {},
            lores: [],
            traits: entry.traits || [],
            desc: "",
            items: []
        };

        if (entry.uuid) {
            try {
                const item = await fromUuid(entry.uuid);
                if (item) {
                    result.desc = item.system.description.value;
                    result.items.push(item.toObject());
                    
                    if (window.ConstructedCreatureParser) {
                        const parsed = window.ConstructedCreatureParser.parseDescription(result.desc);
                        result.stats = parsed.stats;
                        result.lores = parsed.lores;
                    }
                }
            } catch (e) {
                console.error("Ancestry load error:", e);
                result.desc = "Ошибка загрузки предмета.";
            }
        } else if (key === 'human_default') {
             result.stats = { society: "moderate", diplomacy: "moderate" };
             result.desc = "<p>Стандартный человек Голариона.</p>";
        }

        this._cache[key] = result;
        return result;
    }
};