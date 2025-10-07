// ==================================================
//    AFFLICTION AUTOMATOR - v3.5 (Final)
// ==================================================

const ID = 'affliction-automator';
const CLUMSY_UUID = "Compendium.pf2e.conditionitems.Item.i3OJZU2nk64Df3xm";

// -----------------------------------------------------------------------
// Используем 'ready', чтобы гарантировать, что все загружено.
// -----------------------------------------------------------------------
Hooks.once('ready', () => {
    console.log('Affliction Automator | Модуль готов к работе.');

    // -----------------------------------------------------------------------
    // ХУК №1: ПЕРВИЧНОЕ ПРИМЕНЕНИЕ НЕДУГА
    // -----------------------------------------------------------------------
    Hooks.on('createChatMessage', async (message) => {
        if (!message.isCheckRoll || message.flags?.pf2e?.context?.type !== 'saving-throw') return;
        const degreeOfSuccess = message.flags.pf2e.context.outcome;
        if (degreeOfSuccess !== 'failure' && degreeOfSuccess !== 'criticalFailure') return;

        const actor = message.actor;
        if (!actor) return;

        const messages = game.messages.contents;
        const saveMessageIndex = messages.findLastIndex(m => m.id === message.id);
        if (saveMessageIndex < 1) return;
        const originMessage = messages[saveMessageIndex - 1];

        const afflictionData = parseAfflictionCard(originMessage.content);
        if (!afflictionData) return;

        const initialStage = (degreeOfSuccess === 'criticalFailure') ? 2 : 1;
        await createAfflictionEffect(actor, afflictionData, initialStage);
    });

    // -----------------------------------------------------------------------
    // ХУК №2: ГЛАВНЫЙ ТРИГГЕР В КОНЦЕ ХОДА
    // -----------------------------------------------------------------------
    Hooks.on('pf2e.endTurn', async (combatant, combat) => {
        const actor = combatant.actor;
        if (!actor) return;

        const effect = actor.itemTypes.effect.find(e => e.name.startsWith('Недуг:'));
        if (!effect) return;

        const dataRule = effect.system.rules.find(r => r.key === "Note" && r.selector === "affliction-data");
        if (!dataRule) return;
        
        const afflictionSaveData = JSON.parse(dataRule.text);
        const { name, dc, save } = afflictionSaveData;

        const content = `
            <div class="pf2e chat-card">
                <header class="card-header flexrow">
                    <img src="${effect.img}" alt="${name}" width="36" height="36">
                    <h3>${actor.name}: Требуется спасбросок</h3>
                </header>
                <div class="card-content">
                    <p>Требуется спасбросок против недуга <strong>${name}</strong>.</p>
                    <button class="roll-affliction-save" data-actor-id="${actor.id}" data-effect-id="${effect.id}">
                        Спасбросок ${save.capitalize()} DC ${dc}
                    </button>
                </div>
            </div>
        `;

        await ChatMessage.create({
            user: game.user.id,
            speaker: ChatMessage.getSpeaker({ actor }),
            content: content,
            whisper: ChatMessage.getWhisperRecipients("GM")
        });
    });

    // -----------------------------------------------------------------------
    // ХУК №3: ОБРАБОТКА НАЖАТИЯ КНОПКИ
    // -----------------------------------------------------------------------
    Hooks.on('renderChatLog', (app, html) => {
        html.on('click', '.roll-affliction-save', async (event) => {
            const button = event.currentTarget;
            button.disabled = true;

            const { actorId, effectId } = button.dataset;
            const actor = game.actors.get(actorId);
            const effect = actor?.items.get(effectId);

            if (!actor || !effect) return ui.notifications.warn("Не удалось найти актера или эффект недуга.");

            const afflictionData = effect.getFlag(ID, 'data');
            const currentStage = effect.system.badge.value;

            const saveRoll = await actor.saves[afflictionData.save].roll({ dc: afflictionData.dc, skipDialog: false });

            let stageChange = 0;
            if (saveRoll.degreeOfSuccess === 3) stageChange = -2;
            if (saveRoll.degreeOfSuccess === 2) stageChange = -1;
            if (saveRoll.degreeOfSuccess === 1) stageChange = 1;
            if (saveRoll.degreeOfSuccess === 0) stageChange = 2;

            const newStage = currentStage + stageChange;

            if (newStage <= 0) {
                ChatMessage.create({ content: `<strong>${afflictionData.name}</strong> на ${actor.name} излечен!`, speaker: ChatMessage.getSpeaker({ actor }) });
                await effect.delete();
            } else {
                const maxStage = effect.system.badge.max;
                const finalStage = Math.min(newStage, maxStage);
                
                ChatMessage.create({ content: `${actor.name} переходит на <strong>Стадию ${finalStage}</strong> недуга ${afflictionData.name}.`, speaker: ChatMessage.getSpeaker({ actor }) });
                await effect.update({ 'system.badge.value': finalStage });

                const stageInfo = afflictionData.stages[finalStage];
                if (stageInfo?.damage) {
                    const damageRoll = new DamageRoll(`${stageInfo.damage.num}d${stageInfo.damage.die}[poison]`);
                    await damageRoll.toMessage({ speaker: ChatMessage.getSpeaker({ actor }), flavor: `<strong>Урон от ${afflictionData.name} (Стадия ${finalStage})</strong>` });
                    await actor.applyDamage({ damage: damageRoll, token: actor.getActiveTokens()[0] });
                }
            }
        });
    });
});


// -----------------------------------------------------------------------
// ОСНОВНЫЕ ФУНКЦИИ
// -----------------------------------------------------------------------

async function createAfflictionEffect(actor, afflictionData, initialStage) {
    const fullEffectName = `Недуг: ${afflictionData.name}`;
    const existing = actor.itemTypes.effect.find(e => e.name === fullEffectName);
    if (existing) await existing.delete();

    const rules = [];
    const maxStage = Math.max(...Object.keys(afflictionData.stages).map(Number));

    for (const stageNum in afflictionData.stages) {
        const stageInfo = afflictionData.stages[stageNum];
        const stageValue = parseInt(stageNum);

        if (stageInfo.condition?.name === 'clumsy') {
            rules.push({
                key: "GrantItem",
                uuid: CLUMSY_UUID,
                inMemoryOnly: true,
                predicate: [{ "eq": ["parent:badge:value", stageValue] }],
                alterations: [{ mode: "override", property: "badge-value", value: stageInfo.condition.value }]
            });
        }
    }

    const saveData = { dc: afflictionData.dc, save: afflictionData.save, name: afflictionData.name };
    rules.push({
        key: "Note",
        selector: "affliction-data",
        text: JSON.stringify(saveData),
        predicate: [],
        title: "Affliction Automator Data"
    });

    const effectSource = {
        type: 'effect',
        name: fullEffectName,
        img: afflictionData.img,
        system: {
            rules: rules,
            slug: `aff-${afflictionData.slug}`,
            duration: { value: afflictionData.duration, unit: "rounds", expiry: "turn-end" },
            badge: { type: "counter", value: initialStage, max: maxStage }
        },
        flags: {
            [ID]: { isAffliction: true, name: afflictionData.name, data: afflictionData }
        }
    };

    ChatMessage.create({ content: `${actor.name} получает недуг <strong>${afflictionData.name} (Стадия ${initialStage})</strong>!`, speaker: ChatMessage.getSpeaker({ actor }) });
    await actor.createEmbeddedDocuments("Item", [effectSource]);

    const initialStageInfo = afflictionData.stages[initialStage];
    if (initialStageInfo?.damage) {
        const damageRoll = new DamageRoll(`${initialStageInfo.damage.num}d${initialStageInfo.damage.die}[poison]`);
        await damageRoll.toMessage({ speaker: ChatMessage.getSpeaker({ actor }), flavor: `<strong>Урон от ${afflictionData.name} (Стадия ${initialStage})</strong>` });
        await actor.applyDamage({ damage: damageRoll, token: actor.getActiveTokens()[0] });
    }
}

function parseAfflictionCard(htmlContent) {
    try {
        const content = document.createElement('div');
        content.innerHTML = htmlContent;

        const name = content.querySelector("h3")?.textContent.trim();
        const saveEl = content.querySelector("[data-pf2-dc]");
        if (!name || !saveEl) return null;

        const durationMatch = htmlContent.match(/(?:Maximum Duration|Максимальная продолжительность)[^0-9]*(\d+)\s*(?:rounds|раундов)/i);

        const data = {
            name: name,
            slug: name.slugify(),
            img: content.querySelector("header img")?.src,
            dc: parseInt(saveEl.dataset.pf2Dc),
            save: saveEl.dataset.pf2Check,
            duration: durationMatch ? parseInt(durationMatch[1]) : 6,
            stages: {}
        };

        content.querySelectorAll(".card-content > p").forEach(p => {
            const text = p.textContent;
            const stageMatch = text.match(/^(?:Stage|Стадия)\s+(\d+)/i);
            if (stageMatch) {
                const stageNum = parseInt(stageMatch[1]);
                const conditionMatch = text.match(/(?:clumsy|неуклюжесть)\s+(\d+)/i);
                const damageMatch = text.match(/\{(\d+)d(\d+)/);

                data.stages[stageNum] = {
                    damage: damageMatch ? { num: parseInt(damageMatch[1]), die: parseInt(damageMatch[2]) } : null,
                    condition: conditionMatch ? { name: 'clumsy', value: parseInt(conditionMatch[1]) } : null,
                };
            }
        });

        return Object.keys(data.stages).length > 0 ? data : null;
    } catch (e) {
        console.error(`${ID} | Ошибка при парсинге карточки недуга:`, e);
        return null;
    }
}