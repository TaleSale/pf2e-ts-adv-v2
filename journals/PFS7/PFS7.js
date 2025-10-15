// modules/pf2e-ts-adv-v2/createJournal.js

class PFS7JournalSheet extends JournalSheet {

  static get defaultOptions() {
    const options = super.defaultOptions;
    options.classes.push("PFS7");
    return options;
  }

  async activateListeners(html) {
    super.activateListeners(html);

    const navigationElement = html.find('.journal-sidebar')[0];
    const contentElement = html.find('.journal-entry-content')[0];

    if (navigationElement) {
      // Рекомендуется перенести эти стили в PFS7.css
      navigationElement.style.background = "#574840ff";
      navigationElement.style.backgroundSize = "cover";
      navigationElement.style.width = '300px';  // установим ширину навигационной части
    }

    if (contentElement) {
      // Рекомендуется перенести этот стиль в PFS7.css
      contentElement.style.backgroundColor = "#f0f0f0";  // светло-серый фон
    }

    // Удаляем элемент с классом `journal-header`, если он существует
    const journalHeaderElement = html.find('.journal-header')[0];
    if (journalHeaderElement) {
      journalHeaderElement.remove();
    }
  }
}

Hooks.once('init', () => {
  DocumentSheetConfig.registerSheet(JournalEntry, 'PFS7', PFS7JournalSheet, {
    label: "Тема \"PFS7\"",
    makeDefault: false
  });
});
