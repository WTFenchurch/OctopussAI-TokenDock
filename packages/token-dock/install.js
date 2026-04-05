/**
 * Token Dock — Installer
 * Creates Start Menu shortcut on Windows
 * Run: node install.js
 */
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

const APP_NAME = 'Token Dock';
const IS_WIN = process.platform === 'win32';

function getStartMenuPath() {
  if (!IS_WIN) return null;
  const appData = process.env.APPDATA;
  return path.join(appData, 'Microsoft', 'Windows', 'Start Menu', 'Programs');
}

function getDesktopPath() {
  if (!IS_WIN) return null;
  // Check OneDrive Desktop first, then standard Desktop
  const oneDrive = path.join(process.env.USERPROFILE, 'OneDrive', 'Desktop');
  if (fs.existsSync(oneDrive)) return oneDrive;
  const standard = path.join(process.env.USERPROFILE, 'Desktop');
  if (fs.existsSync(standard)) return standard;
  return null;
}

function createWindowsShortcut(targetDir, name) {
  const electronPath = path.resolve(__dirname, 'node_modules', '.bin', 'electron.cmd');
  const appPath = path.resolve(__dirname);
  const iconPath = path.resolve(__dirname, 'icon.ico');
  const shortcutPath = path.join(targetDir, `${name}.lnk`);

  // Use PowerShell to create .lnk shortcut
  const ps = `
    $ws = New-Object -ComObject WScript.Shell;
    $sc = $ws.CreateShortcut('${shortcutPath.replace(/'/g, "''")}');
    $sc.TargetPath = '${electronPath.replace(/'/g, "''")}';
    $sc.Arguments = '"${appPath.replace(/'/g, "''")}"';
    $sc.WorkingDirectory = '${appPath.replace(/'/g, "''")}';
    $sc.Description = 'Token Dock — AI Token Monitor';
    ${fs.existsSync(iconPath) ? `$sc.IconLocation = '${iconPath.replace(/'/g, "''")}';` : ''}
    $sc.Save();
  `.replace(/\n/g, ' ');

  try {
    execSync(`powershell -NoProfile -Command "${ps}"`, { stdio: 'pipe' });
    return shortcutPath;
  } catch (e) {
    console.error(`Failed to create shortcut at ${shortcutPath}:`, e.message);
    return null;
  }
}

function install() {
  console.log('');
  console.log('╔══════════════════════════════════════════╗');
  console.log('║  🐙 Token Dock — Installing...           ║');
  console.log('╚══════════════════════════════════════════╝');
  console.log('');

  if (!IS_WIN) {
    console.log('ℹ️  Start Menu shortcuts are Windows-only.');
    console.log('   On macOS/Linux, run: npm run dock');
    return;
  }

  // 1. Start Menu shortcut
  const startMenu = getStartMenuPath();
  if (startMenu && fs.existsSync(startMenu)) {
    const result = createWindowsShortcut(startMenu, APP_NAME);
    if (result) {
      console.log(`✅ Start Menu shortcut created: ${result}`);
    }
  }

  // 2. Desktop shortcut
  const desktop = getDesktopPath();
  if (desktop && fs.existsSync(desktop)) {
    const result = createWindowsShortcut(desktop, APP_NAME);
    if (result) {
      console.log(`✅ Desktop shortcut created: ${result}`);
    }
  }

  console.log('');
  console.log('🎉 Installation complete!');
  console.log('   Launch from Start Menu: "Token Dock"');
  console.log('   Or run: npm run dock');
  console.log('');
}

// Run if called directly
if (require.main === module) {
  install();
}

module.exports = { install };
