/**
 * Скрипт для создания "групп" в инициативе с полной визуальной, динамической и логической синхронизацией.
 * Финальная, исправленная и стабильная версия.
 */

const LINKED_INITIATIVE_FLAG = 'linked-initiative-targetId';

/**
 * Добавляем стили для визуальной иерархии.
 */
Hooks.once('init', () => {
  const styles = `
    .combat-tracker-entry.linked-initiative {
      margin-left: 25px; /* Отступ для иерархии */
      width: calc(100% - 25px);
      border-left: 2px solid #888;
      padding-top: 1px;
      padding-bottom: 1px;
      min-height: 28px; /* Уменьшаем высоту строки */
      line-height: 24px;
    }
    .combat-tracker-entry.linked-initiative .token-image {
      width: 24px; height: 24px; border: none;
    }
    .combat-tracker-entry.linked-initiative .token-name {
      font-size: 0.9em;
    }
    .combat-tracker-entry.linked-initiative .initiative {
      font-size: 0.9em;
    }
    .initiative-link-icon {
      position: absolute;
      left: -20px; /* Помещаем иконку в отступ */
      top: 50%;
      transform: translateY(-50%);
      opacity: 0.7;
    }
    #context-menu .link-initiative-option {
      border-top: 1px solid #444;
    }
  `;
  const styleSheet = document.createElement("style");
  styleSheet.type = "text/css";
  styleSheet.innerText = styles;
  document.head.appendChild(styleSheet);

  // --- БЕЗОПАСНАЯ ПЕРЕЗАПИСЬ СОРТИРОВКИ ---
  const originalSort = Combat.prototype._sortCombatants;
  Combat.prototype._sortCombatants = function(a, b) {
    const aTargetId = a.getFlag('world', LINKED_INITIATIVE_FLAG);
    const bTargetId = b.getFlag('world', LINKED_INITIATIVE_FLAG);

    // Если 'a' привязан к 'b', 'a' должен идти ПОСЛЕ 'b' (возвращаем 1)
    if (aTargetId && aTargetId === b.id) return 1;
    // Если 'b' привязан к 'a', 'b' должен идти ПОСЛЕ 'a' (возвращаем -1)
    if (bTargetId && bTargetId === a.id) return -1;

    // Во всех остальных случаях используем оригинальную функцию сортировки
    return originalSort.call(this, a, b);
  };
});

/**
 * Основной хук для отрисовки трекера и добавления меню.
 */
Hooks.on('renderCombatTracker', (app, html) => {
  if (!game.combat) return;
  const $html = $(html);

  $html.find('.combatant').each((i, li) => {
    const combatantLi = $(li);
    const combatantId = combatantLi.data('combatant-id');
    const combatant = game.combat.combatants.get(combatantId);
    if (!combatant) return;

    const targetId = combatant.getFlag('world', LINKED_INITIATIVE_FLAG);
    if (targetId) {
      combatantLi.addClass('linked-initiative');
      if (combatantLi.find('.initiative-link-icon').length === 0) {
        // Добавляем position:relative, чтобы иконка позиционировалась правильно
        combatantLi.find('.token-name').css('position', 'relative').prepend('<i class="fas fa-link initiative-link-icon"></i>');
      }
    } else {
      combatantLi.removeClass('linked-initiative');
      combatantLi.find('.initiative-link-icon').remove();
    }

    combatantLi.off('contextmenu.linkInitiative');
    combatantLi.on('contextmenu.linkInitiative', () => {
      setTimeout(() => {
        const contextMenu = $('body').find('#context-menu').last();
        if (contextMenu.length > 0 && contextMenu.find('.link-initiative-option').length === 0) {
          const newOption = $(`<li class="context-item link-initiative-option"><i class="fas fa-link"></i> Привязать к группе</li>`);
          contextMenu.append(newOption);
          newOption.on('click', () => openLinkDialog(combatant));
          contextMenu.css('height', `${contextMenu.height() + newOption.outerHeight(true)}px`);
        }
      }, 50);
    });
  });
});

/**
 * Динамически обновляет инициативу последователя при изменении инициативы цели.
 */
Hooks.on('updateCombatant', (combatant, changes) => {
  if (!changes.hasOwnProperty('initiative') || !game.combat) return;
  const followers = game.combat.combatants.filter(c => c.getFlag('world', LINKED_INITIATIVE_FLAG) === combatant.id);
  for (const follower of followers) {
    if (follower.initiative !== combatant.initiative) {
      follower.update({ initiative: combatant.initiative });
    }
  }
});

/**
 * Функция, открывающая диалоговое окно привязки.
 */
async function openLinkDialog(follower) {
  const targets = game.combat.combatants.filter(c => c.id !== follower.id && !c.getFlag('world', LINKED_INITIATIVE_FLAG));
  if (targets.length === 0) return ui.notifications.warn("Нет других существ в бою для привязки.");
  let dialogContent = `<p>Выберите лидера группы для <b>${follower.name}</b>.</p><hr><div class="form-group"><label>Привязать к:</label><select id="target-select">${targets.map(t => `<option value="${t.id}">${t.name}</option>`).join('')}</select></div>`;
  new Dialog({
    title: `Привязка к группе: ${follower.name}`,
    content: dialogContent,
    buttons: {
      link: { icon: '<i class="fas fa-check"></i>', label: 'Привязать', callback: async (html) => { const targetId = html.find('#target-select').val(); const target = game.combat.combatants.get(targetId); if (!target) return; await follower.update({ initiative: target.initiative }); await follower.setFlag('world', LINKED_INITIATIVE_FLAG, targetId); ui.notifications.info(`"${follower.name}" привязан к группе "${target.name}".`); }},
      unlink: { icon: '<i class="fas fa-unlink"></i>', label: 'Отвязать', callback: async () => { await follower.unsetFlag('world', LINKED_INITIATIVE_FLAG); ui.notifications.info(`"${follower.name}" отвязан от группы.`); }},
      cancel: { icon: '<i class="fas fa-times"></i>', label: 'Отмена' }
    },
    default: 'link'
  }).render(true);
}

/**
 * ИСПРАВЛЕННЫЙ ХУК: Позволяет ходу начаться, а затем мгновенно его завершает.
 */
Hooks.on('combatTurn', async (combat, turnData, options) => {
  const combatant = combat.combatants.get(turnData.combatantId);
  if (!combatant) return true;

  if (combatant.getFlag('world', LINKED_INITIATIVE_FLAG)) {
    ChatMessage.create({ content: `<i>Начало хода привязанного существа ${combatant.name}. Пропуск...</i>`, speaker: ChatMessage.getSpeaker({ alias: "Система Инициативы" }), whisper: ChatMessage.getWhisperRecipients("GM") });
    
    // Используем setTimeout, чтобы отделить вызов nextTurn от текущего стека выполнения.
    // Это самый надежный способ избежать конфликтов и "застревания" хода.
    setTimeout(() => combat.nextTurn(), 0);
    
    return false;
  }
  return true;
});