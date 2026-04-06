/**
 * Token Dock — Icon Builder
 * Renders icon.svg in an offscreen BrowserWindow → captures as PNG → builds ICO
 * Run: npx electron build-icon.js
 */
const { app, BrowserWindow, nativeImage } = require('electron');
const fs = require('fs');
const path = require('path');

app.disableHardwareAcceleration();

app.whenReady().then(async () => {
  const svgPath = path.join(__dirname, 'icon.svg');
  const sizes = [16, 24, 32, 48, 64, 128, 256];
  const pngBuffers = {};

  for (const sz of sizes) {
    const win = new BrowserWindow({
      width: sz, height: sz, show: false,
      webPreferences: { offscreen: true },
      frame: false, transparent: true
    });

    const svgContent = fs.readFileSync(svgPath, 'utf8');
    const html = `<html><body style="margin:0;padding:0;background:transparent;overflow:hidden"><div style="width:${sz}px;height:${sz}px">${svgContent.replace(/<svg/, '<svg width="'+sz+'" height="'+sz+'"')}</div></body></html>`;

    await win.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(html));

    // Wait for render
    await new Promise(r => setTimeout(r, 200));

    const image = await win.webContents.capturePage();
    pngBuffers[sz] = image.toPNG();
    win.close();
  }

  // Save 256px PNG
  fs.writeFileSync(path.join(__dirname, 'icon.png'), pngBuffers[256]);
  console.log('✅ icon.png (' + pngBuffers[256].length + ' bytes)');

  // Build ICO
  const headerSize = 6;
  const dirSize = 16 * sizes.length;
  let totalData = 0;
  sizes.forEach(sz => { totalData += pngBuffers[sz].length; });

  const ico = Buffer.alloc(headerSize + dirSize + totalData);
  ico.writeUInt16LE(0, 0);
  ico.writeUInt16LE(1, 2);
  ico.writeUInt16LE(sizes.length, 4);

  let offset = headerSize + dirSize;
  sizes.forEach((sz, i) => {
    const png = pngBuffers[sz];
    const dir = headerSize + i * 16;
    ico.writeUInt8(sz >= 256 ? 0 : sz, dir);
    ico.writeUInt8(sz >= 256 ? 0 : sz, dir + 1);
    ico.writeUInt8(0, dir + 2);
    ico.writeUInt8(0, dir + 3);
    ico.writeUInt16LE(1, dir + 4);
    ico.writeUInt16LE(32, dir + 6);
    ico.writeUInt32LE(png.length, dir + 8);
    ico.writeUInt32LE(offset, dir + 12);
    png.copy(ico, offset);
    offset += png.length;
  });

  fs.writeFileSync(path.join(__dirname, 'icon.ico'), ico);
  console.log('✅ icon.ico (' + ico.length + ' bytes, ' + sizes.join('/') + 'px)');

  app.quit();
});
