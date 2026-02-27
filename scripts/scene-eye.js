/**
 * Скрипт для модуля ts-pf2e-adv-v2
 * Версия 4: Стилизация под инлайн-кнопки проверок Pathfinder 2e (сдвоенная кнопка)
 */

Hooks.once('ready', () => {
    if (!game.user.isGM) return;

    console.log("👁️ Scene Eye Script | Запущен (Стиль PF2e)");

    const processLinks = (htmlElement) => {
        const links = $(htmlElement).find('a.content-link[data-type="Scene"]:not(.eye-processed)');
        
        links.each(function() {
            const $link = $(this);
            $link.addClass('eye-processed');

            const sceneId = $link.attr('data-id');
            if (!sceneId) return;

            // 1. Создаем ОБЕРТКУ. Она будет выглядеть как общая рамка для обеих кнопок.
            // Используем inline-flex, чтобы элементы стояли в ряд и занимали одинаковую высоту.
            const $wrapper = $('<span class="pf2e-scene-eye-wrapper" style="display: inline-flex; align-items: stretch; border: 1px solid var(--color-border-dark); border-radius: 3px; overflow: hidden; vertical-align: text-bottom; margin: 0 2px; box-shadow: 0 1px 1px rgba(0,0,0,0.1); background: var(--color-bg-btn-minor);"></span>');

            // 2. Модифицируем оригинальную ссылку.
            // Убираем у неё её собственные рамки, скругления и отступы, чтобы она слилась с оберткой.
            $link.css({
                'border': 'none',
                'border-radius': '0',
                'margin': '0',
                'background': 'transparent', // Фон берем от обертки
                'box-shadow': 'none'
            });

            // 3. Создаем кнопку с ГЛАЗОМ (правая часть).
            // Задаем ей фон чуть темнее (через полупрозрачный черный) и левую рамку-разделитель.
            const $eyeBtn = $('<span class="gm-scene-eye-btn" title="Перейти на сцену (GM)" style="display: inline-flex; align-items: center; justify-content: center; padding: 0 6px; background: rgba(0, 0, 0, 0.15); border-left: 1px dashed var(--color-border-dark); cursor: pointer; color: var(--color-text-dark-primary);"><i class="fas fa-eye"></i></span>');
            
            // Обработчик клика по глазу
            $eyeBtn.on('click', async (e) => {
                e.preventDefault();
                e.stopPropagation(); // Не даем клику "провалиться" в настройки сцены
                
                const scene = game.scenes.get(sceneId);
                if (scene) {
                    await scene.view();
                } else {
                    ui.notifications.warn("Сцена не найдена!");
                }
            });

            // Эффекты наведения для правой кнопки (глаза)
            $eyeBtn.hover(
                function() { $(this).css({"background": "rgba(0, 0, 0, 0.3)", "color": "white"}); },
                function() { $(this).css({"background": "rgba(0, 0, 0, 0.15)", "color": "var(--color-text-dark-primary)"}); }
            );

            // 4. СБОРКА HTML
            // Оборачиваем старую ссылку в нашу новую рамку
            $link.wrap($wrapper); 
            // Добавляем глаз ВНУТРЬ рамки, сразу после ссылки
            $link.parent().append($eyeBtn); 
        });
    };

    // Первоначальный запуск
    processLinks(document.body);

    // Слежка за появлением новых текстов (журналы, чат)
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.addedNodes && mutation.addedNodes.length > 0) {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        processLinks(node);
                    }
                });
            }
        });
    });

    observer.observe(document.body, { childList: true, subtree: true });
});