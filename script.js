// Конфигурации регионов
const regionConfigs = {
  msk_zpc: {
    name: "Москва",
    currency: "RUB",
    advanceAmount: 14500,
    vacancies: ["Оператор", "Стажёр"],
    rates: {
      oper: { dayShift: 5610, nightShift: 5520, vacationSick: 3285.71 },
      st: { dayShift: 5000, nightShift: 5000, vacationSick: 0 }
    }
  },
  kz_zpc: {
    name: "Казахстан",
    currency: "KZT",
    advanceAmount: 70000,
    vacancies: ["Оператор", "Старший смены", "Стажёр"],
    rates: {
      oper: { dayShift: 22858, nightShift: 25142, vacationSick: 13285.71 },
      ss: { dayShift: 25143, nightShift: 27657, vacationSick: 14614.28 },
      st: { dayShift: 19429, nightShift: 21370, vacationSick: 0 }
    }
  }
};

let currentRegion = regionConfigs.kz_zpc;
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
    
    // Обновляем текст аванса
    document.querySelector('label[for="avans"]').innerHTML = 
      `Вычесть аванс (${currentRegion.advanceAmount.toLocaleString('ru-RU')} ${currentRegion.currency})`;
  } else {
    errorElement.textContent = "Неверный пароль региона";
  }
}

// Обновление информации о регионе
function updateRegionInfo() {
  document.title = `Калькулятор зарплаты | ${currentRegion.name}`;
  
  // Обновляем все элементы с валютой
  const currencyElements = document.querySelectorAll('[class*="currency"], [for="bonuses"], [for="penalties"], [for="receivedAmount"]');
  currencyElements.forEach(el => {
    if (el.textContent.includes('(')) {
      el.textContent = el.textContent.replace(/\(.*\)/, `(${currentRegion.currency})`);
    } else if (el.classList.contains('currency-symbol')) {
      el.textContent = currentRegion.currency;
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

    // Валидации
    if ([dayShifts, nightShifts, holidayDay, holidayNight, dayOffs, vacationDays, sickDays].some(val => val < 0)) {
      throw new Error("Количество смен не может быть отрицательным");
    }

    const totalShifts = dayShifts + nightShifts + holidayDay + holidayNight;
    if (totalShifts > 31) {
      throw new Error(`Общее количество смен (${totalShifts}) превышает 31 день`);
    }

    if (position === 'st' && (vacationDays > 0 || sickDays > 0)) {
      if (!confirm("Для стажёра отпускные/больничные не предусмотрены. Продолжить?")) return;
    }

    // Расчеты
    let regularDaySalary = dayShifts * dayShiftRate;
    let regularNightSalary = nightShifts * nightShiftRate;

    if (efficiencyChecked) {
      regularDaySalary *= 1.10;
      regularNightSalary *= 1.10;
    }

    const holidayDaySalary = holidayDay * dayShiftRate;
    const holidayNightSalary = holidayNight * nightShiftRate;
    const dayOffSalary = dayOffs * dayOffRate;
    const vacationSickSalary = (vacationDays + sickDays) * vacationSickRate;

    let totalSalary = regularDaySalary + regularNightSalary + 
                     holidayDaySalary + holidayNightSalary + 
                     dayOffSalary + vacationSickSalary - 
                     penalties + bonuses;

    if (advanceChecked) {
      totalSalary -= currentRegion.advanceAmount;
    }

    // Формирование результата
    const currency = currentRegion.currency;
    let resultHTML = `
      <div class="result-details">
        <div>Обычные дневные: ${dayShifts} × ${formatNumber(dayShiftRate)} = <strong>${formatNumber(regularDaySalary)} ${currency}</strong></div>
        <div>Обычные ночные: ${nightShifts} × ${formatNumber(nightShiftRate)} = <strong>${formatNumber(regularNightSalary)} ${currency}</strong></div>
        ${holidayDay > 0 ? `<div>Праздничные дневные: ${holidayDay} × ${formatNumber(dayShiftRate)} = <strong>${formatNumber(holidayDaySalary)} ${currency}</strong></div>` : ''}
        ${holidayNight > 0 ? `<div>Праздничные ночные: ${holidayNight} × ${formatNumber(nightShiftRate)} = <strong>${formatNumber(holidayNightSalary)} ${currency}</strong></div>` : ''}
        ${dayOffs > 0 ? `<div>Day Off: ${dayOffs} × ${formatNumber(dayOffRate)} = <strong>${formatNumber(dayOffSalary)} ${currency}</strong></div>` : ''}
        ${vacationDays > 0 && vacationSickRate > 0 ? `<div>Отпускные: ${vacationDays} × ${formatNumber(vacationSickRate)} = <strong>${formatNumber(vacationDays * vacationSickRate)} ${currency}</strong></div>` : ''}
        ${sickDays > 0 && vacationSickRate > 0 ? `<div>Больничные: ${sickDays} × ${formatNumber(vacationSickRate)} = <strong>${formatNumber(sickDays * vacationSickRate)} ${currency}</strong></div>` : ''}
        ${penalties > 0 ? `<div>Штрафы: -${formatNumber(penalties)} ${currency}</div>` : ''}
        ${bonuses > 0 ? `<div>Премии: +${formatNumber(bonuses)} ${currency}</div>` : ''}
        ${advanceChecked ? `<div>Аванс: -${currentRegion.advanceAmount.toLocaleString('ru-RU')} ${currency}</div>` : ''}
        ${receivedAmount > 0 ? `<div>Поступило: ${formatNumber(receivedAmount)} ${currency}</div>` : ''}
      </div>
      <div class="result-total">
        Итоговая зарплата: <strong>${formatNumber(totalSalary)} ${currency}</strong>
        ${receivedAmount > 0 ? `
          <div class="difference">
            ${difference > 0 ? `Недостача: <span class="negative">${formatNumber(difference)} ${currency}</span>` : 
             difference < 0 ? `Переплата: <span class="positive">${formatNumber(-difference)} ${currency}</span>` : 
             'Суммы совпадают'}
          </div>
        ` : ''}
      </div>
    `;

    document.getElementById('result').innerHTML = resultHTML;
    document.getElementById('result').classList.remove('hidden');

    // Сохранение данных
    saveFormData();

  } catch (error) {
    alert(`Ошибка: ${error.message}`);
    console.error(error);
  }
}

// Остальные функции остаются без изменений
// (resetForm, saveFormData, loadFormData, toggleGuide, toggleTheme)

// Инициализация
window.onload = function() {
  // Инициализация темы
  if (localStorage.getItem('darkTheme') === 'true') {
    document.body.classList.add('dark-theme');
  }

  // Инициализация калькулятора
  loadFormData();
  updateRates();
  
  // Обработчики полей ввода
  document.querySelectorAll('input[type="number"]').forEach(input => {
    input.addEventListener('focus', function() { if (this.value === '0') this.value = ''; });
    input.addEventListener('blur', function() { if (this.value === '') this.value = '0'; });
  });

  // Автовход по URL
  const urlParams = new URLSearchParams(window.location.search);
  const passwordParam = urlParams.get('password');
  if (passwordParam && regionConfigs[passwordParam]) {
    document.getElementById('regionPassword').value = passwordParam;
    checkPassword();
  }
};
