/**
 * Token Dock — Icon Generator
 * Generates icon.png from the SVG octopus mark
 * Uses Electron's offscreen rendering to convert SVG → PNG
 * Then use an online tool or sharp to convert PNG → ICO
 *
 * For now, creates a high-quality PNG that Windows can use as an icon.
 * Run: node generate-icon.js
 */
const fs = require('fs');
const path = require('path');

// Read the SVG
const svgPath = path.join(__dirname, 'icon.svg');
const svg = fs.readFileSync(svgPath, 'utf8');

// Create multiple size PNGs from SVG using data URL approach
// The SVG is resolution-independent, so we encode it for use as icon

// For Windows .ico, we need to create a multi-size icon
// The simplest approach: create an HTML file that renders the SVG at multiple sizes
// and screenshots them. But for now, let's create a PNG data URL that Electron can use.

// Convert SVG to base64 data URL for nativeImage
const svgBase64 = Buffer.from(svg).toString('base64');
const dataUrl = `data:image/svg+xml;base64,${svgBase64}`;

console.log('');
console.log('OCTOPUS AI — Icon Data URL Generated');
console.log('');
console.log('SVG icon available at: icon.svg');
console.log('');
console.log('To create icon.ico for Windows:');
console.log('  1. Open icon.svg in a browser');
console.log('  2. Use https://convertio.co/svg-ico/ to convert');
console.log('  3. Save as icon.ico in this directory');
console.log('  4. Run: npm run install-shortcuts');
console.log('');
console.log('The app will use icon.svg/icon.ico automatically for:');
console.log('  - Window taskbar icon');
console.log('  - System tray icon');
console.log('  - Start Menu shortcut');
console.log('  - Desktop shortcut');
console.log('');

// Also write a simple HTML viewer for the icon
const html = `<!DOCTYPE html>
<html><head><title>Octopus AI Icon Preview</title>
<style>body{background:#0f1117;display:flex;gap:32px;align-items:center;justify-content:center;min-height:100vh;flex-wrap:wrap}
.icon{background:#1a1b26;border-radius:12px;padding:16px;display:flex;flex-direction:column;align-items:center;gap:8px}
.icon img{image-rendering:auto}
.icon span{color:#8b8fa3;font-family:monospace;font-size:12px}</style></head>
<body>
<div class="icon"><img src="icon.svg" width="16" height="16"><span>16px</span></div>
<div class="icon"><img src="icon.svg" width="32" height="32"><span>32px</span></div>
<div class="icon"><img src="icon.svg" width="48" height="48"><span>48px</span></div>
<div class="icon"><img src="icon.svg" width="64" height="64"><span>64px</span></div>
<div class="icon"><img src="icon.svg" width="128" height="128"><span>128px</span></div>
<div class="icon"><img src="icon.svg" width="256" height="256"><span>256px</span></div>
</body></html>`;
fs.writeFileSync(path.join(__dirname, 'icon-preview.html'), html);
console.log('Preview: open icon-preview.html in a browser');
