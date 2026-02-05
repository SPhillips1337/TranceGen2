# Usage Guide

## Getting Started

### Starting the Application

1. **Launch the web server:**
   ```bash
   python3 -m http.server 8001 --directory /var/www/html/TranceGen2/strudel_new
   ```

2. **Open your browser:**
   Navigate to `http://localhost:8001`

3. **Initialize audio:**
   Click the **START SESSION** button to begin playback

### Controls

#### BPM Slider
- **Range**: 128-145 BPM
- **Default**: 138 BPM
- **Effect**: Changes the tempo of the entire track in real-time

#### Filter Cutoff
- **Range**: 100-5000 Hz
- **Default**: 1200 Hz
- **Effect**: Controls the low-pass filter frequency on the bassline and leads
- **Tip**: Lower values create a darker, more filtered sound; higher values brighten the mix

#### Resonance
- **Range**: 0-20
- **Default**: 8
- **Effect**: Controls the filter resonance (Q factor)
- **Tip**: Higher values create a more pronounced "trance sweep" effect

### Understanding the Track Phases

The engine automatically progresses through six distinct phases:

#### 1. Intro (8 bars)
- Filtered kick drum
- Atmospheric pads
- Energy: 20%

#### 2. Groove (16 bars)
- Full 4/4 kick pattern
- Rolling 16th-note bassline
- Hi-hats and subtle arpeggios
- Energy: 60%

#### 3. Breakdown (16 bars)
- Drums drop out
- Euphoric lead melodies emerge
- Pads swell with reverb
- Energy: 30%

#### 4. Build-up (8 bars)
- Accelerating snare rolls
- Rising filter sweeps
- Tension builds toward the drop
- Energy: 80%

#### 5. Drop (16 bars)
- Maximum energy
- All elements playing
- Peak euphoria
- Energy: 100%

#### 6. Outro (8 bars)
- Gradual reduction
- Return to filtered kick
- Settling down
- Energy: 40%

### UI Elements

#### Current Phase Display
Shows the current track section and bar count (e.g., "Groove (Bar 5/16)")

#### Track Energy Bar
Visual representation of the current energy level, dynamically updated based on the phase

#### Visualizer
Real-time waveform display that responds to the audio output

### Tips for Best Experience

1. **Let it evolve**: The track is designed to be listened to for at least 5 minutes to experience a full cycle
2. **Experiment with filters**: Try sweeping the cutoff during the Build-up phase for extra intensity
3. **Adjust BPM carefully**: Small changes (±2-3 BPM) can significantly affect the vibe
4. **Use headphones**: The bassline and sub frequencies are best experienced with good headphones or speakers

### Troubleshooting

#### No Sound
- Ensure your browser allows audio playback (some browsers require user interaction first)
- Check your system volume and browser tab audio settings
- Try refreshing the page and clicking START SESSION again

#### Choppy Audio
- Close other browser tabs to free up CPU resources
- Reduce the number of background applications
- Try a different browser (Chrome/Edge recommended for best Web Audio API performance)

#### Phase Not Transitioning
- Check the browser console (F12) for any JavaScript errors
- Verify the bar count is incrementing in the phase display
- Refresh the page if the state machine appears stuck

### Advanced Usage

#### Modifying Patterns
Edit `app.js` and locate the `getTranceCode()` function to customize patterns for each phase.

#### Adding More Samples
Place `.wav` files in the `samples/` directory and register them in the `prebake` hook:
```javascript
samples({
    'mysample': 'path/to/sample.wav'
}, 'samples/');
```

#### Changing Phase Durations
Modify the `PHASES` array in `app.js`:
```javascript
const PHASES = [
    { name: 'Intro', duration: 8, energy: 20 },
    // ... adjust durations as needed
];
```
