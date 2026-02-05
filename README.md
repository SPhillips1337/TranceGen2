# TranceGen2 Strudel New

A generative trance music engine built with [Strudel](https://strudel.cc/) that automatically creates evolving trance tracks with dynamic song structure.

## Features

- **🎵 Generative Trance Patterns**: Euphoric arpeggios, rolling basslines, and atmospheric pads
- **🔄 Automatic Song Structure**: Progresses through Intro → Groove → Breakdown → Build-up → Drop → Outro
- **🎛️ Real-time Control**: Adjust BPM, filter cutoff, and resonance on the fly
- **🎨 Premium UI**: Dark-themed glassmorphic design with live visualizer
- **🔊 Local Samples**: Includes TR-808 percussion samples for authentic trance drums
- **⚡ Browser-based**: No server dependencies, runs entirely in the browser

## Quick Start

1. **Start the local server:**
   ```bash
   cd /var/www/html/TranceGen2/strudel_new
   python3 -m http.server 8001
   ```

2. **Open in browser:**
   Navigate to `http://localhost:8001`

3. **Start the session:**
   Click **START SESSION** and let the track evolve!

## Technology Stack

- **[Strudel](https://strudel.cc/)**: Live coding pattern language for music
- **Vanilla JavaScript**: No framework dependencies
- **Web Audio API**: High-performance audio synthesis
- **CSS3**: Glassmorphism and modern design patterns

## Project Structure

```
strudel_new/
├── index.html          # Main HTML entry point
├── app.js              # Strudel engine & state machine
├── style.css           # Premium glassmorphic styling
├── samples/
│   └── 808/            # TR-808 percussion samples
│       ├── BD.wav      # Kick drum
│       ├── SD.wav      # Snare drum
│       ├── CH.wav      # Closed hi-hat
│       └── OH.wav      # Open hi-hat
└── README.md           # This file
```

## How It Works

The engine uses a **state machine** inspired by the "Switch Angel" methodology to automatically transition between track sections every 8-16 bars. Each phase has unique musical characteristics:

- **Intro**: Filtered kick, atmospheric pads
- **Groove**: Full rhythm section with rolling bass
- **Breakdown**: Silent drums, euphoric melodies
- **Build-up**: Rising filters and snare rolls
- **Drop**: Maximum energy and instrumentation
- **Outro**: Gradual wind-down

## Credits

- Built with [Strudel](https://strudel.cc/) by Felix Roos
- Inspired by [honcoops](https://github.com/honcoops) and [eefano](https://github.com/eefano)
- TR-808 samples from [geikha/tidal-drum-machines](https://github.com/geikha/tidal-drum-machines)

## License

MIT
