// Регистрация настройки при инициализации модуля
Hooks.once('init', () => {
    game.settings.register("pf2e-ts-adv-v2", "enableConverterButton", {
        name: "Включить конвертер в действие",
        hint: "Добавляет кнопку 'M' в заголовки способностей и особенностей класса для их быстрого превращения в 'Другое умение' (Action).",
        scope: "world",
        config: true,
        type: Boolean,
        default: false
    });
});

// Добавление кнопки в заголовок
Hooks.on('getItemSheetHeaderButtons', (sheet, buttons) => {
    // 1. Проверяем, включена ли настройка в модуле
    if (!game.settings.get("pf2e-ts-adv-v2", "enableConverterButton")) return;

    // 2. Проверяем тип предмета (Feat включает в себя и особенности класса)
    if (sheet.item.type !== "feat") return;

    // 3. ПРОВЕРКА: Если предмет находится в компедиуме, кнопка не добавляется
    // В Foundry VTT у предметов в мире sheet.item.pack равен null или undefined
    if (sheet.item.pack) return;

    buttons.unshift({
        label: "M",
        class: "convert-to-action",
        icon: "fas fa-sync-alt",
        onclick: async () => {
            const item = sheet.item;
            const itemData = item.toObject();

            // Логика выбора иконки
            const actionType = itemData.system.actionType?.value || "passive";
            const actions = itemData.system.actions?.value || null;

            let newImg = itemData.img;
            if (actionType === "action") {
                if (actions === 1) newImg = "systems/pf2e/icons/actions/OneAction.webp";
                else if (actions === 2) newImg = "systems/pf2e/icons/actions/TwoActions.webp";
                else if (actions === 3) newImg = "systems/pf2e/icons/actions/ThreeActions.webp";
            } else if (actionType === "reaction") {
                newImg = "systems/pf2e/icons/actions/Reaction.webp";
            } else if (actionType === "free") {
                newImg = "systems/pf2e/icons/actions/FreeAction.webp";
            }

            const actionData = {
                name: itemData.name,
                type: "action",
                img: newImg,
                system: {
                    description: itemData.system.description,
                    actionType: { value: actionType },
                    actions: { value: actions },
                    traits: itemData.system.traits,
                    rules: itemData.system.rules,
                    slug: itemData.system.slug,
                    source: itemData.system.source,
                    frequency: itemData.system.frequency || null,
                    category: null 
                }
            };

            new Dialog({
                title: `Конвертация: ${item.name}`,
                content: `<p>Вы уверены, что хотите превратить "${item.name}" в "Другое умение"? Оригинал будет удален.</p>`,
                buttons: {
                    yes: {
                        icon: '<i class="fas fa-check"></i>',
                        label: "Конвертировать",
                        callback: async () => {
                            if (item.actor) {
                                await item.actor.createEmbeddedDocuments("Item", [actionData]);
                                await item.delete();
                            } else {
                                await Item.create(actionData);
                                await item.delete();
                            }
                            ui.notifications.info(`Предмет "${itemData.name}" успешно конвертирован.`);
                        }
                    },
                    no: { icon: '<i class="fas fa-times"></i>', label: "Отмена" }
                },
                default: "yes"
            }).render(true);
        }
    });
});