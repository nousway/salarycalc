// Конфигурации регионов
const regionConfigs = {
  msk_zpc: {
    name: "Москва",
    currency: "RUB",
    vacancies: ["Оператор", "Стажёр"],
    rates: {
      oper: { dayShift: 5610, nightShift: 5520, vacationSick: 3285.71 },
      st: { dayShift: 5000, nightShift: 5000, vacationSick: 0 }
    }
  },
  kz_zpc: {
    name: "Казахстан",
    currency: "KZT",
    vacancies: ["Оператор", "Старший смены", "Стажёр"],
    rates: {
      oper: { dayShift: 22858, nightShift: 25142, vacationSick: 13285.71 },
      ss: { dayShift: 25143, nightShift: 27657, vacationSick: 14614.28 },
      st: { dayShift: 19429, nightShift: 21370, vacationSick: 0 }
    }
  }
};

let currentRegion = regionConfigs.kz_zpc; // По умолчанию Казахстан
let dayShiftRate = currentRegion.rates.oper.dayShift;
let nightShiftRate = currentRegion.rates.oper.nightShift;
let vacationSickRate = currentRegion.rates.oper.vacationSick;
let dayOffRate = (dayShiftRate + nightShiftRate) / 2;

// Проверка пароля региона
function checkPassword() {
  const password = document.getElementById('regionPassword').value.trim();
  const errorElement = document.getElementById('password-error');
  
  if (regionConfigs[password]) {
    currentRegion = regionConfigs[password];
    document.getElementById('auth-screen').classList.add('hidden');
    document.getElementById('calculator-app').classList.remove('hidden');
    updateRegionInfo();
    updateVacanciesDropdown();
    updateRates();
  } else {
    errorElement.textContent = "Неверный пароль региона";
  }
}

// Обновление информации о регионе
function updateRegionInfo() {
  document.title = `Калькулятор зарплаты | ${currentRegion.name}`;
  
  // Принудительно устанавливаем RUB для московского региона
  const currencyToShow = currentRegion.name === "Москва" ? "RUB" : currentRegion.currency;
  
  const currencyElements = document.querySelectorAll('.currency-symbol, [for="bonuses"], [for="penalties"], [for="receivedAmount"]');
  currencyElements.forEach(el => {
    // Обновляем текст в скобках (KZT) → (RUB)
    if (el.textContent.includes('(')) {
      el.textContent = el.textContent.replace(/\(.*\)/, `(${currencyToShow})`);
    } else {
      el.textContent = currencyToShow;
    }
  });
}

// Обновление dropdown с вакансиями
function updateVacanciesDropdown() {
  const positionSelect = document.getElementById('position');
  positionSelect.innerHTML = '';
  
  currentRegion.vacancies.forEach(vacancy => {
    const option = document.createElement('option');
    const valueMap = {
      'Оператор': 'oper',
      'Старший смены': 'ss',
      'Стажёр': 'st'
    };
    option.value = valueMap[vacancy];
    option.textContent = vacancy;
    positionSelect.appendChild(option);
  });
}

// Обновление ставок при изменении должности
function updateRates() {
  const position = document.getElementById('position').value;
  
  dayShiftRate = currentRegion.rates[position]?.dayShift || 0;
  nightShiftRate = currentRegion.rates[position]?.nightShift || 0;
  vacationSickRate = currentRegion.rates[position]?.vacationSick || 0;
  
  // Расчет ставки Day Off
  dayOffRate = (dayShiftRate + nightShiftRate) / 2;
}

// Форматирование числа с разделителями
function formatNumber(num) {
  return new Intl.NumberFormat('ru-RU').format(num.toFixed(2));
}

// Основная функция расчета
function calculateSalary() {
  try {
    const position = document.getElementById('position').value;
    // Получаем значения из формы
    const dayShifts = parseInt(document.getElementById('dayShifts').value) || 0;
    const nightShifts = parseInt(document.getElementById('nightShifts').value) || 0;
    const holidayDay = parseInt(document.getElementById('holidayDay').value) || 0;
    const holidayNight = parseInt(document.getElementById('holidayNight').value) || 0;
    const dayOffs = parseInt(document.getElementById('dayOffs').value) || 0;
    const vacationDays = parseInt(document.getElementById('vacationDays').value) || 0;
    const sickDays = parseInt(document.getElementById('sickDays').value) || 0;
    const penalties = parseFloat(document.getElementById('penalties').value) || 0;
    const bonuses = parseFloat(document.getElementById('bonuses').value) || 0;
    const receivedAmount = parseFloat(document.getElementById('receivedAmount').value) || 0;
    const advanceChecked = document.getElementById('avans').checked;
    const efficiencyChecked = document.getElementById('efficiency').checked;

    // Проверка на отрицательные значения
    if ([dayShifts, nightShifts, holidayDay, holidayNight, dayOffs, vacationDays, sickDays, penalties, bonuses, receivedAmount].some(val => val < 0)) {
      throw new Error("Все значения должны быть положительными");
    }

    // Проверка на максимальное количество смен (31 день)
    const totalShifts = dayShifts + nightShifts + holidayDay + holidayNight;
    if (totalShifts > 31) {
      throw new Error(`Общее количество смен (${totalShifts}) превышает максимально возможное (31)`);
    }

    // Проверка для испытательного срока
    if (position === 'st' && (vacationDays > 0 || sickDays > 0)) {
      if (!confirm("Для стажёра отпускные/больничные не предусмотрены. Продолжить без учета этих дней?")) {
        return;
      }
    }

    // Расчет базовой зарплаты
    let regularDaySalary = dayShifts * dayShiftRate;
    let regularNightSalary = nightShifts * nightShiftRate;

    // Применение премии за эффективность (10% только к обычным сменам)
    if (efficiencyChecked) {
      regularDaySalary *= 1.10;
      regularNightSalary *= 1.10;
    }

    // Расчет праздничных смен (без премии за эффективность)
    const holidayDaySalary = holidayDay * dayShiftRate;
    const holidayNightSalary = holidayNight * nightShiftRate;

    // Расчет Day Off
    const dayOffSalary = dayOffs * dayOffRate;

    // Расчет отпускных/больничных
    const vacationSickSalary = (vacationDays + sickDays) * vacationSickRate;

    // Итоговый расчет
    let totalSalary = regularDaySalary + regularNightSalary + 
                     holidayDaySalary + holidayNightSalary + 
                     dayOffSalary + vacationSickSalary - 
                     penalties + bonuses;

    // Вычет аванса
    if (advanceChecked) {
      totalSalary -= 70000;
    }

    // Расчет разницы с полученной суммой
    const difference = totalSalary - receivedAmount;
    let differenceText = '';

    if (receivedAmount > 0) {
      if (difference > 0) {
        differenceText = `<div class="difference">Недостача: <span class="negative">${formatNumber(difference)} ${currentRegion.currency}</span></div>`;
      } else if (difference < 0) {
        differenceText = `<div class="difference">Переплата: <span class="positive">${formatNumber(-difference)} ${currentRegion.currency}</span></div>`;
      } else {
        differenceText = `<div class="difference">Суммы совпадают</div>`;
      }
    }

    // Формируем детализированный результат
    let resultHTML = `
      <div style="text-align: left; margin-bottom: 10px;">
        <div>Обычные дневные: ${dayShifts} × ${formatNumber(dayShiftRate)} = <strong>${formatNumber(regularDaySalary)} ${currentRegion.currency}</strong></div>
        <div>Обычные ночные: ${nightShifts} × ${formatNumber(nightShiftRate)} = <strong>${formatNumber(regularNightSalary)} ${currentRegion.currency}</strong></div>
        ${holidayDay > 0 ? `<div>Праздничные дневные: ${holidayDay} × ${formatNumber(dayShiftRate)} = <strong>${formatNumber(holidayDaySalary)} ${currentRegion.currency}</strong></div>` : ''}
        ${holidayNight > 0 ? `<div>Праздничные ночные: ${holidayNight} × ${formatNumber(nightShiftRate)} = <strong>${formatNumber(holidayNightSalary)} ${currentRegion.currency}</strong></div>` : ''}
        ${dayOffs > 0 ? `<div>Day Off: ${dayOffs} × ${formatNumber(dayOffRate)} = <strong>${formatNumber(dayOffSalary)} ${currentRegion.currency}</strong></div>` : ''}
        ${vacationDays > 0 && vacationSickRate > 0 ? `<div>Отпускные: ${vacationDays} × ${formatNumber(vacationSickRate)} = <strong>${formatNumber(vacationDays * vacationSickRate)} ${currentRegion.currency}</strong></div>` : ''}
        ${sickDays > 0 && vacationSickRate > 0 ? `<div>Больничные: ${sickDays} × ${formatNumber(vacationSickRate)} = <strong>${formatNumber(sickDays * vacationSickRate)} ${currentRegion.currency}</strong></div>` : ''}
        ${penalties > 0 ? `<div>Штрафы: -${formatNumber(penalties)} ${currentRegion.currency}</div>` : ''}
        ${bonuses > 0 ? `<div>Премии: +${formatNumber(bonuses)} ${currentRegion.currency}</div>` : ''}
        ${advanceChecked ? `<div>Аванс: -70 000 ${currentRegion.currency}</div>` : ''}
        ${receivedAmount > 0 ? `<div>Поступило: ${formatNumber(receivedAmount)} ${currentRegion.currency}</div>` : ''}
      </div>
      <div style="border-top: 1px solid #ddd; padding-top: 10px; margin-top: 10px;">
        Итоговая зарплата: <strong>${formatNumber(totalSalary)} ${currentRegion.currency}</strong>
        ${differenceText}
      </div>
    `;

    // Проверка на отрицательную зарплату
    if (totalSalary < 0) {
      document.getElementById('result').style.color = 'var(--accent-color)';
    } else {
      document.getElementById('result').style.color = 'var(--primary-color)';
    }

    document.getElementById('result').innerHTML = resultHTML;

    // Показываем результат с анимацией
    const resultElement = document.getElementById('result');
    resultElement.classList.remove('hidden');
    resultElement.classList.add('fadeIn');

    // Сохраняем данные в localStorage
    saveFormData();

  } catch (error) {
    alert(`Ошибка: ${error.message}`);
    console.error(error);
  }
}

// Сброс формы
function resetForm() {
  document.getElementById('position').value = 'oper';
  document.getElementById('dayShifts').value = '';
  document.getElementById('nightShifts').value = '';
  document.getElementById('holidayDay').value = '';
  document.getElementById('holidayNight').value = '';
  document.getElementById('dayOffs').value = '';
  document.getElementById('vacationDays').value = '';
  document.getElementById('sickDays').value = '';
  document.getElementById('penalties').value = '';
  document.getElementById('bonuses').value = '';
  document.getElementById('receivedAmount').value = '';
  document.getElementById('avans').checked = false;
  document.getElementById('efficiency').checked = true;
  document.getElementById('result').classList.add('hidden');

  // Обновляем ставки после сброса
  updateRates();
}

// Сохранение данных формы
function saveFormData() {
  const formData = {
    position: document.getElementById('position').value,
    dayShifts: document.getElementById('dayShifts').value,
    nightShifts: document.getElementById('nightShifts').value,
    holidayDay: document.getElementById('holidayDay').value,
    holidayNight: document.getElementById('holidayNight').value,
    dayOffs: document.getElementById('dayOffs').value,
    vacationDays: document.getElementById('vacationDays').value,
    sickDays: document.getElementById('sickDays').value,
    penalties: document.getElementById('penalties').value,
    bonuses: document.getElementById('bonuses').value,
    receivedAmount: document.getElementById('receivedAmount').value,
    avans: document.getElementById('avans').checked,
    efficiency: document.getElementById('efficiency').checked
  };

  localStorage.setItem('salaryCalculatorData', JSON.stringify(formData));
}

// Загрузка сохраненных данных
function loadFormData() {
  const savedData = localStorage.getItem('salaryCalculatorData');
  if (savedData) {
    const formData = JSON.parse(savedData);

    document.getElementById('position').value = formData.position || 'oper';
    document.getElementById('dayShifts').value = formData.dayShifts || '';
    document.getElementById('nightShifts').value = formData.nightShifts || '';
    document.getElementById('holidayDay').value = formData.holidayDay || '';
    document.getElementById('holidayNight').value = formData.holidayNight || '';
    document.getElementById('dayOffs').value = formData.dayOffs || '';
    document.getElementById('vacationDays').value = formData.vacationDays || '';
    document.getElementById('sickDays').value = formData.sickDays || '';
    document.getElementById('penalties').value = formData.penalties || '';
    document.getElementById('bonuses').value = formData.bonuses || '';
    document.getElementById('receivedAmount').value = formData.receivedAmount || '';
    document.getElementById('avans').checked = formData.avans || false;
    document.getElementById('efficiency').checked = formData.efficiency !== false;

    // Обновляем ставки при загрузке
    updateRates();
  }
}

// Переключение видимости инструкции
function toggleGuide() {
  const guide = document.querySelector('.guide');
  guide.classList.toggle('collapsed');

  // Устанавливаем высоту контента перед анимацией
  if (!guide.classList.contains('collapsed')) {
    const content = guide.querySelector('.guide-content');
    content.style.maxHeight = content.scrollHeight + 'px';
  }
}

// Переключение темы
function toggleTheme() {
  document.body.classList.toggle('dark-theme');
  localStorage.setItem('darkTheme', document.body.classList.contains('dark-theme'));
  
  // Обновляем иконку темы
  const themeIcon = document.querySelector('.theme-toggle i');
  if (themeIcon) {
    themeIcon.className = document.body.classList.contains('dark-theme') ? 'fas fa-sun' : 'fas fa-moon';
  }
}

window.onload = function() {
  // Инициализация темы
  const isDarkTheme = localStorage.getItem('darkTheme') === 'true';
  if (isDarkTheme) {
    document.body.classList.add('dark-theme');
  }

  // Инициализация иконки темы
  const themeToggle = document.querySelector('.theme-toggle');
  if (themeToggle) {
    const themeIcon = document.createElement('i');
    themeIcon.className = isDarkTheme ? 'fas fa-sun' : 'fas fa-moon';
    themeToggle.appendChild(themeIcon);
  }

  // Остальной код инициализации...
  loadFormData();
  updateRates();
  
  // Инициализация сворачиваемой инструкции
  const guide = document.querySelector('.guide');
  const content = guide.querySelector('.guide-content');
  content.style.maxHeight = content.scrollHeight + 'px';
  guide.classList.add('collapsed');

  // Обработчики для полей ввода
  document.querySelectorAll('input[type="number"]').forEach(input => {
    input.addEventListener('focus', function() {
      if (this.value === '0') this.value = '';
    });
    input.addEventListener('blur', function() {
      if (this.value === '') this.value = '0';
    });
  });

  // Если есть пароль в URL (для удобства тестирования)
  const urlParams = new URLSearchParams(window.location.search);
  const passwordParam = urlParams.get('password');
  if (passwordParam && regionConfigs[passwordParam]) {
    document.getElementById('regionPassword').value = passwordParam;
    checkPassword();
  }
};
