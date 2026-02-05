import { initStrudel, samples } from 'https://esm.sh/@strudel/web@latest';

// 1. Initialize Strudel and register samples
// RolandTR808 is not in the default Dirt-Samples, so we map it manually or use a different bank name.
// We'll map the standard names (bd, sd, hh, oh) to the 808 samples directly for ease of use.
const strudel = await initStrudel({
    prebake: () => {
        samples({
            'tr808': {
                'bd': '808/BD.wav',
                'sd': '808/SD.wav',
                'hh': '808/CH.wav',
                'oh': '808/OH.wav'
            }
        }, 'samples/');
    }
});

const { evaluate } = strudel;
evaluate("samples('github:tidalcycles/Dirt-Samples')");

// UI Elements
const startBtn = document.getElementById('start-btn');
const stopBtn = document.getElementById('stop-btn');
const bpmSlider = document.getElementById('bpm');
const bpmVal = document.getElementById('bpm-val');
const cutoffSlider = document.getElementById('cutoff');
const resonanceSlider = document.getElementById('resonance');
const phaseDisplay = document.getElementById('current-phase');
const energyFill = document.getElementById('energy-fill');
const visualizerCanvas = document.getElementById('visualizer');

const PHASES = [
    { name: 'Intro', duration: 8, energy: 20 },
    { name: 'Groove', duration: 16, energy: 60 },
    { name: 'Breakdown', duration: 16, energy: 30 },
    { name: 'Build-up', duration: 8, energy: 80 },
    { name: 'Drop', duration: 16, energy: 100 },
    { name: 'Outro', duration: 8, energy: 40 }
];

// State
let isPlaying = false;
let currentPhaseIndex = 0;
let barCount = 1;
let currentEnergy = 0;
let phaseInterval = null;
let energyInterval = null;

// Pattern Definitions
const getTranceCode = () => {
    const phase = PHASES[currentPhaseIndex];
    const bpm = Number(bpmSlider.value);
    const cutoff = Number(cutoffSlider.value);
    const resonance = Number(resonanceSlider.value);

    // Dynamic pattern parts based on phase
    const kickPattern = phase.name === 'Breakdown' ? '~' : 'bd*4';
    const kickGain = (phase.name === 'Intro' || phase.name === 'Outro') ? 0.6 : 0.8;
    const kickLPF = phase.name === 'Intro' ? '.lpf(800)' : '';

    const hatsPattern = ['Groove', 'Build-up', 'Drop'].includes(phase.name) ? '~ hh ~ hh' : '~';
    const openHatPattern = ['Groove', 'Drop'].includes(phase.name) ? '~ ~ oh ~' : '~';
    const snarePattern = phase.name === 'Build-up' ? 'sd*8' : (phase.name === 'Drop' ? '~ sd' : '~');

    const bassGain = ['Groove', 'Build-up', 'Drop'].includes(phase.name) ? 0.6 : 0;
    const leadGain = ['Breakdown', 'Build-up', 'Drop'].includes(phase.name) ? 0.4 : 0;
    const padGain = phase.name === 'Breakdown' ? 0.4 : 0.25;

    return `
setcpm(${bpm}/4);

// 1. Percussion
const kick = s("${kickPattern}").bank("tr808").gain(${kickGain})${kickLPF};
const hats = s("${hatsPattern}").bank("tr808").gain(0.4).decay(0.1);
const openHat = s("${openHatPattern}").bank("tr808").gain(0.3).decay(0.3);
const snare = s("${snarePattern}").bank("tr808").gain(0.4);

// 2. Bassline
const bass = note("a2 a2 a2 a2 a2 a2 a2 a2".fast(2))
  .sound("sawtooth")
  .lpf(${cutoff})
  .resonance(${resonance})
  .gain(${bassGain})
  .release(0.08);

// 3. Euphoric Arpeggio
const lead = note("a4 c5 e5 a5".fast(4))
  .sound("sawtooth")
  .lpf(sine.range(500, 3000).slow(8))
  .room(0.8)
  .delay(0.5)
  .gain(${leadGain})
  .release(0.1);

// 4. Atmospheric Pad
const pad = note("<[a3, c4, e4] [f3, a3, c4, e4] [g3, b3, d4] [e3, g3, b3]>")
  .sound("sine")
  .gain(${padGain})
  .attack(2)
  .release(2)
  .room(1);

stack(
  kick,
  hats,
  snare,
  bass,
  lead,
  pad
);
`;
};

// Initialize Audio Context and Start
const startSession = async () => {
    if (isPlaying) return;

    try {
        phaseDisplay.textContent = 'Initializing...';
        await new Promise(r => setTimeout(r, 500));

        currentPhaseIndex = 0;
        barCount = 1;

        await evaluate(getTranceCode());
        isPlaying = true;
        startBtn.disabled = true;
        stopBtn.disabled = false;

        startPhaseLoop();
        initVisualizer();
    } catch (err) {
        console.error('Strudel failed to start:', err);
        phaseDisplay.textContent = 'Error';
    }
};

// Stop Music
const stopSession = () => {
    evaluate('stack()');
    isPlaying = false;
    startBtn.disabled = false;
    stopBtn.disabled = true;
    phaseDisplay.textContent = 'Silent';
    clearTimeout(phaseInterval);
    clearInterval(energyInterval);
    energyFill.style.width = '0%';
};

// Automatic Phase Progression (Switch Angel)
const startPhaseLoop = () => {
    clearTimeout(phaseInterval);

    const getBarDuration = () => (60 / Number(bpmSlider.value)) * 4 * 1000;

    const tick = () => {
        if (!isPlaying) return;

        const phase = PHASES[currentPhaseIndex];
        phaseDisplay.textContent = `${phase.name} (Bar ${barCount}/${phase.duration})`;
        energyFill.style.width = `${phase.energy}%`;
        currentEnergy = phase.energy;

        if (barCount >= phase.duration) {
            currentPhaseIndex = (currentPhaseIndex + 1) % PHASES.length;
            barCount = 1;
            evaluate(getTranceCode());
            console.log(`Phase Transition: ${PHASES[currentPhaseIndex].name}`);
        } else {
            barCount++;
        }

        phaseInterval = setTimeout(tick, getBarDuration());
    };

    tick();
};

// Basic Visualizer (Oscilloscope style)
const initVisualizer = () => {
    const ctx = visualizerCanvas.getContext('2d');
    const draw = () => {
        if (!isPlaying) return;
        requestAnimationFrame(draw);

        ctx.fillStyle = 'rgba(5, 5, 10, 0.2)';
        ctx.fillRect(0, 0, visualizerCanvas.width, visualizerCanvas.height);

        // Dynamic styling based on energy
        const hue = 180 + (currentEnergy * 0.8); // Shift from cyan toward purple/pink
        ctx.strokeStyle = `hsl(${hue}, 100%, 50%)`;
        ctx.lineWidth = 2 + (currentEnergy / 40);
        ctx.shadowBlur = currentEnergy / 5;
        ctx.shadowColor = ctx.strokeStyle;

        const time = Date.now() / 1000;
        const speed = 5 + (currentEnergy / 10);
        const frequency = 0.02 + (currentEnergy / 2000);

        ctx.beginPath();
        for (let x = 0; x < visualizerCanvas.width; x++) {
            const y = (visualizerCanvas.height / 2) +
                     Math.sin(x * frequency + time * speed) * (currentEnergy / 2) *
                     Math.sin(time * 0.5); // Add some slow modulation
            if (x === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.shadowBlur = 0; // Reset for next frame
    };
    draw();
};

// Utils
const debounce = (func, wait) => {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
};

const debouncedEvaluate = debounce(() => {
    if (isPlaying) evaluate(getTranceCode());
}, 150);

// Event Listeners
startBtn.addEventListener('click', startSession);
stopBtn.addEventListener('click', stopSession);

bpmSlider.addEventListener('input', () => {
    bpmVal.textContent = bpmSlider.value;
    debouncedEvaluate();
});

cutoffSlider.addEventListener('input', debouncedEvaluate);
resonanceSlider.addEventListener('input', debouncedEvaluate);
