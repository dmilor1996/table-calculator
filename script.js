document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('tableForm');
  if (!form) return;

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    // ---- Ввод ----
    const topDiameter    = parseFloat(document.getElementById('topDiameter').value);
    const topThickness   = parseFloat(document.getElementById('topThickness').value);
    const tableHeight    = parseFloat(document.getElementById('tableHeight').value);
    const baseDiameter   = parseFloat(document.getElementById('baseDiameter').value);

    const beamWidth      = parseFloat(document.getElementById('beamWidth').value);     // ширина бруска (по касательной)
    const beamThickness  = parseFloat(document.getElementById('beamThickness').value); // толщина бруска (по радиусу)

    const railWidth      = parseFloat(document.getElementById('railWidth').value);
    const railThickness  = parseFloat(document.getElementById('railThickness').value);
    const railGap        = parseFloat(document.getElementById('railGap').value);       // расстояние между рейками

    const cutterDiameter = parseFloat(document.getElementById('cutterDiameter').value);
    const fiberboardGap  = parseFloat(document.getElementById('fiberboardGap').value) || 0; // мм, может быть отрицательным

    const topMaterial    = document.getElementById('topMaterial').value;
    const railMaterial   = document.getElementById('railMaterial').value;

    const ok = n => Number.isFinite(n) && n >= 0;
    if (![topDiameter, topThickness, tableHeight, baseDiameter,
          beamWidth, beamThickness, railWidth, railThickness,
          railGap, cutterDiameter].every(ok)) {
      alert('Проверь числа — где-то пусто или отрицательное.');
      return;
    }

    // ---- Константы ----
    const plywoodThickness    = 15;   // фанера (крышки), мм
    const fiberboardThickness = 3.2;  // ДВП, мм
    const grooveDepth         = 6;    // глубина паза, мм
    const crossBeamSize       = 40;   // поперечины 40×40 (сечение), мм

    // Плотности (кг/м³)
    const densities = {
      beech:      680,
      oak:        700,
      ash:        680,
      plywood:    600,
      pine:       500,
      fiberboard: 800,
    };

    // ---- Паз и крышки (исправлено под твою схему) ----
    // Снаружи внутрь: рейка -> ПАЗ(фреза) -> ДВП -> брусок
    const grooveOuterDiameter = baseDiameter - 2 * railThickness;
    const grooveInnerDiameter = baseDiameter - 2 * (railThickness + cutterDiameter);
    const innerRadius         = grooveInnerDiameter / 2;

    // Крышка Б = внутренний диаметр паза
    const lidDiameter = grooveInnerDiameter;

    // Промежуточная крышка: max(115% базы, 55% столешницы), округление к 5 мм вверх
    const roundUp5 = mm => Math.ceil(mm / 5) * 5;
    const intermediateDiameter = roundUp5(Math.max(baseDiameter * 1.15, topDiameter * 0.55));

    // ---- ДВП (лента) ----
    // Внешний диаметр ленты = внутренний диаметр паза + 2*толщину ДВП
    const fiberboardOuterDiameter = grooveInnerDiameter + 2 * fiberboardThickness;
    // Длина ленты — окружность по внешнему диаметру ленты, плюс технологический зазор (может быть отрицательным)
    const fiberboardLength = Math.PI * (fiberboardOuterDiameter + fiberboardGap);
    const fiberboardHeight = tableHeight - topThickness - 2 * plywoodThickness + grooveDepth;

    // ---- Основные бруски / рейки ----
    const mainBeamHeight  = tableHeight - topThickness - 3 * plywoodThickness; // 4 шт
    const railHeight      = tableHeight - topThickness - 2 * plywoodThickness;

    // Расчёт реек по окружности
    const circumference   = Math.PI * baseDiameter;       // окружность по diameter подстолья
    const desiredPitch    = railWidth + railGap;          // шаг "рейка + зазор"
    let   railCountDry    = Math.max(1, Math.floor(circumference / desiredPitch)); // сколько целиком влезет
    let   leftover        = circumference - railCountDry * desiredPitch;           // остаток между последней и первой

    // Рекомендуемая ширина рейки (при заданном зазоре и том же количестве) для ровного круга:
    let railSuggestedWidth = (circumference - railCountDry * railGap) / railCountDry;
    if (!Number.isFinite(railSuggestedWidth) || railSuggestedWidth < 0) railSuggestedWidth = 0;

    // ---- Поперечина: строгая геометрия с упором в внешнюю окружность ленты ДВП ----
    // Радиус опоры для бруска — внешняя окружность ленты ДВП
    const Rc = fiberboardOuterDiameter / 2;

    let crossBeamLength = 0;
    if (Rc > 0 && beamWidth / 2 < Rc) {
      const yOut = Math.sqrt(Rc * Rc - (beamWidth / 2) ** 2); // расстояние от центра до угла касания по радиусу
      crossBeamLength = 2 * (yOut - beamThickness);           // между внутренними гранями двух брусков
      if (crossBeamLength < 0) crossBeamLength = 0;
    }

    // ---- Объёмы и веса ----
    const mm3_to_m3 = v => v / 1e9;

    // Столешница
    const topVolume = Math.PI * Math.pow(topDiameter / 2, 2) * topThickness;
    const topWeight = mm3_to_m3(topVolume) * (densities[topMaterial] || 650);

    // Крышки (2× фанера)
    const lid1Volume = Math.PI * Math.pow(grooveOuterDiameter / 2, 2) * plywoodThickness;
    const lid2Volume = Math.PI * Math.pow(lidDiameter        / 2, 2) * plywoodThickness;
    const lidsVolume = lid1Volume + lid2Volume;
    const lidsWeight = mm3_to_m3(lidsVolume) * densities.plywood;

    // ДВП-лента
    const fiberboardVolume = fiberboardLength * fiberboardHeight * fiberboardThickness;
    const fiberboardWeight = mm3_to_m3(fiberboardVolume) * densities.fiberboard;

    // Основные бруски (4 шт)
    const mainBeamsVolume = (beamWidth * beamThickness * mainBeamHeight) * 4;

    // Поперечины: 2 шт 40×40, длина — рассчитанная выше
    const crossBeamsVolume = (crossBeamSize * crossBeamSize * crossBeamLength) * 2;

    // Рейки (по вашим исходным параметрам — фактическая ширина та, что введена)
    const railsVolume = (railWidth * railThickness * railHeight) * railCountDry;

    // Масса подстолья
    const beamsVolumeAll = mainBeamsVolume + crossBeamsVolume + railsVolume;
    const beamsWeight    = mm3_to_m3(beamsVolumeAll) * (densities[railMaterial] || densities.pine);

    const baseWeight  = lidsWeight + fiberboardWeight + beamsWeight;
    const totalWeight = topWeight + baseWeight;

    // ---- Вывод ----
    const set = (id, val, digits = 2) => {
      const el = document.getElementById(id);
      if (el) el.textContent = Number(val).toFixed(digits);
    };

    set('grooveOuterDiam',  grooveOuterDiameter);
    set('grooveInnerDiam',  grooveInnerDiameter);
    set('grooveInnerRadius',innerRadius);
    set('coverBDiam',       lidDiameter);
    set('midCoverDiam',     intermediateDiameter);

    set('fiberboardLength', fiberboardLength, 2);
    set('fiberboardHeight', fiberboardHeight, 0);

    set('mainBeamHeight',   mainBeamHeight, 0);
    set('crossBeamLength',  crossBeamLength, 2);

    // Рейки
    const rc = document.getElementById('railCount');
    if (rc) rc.textContent = String(railCountDry);
    set('railLeftover', leftover, 2);
    set('railSuggestedWidth', railSuggestedWidth, 2);
    set('railHeight', railHeight, 0);

    // Вес
    set('baseWeight',  baseWeight);
    set('topWeight',   topWeight);
    set('totalWeight', totalWeight);

    // показать блок результатов
    const res = document.getElementById('results');
    if (res) {
      res.classList.remove('hidden');
      res.style.display = 'block';
    }

    // Лог для проверки
    console.log(
      'grooveOuter=', grooveOuterDiameter.toFixed(2),
      'grooveInner=', grooveInnerDiameter.toFixed(2),
      'fiberOut=', fiberboardOuterDiameter.toFixed(2),
      'fiberLen=', fiberboardLength.toFixed(2),
      'Rc=', Rc.toFixed(2),
      'cross=', crossBeamLength.toFixed(2)
    );
  });
});
