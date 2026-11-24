# AETHER HORIZON: DIMENSIONAL SHIFT

A production-ready 3D Endless Action Racing & Flight Web Game built with **React 19, TypeScript, Tailwind CSS v4, and Three.js**.

## Features
- **3 Altitude Layers**: Ground Racing, Sky Flight, and Space Flight with seamless vertical transitions and vehicle compatibility rules.
- **200 Procedural Vehicles**: Cars, Aircraft, Spaceships, and Hybrids across 8 distinct weapon patterns (Single, Twin, Pierce, Spread3, Quad4, Homing, Wave3, Nova).
- **20 Playable Dimensions**: Volcanic Caldera, Quantum Rift, Cyber Neon District, Crystal Sanctuary, Aurora Glacier, Pyramid Desert, Sakura Shrine, and more — each with unique biome geometry, road fissures, hazards, and atmosphere across Ground, Sky, and Space.
- **Boss Battles & Progression**: Dynamic boss encounters, Dimensional Route Selection portals, 4-stat upgrade system, Web Audio procedural SFX/music, and LocalStorage save/export/import.
- **100% Client-Side & Portable**: Builds with relative paths (`base: './'`) so the output works on any static host, subpath, or HTML5 game portal.

## Quick Start

```bash
npm install
npm run dev
```

## Build for Any Web Host or Game Portal

```bash
npm run build
```

This generates a portable static bundle inside `dist/`:

- **itch.io / Game Portals**: Zip the contents of `dist/` (make sure `index.html` is at the root of the `.zip`) and upload as an HTML5 project (`1280x720` or responsive viewport).
- **Cloudflare Pages / Netlify / Vercel**: Connect the repository or drag-and-drop the `dist/` folder directly (Build command: `npm run build`, Output directory: `dist`).
- **GitHub Pages / Subfolder Hosting**: Upload the contents of `dist/` directly — all asset links use relative paths (`./`).
- **Local Test of Production Build**: Run `npm run preview`.

## Controls
- **A / D** or **Arrow Left / Right**: Switch lanes (Swipe Left/Right on touch devices)
- **W** or **Arrow Up**: Jump / Double Jump (Swipe Up on touch devices)
- **S** or **Arrow Down**: Crouch / Fast Fall (Swipe Down on touch devices)
- **Space**: Fire Weapons (or toggle Auto-Fire in HUD)
- **Shift**: Activate Overdrive (when meter reaches 100%)
- **1 / 2 / 3**: Switch Altitude (`GROUND` / `SKY` / `SPACE`)
- **Esc / P**: Pause
