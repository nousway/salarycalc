const regionConfigs = {
  msk_zpc: {
    name: "Москва",
    currency: "RUB",
    vacancies: ["Оператор", "Стажёр"],
    rates: {
      oper: { dayShift: 5160, nightShift: 5520, vacationSick: 2956.07 },
      st: { dayShift: 4386, nightShift: 4692, vacationSick: 0 }
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

let currentRegion = regionConfigs.kz_zpc;
let dayShiftRate = currentRegion.rates.oper.dayShift;
let nightShiftRate = currentRegion.rates.oper.nightShift;
let vacationSickRate = currentRegion.rates.oper.vacationSick;
let dayOffRate = (dayShiftRate + nightShiftRate) / 2;

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

function updateRegionInfo() {
  document.title = `Калькулятор зарплаты | ${currentRegion.name}`;
  
  const currencyToShow = currentRegion.name === "Москва" ? "RUB" : currentRegion.currency;
  
  const currencyElements = document.querySelectorAll('.currency-symbol, [for="bonuses"], [for="penalties"], [for="receivedAmount"]');
  currencyElements.forEach(el => {
    if (el.textContent.includes('(')) {
      el.textContent = el.textContent.replace(/\(.*\)/, `(${currencyToShow})`);
    } else {
      el.textContent = currencyToShow;
    }
  });
}

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

function updateRates() {
  const position = document.getElementById('position').value;
  
  dayShiftRate = currentRegion.rates[position]?.dayShift || 0;
  nightShiftRate = currentRegion.rates[position]?.nightShift || 0;
  vacationSickRate = currentRegion.rates[position]?.vacationSick || 0;
  
  dayOffRate = (dayShiftRate + nightShiftRate) / 2;
}

function formatNumber(num) {
  return new Intl.NumberFormat('ru-RU').format(num.toFixed(2));
}

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
    const efficiencyChecked = document.getElementById('efficiency').checked;

    if ([dayShifts, nightShifts, holidayDay, holidayNight, dayOffs, vacationDays, sickDays, penalties, bonuses, receivedAmount].some(val => val < 0)) {
      throw new Error("Все значения должны быть положительными");
    }

    const totalShifts = dayShifts + nightShifts + holidayDay + holidayNight;
    if (totalShifts > 31) {
      throw new Error(`Общее количество смен (${totalShifts}) превышает максимально возможное (31)`);
    }

    if (position === 'st' && (vacationDays > 0 || sickDays > 0)) {
      if (!confirm("Для стажёра отпускные/больничные не предусмотрены. Продолжить без учета этих дней?")) {
        return;
      }
    }

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
        ${receivedAmount > 0 ? `<div>Поступило: ${formatNumber(receivedAmount)} ${currentRegion.currency}</div>` : ''}
      </div>
      <div style="border-top: 1px solid #ddd; padding-top: 10px; margin-top: 10px;">
        Итоговая зарплата: <strong>${formatNumber(totalSalary)} ${currentRegion.currency}</strong>
        ${differenceText}
      </div>
    `;

    document.getElementById('result').style.color = totalSalary < 0 ? 'var(--accent-color)' : 'var(--primary-color)';
    document.getElementById('result').innerHTML = resultHTML;
    document.getElementById('result').classList.remove('hidden');
    document.getElementById('result').classList.add('fadeIn');

    saveFormData();
  } catch (error) {
    alert(`Ошибка: ${error.message}`);
    console.error(error);
  }
}

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
  document.getElementById('efficiency').checked = true;
  document.getElementById('result').classList.add('hidden');
  updateRates();
}

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
    efficiency: document.getElementById('efficiency').checked
  };

  localStorage.setItem('salaryCalculatorData', JSON.stringify(formData));
}

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
    document.getElementById('efficiency').checked = formData.efficiency !== false;
    updateRates();
  }
}

function toggleGuide() {
  const guide = document.querySelector('.guide');
  guide.classList.toggle('collapsed');
  if (!guide.classList.contains('collapsed')) {
    const content = guide.querySelector('.guide-content');
    content.style.maxHeight = content.scrollHeight + 'px';
  }
}

function toggleTheme() {
  document.body.classList.toggle('dark-theme');
  localStorage.setItem('darkTheme', document.body.classList.contains('dark-theme'));
  const themeIcon = document.querySelector('.theme-toggle i');
  if (themeIcon) {
    themeIcon.className = document.body.classList.contains('dark-theme') ? 'fas fa-sun' : 'fas fa-moon';
  }
}

window.onload = function() {
  const isDarkTheme = localStorage.getItem('darkTheme') === 'true';
  if (isDarkTheme) {
    document.body.classList.add('dark-theme');
  }

  const themeToggle = document.querySelector('.theme-toggle');
  if (themeToggle) {
    const themeIcon = document.createElement('i');
    themeIcon.className = isDarkTheme ? 'fas fa-sun' : 'fas fa-moon';
    themeToggle.appendChild(themeIcon);
  }

  loadFormData();
  updateRates();

  const guide = document.querySelector('.guide');
  const content = guide.querySelector('.guide-content');
  content.style.maxHeight = content.scrollHeight + 'px';
  guide.classList.add('collapsed');

  document.querySelectorAll('input[type="number"]').forEach(input => {
    input.addEventListener('focus', function() {
      if (this.value === '0') this.value = '';
    });
    input.addEventListener('blur', function() {
      if (this.value === '') this.value = '0';
    });
  });

  const urlParams = new URLSearchParams(window.location.hash);
  const passwordParam = urlParams.get('password');
  if (passwordParam && regionConfigs[passwordParam]) {
    document.getElementById('regionPassword').value = passwordParam;
    checkPassword();
  }
};
