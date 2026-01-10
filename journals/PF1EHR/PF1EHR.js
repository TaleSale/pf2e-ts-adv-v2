// modules/pf2e-ts-adv-v2/createJournal.js

class PF1EHRJournalSheet extends JournalSheet {

  static get defaultOptions() {
    const options = super.defaultOptions;
    options.classes.push("PF1EHR");
    return options;
  }

  async activateListeners(html) {
    super.activateListeners(html);

    const navigationElement = html.find('.journal-sidebar')[0];
    const contentElement = html.find('.journal-entry-content')[0];

    if (navigationElement) {
      // Рекомендуется перенести эти стили в PF1EHR.css
      navigationElement.style.background = "url('modules/pf2e-ts-adv-v2/journals/PF1EHR/back.webp') no-repeat center center";
      navigationElement.style.backgroundSize = "cover";
      navigationElement.style.width = '300px';  // установим ширину навигационной части
    }

    if (contentElement) {
      // Рекомендуется перенести этот стиль в PF1EHR.css
      contentElement.style.backgroundColor = "#f0f0f0";  // светло-серый фон
    }

// Удаляем элемент с классом `journal-header`, если он существует
    const journalHeaderElement = html.find('.journal-header')[0];
    if (journalHeaderElement) {
      journalHeaderElement.remove();
    }

    // Загружаем слова для выделения из JSON-файла
    try {
      const response = await fetch('/modules/pf2e-ts-adv-v2/journals/PF1EHR/keywords.json');
      const keywords = await response.json();
      this.setupMutationObserver(contentElement, keywords);
    } catch (error) {
      console.error('Error loading keywords:', error);
    }
  }

  // Метод для настройки MutationObserver
  setupMutationObserver(contentElement, keywords) {
    if (!contentElement) return;

    const observer = new MutationObserver((mutationsList) => {
      let shouldHighlight = false;
      for (const mutation of mutationsList) {
        if (mutation.type === 'childList' || mutation.type === 'subtree') {
          shouldHighlight = true;
          break;
        }
      }
      if (shouldHighlight) {
        this.highlightText(contentElement, keywords);
      }
    });

    observer.observe(contentElement, {
      childList: true,
      subtree: true
    });

    // Начальное выделение текста
    this.highlightText(contentElement, keywords);
  }

  // Метод для выделения текста
  highlightText(contentElement, keywords) {
    if (!contentElement) return;

    const regexes = Object.entries(keywords).reduce((acc, [color, words]) => {
      acc[color] = words.map(word => new RegExp(`(?<![а-яА-Я])${word}(?![а-яА-Я])`, 'gi'));
      return acc;
    }, {});

    const traverseAndHighlight = (node) => {
      if (node.nodeType === 3) {  // текстовый узел
        let text = node.nodeValue;
        for (const [color, regexArray] of Object.entries(regexes)) {
          for (const regex of regexArray) {
            text = text.replace(regex, `<span class="highlight-${color}">$&</span>`);
          }
        }
        if (text !== node.nodeValue) {
          const tempDiv = document.createElement('div');
          tempDiv.innerHTML = text;
          while (tempDiv.firstChild) {
            node.parentNode.insertBefore(tempDiv.firstChild, node);
          }
          node.parentNode.removeChild(node);
        }
      } else if (node.nodeType === 1 && node.nodeName !== "SPAN" && !node.classList.contains('editor-content') && !/H[1-6]/.test(node.nodeName)) {  // элемент и не редакторский контент и не заголовки
        node.childNodes.forEach(traverseAndHighlight);
      }
    };

    // Проверяем, есть ли редактор контента
    if (!contentElement.querySelector('.editor-content')) {
      traverseAndHighlight(contentElement);
    }
  }
}

Hooks.once('init', () => {
  DocumentSheetConfig.registerSheet(JournalEntry, 'PF1EHR', PF1EHRJournalSheet, {
    label: "Тема PF1E \"Адские Мятежники\"",
    makeDefault: false
  });
});

// Добавляем стили для выделения текста
Hooks.once('ready', () => {
  const style = document.createElement('style');
  style.textContent = `
    .highlight-em {
      font-style: italic;
    }

    .highlight-bold {
      font-weight: bold;
    }

    .highlight-underline {
      text-decoration: underline;
    }
    
    .highlight-darkred {
      font-weight: bold;
      color: darkred;
    }

    .highlight-indigo {
      font-weight: bold;
      color: indigo;
    }
  `;
  document.head.appendChild(style);
});