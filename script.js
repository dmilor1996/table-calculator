document.getElementById('tableForm').addEventListener('submit', function(e) {
    e.preventDefault();

    // Вводные данные
    const topDiameter = parseFloat(document.getElementById('topDiameter').value);
    const topThickness = parseFloat(document.getElementById('topThickness').value);
    const tableHeight = parseFloat(document.getElementById('tableHeight').value);
    const baseDiameter = parseFloat(document.getElementById('baseDiameter').value);
    const railDiameter = parseFloat(document.getElementById('railDiameter').value);
    const cutterDiameter = parseFloat(document.getElementById('cutterDiameter').value);
    const topMaterial = document.getElementById('topMaterial').value;
    const railMaterial = document.getElementById('railMaterial').value;

    // Константы
    const plywoodThickness = 15;
    const fiberboardThickness = 3.2;
    const grooveDepth = 6;
    const beamSize = 40;

    // Плотности материалов (кг/м³)
    const densities = {
        beech: 680,
        oak: 700,
        ash: 680,
        plywood: 600,
        pine: 500,
        fiberboard: 800
    };

    // Расчёты
    // 1. Паз на нижней крышке
    const grooveOuterDiam = baseDiameter - 2 * (railDiameter + fiberboardThickness) + cutterDiameter;
    const grooveInnerDiam = baseDiameter - 2 * (railDiameter + fiberboardThickness);
    const grooveInnerRadius = grooveInnerDiam / 2;

    // 2. Крышка Б
    const coverBDiam = grooveInnerDiam;

    // 3. Промежуточная крышка
    let midCoverDiam = Math.max(baseDiameter * 1.15, topDiameter * 0.55);
    midCoverDiam = Math.ceil(midCoverDiam / 5) * 5;

    // 4. Лист ДВП
    const fiberboardHeight = tableHeight - topThickness - 2 * plywoodThickness + grooveDepth;
    const fiberboardOuterDiam = grooveInnerDiam + 2 * fiberboardThickness;
    const fiberboardLength = Math.PI * fiberboardOuterDiam;

    // 5. Основные бруски
    const mainBeamHeight = tableHeight - topThickness - 3 * plywoodThickness;

    // 6. Поперечные бруски
    const crossBeamLength = grooveInnerDiam - 2 * beamSize;

    // 7. Рейки
    const railHeight = tableHeight - topThickness - 2 * plywoodThickness;
    const railCount = Math.floor((Math.PI * baseDiameter) / (railDiameter + 0.2));

    // Расчёт веса
    const topVolume = (Math.PI * (topDiameter / 2) ** 2 * topThickness) / 1000000; // м³
    const topWeight = topVolume * densities[topMaterial];

    const baseCoverVolume = (Math.PI * (baseDiameter / 2) ** 2 * plywoodThickness) / 1000000;
    const coverBVolume = (Math.PI * (coverBDiam / 2) ** 2 * plywoodThickness) / 1000000;
    const midCoverVolume = (Math.PI * (midCoverDiam / 2) ** 2 * plywoodThickness) / 1000000;
    const fiberboardVolume = (fiberboardLength * fiberboardHeight * fiberboardThickness) / 1000000;
    const beamsVolume = (4 * beamSize * beamSize * mainBeamHeight + 2 * beamSize * beamSize * crossBeamLength) / 1000000;
    const railsVolume = (railCount * Math.PI * (railDiameter / 2) ** 2 * railHeight) / 1000000;

    const baseWeight = (baseCoverVolume + coverBVolume + midCoverVolume) * densities.plywood +
                      fiberboardVolume * densities.fiberboard +
                      beamsVolume * densities.pine +
                      railsVolume * densities[railMaterial];

    const totalWeight = topWeight + baseWeight;

    // Вывод результатов
    document.getElementById('grooveOuterDiam').textContent = grooveOuterDiam.toFixed(1);
    document.getElementById('grooveInnerDiam').textContent = grooveInnerDiam.toFixed(1);
    document.getElementById('grooveInnerRadius').textContent = grooveInnerRadius.toFixed(1);
    document.getElementById('coverBDiam').textContent = coverBDiam.toFixed(1);
    document.getElementById('midCoverDiam').textContent = midCoverDiam.toFixed(1);
    document.getElementById('fiberboardLength').textContent = fiberboardLength.toFixed(1);
    document.getElementById('fiberboardHeight').textContent = fiberboardHeight.toFixed(1);
    document.getElementById('mainBeamHeight').textContent = mainBeamHeight.toFixed(1);
    document.getElementById('crossBeamLength').textContent = crossBeamLength.toFixed(1);
    document.getElementById('railCount').textContent = railCount;
    document.getElementById('railHeight').textContent = railHeight.toFixed(1);
    document.getElementById('totalWeight').textContent = totalWeight.toFixed(2);
    document.getElementById('topWeight').textContent = topWeight.toFixed(2);
    document.getElementById('baseWeight').textContent = baseWeight.toFixed(2);

    document.getElementById('results').classList.remove('hidden');
});
