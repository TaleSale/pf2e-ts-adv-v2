Hooks.once("init", () => {
    // Таблица из GM Core (Table 2-11)
    const DC_TABLE = {
        "-1": { moderate: 13, high: 16, extreme: 19 },
        "0":  { moderate: 13, high: 16, extreme: 19 },
        "1":  { moderate: 14, high: 17, extreme: 20 },
        "2":  { moderate: 15, high: 18, extreme: 22 },
        "3":  { moderate: 17, high: 20, extreme: 23 },
        "4":  { moderate: 18, high: 21, extreme: 25 },
        "5":  { moderate: 19, high: 22, extreme: 26 },
        "6":  { moderate: 21, high: 24, extreme: 27 },
        "7":  { moderate: 22, high: 25, extreme: 29 },
        "8":  { moderate: 23, high: 26, extreme: 30 },
        "9":  { moderate: 25, high: 28, extreme: 32 },
        "10": { moderate: 26, high: 29, extreme: 33 },
        "11": { moderate: 27, high: 30, extreme: 34 },
        "12": { moderate: 29, high: 32, extreme: 36 },
        "13": { moderate: 30, high: 33, extreme: 37 },
        "14": { moderate: 31, high: 34, extreme: 39 },
        "15": { moderate: 33, high: 36, extreme: 40 },
        "16": { moderate: 34, high: 37, extreme: 41 },
        "17": { moderate: 35, high: 38, extreme: 43 },
        "18": { moderate: 37, high: 40, extreme: 44 },
        "19": { moderate: 38, high: 41, extreme: 46 },
        "20": { moderate: 39, high: 42, extreme: 47 },
        "21": { moderate: 41, high: 44, extreme: 48 },
        "22": { moderate: 42, high: 45, extreme: 50 },
        "23": { moderate: 43, high: 46, extreme: 51 },
        "24": { moderate: 45, high: 48, extreme: 52 },
        "25": { moderate: 46, high: 50, extreme: 53 } // На всякий случай
    };

    // Глобальная функция для вызова в предметах
    globalThis.MonsterDC = function(level, tier = "moderate") {
        // Если уровень передан как строка или число, приводим к строке для поиска в объекте
        const lvl = String(level);
        // Приводим тир к нижнему регистру
        const t = tier.toLowerCase();

        // Проверка на существование уровня в таблице
        if (!DC_TABLE[lvl]) return 10; // Возврат дефолтного значения при ошибке

        // Возвращаем значение или moderate, если тир указан неверно
        return DC_TABLE[lvl][t] || DC_TABLE[lvl]["moderate"];
    };
    
    console.log("PF2e Monster DC Helper | Loaded");
});