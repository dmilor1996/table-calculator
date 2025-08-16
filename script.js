document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('tableForm');
  if (!form) return;

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    // ---- Ввод ----
    const topDiameter      = parseFloat(document.getElementById('topDiameter').value);
    const topThickness     = parseFloat(document.getElementById('topThickness').value);
    const tableHeight      = parseFloat(document.getElementById('tableHeight').value);
    const baseDiameter     = parseFloat(document.getElementById('baseDiameter').value);

    const beamWidth        = parseFloat(document.getElementById('beamWidth').value);
    const beamThickness    = parseFloat(document.getElementById('beamThickness').value);

    const railWidth        = parseFloat(document.getElementById('railWidth').value);
    const railThickness    = parseFloat(document.getElementById('railThickness').value);

    const cutterDiameter   = parseFloat(document.getElementById('cutterDiameter').value);

    const topMaterial      = document.getElementById('topMaterial').value;   // столешница
    const railMaterial     = document.getElementById('railMaterial').value;  // рейки/подстолье

    // Быстрые проверки
    const ok = n => Number.isFinite(n) && n >= 0;
    if (![topDiameter, topThickness, tableHeight, baseDiameter,
          beamWidth, beamThickness, railWidth, railThickness, cutterDiameter].every(ok)) {
      alert('Проверь числа — где-то пусто или отрицательное.');
      return;
    }

    // ---- Константы ----
    const plywoodThickness     = 15;   // фанера, мм (крышки)
    const fiberboardThickness  = 3.2;  // ДВП, мм
    const grooveDepth          = 6;    // глубина паза, мм
    const crossBeamSize        = 40;   // поперечины 40×40, мм (сечение)

    // Плотности (кг/м³)
    const densities = {
      beech:      680,
      oak:        700,
      ash:        680,
      plywood:    600,
      pine:       500,
      fiberboard: 800,
    };

    // ---- Геометрия подстолья ----
    // Паз на нижней крышке (наружный/внутренний диаметры)
    const grooveOuterDiameter = baseDiameter - 2 * (railThickness + fiberboardThickness) + cutterDiameter;
    const grooveInnerDiameter = baseDiameter - 2 * (railThickness + fiberboardThickness);
    const innerRadius         = grooveInnerDiameter / 2;

    // Крышка Б (внутренняя) = внутренний диаметр паза
    const lidDiameter = grooveInnerDiameter;

    // Промежуточная крышка: max(115% базы, 55% столешницы), округление к 5 мм вверх
    const roundUp5 = (mm) => Math.ceil(mm / 5) * 5;
    const intermediateDiameter = roundUp5(Math.max(baseDiameter * 1.15, topDiameter * 0.55));

    // Лист ДВП (лента)
    const fiberboardHeight = tableHeight - topThickness - 2 * plywoodThickness + grooveDepth;
    const fiberboardLength = Math.PI * grooveOuterDiameter + 2 * fiberboardThickness;

    // Бруски
    const mainBeamHeight  = tableHeight - topThickness - 3 * plywoodThickness; // 4 шт
    // Рейки
    const railHeight = tableHeight - topThickness - 2 * plywoodThickness;
    const railCount  = Math.max(1, Math.floor(Math.PI * baseDiameter / (railWidth + 0.2))); // +0.2 мм зазор

    // ---- Поперечины: точная геометрия от размеров бруска ----
    // Брус стоит углом в паз. Его центр сдвинут внутрь на половину диагонали прямоугольника.
    const R = innerRadius; // радиус внутреннего края паза
    const halfDiag = Math.sqrt(beamWidth ** 2 + beamThickness ** 2) / 2;

    // Длины поперечин:
    // X — поперечина, которую ограничивают "ширины" брусков
    // Y — поперечина, которую ограничивают "толщины" брусков
    const crossBeamLengthX = 2 * (R - halfDiag) - beamWidth;     // по оси, где видим ширины брусков
    const crossBeamLengthY = 2 * (R - halfDiag) - beamThickness; // по оси, где видим толщины

    // Для обратной совместимости (если в разметке остался один <span id="crossBeamLength">)
    const crossBeamLength = Math.min(crossBeamLengthX, crossBeamLengthY);

    // ---- Объёмы и веса ----
    const mm3_to_m3 = (v) => v / 1e9;

    // Столешница
    const topVolume = Math.PI * Math.pow(topDiameter / 2, 2) * topThickness;
    const topWeight = mm3_to_m3(topVolume) * (densities[topMaterial] || 650);

    // Крышки (фанера): нижняя по grooveOuterDiameter и внутренняя (Крышка Б) по lidDiameter
    const lid1Volume = Math.PI * Math.pow(grooveOuterDiameter / 2, 2) * plywoodThickness;
    const lid2Volume = Math.PI * Math.pow(lidDiameter        / 2, 2) * plywoodThickness;
    const lidsVolume = lid1Volume + lid2Volume;
    const lidsWeight = mm3_to_m3(lidsVolume) * densities['plywood'];

    // ДВП-лента
    const fiberboardVolume = fiberboardLength * fiberboardHeight * fiberboardThickness;
    const fiberboardWeight = mm3_to_m3(fiberboardVolume) * densities['fiberboard'];

    // Основные бруски (4 шт, прямоугольное сечение)
    const mainBeamsVolume = (beamWidth * beamThickness * mainBeamHeight) * 4;

    // Поперечины: 2 шт 40×40, длины X и Y — суммируем
    const crossBeamsVolume = (crossBeamSize * crossBeamSize) * (crossBeamLengthX + crossBeamLengthY);

    // Рейки: прямоугольное сечение, N шт
    const railsVolume = (railWidth * railThickness * railHeight) * railCount;

    // Масса подстолья (бруски + рейки по материалу railMaterial)
    const beamsVolumeAll = mainBeamsVolume + crossBeamsVolume + railsVolume;
    const beamsWeight    = mm3_to_m3(beamsVolumeAll) * (densities[railMaterial] || densities.pine);

    // Итоги
    const baseWeight  = lidsWeight + fiberboardWeight + beamsWeight;
    const totalWeight = topWeight + baseWeight;

    // ---- Вывод ----
    const set = (id, val, digits = 2) => {
      const el = document.getElementById(id);
      if (el) el.textContent = Number(val).toFixed(digits);
    };

    set('grooveOuterDiam', grooveOuterDiameter);
    set('grooveInnerDiam', grooveInnerDiameter);
    set('grooveInnerRadius', innerRadius);
    set('coverBDiam', lidDiameter);
    set('midCoverDiam', intermediateDiameter);

    set('fiberboardLength', fiberboardLength, 0);
    set('fiberboardHeight', fiberboardHeight, 0);

    set('mainBeamHeight',  mainBeamHeight, 0);

    // Новые поля вывода для двух поперечин:
    set('crossBeamLengthX', crossBeamLengthX, 0);
    set('crossBeamLengthY', crossBeamLengthY, 0);
    // Обратная совместимость:
    set('crossBeamLength',  crossBeamLength,  0);

    set('railHeight', railHeight, 0);
    const rc = document.getElementById('railCount'); 
    if (rc) rc.textContent = String(railCount);

    set('baseWeight',  baseWeight);
    set('topWeight',   topWeight);
    set('totalWeight', totalWeight);

    // показать блок результатов
    const res = document.getElementById('results');
    if (res) {
      res.classList.remove('hidden');
      res.style.display = 'block';
    }

    console.log('Calculated. railCount=', railCount,
                'crossBeamLengthX=', crossBeamLengthX,
                'crossBeamLengthY=', crossBeamLengthY);
  });
});
