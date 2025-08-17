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

    // ---- Паз и крышки (снаружи внутрь: рейка -> паз(фреза) -> ДВП -> брусок) ----
    const grooveOuterDiameter = baseDiameter - 2 * railThickness;
    const grooveInnerDiameter = baseDiameter - 2 * (railThickness + cutterDiameter);
    const innerRadius         = grooveInnerDiameter / 2;

    // Крышка Б = внутренний диаметр паза
    const lidDiameter = grooveInnerDiameter;

    // Промежуточная крышка: max(115% базы, 55% столешницы), округление к 5 мм вверх
    const roundUp5 = mm => Math.ceil(mm / 5) * 5;
    const intermediateDiameter = roundUp5(Math.max(baseDiameter * 1.15, topDiameter * 0.55));

    // ---- ДВП (лента) ----
    const fiberboardOuterDiameter = grooveInnerDiameter + 2 * fiberboardThickness;
    const fiberboardLength = Math.PI * (fiberboardOuterDiameter + fiberboardGap);
    const fiberboardHeight = tableHeight - topThickness - 2 * plywoodThickness + grooveDepth;

    // ---- Основные бруски / рейки ----
    const mainBeamHeight  = tableHeight - topThickness - 3 * plywoodThickness; // 4 шт
    const railHeight      = tableHeight - topThickness - 2 * plywoodThickness;

    // Расчёт реек по окружности
    const circumference   = Math.PI * baseDiameter;       // окружность по диаметру подстолья
    const desiredPitch    = railWidth + railGap;          // шаг "рейка + зазор"
    let   railCountDry    = Math.max(1, Math.floor(circumference / desiredPitch)); // сколько целиком влезет
    let   leftover        = circumference - railCountDry * desiredPitch;           // остаток между последней и первой

    // Рекомендуемая ширина рейки (при заданном зазоре и том же количестве) для ровного круга:
    let railSuggestedWidth = (circumference - railCountDry * railGap) / railCountDry;
    if (!Number.isFinite(railSuggestedWidth) || railSuggestedWidth < 0) railSuggestedWidth = 0;

    // ---- Поперечина: строгая геометрия с упором в внешнюю окружность ленты ДВП ----
    const Rc = fiberboardOuterDiameter / 2; // радиус, куда брусок упирается углом (внешняя кромка ДВП)

    let crossBeamLength = 0;
    if (Rc > 0 && beamWidth / 2 < Rc) {
      const yOut = Math.sqrt(Rc * Rc - (beamWidth / 2) ** 2); // расстояние от центра до угла касания по радиусу
      crossBeamLength = 2 * (yOut - beamThickness);           // между внутренними гранями двух брусков
      if (crossBeamLength < 0) crossBeamLength = 0;
    }

    // ---- Объёмы и веса ----
    const mm3_to_m3 = v => v / 1e9;

    const topVolume = Math.PI * Math.pow(topDiameter / 2, 2) * topThickness;
    const topWeight = mm3_to_m3(topVolume) * (densities[topMaterial] || 650);

    const lid1Volume = Math.PI * Math.pow(grooveOuterDiameter / 2, 2) * plywoodThickness;
    const lid2Volume = Math.PI * Math.pow(lidDiameter        / 2, 2) * plywoodThickness;
    const lidsVolume = lid1Volume + lid2Volume;
    const lidsWeight = mm3_to_m3(lidsVolume) * densities.plywood;

    const fiberboardVolume = fiberboardLength * fiberboardHeight * fiberboardThickness;
    const fiberboardWeight = mm3_to_m3(fiberboardVolume) * densities.fiberboard;

    const mainBeamsVolume = (beamWidth * beamThickness * mainBeamHeight) * 4;

    const crossBeamsVolume = (crossBeamSize * crossBeamSize * crossBeamLength) * 2;

    const railsVolume = (railWidth * railThickness * railHeight) * railCountDry;

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

    const rcEl = document.getElementById('railCount');
    if (rcEl) rcEl.textContent = String(railCountDry);
    set('railLeftover', leftover, 2);
    set('railSuggestedWidth', railSuggestedWidth, 2);
    set('railHeight', railHeight, 0);

    set('baseWeight',  baseWeight);
    set('topWeight',   topWeight);
    set('totalWeight', totalWeight);

    // показать блок результатов
    const res = document.getElementById('results');
    if (res) {
      res.classList.remove('hidden');
      res.style.display = 'block';
    }

    // ---- Отрисовка вида сверху ----
    renderTopView({
      baseDiameter,
      railThickness,
      railWidth,
      railGap,
      cutterDiameter,
      fiberboardThickness,
      beamWidth,
      beamThickness,
      crossBeamSize,
      crossBeamLength,
      fiberboardOuterDiameter,
      railCountDry
    });

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

/* ---------- SVG отрисовка (вид сверху) ---------- */
function renderTopView(params) {
  const {
    baseDiameter,
    railThickness,
    railWidth,
    railGap,
    cutterDiameter,
    fiberboardThickness,
    beamWidth,
    beamThickness,
    crossBeamSize,
    crossBeamLength,
    fiberboardOuterDiameter,
    railCountDry
  } = params;

  const svg = document.getElementById('topView');
  if (!svg) return;
  while (svg.firstChild) svg.removeChild(svg.firstChild);

  // Геометрия (мм)
  const R_base_out   = baseDiameter / 2;
  const R_rail_in    = R_base_out - railThickness;

  const R_groove_out = R_rail_in;
  const R_groove_in  = R_groove_out - cutterDiameter;

  const R_fiber_in   = R_groove_in;
  const R_fiber_out  = fiberboardOuterDiameter / 2;

  // Масштаб: вписываем во вьюбокс 200 мм радиуса (с запасом)
  const maxR = Math.max(R_base_out, R_fiber_out);
  const pad  = 10; // мм на отступ
  const scale = 200 / (maxR + pad); // мм -> px

  // Утилиты
  const NS = 'http://www.w3.org/2000/svg';
  const g = (attrs={}) => {
    const el = document.createElementNS(NS,'g');
    for (const k in attrs) el.setAttribute(k, attrs[k]);
    svg.appendChild(el);
    return el;
  };
  const circle = (r, fill, stroke) => {
    const c = document.createElementNS(NS,'circle');
    c.setAttribute('cx', 0); c.setAttribute('cy', 0);
    c.setAttribute('r',  r * scale);
    if (fill)   c.setAttribute('fill', fill);
    if (stroke) c.setAttribute('stroke', stroke);
    return c;
  };
  const ring = (rOut, rIn, fill, stroke) => {
    const p = document.createElementNS(NS,'path');
    const ro = rOut * scale, ri = rIn * scale;
    const d = [
      `M ${ro} 0`,
      `A ${ro} ${ro} 0 1 0 ${-ro} 0`,
      `A ${ro} ${ro} 0 1 0 ${ro} 0`,
      `M ${ri} 0`,
      `A ${ri} ${ri} 0 1 1 ${-ri} 0`,
      `A ${ri} ${ri} 0 1 1 ${ri} 0`,
      'Z'
    ].join(' ');
    p.setAttribute('d', d);
    p.setAttribute('fill-rule', 'evenodd');
    if (fill)   p.setAttribute('fill', fill);
    if (stroke) p.setAttribute('stroke', stroke);
    return p;
  };
  const rect = (w, h, fill, stroke) => {
    const r = document.createElementNS(NS,'rect');
    r.setAttribute('x', (-w/2) * scale);
    r.setAttribute('y', (-h/2) * scale);
    r.setAttribute('width',  (w) * scale);
    r.setAttribute('height', (h) * scale);
    if (fill)   r.setAttribute('fill', fill);
    if (stroke) r.setAttribute('stroke', stroke);
    r.setAttribute('rx', 2);
    r.setAttribute('ry', 2);
    return r;
  };

  // 1) Вся фанера (внешний край базы)
  const root = g({transform: 'translate(0,0)'});
  const fanera = circle(R_base_out, '#c8d7ff', '#5b7cff');
  root.appendChild(fanera);

  // 2) Фоновое кольцо реек (для наглядности зоны)
  const railsRing = ring(R_base_out, R_rail_in, '#fff6dd', '#f2c44d');
  root.appendChild(railsRing);

  // 3) Паз — кольцо между R_groove_out и R_groove_in
  const groove = ring(R_groove_out, R_groove_in, '#ffd1d1', '#cc5c5c');
  root.appendChild(groove);

  // 4) ДВП — кольцо между R_fiber_out и R_fiber_in
  const fiber = ring(R_fiber_out, R_fiber_in, '#c9f2d1', '#3fa66e');
  root.appendChild(fiber);

  // 5) Рейки — отрисовать поштучно (N штук), с зазором railGap
  const N = Math.max(1, Math.floor((Math.PI * baseDiameter) / (railWidth + railGap)));
  const R_rails_center = (R_base_out + R_rail_in) / 2; // центр зоны реек
  const stepAngle = (railWidth + railGap) / R_rails_center; // рад
  for (let i = 0; i < N; i++) {
    const a = i * stepAngle; // рад
    // Прямоугольник: ширина по касательной (railWidth), высота по радиусу (railThickness)
    const gr = g({ transform:
      `rotate(${a*180/Math.PI}) translate(${R_rails_center*scale},0) rotate(90)` });
    const railRect = rect(railWidth, railThickness, '#ffe6b3', '#d4a200');
    gr.appendChild(railRect);
  }

  // 6) Основные бруски — 4 шт, углом на R_fiber_out (центр смещён на половину диагонали внутрь)
  const halfDiag = Math.hypot(beamWidth, beamThickness) / 2;
  const centerR  = R_fiber_out - halfDiag; // расстояние центра бруска от центра стола
  const beamFill = '#bbb', beamStroke = '#666';

  [0, 90, 180, 270].forEach(deg => {
    const a = (deg * Math.PI) / 180;
    const cx = centerR * Math.cos(a);
    const cy = centerR * Math.sin(a);
    const gr = g({transform: `translate(${cx*scale},${cy*scale}) rotate(45)`});
    gr.appendChild(rect(beamWidth, beamThickness, beamFill, beamStroke));
  });

  // 7) Поперечина — горизонтальная по центру
  const cross = rect(crossBeamLength, crossBeamSize, '#999', '#333');
  svg.appendChild(cross);

  // 8) Оси (тонкие серые)
  const axis = (x1,y1,x2,y2) => {
    const ln = document.createElementNS(NS,'line');
    ln.setAttribute('x1', x1*scale); ln.setAttribute('y1', y1*scale);
    ln.setAttribute('x2', x2*scale); ln.setAttribute('y2', y2*scale);
    ln.setAttribute('stroke', '#d0d4db'); ln.setAttribute('stroke-width', '1');
    ln.setAttribute('stroke-dasharray', '4 4');
    svg.appendChild(ln);
  };
  axis(-R_base_out*1.1, 0, R_base_out*1.1, 0);
  axis(0, -R_base_out*1.1, 0, R_base_out*1.1);
}
