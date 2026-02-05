import { initStrudel, samples } from 'https://esm.sh/@strudel/web@latest';

// 1. Initialize Strudel and register samples
// RolandTR808 is not in the default Dirt-Samples, so we map it manually or use a different bank name.
// We'll map the standard names (bd, sd, hh, oh) to the 808 samples directly for ease of use.
const strudel = await initStrudel({
    prebake: () => {
        samples({
            'tr808_bd': 'samples/808/BD.wav',
            'tr808_sd': 'samples/808/SD.wav',
            'tr808_hh': 'samples/808/CH.wav',
            'tr808_oh': 'samples/808/OH.wav'
        });
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

// State
let isPlaying = false;
let currentEnergy = 0;
let phaseInterval = null;

// Pattern Definitions
const getTranceCode = () => `
setcpm(${bpmSlider.value}/4);

// 1. Percussion
const kick = s("tr808_bd*4").gain(0.8);
const hats = s("~ tr808_hh ~ tr808_hh").gain(0.4).decay(0.1);
const openHat = s("~ ~ tr808_oh ~").gain(0.3).decay(0.3);
const snare = s("~ tr808_sd").gain(0.4);

// 2. Bassline (Classic Rolling 16ths)
const bass = note("a2 a2 a2 a2 a2 a2 a2 a2").fast(2)
  .sound("sawtooth")
  .lpf(${cutoffSlider.value})
  .resonance(${resonanceSlider.value})
  .gain(0.6)
  .release(0.08);

// 3. Euphoric Arpeggio
const lead = note("a4 c5 e5 a5").fast(4)
  .sound("sawtooth")
  .lpf("<800 1200 2000 2800>") // Sweeping filter for movement
  .room(0.8)
  .delay(0.5)
  .gain(0.4)
  .release(0.1);

// 4. Atmospheric Pad
const pad = note("<[a3, c4, e4] [f3, a3, c4, e4] [g3, b3, d4] [e3, g3, b3]>")
  .sound("sine")
  .gain(0.25)
  .attack(2)
  .release(2)
  .room(1);

// Combine based on energy
stack(
  kick,
  hats,
  snare,
  bass,
  lead,
  pad
);
`;

// Initialize Audio Context and Start
const startSession = async () => {
    if (isPlaying) return;

    try {
        // Give a tiny moment for samples to settle if just loaded
        phaseDisplay.textContent = 'Initializing...';
        await new Promise(r => setTimeout(r, 500));

        await evaluate(getTranceCode());
        isPlaying = true;
        startBtn.disabled = true;
        stopBtn.disabled = false;
        phaseDisplay.textContent = 'Euphoria';
        startEnergyLoop();
        initVisualizer();
    } catch (err) {
        console.error('Strudel failed to start:', err);
        phaseDisplay.textContent = 'Error';
    }
};

// Stop Music
const stopSession = () => {
    evaluate('stack()'); // Clear patterns
    isPlaying = false;
    startBtn.disabled = false;
    stopBtn.disabled = true;
    phaseDisplay.textContent = 'Silent';
    clearInterval(phaseInterval);
    energyFill.style.width = '0%';
};

// Dynamic Energy Simulation
const startEnergyLoop = () => {
    let t = 0;
    phaseInterval = setInterval(() => {
        t += 0.05;
        currentEnergy = (Math.sin(t) + 1) * 50; // Oscillation 0-100
        energyFill.style.width = `${currentEnergy}%`;

        // Note: Removed redundant evaluate() from here.
        // Parameters are already updated via slider event listeners.
    }, 100); // Faster update for smooth UI
};

// Basic Visualizer (Oscilloscope style)
const initVisualizer = () => {
    const ctx = visualizerCanvas.getContext('2d');
    const draw = () => {
        if (!isPlaying) return;
        requestAnimationFrame(draw);

        ctx.fillStyle = 'rgba(5, 5, 10, 0.2)';
        ctx.fillRect(0, 0, visualizerCanvas.width, visualizerCanvas.height);

        ctx.beginPath();
        ctx.strokeStyle = '#00f2ff';
        ctx.lineWidth = 2;

        const time = Date.now() / 1000;
        for (let x = 0; x < visualizerCanvas.width; x++) {
            const y = (visualizerCanvas.height / 2) + Math.sin(x * 0.05 + time * 10) * (currentEnergy / 2);
            if (x === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();
    };
    draw();
};

// Event Listeners
startBtn.addEventListener('click', startSession);
stopBtn.addEventListener('click', stopSession);

bpmSlider.addEventListener('input', () => {
    bpmVal.textContent = bpmSlider.value;
    if (isPlaying) evaluate(getTranceCode());
});

cutoffSlider.addEventListener('input', () => {
    if (isPlaying) evaluate(getTranceCode());
});

resonanceSlider.addEventListener('input', () => {
    if (isPlaying) evaluate(getTranceCode());
});
