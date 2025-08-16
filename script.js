document.getElementById('tableForm').addEventListener('submit', function(e) {
    e.preventDefault();

    const topDiameter = parseFloat(document.getElementById('topDiameter').value);
    const topThickness = parseFloat(document.getElementById('topThickness').value);
    const tableHeight = parseFloat(document.getElementById('tableHeight').value);
    const baseDiameter = parseFloat(document.getElementById('baseDiameter').value);
    const beamWidth = parseFloat(document.getElementById('beamWidth').value);
    const beamThickness = parseFloat(document.getElementById('beamThickness').value);
    const railWidth = parseFloat(document.getElementById('railWidth').value);
    const railThickness = parseFloat(document.getElementById('railThickness').value);
    const cutterDiameter = parseFloat(document.getElementById('cutterDiameter').value);
    const topMaterial = document.getElementById('topMaterial').value;
    const railMaterial = document.getElementById('railMaterial').value;

    // constants
    const plywoodThickness = 15; // mm
    const fiberboardThickness = 3.2; // mm
    const grooveDepth = 5.5; // mm
    const crossBeamSize = 40; // mm (square section for cross beams)

    // material densities in kg/m^3
    const densities = {
        birch: 650,
        oak: 750,
        ash: 700,
        plywood: 600,
        pine: 450,
        fiberboard: 850,
    };

    // calculate groove diameters
    const grooveOuterDiameter = baseDiameter - 2 * (railThickness + fiberboardThickness) + cutterDiameter;
    const grooveInnerDiameter = baseDiameter - 2 * (railThickness + fiberboardThickness) - cutterDiameter;

    // lid B and intermediate diameters
    const lidDiameter = grooveInnerDiameter;
    let intermediateDiameter = Math.max(baseDiameter * 1.15, topDiameter * 0.55);
    intermediateDiameter = Math.ceil(intermediateDiameter / 5) * 5;

    // fiberboard sheet dimensions
    const fiberboardHeight = tableHeight - topThickness - 2 * plywoodThickness + grooveDepth;
    const fiberboardLength = Math.ceil(Math.PI * grooveOuterDiameter + 2 * fiberboardThickness);

    // main beams height and cross beams length
    const mainBeamHeight = tableHeight - topThickness - 3 * plywoodThickness;
    const crossBeamLength = grooveInnerDiameter - 2 * crossBeamSize;

    // rail calculations
    const railHeight = tableHeight - topThickness - 2 * plywoodThickness;
    const railCount = Math.floor(Math.PI * baseDiameter / (railWidth + 0.2));

    // compute volumes in cubic meters (mm^3 -> m^3)
    const toCubicMeters = (v) => v / 1e9;

    // volumes of circular pieces
    const topVolume = toCubicMeters(Math.PI * Math.pow(topDiameter / 2, 2) * topThickness);
    const lidVolume = toCubicMeters(Math.PI * Math.pow(lidDiameter / 2, 2) * plywoodThickness);
    const intermediateVolume = toCubicMeters(Math.PI * Math.pow(intermediateDiameter / 2, 2) * plywoodThickness);

    // other volumes
    const fiberboardVolume = toCubicMeters(fiberboardLength * fiberboardHeight * fiberboardThickness);
    const mainBeamsVolume = toCubicMeters(beamWidth * beamThickness * mainBeamHeight * 4);
    const crossBeamsVolume = toCubicMeters(crossBeamSize * crossBeamSize * crossBeamLength * 2);
    const railsVolume = toCubicMeters(railWidth * railThickness * railHeight * railCount);

    // weights (kg)
    const topWeight = topVolume * densities[topMaterial];
    const lidsWeight = (lidVolume + intermediateVolume) * densities['plywood'];
    const fiberboardWeight = fiberboardVolume * densities['fiberboard'];
    const beamsWeight = (mainBeamsVolume + crossBeamsVolume + railsVolume) * densities[railMaterial];

    const baseWeight = lidsWeight + fiberboardWeight + beamsWeight;
    const totalWeight = baseWeight + topWeight;

    // update results
    document.getElementById('grooveOuter').textContent = grooveOuterDiameter.toFixed(2);
    document.getElementById('grooveInner').textContent = grooveInnerDiameter.toFixed(2);
    document.getElementById('lidDiameter').textContent = lidDiameter.toFixed(2);
    document.getElementById('intermediateDiameter').textContent = intermediateDiameter.toFixed(2);
    document.getElementById('fiberboardLength').textContent = fiberboardLength.toFixed(0);
    document.getElementById('fiberboardHeight').textContent = fiberboardHeight.toFixed(0);
    document.getElementById('mainBeamLength').textContent = beamWidth.toFixed(0);
    document.getElementById('mainBeamHeight').textContent = mainBeamHeight.toFixed(0);
    document.getElementById('crossBeamLength').textContent = crossBeamLength.toFixed(0);
    document.getElementById('railCount').textContent = railCount.toString();
    document.getElementById('railHeight').textContent = railHeight.toFixed(0);
    document.getElementById('baseWeight').textContent = baseWeight.toFixed(2);
    document.getElementById('topWeight').textContent = topWeight.toFixed(2);
    document.getElementById('totalWeight').textContent = totalWeight.toFixed(2);

    document.getElementById('results').classList.remove('hidden');
});
