// constructed-creature-equipment.js

window.ConstructedCreatureEquipment = {
    getTabHTML: function() {
        return `
        <div class="monster-maker-container">
            <div class="header-row">
                <p class="flavor-text">Снаряжение добавляет действия и реакции.</p>
            </div>
            <div class="form-group-row" style="align-items: center; margin-top: 15px;">
                <div class="form-group" style="display: flex; align-items: center; gap: 10px;">
                    <input type="checkbox" id="mm-shield-check" name="hasShield" style="width: 20px; height: 20px;">
                    <label for="mm-shield-check" style="margin: 0; cursor: pointer;">Владеет Щитом (Shield)</label>
                </div>
            </div>
        </div>
        `;
    },

    getEquipmentItems: async function(html) {
        const items = [];
        const hasShield = html.find("#mm-shield-check").is(":checked");

        if (hasShield) {
            try {
                // Поднять щит
                const raiseAction = await fromUuid("Compendium.pf2e.actionspf2e.Item.xjGwis0uaC2305pm");
                if (raiseAction) items.push(raiseAction.toObject());
                
            } catch (e) {
                console.error("Constructed Creature: Error loading shield items", e);
            }
        }
        return items;
    }
};