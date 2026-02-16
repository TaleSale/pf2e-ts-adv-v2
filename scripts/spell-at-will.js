/**
 * Script for module: pf2e-ts-adv-v2
 * Adds checkboxes "At Will", "Constant", "Self" to the Spell Sheet.
 * Features:
 * - 3-column layout
 * - Persists via Flags
 * - Auto-sets 99/99 uses for Innate spells
 * - Configurable via Module Settings
 */

const MODULE_ID = 'pf2e-ts-adv-v2';
const FLAG_KEY = 'spellMods';
const SETTING_ENABLE = 'enableSpellAtWill';

// Конфигурация тегов
const MOD_TAGS = [
    { key: 'atWill', label: 'По желанию', col: 2 },
    { key: 'constant', label: 'Постоянно', col: 2 },
    { key: 'self', label: 'На себя', col: 3 }
];

// --- ХУК 0: Регистрация настройки ---
Hooks.once('init', () => {
    game.settings.register(MODULE_ID, SETTING_ENABLE, {
        name: "Включить чекбоксы «По желанию»",
        hint: "Добавляет в окно заклинания чекбоксы: По желанию, Постоянно, На себя. При активации меняет имя заклинания и выставляет 99/99 использований для врожденных чар.",
        scope: "world",     // Настройка для всего мира (только ГМ может менять)
        config: true,       // Показывать в меню настроек модуля
        default: true,      // По умолчанию включено
        type: Boolean,
        onChange: () => {
            // Перезагрузка не обязательна, но закроет открытые окна, чтобы применить изменения
            Object.values(ui.windows).forEach(w => {
                if (w instanceof ItemSheet && w.document.type === 'spell') w.render(true);
            });
        }
    });
});

// --- ХУК 1: Отрисовка интерфейса (Render) ---
Hooks.on('renderSpellSheetPF2e', async (app, html, data) => {
    // 0. Проверка настройки: если выключено, ничего не делаем
    if (!game.settings.get(MODULE_ID, SETTING_ENABLE)) return;

    const item = app.document;
    if (item.type !== 'spell') return;

    // 1. Миграция/Синхронизация флагов при открытии
    let currentFlags = item.getFlag(MODULE_ID, FLAG_KEY) || {};
    let flagsChanged = false;

    // Восстанавливаем флаги из имени, если их нет
    MOD_TAGS.forEach(tag => {
        const regex = new RegExp(escapeRegExp(tag.label), 'i');
        const hasNameTag = regex.test(item.name);
        
        if (currentFlags[tag.key] === undefined && hasNameTag) {
            currentFlags[tag.key] = true;
            flagsChanged = true;
        }
    });

    if (flagsChanged) {
        await item.update({ [`flags.${MODULE_ID}.${FLAG_KEY}`]: currentFlags });
        return;
    }

    // --- АВТО-КОРРЕКЦИЯ ИСПОЛЬЗОВАНИЙ (99/99) ---
    const spellEntry = item.spellcasting;
    const isInnate = spellEntry?.isInnate || spellEntry?.system?.type === 'innate';
    const isAtWillOrConstant = currentFlags.atWill || currentFlags.constant;

    if (isInnate && isAtWillOrConstant) {
        const currentUses = item.system.location?.uses;
        const value = currentUses?.value;
        const max = currentUses?.max;

        if (value !== 99 || max !== 99) {
            console.log(`PF2e Spell Mod: Устанавливаю 99/99 использований для врожденного заклинания "${item.name}"`);
            await item.update({
                "system.location.uses": { value: 99, max: 99 }
            });
            return; 
        }
    }

    // --- 2. Поиск элементов интерфейса ---
    const counteractionInput = html.find('input[name="system.counteraction"]');
    const counteractionGroup = counteractionInput.closest('.form-group');
    const ritualInput = html.find('input[data-action="toggle-ritual-data"]');
    const ritualGroup = ritualInput.closest('.form-group');

    if (counteractionGroup.length === 0 || ritualGroup.length === 0) return;
    if (html.find('.custom-three-col-layout').length > 0) return;

    // --- 3. Создание структуры (Grid) ---
    const gridContainer = $(`
        <div class="form-group custom-three-col-layout" style="
            display: grid; 
            grid-template-columns: 1fr 1fr 1fr; 
            gap: 10px; 
            align-items: start;
            margin-top: 5px;
            padding-top: 5px;
            border-top: 1px solid rgba(0,0,0,0.1);
        "></div>
    `);

    const col1 = $(`<div style="display: flex; flex-direction: column; gap: 0;"></div>`);
    const col2 = $(`<div style="display: flex; flex-direction: column; gap: 4px; padding-top: 4px;"></div>`);
    const col3 = $(`<div style="display: flex; flex-direction: column; gap: 4px; padding-top: 4px;"></div>`);

    // Перенос старых элементов
    counteractionGroup.before(gridContainer);
    counteractionGroup.css({ margin: '0', border: 'none', padding: '0' });
    ritualGroup.css({ margin: '0', border: 'none', padding: '0' });
    counteractionGroup.find('label').removeClass('large').css('font-weight', 'bold');
    ritualGroup.find('label').removeClass('large').css('font-weight', 'bold');
    col1.append(counteractionGroup);
    col1.append(ritualGroup);

    // --- 4. Генерация чекбоксов ---
    MOD_TAGS.forEach(tag => {
        const isChecked = currentFlags[tag.key] || (new RegExp(escapeRegExp(tag.label), 'i').test(item.name));
        
        const checkbox = $(`
            <label class="checkbox" style="display: flex; align-items: center; justify-content: space-between; font-size: 13px;">
                ${tag.label}
                <input type="checkbox" class="custom-spell-mod-checkbox" data-key="${tag.key}" data-label="${tag.label}" ${isChecked ? "checked" : ""}>
            </label>
        `);

        if (tag.col === 2) col2.append(checkbox);
        if (tag.col === 3) col3.append(checkbox);
    });

    gridContainer.append(col1).append(col2).append(col3);

    // --- 5. Обработчик изменений ---
    gridContainer.find('.custom-spell-mod-checkbox').on('change', async (event) => {
        const el = event.currentTarget;
        const key = el.getAttribute('data-key');
        const checked = el.checked;

        // 1. Обновляем флаг
        const newFlags = { ...(item.getFlag(MODULE_ID, FLAG_KEY) || {}) };
        newFlags[key] = checked;
        
        // 2. Генерируем новое имя
        const activeLabels = MOD_TAGS.filter(t => newFlags[t.key]).map(t => t.label);
        const finalName = generateNewName(item.name, activeLabels);

        // 3. Формируем объект обновления
        const updateData = {
            name: finalName,
            [`flags.${MODULE_ID}.${FLAG_KEY}`]: newFlags
        };

        // 4. Логика для ВРОЖДЕННЫХ заклинаний (99/99)
        const spellEntryForUpdate = item.spellcasting;
        const isEntryInnateUpdate = spellEntryForUpdate?.isInnate || spellEntryForUpdate?.system?.type === 'innate';
        const isAtWillOrConst = newFlags['atWill'] || newFlags['constant'];
        
        if (isEntryInnateUpdate && isAtWillOrConst) {
            updateData['system.location.uses'] = { value: 99, max: 99 };
        }

        // Сохраняем
        await item.update(updateData);
    });
});

// --- ХУК 2: Защита при обновлении (Update) ---
Hooks.on('preUpdateItem', (item, changes, options, userId) => {
    // 0. Проверка настройки
    if (!game.settings.get(MODULE_ID, SETTING_ENABLE)) return;

    if (item.type !== 'spell' || !changes.name) return;

    const flags = item.getFlag(MODULE_ID, FLAG_KEY);
    if (!flags) return;

    const activeLabels = MOD_TAGS.filter(t => flags[t.key]).map(t => t.label);

    if (activeLabels.length > 0) {
        const patchedName = generateNewName(changes.name, activeLabels);
        changes.name = patchedName;
        console.log(`PF2e Spell Mod: Восстановлены теги при обновлении: "${patchedName}"`);
    }
});

// --- Вспомогательные функции ---

function generateNewName(currentName, activeLabels) {
    let name = currentName;

    // 1. Очистка от тегов
    MOD_TAGS.forEach(tag => {
        const removeRegex = new RegExp(`(\\s*,\\s*)?${escapeRegExp(tag.label)}(\\s*,\\s*)?`, 'gi');
        name = name.replace(removeRegex, (match, p1, p2) => {
            if (p1 && p2) return ", "; 
            return "";
        });
    });

    // 2. Чистка пунктуации
    name = name.replace(/\(\s*\)/g, "");         
    name = name.replace(/\(\s*,\s*\)/g, "");     
    name = name.replace(/\(\s*,\s*/g, "(");      
    name = name.replace(/\s*,\s*\)/g, ")");      
    name = name.replace(/,\s*,/g, ", ");         
    name = name.replace(/\s\s+/g, " ").trim();   

    // 3. Если нет тегов
    if (!activeLabels || activeLabels.length === 0) return name;

    const tagsString = activeLabels.join(", ");
    const separator = " / ";
    
    // 4. Разделение RU / EN
    let parts = name.split(separator);
    let ruName = parts[0].trim();
    let enName = parts.length > 1 ? parts.slice(1).join(separator) : "";

    // 5. Вставка
    if (ruName.endsWith(")")) {
        const lastOpenParenIndex = ruName.lastIndexOf("(");
        if (lastOpenParenIndex !== -1) {
            const basePart = ruName.slice(0, lastOpenParenIndex); 
            const contentPart = ruName.slice(lastOpenParenIndex + 1, -1).trim();
            
            if (contentPart.length > 0) {
                ruName = `${basePart}(${contentPart}, ${tagsString})`;
            } else {
                ruName = `${basePart}(${tagsString})`;
            }
        } else {
            ruName = `${ruName} (${tagsString})`;
        }
    } else {
        ruName = `${ruName} (${tagsString})`;
    }

    return enName ? `${ruName}${separator}${enName}` : ruName;
}

function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}