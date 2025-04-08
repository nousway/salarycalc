  // Текущие ставки
  let dayShiftRate = 22858;
  let nightShiftRate = 25142;
  let vacationSickRate = 13285.71;
  let dayOffRate = (dayShiftRate + nightShiftRate) / 2;

  // Обновление ставок при изменении должности
  function updateRates() {
    const position = document.getElementById('position').value;

    switch(position) {
      case 'ss': // Старший смены
        dayShiftRate = 25143;
        nightShiftRate = 27657;
        vacationSickRate = 14614.28;
        break;
      case 'st': // Испытательный срок
        dayShiftRate = 19429;
        nightShiftRate = 21370;
        vacationSickRate = 0; // Не предусмотрены
        break;
      default: // Оператор
        dayShiftRate = 22858;
        nightShiftRate = 25142;
        vacationSickRate = 13285.71;
    }

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

      // Проверка для испытательного срока
      if (position === 'st' && (vacationDays > 0 || sickDays > 0)) {
        if (!confirm("Для испытательного срока отпускные/больничные не предусмотрены. Продолжить без учета этих дней?")) {
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
          differenceText = `<div class="difference">Недостача: <span class="negative">${formatNumber(difference)} KZT</span></div>`;
        } else if (difference < 0) {
          differenceText = `<div class="difference">Переплата: <span class="positive">${formatNumber(-difference)} KZT</span></div>`;
        } else {
          differenceText = `<div class="difference">Суммы совпадают</div>`;
        }
      }

      // Формируем детализированный результат
      let resultHTML = `
        <div style="text-align: left; margin-bottom: 10px;">
          <div>Обычные дневные: ${dayShifts} × ${formatNumber(dayShiftRate)} = <strong>${formatNumber(regularDaySalary)} KZT</strong></div>
          <div>Обычные ночные: ${nightShifts} × ${formatNumber(nightShiftRate)} = <strong>${formatNumber(regularNightSalary)} KZT</strong></div>
          ${holidayDay > 0 ? `<div>Праздничные дневные: ${holidayDay} × ${formatNumber(dayShiftRate)} = <strong>${formatNumber(holidayDaySalary)} KZT</strong></div>` : ''}
          ${holidayNight > 0 ? `<div>Праздничные ночные: ${holidayNight} × ${formatNumber(nightShiftRate)} = <strong>${formatNumber(holidayNightSalary)} KZT</strong></div>` : ''}
          ${dayOffs > 0 ? `<div>Day Off: ${dayOffs} × ${formatNumber(dayOffRate)} = <strong>${formatNumber(dayOffSalary)} KZT</strong></div>` : ''}
          ${vacationDays > 0 ? `<div>Отпускные: ${vacationDays} × ${formatNumber(vacationSickRate)} = <strong>${formatNumber(vacationDays * vacationSickRate)} KZT</strong></div>` : ''}
          ${sickDays > 0 ? `<div>Больничные: ${sickDays} × ${formatNumber(vacationSickRate)} = <strong>${formatNumber(sickDays * vacationSickRate)} KZT</strong></div>` : ''}
          ${penalties > 0 ? `<div>Штрафы: -${formatNumber(penalties)} KZT</div>` : ''}
          ${bonuses > 0 ? `<div>Премии: +${formatNumber(bonuses)} KZT</div>` : ''}
          ${advanceChecked ? `<div>Аванс: -70 000 KZT</div>` : ''}
          ${receivedAmount > 0 ? `<div>Поступило: ${formatNumber(receivedAmount)} KZT</div>` : ''}
        </div>
        <div style="border-top: 1px solid #ddd; padding-top: 10px; margin-top: 10px;">
          Итоговая зарплата: <strong>${formatNumber(totalSalary)} KZT</strong>
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

  // Инициализация при загрузке страницы
  window.onload = function() {
    loadFormData();
    updateRates();

    // Инициализация сворачиваемой инструкции
    const guide = document.querySelector('.guide');
    const content = guide.querySelector('.guide-content');
    content.style.maxHeight = content.scrollHeight + 'px';
    guide.classList.add('collapsed');

    // Обработчики для полей ввода
    document.querySelectorAll('input[type="number"]').forEach(input => {
      // Очищаем поле при получении фокуса, если значение 0
      input.addEventListener('focus', function() {
        if (this.value === '0') {
          this.value = '';
        }
      });

      // Устанавливаем 0 если поле пустое при потере фокуса
      input.addEventListener('blur', function() {
        if (this.value === '') {
          this.value = '0';
        }
      });
    });
  };
