/**
 * Этот хук срабатывает при открытии окна настроек сцены.
 * Он добавляет новое поле для редактирования свойства 'thumb' (миниатюры) сцены.
 */
Hooks.on('renderSceneConfig', (app, html, data) => {
  // Оборачиваем DOM-элемент (который является самой формой) в jQuery.
  const $html = $(html);

  // Предотвращаем дублирование, если окно просто обновляется.
  if ($html.find('input[name="thumb"]').length > 0) {
    return;
  }

  // Получаем текущий путь к миниатюре из данных сцены.
  const thumbPath = data.document.thumb || '';

  // Создаем HTML-код для нового поля.
  const newFieldHTML = `
    <div class="form-group">
      <label>Изображение миниатюры (Thumb)</label>
      <div class="form-fields">
        <input type="text" name="thumb" value="${thumbPath}" data-dtype="String">
        <button type="button" class="file-picker" data-type="imagevideo" data-target="thumb" title="Выбрать файл" tabindex="-1">
          <i class="fas fa-file-import fa-fw"></i>
        </button>
      </div>
      <p class="hint">
        Путь к изображению, которое будет использоваться как миниатюра для этой сцены в боковой панели.
      </p>
    </div>
  `;

  // Находим элемент "Переднее изображение" (Foreground Image).
  const foregroundField = $html.find('file-picker[name="foreground"]').closest('.form-group');

  // Вставляем наше поле после него.
  if (foregroundField.length) {
    foregroundField.after(newFieldHTML);
  } else {
    // Запасной вариант: добавляем в конец первой вкладки.
    $html.find('.tab[data-tab="basics"]').append(newFieldHTML);
  }

  // --- КЛЮЧЕВОЕ ИЗМЕНЕНИЕ: Активация кнопки File Picker ---
  // Находим нашу новую кнопку и добавляем обработчик клика.
  $html.find('button[data-target="thumb"]').on('click', event => {
    const targetInput = $(event.currentTarget).siblings('input[name="thumb"]');
    new FilePicker({
      type: "imagevideo",
      current: targetInput.val(),
      callback: path => {
        targetInput.val(path);
        // Опционально: имитируем событие 'change', чтобы Foundry "увидел" изменения
        targetInput.trigger('change');
      }
    }).browse();
  });

  // Устанавливаем высоту окна в 'auto', чтобы оно автоматически подстроилось под новый контент.
  app.setPosition({ height: 'auto' });
});