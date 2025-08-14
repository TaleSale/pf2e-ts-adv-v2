// modules/pf2e-ts-adv-v2/createJournal.js

// Класс для нашего кастомного листа журнала
class CCJournalSheet extends JournalSheet {
  static get defaultOptions() {
    const options = super.defaultOptions;
    // Просто добавляем наш класс .CC к окну журнала. Стили подхватятся из CSS.
    options.classes.push("CC");
    return options;
  }
}

// Используем один хук 'init' для всех наших действий
Hooks.once('init', () => {
    // 1. Подключаем наш CSS-файл
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'modules/pf2e-ts-adv-v2/journals/CC/CC.css'; // Путь к вашему CSS
    document.head.appendChild(link);

    // 2. Регистрируем наш лист
    DocumentSheetConfig.registerSheet(JournalEntry, 'CC', CCJournalSheet, {
        label: "Тема \"Вызов Занавеса\"",
        makeDefault: false
    });
});