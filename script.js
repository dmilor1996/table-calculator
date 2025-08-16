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

    // Быстрые проверки, чтобы не падать
    function ok(n){ return Number.isFinite(n) && n >= 0; }
    if (![topDiameter, topThickness, tableHeight, baseDiameter, beamWidth, beamThickness, railWidth, railThickness, cutterDiameter]
        .every(ok)) { alert('Проверь числа — где-то пусто или отрицательное.'); return; }

    // ---- Константы ----
    const plywoodThickness     = 15;   // фанера, мм (крышки)
    const fiberboardThickness  = 3.2;  // ДВП, мм
    const grooveDepth          = 6;    // глубина паза, мм
    const crossBeamSize        = 40;   // поперечные бруски 40×40, мм

    // Плотности (кг/м³)
    const densities = {
      beech:     680,
      oak:       700,
      ash:       680,
      plywood:   600,
      pine:      500,
      fiberboard:800,
    };

    // ---- Геометрия подстолья ----
    // Паз на нижней крышке (наружный и внутренний диаметры)
    const grooveOuterDiameter = baseDiameter - 2 * (railThickness + fiberboardThickness) + cutterDiameter;
    const grooveInnerDiameter = baseDiameter - 2 * (railThickness + fiberboardThickness);
    const innerRadius         = grooveInnerDiameter / 2;

    // Крышка Б (внутренняя) = внутренний диаметр паза
    const lidDiameter = grooveInnerDiameter;

    // Промежуточная крышка: max(115% базы, 55% столешницы), округление к 5 мм вверх
    function roundUp5(mm){ return Math.ceil(mm / 5) * 5; }
    const intermediateDiameter = roundUp5(Math.max(baseDiameter * 1.15, topDiameter * 0.55));

    // Лист ДВП (лента)
    const fiberboardHeight = tableHeight - topThickness - 2 * plywoodThickness + grooveDepth;
    const fiberboardLength = Math.PI * grooveOuterDiameter + 2 * fiberboardThickness; // как в старой логике

    // Бруски
    const mainBeamHeight  = tableHeight - topThickness - 3 * plywoodThickness; // основные (4 шт)
    const crossBeamLength = grooveInnerDiameter - 2 * crossBeamSize;           // поперечные (2 шт, 40×40)

    // Рейки по кругу
    const railHeight = tableHeight - topThickness - 2 * plywoodThickness;
    const railCount  = Math.max(1, Math.floor(Math.PI * baseDiameter / (railWidth + 0.2))); // +0.2 мм зазор

    // ---- Объёмы и веса ----
    const mm3_to_m3 = v => v / 1e9;

    // Столешница
    const topVolume = Math.PI * Math.pow(topDiameter / 2, 2) * topThickness; // мм³
    const topWeight = mm3_to_m3(topVolume) * (densities[topMaterial] || 650);

    // Крышки (фанера): нижняя круглая по grooveOuterDiameter и внутренняя (Крышка Б) по lidDiameter
    const lid1Volume = Math.PI * Math.pow(grooveOuterDiameter / 2, 2) * plywoodThickness;
    const lid2Volume = Math.PI * Math.pow(lidDiameter        / 2, 2) * plywoodThickness;
    const lidsVolume = lid1Volume + lid2Volume;
    const lidsWeight = mm3_to_m3(lidsVolume) * densities['plywood'];

    // ДВП-лента
    const fiberboardVolume = fiberboardLength * fiberboardHeight * fiberboardThickness;
    const fiberboardWeight = mm3_to_m3(fiberboardVolume) * densities['fiberboard'];

    // Основные бруски: прямоугольное сечение (beamWidth × beamThickness), 4 шт
    const mainBeamsVolume = (beamWidth * beamThickness * mainBeamHeight) * 4;
    // Поперечные бруски: 40×40, 2 шт
    const crossBeamsVolume = (crossBeamSize * crossBeamSize * crossBeamLength) * 2;

    // Рейки: прямоугольное сечение (railWidth × railThickness), N шт
    const railsVolume = (railWidth * railThickness * railHeight) * railCount;

    // Масса брусков + реек — по материалу подстолья (railMaterial)
    const beamsVolumeAll = mainBeamsVolume + crossBeamsVolume + railsVolume;
    const beamsWeight    = mm3_to_m3(beamsVolumeAll) * (densities[railMaterial] || densities.pine);

    // Итого подстолье и общий вес
    const baseWeight  = lidsWeight + fiberboardWeight + beamsWeight;
    const totalWeight = topWeight + baseWeight;

    // ---- Вывод ----
    function set(id, val, digits=2) {
      const el = document.getElementById(id);
      if (el) el.textContent = Number(val).toFixed(digits);
    }

    set('grooveOuterDiameter', grooveOuterDiameter);
    set('grooveInnerDiameter', grooveInnerDiameter);
    set('lidDiameter',         lidDiameter);
    set('intermediateDiameter',intermediateDiameter);

    set('fiberboardLength', fiberboardLength, 0);
    set('fiberboardHeight', fiberboardHeight, 0);

    set('mainBeamHeight',  mainBeamHeight, 0);
    set('crossBeamLength', crossBeamLength, 0);

    set('railHeight', railHeight, 0);
    const rc = document.getElementById('railCount'); if (rc) rc.textContent = String(railCount);

    set('baseWeight',  baseWeight);
    set('topWeight',   topWeight);
    set('totalWeight', totalWeight);
  });
});
