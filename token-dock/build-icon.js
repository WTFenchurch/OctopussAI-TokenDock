/**
 * Token Dock — Icon Builder
 * Renders baby-otto.png at multiple sizes → builds icon.ico + icon.png
 * Run: npx electron build-icon.js
 */
const { app, nativeImage } = require('electron');
const fs = require('fs');
const path = require('path');

app.disableHardwareAcceleration();

app.whenReady().then(async () => {
  const srcPath = path.join(__dirname, 'baby-otto.png');
  if (!fs.existsSync(srcPath)) {
    console.error('baby-otto.png not found!');
    app.quit();
    return;
  }

  const img = nativeImage.createFromPath(srcPath);
  const sizes = [16, 24, 32, 48, 64, 128, 256];
  const pngBuffers = {};

  sizes.forEach(sz => {
    const resized = img.resize({ width: sz, height: sz, quality: 'best' });
    pngBuffers[sz] = resized.toPNG();
  });

  // Save 256px PNG as icon.png
  fs.writeFileSync(path.join(__dirname, 'icon.png'), pngBuffers[256]);
  console.log('✅ icon.png (' + pngBuffers[256].length + ' bytes) — from baby-otto.png');

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
  console.log('✅ icon.ico (' + ico.length + ' bytes, ' + sizes.join('/') + 'px) — from baby-otto.png');

  app.quit();
});
