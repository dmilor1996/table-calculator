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

    const beamWidth      = parseFloat(document.getElementById('beamWidth').value);
    const beamThickness  = parseFloat(document.getElementById('beamThickness').value);

    const railWidth      = parseFloat(document.getElementById('railWidth').value);
    const railThickness  = parseFloat(document.getElementById('railThickness').value);
    const railGap        = parseFloat(document.getElementById('railGap').value);

    const cutterDiameter = parseFloat(document.getElementById('cutterDiameter').value);
    const fiberboardGap  = parseFloat(document.getElementById('fiberboardGap').value) || 0;

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
    const plywoodThickness    = 15;   // фанера (крышки)
    const fiberboardThickness = 3.2;  // ДВП
    const grooveDepth         = 6;    // глубина паза
    const crossBeamSize       = 40;   // поперечина 40×40

    // Плотности (кг/м³)
    const densities = {
      beech: 680, oak: 700, ash: 680, plywood: 600, pine: 500, fiberboard: 800
    };

    // ---- Паз и крышки (снаружи внутрь: рейка -> паз(фреза) -> ДВП -> брусок) ----
    const grooveOuterDiameter = baseDiameter - 2 * railThickness;
    const grooveInnerDiameter = baseDiameter - 2 * (railThickness + cutterDiameter);
    const innerRadius         = grooveInnerDiameter / 2;

    const lidDiameter = grooveInnerDiameter;

    // Промежуточная крышка
    const roundUp5 = mm => Math.ceil(mm / 5) * 5;
    const intermediateDiameter = roundUp5(Math.max(baseDiameter * 1.15, topDiameter * 0.55));

    // ---- ДВП (лента) ----
    const fiberboardOuterDiameter = grooveInnerDiameter + 2 * fiberboardThickness;
    const fiberboardLength = Math.PI * (fiberboardOuterDiameter + fiberboardGap);
    const fiberboardHeight = tableHeight - topThickness - 2 * plywoodThickness + grooveDepth;

    // ---- Основные бруски / рейки ----
    const mainBeamHeight  = tableHeight - topThickness - 3 * plywoodThickness;
    const railHeight      = tableHeight - topThickness - 2 * plywoodThickness;

    // Окружность реек — по центру зоны реек (ВАЖНО: и расчёт, и отрисовка по одному и тому же радиусу)
    const R_base_out   = baseDiameter / 2;
    const R_rail_in    = R_base_out - railThickness;
    const R_rails_center = (R_base_out + R_rail_in) / 2;                 // радиус центра реек
    const circumferenceCenter = 2 * Math.PI * R_rails_center;            // длина окружности на этом радиусе

    const desiredPitch  = railWidth + railGap;                            // шаг «рейка+зазор»
    const railCountDry  = Math.max(1, Math.floor(circumferenceCenter / desiredPitch));
    const leftover      = circumferenceCenter - railCountDry * desiredPitch; // остаток по дуге между последней и первой

    // Рекомендуемая ширина при заданном зазоре и том же количестве
    let railSuggestedWidth = (circumferenceCenter - railCountDry * railGap) / railCountDry;
    if (!Number.isFinite(railSuggestedWidth) || railSuggestedWidth < 0) railSuggestedWidth = 0;

    // ---- Поперечина и положение брусков — угол бруска касается внутренней окружности паза ----
    const Rin = innerRadius;
    const rCenter = Math.sqrt(Math.max(0, Rin*Rin - (beamWidth/2)**2)) - beamThickness/2; // центр бруска
    let crossBeamLength = 2 * (Math.sqrt(Math.max(0, Rin*Rin - (beamWidth/2)**2)) - beamThickness);
    if (!Number.isFinite(crossBeamLength) || crossBeamLength < 0) crossBeamLength = 0;

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

    const mainBeamsVolume  = (beamWidth * beamThickness * mainBeamHeight) * 4;
    const crossBeamsVolume = (crossBeamSize * crossBeamSize * crossBeamLength) * 2;
    const railsVolume      = (railWidth * railThickness * railHeight) * railCountDry;

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
    if (res) { res.classList.remove('hidden'); res.style.display = 'block'; }

    // ---- Отрисовка ----
    renderTopView({
      baseDiameter, railThickness, railWidth, railGap,
      cutterDiameter, fiberboardThickness,
      beamWidth, beamThickness,
      crossBeamSize, crossBeamLength,
      fiberboardOuterDiameter,
      railCountDry,
      rCenter, Rin,
      leftover, railSuggestedWidth
    });
  });
});

/* ======= SVG отрисовка ======= */
function renderTopView(p) {
  const {
    baseDiameter, railThickness, railWidth, railGap,
    cutterDiameter, fiberboardThickness,
    beamWidth, beamThickness,
    crossBeamSize, crossBeamLength,
    fiberboardOuterDiameter, railCountDry,
    rCenter, Rin
  } = p;

  const svg = document.getElementById('topView');
  if (!svg) return;
  while (svg.firstChild) svg.removeChild(svg.firstChild);

  const NS='http://www.w3.org/2000/svg';

  const R_base_out   = baseDiameter / 2;
  const R_rail_in    = R_base_out - railThickness;
  const R_groove_out = R_rail_in;
  const R_groove_in  = R_groove_out - cutterDiameter;
  const R_fiber_in   = R_groove_in;
  const R_fiber_out  = fiberboardOuterDiameter / 2;

  // Масштаб
  const maxR = Math.max(R_base_out, R_fiber_out);
  const pad = 10;
  const scale = 200 / (maxR + pad);

  // helpers
  const add = (el)=>svg.appendChild(el);
  const G = (attrs={}) => { const g=document.createElementNS(NS,'g'); for(const k in attrs) g.setAttribute(k,attrs[k]); return g; };
  const circle = (r,fill,stroke)=>{ const c=document.createElementNS(NS,'circle'); c.setAttribute('cx',0);c.setAttribute('cy',0);c.setAttribute('r',r*scale); if(fill)c.setAttribute('fill',fill); if(stroke)c.setAttribute('stroke',stroke); return c; };
  const ring = (rOut,rIn,fill,stroke)=>{ const pth=document.createElementNS(NS,'path'); const ro=rOut*scale,ri=rIn*scale;
    const d=`M ${ro} 0 A ${ro} ${ro} 0 1 0 ${-ro} 0 A ${ro} ${ro} 0 1 0 ${ro} 0 M ${ri} 0 A ${ri} ${ri} 0 1 1 ${-ri} 0 A ${ri} ${ri} 0 1 1 ${ri} 0 Z`;
    pth.setAttribute('d',d); pth.setAttribute('fill-rule','evenodd'); if(fill)pth.setAttribute('fill',fill); if(stroke)pth.setAttribute('stroke',stroke); return pth; };
  const rect = (w,h,fill,stroke)=>{ const r=document.createElementNS(NS,'rect'); r.setAttribute('x',(-w/2)*scale); r.setAttribute('y',(-h/2)*scale); r.setAttribute('width',w*scale); r.setAttribute('height',h*scale); if(fill)r.setAttribute('fill',fill); if(stroke)r.setAttribute('stroke',stroke); r.setAttribute('rx',2);r.setAttribute('ry',2); return r; };
  const line = (x1,y1,x2,y2,stroke='#d0d4db',w=1,dash='4 4')=>{
    const l=document.createElementNS(NS,'line');
    l.setAttribute('x1',x1*scale); l.setAttribute('y1',y1*scale);
    l.setAttribute('x2',x2*scale); l.setAttribute('y2',y2*scale);
    l.setAttribute('stroke',stroke); l.setAttribute('stroke-width',w);
    if(dash) l.setAttribute('stroke-dasharray',dash);
    return l;
  };
  const dim = (x1,y1,x2,y2,off,label)=>{
    add(line(x1,y1+off,x2,y2+off,'#888',1,null));
    add(line(x1,y1,x1,y1+off,'#888',1,null));
    add(line(x2,y2,x2,y2+off,'#888',1,null));
    const t=document.createElementNS(NS,'text');
    t.setAttribute('x', ((x1+x2)/2)*scale );
    t.setAttribute('y', (y1+off-2)*scale );
    t.setAttribute('text-anchor','middle');
    t.setAttribute('font-size','10');
    t.setAttribute('fill','#444');
    t.textContent = label;
    add(t);
  };

  // фон, оси
  add(line(-R_base_out*1.1,0,R_base_out*1.1,0));
  add(line(0,-R_base_out*1.1,0,R_base_out*1.1));

  // фанера
  add(circle(R_base_out,'#c8d7ff','#5b7cff'));
  // зона реек
  add(ring(R_base_out,R_rail_in,'#fff6dd','#f2c44d'));
  // паз
  add(ring(R_groove_out,R_groove_in,'#ffd1d1','#cc5c5c'));
  // ДВП
  add(ring(R_fiber_out,R_fiber_in,'#c9f2d1','#3fa66e'));

  // Рейки поштучно — шаг по окружности центра реек
  const R_rails_center = (R_base_out + R_rail_in)/2;
  const stepAngle = (railWidth + railGap) / R_rails_center; // рад
  for (let i=0;i<railCountDry;i++){
    const a = i*stepAngle;
    const gr = G({transform:`rotate(${a*180/Math.PI}) translate(${R_rails_center*scale},0) rotate(90)`});
    const r = rect(railWidth, railThickness, '#ffe6b3', '#d4a200');
    gr.appendChild(r);
    add(gr);
  }

  // Основные бруски (0/90/180/270), без поворота
  const beamFill='#bbb', beamStroke='#666';
  [0, 90, 180, 270].forEach(deg=>{
    const a = (deg*Math.PI)/180;
    const cx = rCenter * Math.cos(a);
    const cy = rCenter * Math.sin(a);
    const gr = G({transform:`translate(${cx*scale},${cy*scale}) rotate(${deg})`});
    gr.appendChild(rect(beamWidth, beamThickness, beamFill, beamStroke));
    add(gr);
  });

  // Поперечина — горизонтально по центру
  add(rect(crossBeamLength, crossBeamSize, '#999', '#333'));

  // ---- Размер поперечины — опустил ниже планки ----
  const dimOffset = (beamThickness/2) + 8; // ниже поперечины
  dim(-crossBeamLength/2, 0, crossBeamLength/2, 0, dimOffset, `L = ${crossBeamLength.toFixed(2)} мм`);

  // ---- Мини-превью деталей в правом нижнем углу основной схемы ----
  drawMiniParts(svg, scale, R_base_out, {
    railWidth, railThickness, beamWidth, beamThickness
  });
}

// мини-превью рейки и бруска в углу основного SVG
function drawMiniParts(svg, scale, R_base_out, dims){
  const NS='http://www.w3.org/2000/svg';
  const add = (el)=>svg.appendChild(el);

  // базовая точка (правый-низ)
  const bx =  R_base_out * 0.72 * scale;
  const by =  R_base_out * 0.72 * scale;

  // контейнер
  const g = document.createElementNS(NS,'g');
  g.setAttribute('transform', `translate(${bx},${by})`);
  add(g);

  // фон под превью
  const bg = document.createElementNS(NS,'rect');
  bg.setAttribute('x', 0); bg.setAttribute('y', 0);
  bg.setAttribute('width',  110); bg.setAttribute('height', 90);
  bg.setAttribute('fill', '#ffffff'); bg.setAttribute('stroke', '#e1e5ea');
  bg.setAttribute('rx', 6); bg.setAttribute('ry', 6);
  g.appendChild(bg);

  // функция рисования детали в пикселях
  const rectPx = (x,y,w,h,fill,stroke)=>{
    const r=document.createElementNS(NS,'rect');
    r.setAttribute('x',x); r.setAttribute('y',y);
    r.setAttribute('width',w); r.setAttribute('height',h);
    r.setAttribute('fill',fill); r.setAttribute('stroke',stroke);
    r.setAttribute('rx',3); r.setAttribute('ry',3);
    return r;
  };
  const linePx = (x1,y1,x2,y2,stroke='#888')=>{
    const l=document.createElementNS(NS,'line');
    l.setAttribute('x1',x1); l.setAttribute('y1',y1);
    l.setAttribute('x2',x2); l.setAttribute('y2',y2);
    l.setAttribute('stroke',stroke); l.setAttribute('stroke-width','1');
    return l;
  };
  const textPx = (x,y,str)=>{
    const t=document.createElementNS(NS,'text');
    t.setAttribute('x',x); t.setAttribute('y',y);
    t.setAttribute('font-size','10'); t.setAttribute('fill','#333');
    t.textContent=str; return t;
  };

  // ---- Рейка (верх превью) ----
  const rw = dims.railWidth, rt = dims.railThickness;
  const sR = Math.min(60 / Math.max(rw, rt), 2.0); // маленький масштаб
  const Wrp = rw * scale * sR, Hrp = rt * scale * sR;
  const oxR = 12, oyR = 10;
  g.appendChild(rectPx(oxR, oyR, Wrp, Hrp, '#ffe6b3', '#d4a200'));
  // размеры
  g.appendChild(linePx(oxR, oyR+Hrp+10, oxR+Wrp, oyR+Hrp+10));
  g.appendChild(linePx(oxR, oyR+Hrp,    oxR,      oyR+Hrp+10));
  g.appendChild(linePx(oxR+Wrp, oyR+Hrp, oxR+Wrp, oyR+Hrp+10));
  g.appendChild(textPx(oxR+Wrp/2-16, oyR+Hrp+8, `${rw.toFixed(2)} мм`));

  g.appendChild(linePx(oxR+Wrp+10, oyR, oxR+Wrp+10, oyR+Hrp));
  g.appendChild(linePx(oxR+Wrp, oyR,    oxR+Wrp+10, oyR));
  g.appendChild(linePx(oxR+Wrp, oyR+Hrp, oxR+Wrp+10, oyR+Hrp));
  g.appendChild(textPx(oxR+Wrp+14, oyR+Hrp/2+3, `${rt.toFixed(2)} мм`));

  // ---- Брусок (низ превью) ----
  const bw = dims.beamWidth, bt = dims.beamThickness;
  const sB = Math.min(60 / Math.max(bw, bt), 2.0);
  const Wbp = bw * scale * sB, Hbp = bt * scale * sB;
  const oxB = 12, oyB = 48;
  g.appendChild(rectPx(oxB, oyB, Wbp, Hbp, '#bbb', '#666'));
  g.appendChild(linePx(oxB, oyB+Hbp+10, oxB+Wbp, oyB+Hbp+10));
  g.appendChild(linePx(oxB, oyB+Hbp,    oxB,      oyB+Hbp+10));
  g.appendChild(linePx(oxB+Wbp, oyB+Hbp, oxB+Wbp, oyB+Hbp+10));
  g.appendChild(textPx(oxB+Wbp/2-16, oyB+Hbp+8, `${bw.toFixed(2)} мм`));

  g.appendChild(linePx(oxB+Wbp+10, oyB, oxB+Wbp+10, oyB+Hbp));
  g.appendChild(linePx(oxB+Wbp, oyB,    oxB+Wbp+10, oyB));
  g.appendChild(linePx(oxB+Wbp, oyB+Hbp, oxB+Wbp+10, oyB+Hbp));
  g.appendChild(textPx(oxB+Wbp+14, oyB+Hbp/2+3, `${bt.toFixed(2)} мм`));
}
