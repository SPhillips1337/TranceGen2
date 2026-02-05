import { initStrudel, samples } from 'https://esm.sh/@strudel/web@latest';

// 0. Variables for visualizer and state
let analyser = null;
let dataArray = null;
let evaluate = null;
let isPlaying = false;
let currentPhaseIndex = 0;
let barCount = 1;
let currentEnergy = 0;
let phaseInterval = null;
let lastBarStartTime = 0;
let currentBarDuration = 0;

// 1. Initialize Strudel and register samples
let strudel = null;
try {
    strudel = await initStrudel({
        prebake: () => {
            console.log('Registering samples in prebake...');
            samples({
                'tr808_bd': '808/BD.wav',
                'tr808_sd': '808/SD.wav',
                'tr808_hh': '808/CH.wav',
                'tr808_oh': '808/OH.wav'
            }, 'samples/');
        }
    });
    console.log('Strudel initialized:', strudel);
} catch (err) {
    console.error('initStrudel failed:', err);
}

if (strudel) {
    try {
        evaluate = strudel.evaluate;
    } catch (e) {
        console.warn('Could not read evaluate from strudel:', e);
    }
}

// NOTE: removed an unconditional remote samples evaluate which could fail
// and prevent subsequent code from running in some environments.

// Expose to window for debugging and inspector access
window.strudel = strudel;
window.evaluate = evaluate;

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

// Pattern Definitions
const getTranceCode = () => {
    const phase = PHASES[currentPhaseIndex];
    const bpm = Number(bpmSlider.value);
    const cutoff = Number(cutoffSlider.value);
    const resonance = Number(resonanceSlider.value);

    // Dynamic pattern parts based on phase
    // Use underscores to avoid search/slash operators in mini-notation
    const kickPattern = phase.name === 'Breakdown' ? '~' : 'tr808_bd*4';
    const kickGain = (phase.name === 'Intro' || phase.name === 'Outro') ? 0.6 : 0.8;
    const kickLPF = phase.name === 'Intro' ? '.lpf(800)' : '';

    const hatsPattern = ['Groove', 'Build-up', 'Drop'].includes(phase.name) ? '~ tr808_hh ~ tr808_hh' : '~';
    const openHatPattern = ['Groove', 'Drop'].includes(phase.name) ? '~ ~ tr808_oh ~' : '~';
    const snarePattern = phase.name === 'Build-up' ? 'tr808_sd*8' : (phase.name === 'Drop' ? '~ tr808_sd' : '~');

    const bassGain = ['Groove', 'Build-up', 'Drop'].includes(phase.name) ? 0.6 : 0;
    const leadGain = ['Breakdown', 'Build-up', 'Drop'].includes(phase.name) ? 0.4 : 0;
    const padGain = phase.name === 'Breakdown' ? 0.4 : 0.25;

    return `
setcpm(${bpm}/4);

// 1. Percussion
const kick = s("${kickPattern}").gain(${kickGain})${kickLPF};
const hats = s("${hatsPattern}").gain(0.4).decay(0.1);
const openHat = s("${openHatPattern}").gain(0.3).decay(0.3);
const snare = s("${snarePattern}").gain(0.4);

// 2. Bassline
const bass = note("a2 a2 a2 a2 a2 a2 a2 a2").fast(2)
  .sound("sawtooth")
  .lpf(${cutoff})
  .resonance(${resonance})
  .gain(${bassGain})
  .release(0.08);

// 3. Euphoric Arpeggio
const lead = note("a4 c5 e5 a5").fast(4)
  .sound("sawtooth")
  .lpf("<800 1200 2000 2800>")
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

window.getTranceCode = getTranceCode;

// Automatic Phase Progression
const tick = () => {
    if (!isPlaying) return;

    if (barCount > PHASES[currentPhaseIndex].duration) {
        currentPhaseIndex = (currentPhaseIndex + 1) % PHASES.length;
        barCount = 1;
        console.log(`Phase Transition: ${PHASES[currentPhaseIndex].name}`);
        evaluate(getTranceCode());
    }

    const phase = PHASES[currentPhaseIndex];
    phaseDisplay.textContent = `${phase.name} (Bar ${barCount}/${phase.duration})`;
    energyFill.style.width = `${phase.energy}%`;
    currentEnergy = phase.energy;

    barCount++;

    const bpm = Number(bpmSlider.value);
    currentBarDuration = (60 / bpm) * 4 * 1000;
    lastBarStartTime = Date.now();
    phaseInterval = setTimeout(tick, currentBarDuration);
};

const startPhaseLoop = () => {
    clearTimeout(phaseInterval);
    tick();
};

const syncPhaseLoop = () => {
    if (!isPlaying) return;
    const elapsed = Date.now() - lastBarStartTime;
    const progress = Math.min(elapsed / currentBarDuration, 0.99);
    const bpm = Number(bpmSlider.value);
    currentBarDuration = (60 / bpm) * 4 * 1000;
    clearTimeout(phaseInterval);
    const remaining = currentBarDuration * (1 - progress);
    phaseInterval = setTimeout(tick, remaining);
};

// Real Visualizer (AnalyserNode)
const initVisualizer = () => {
    const ctx = visualizerCanvas.getContext('2d');

    // Attempt to connect to Strudel's audio output or find the context directly
    if (strudel) {
        try {
            const audioCtx = strudel.context ||
                (strudel.getAudioContext && strudel.getAudioContext()) ||
                (strudel.weContext && strudel.weContext.context) ||
                (strudel.scheduler && strudel.scheduler.context);

            const outputNode = strudel.output ||
                (strudel.weContext && strudel.weContext.out) ||
                (strudel.scheduler && strudel.scheduler.out);

            console.log('Visualizer: audioCtx=', audioCtx, 'outputNode=', outputNode);
            if (audioCtx && outputNode) {
                try {
                    analyser = audioCtx.createAnalyser();
                    analyser.fftSize = 256;
                    outputNode.connect(analyser);
                    dataArray = new Uint8Array(analyser.frequencyBinCount);
                    console.log('Visualizer connected to Strudel output');
                } catch (e) {
                    console.warn('Visualizer connection failed during connect:', e);
                }
            } else {
                console.warn('Visualizer: Could not find audioCtx or outputNode on strudel');
            }
        } catch (e) {
            console.warn('Visualizer connection failed:', e);
        }
    }

    const draw = () => {
        if (!isPlaying) return;
        requestAnimationFrame(draw);

        ctx.fillStyle = 'rgba(5, 5, 15, 0.2)';
        ctx.fillRect(0, 0, visualizerCanvas.width, visualizerCanvas.height);

        const hue = 180 + (currentEnergy * 0.8);
        ctx.strokeStyle = `hsl(${hue}, 100%, 50%)`;
        ctx.lineWidth = 2 + (currentEnergy / 40);
        ctx.shadowBlur = currentEnergy / 5;
        ctx.shadowColor = ctx.strokeStyle;

        ctx.beginPath();

        if (analyser && dataArray) {
            analyser.getByteTimeDomainData(dataArray);
            const sliceWidth = visualizerCanvas.width * 1.0 / dataArray.length;
            let x = 0;
            for (let i = 0; i < dataArray.length; i++) {
                const v = dataArray[i] / 128.0;
                const y = v * visualizerCanvas.height / 2;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
                x += sliceWidth;
            }
        } else {
            const time = Date.now() / 1000;
            for (let x = 0; x < visualizerCanvas.width; x++) {
                const y = (visualizerCanvas.height / 2) + Math.sin(x * 0.05 + time * 10) * (currentEnergy / 2);
                if (x === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
        }
        ctx.stroke();
        ctx.shadowBlur = 0;
    };
    draw();
};

// Event Handlers
const startSession = async () => {
    if (isPlaying) return;
    try {
        phaseDisplay.textContent = 'Initializing...';

        // Ensure AudioContext is resumed (required for browser security)
        const audioCtx = strudel.context ||
            (strudel.getAudioContext && strudel.getAudioContext()) ||
            (strudel.weContext && strudel.weContext.context) ||
            (strudel.scheduler && strudel.scheduler.context);

        if (audioCtx && audioCtx.state === 'suspended') {
            await audioCtx.resume();
        }

        // If Strudel exposes a start/play method, call it on user gesture
        if (strudel) {
            try {
                if (typeof strudel.start === 'function') {
                    await strudel.start();
                    console.log('Called strudel.start()');
                } else if (typeof strudel.play === 'function') {
                    await strudel.play();
                    console.log('Called strudel.play()');
                }
            } catch (e) {
                console.warn('strudel start/play threw:', e);
            }
        }

        await new Promise(r => setTimeout(r, 500));
        currentPhaseIndex = 0;
        barCount = 1;
        try {
            await evaluate(getTranceCode());
            console.log('Initial evaluate succeeded');
        } catch (e) {
            console.error('Initial evaluate failed:', e);
            throw e;
        }
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

window.startSession = startSession;

const stopSession = () => {
    evaluate('stack()');
    isPlaying = false;
    startBtn.disabled = false;
    stopBtn.disabled = true;
    phaseDisplay.textContent = 'Silent';
    clearTimeout(phaseInterval);
    energyFill.style.width = '0%';
};

// Utils
const debounce = (func, wait) => {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
};

const debouncedEvaluate = debounce(() => {
    if (isPlaying) evaluate(getTranceCode());
}, 150);

// Listeners
startBtn.addEventListener('click', startSession);
stopBtn.addEventListener('click', stopSession);

bpmSlider.addEventListener('input', () => {
    bpmVal.textContent = bpmSlider.value;
    debouncedEvaluate();
    syncPhaseLoop();
});

cutoffSlider.addEventListener('input', debouncedEvaluate);
resonanceSlider.addEventListener('input', debouncedEvaluate);
