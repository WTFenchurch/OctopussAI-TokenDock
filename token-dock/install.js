/**
 * Token Dock — Installer
 * Creates Desktop, Start Menu, and Taskbar shortcuts on Windows
 * All shortcuts use icon.ico for proper themed icons.
 *
 * Prerequisites: Run `npx electron build-icon.js` first to generate icon.ico
 * Run: node install.js  (or npm run install-shortcuts)
 */
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

const APP_NAME = 'Token Dock';
const IS_WIN = process.platform === 'win32';

function getStartMenuPath() {
  if (!IS_WIN) return null;
  return path.join(process.env.APPDATA, 'Microsoft', 'Windows', 'Start Menu', 'Programs');
}

function getDesktopPath() {
  if (!IS_WIN) return null;
  const oneDrive = path.join(process.env.USERPROFILE, 'OneDrive', 'Desktop');
  if (fs.existsSync(oneDrive)) return oneDrive;
  const standard = path.join(process.env.USERPROFILE, 'Desktop');
  if (fs.existsSync(standard)) return standard;
  return null;
}

function getTaskbarPath() {
  if (!IS_WIN) return null;
  return path.join(process.env.APPDATA, 'Microsoft', 'Internet Explorer', 'Quick Launch', 'User Pinned', 'TaskBar');
}

function ensureIcon() {
  const icoPath = path.resolve(__dirname, 'icon.ico');
  if (fs.existsSync(icoPath)) return icoPath;

  // Try to build it
  console.log('  ⚠️  icon.ico not found — building from icon.svg...');
  const electronCmd = path.resolve(__dirname, 'node_modules', '.bin', 'electron.cmd');
  const buildScript = path.resolve(__dirname, 'build-icon.js');

  if (fs.existsSync(electronCmd) && fs.existsSync(buildScript)) {
    try {
      execSync(`"${electronCmd}" "${buildScript}"`, { stdio: 'pipe', timeout: 15000 });
      if (fs.existsSync(icoPath)) {
        console.log('  ✅ icon.ico built successfully');
        return icoPath;
      }
    } catch (e) {
      console.error('  ❌ Auto-build failed:', e.message);
    }
  }

  console.log('  ℹ️  Run: npx electron build-icon.js');
  return null;
}

function createWindowsShortcut(targetDir, name, iconPath) {
  const electronPath = path.resolve(__dirname, 'node_modules', '.bin', 'electron.cmd');
  const appPath = path.resolve(__dirname);
  const shortcutPath = path.join(targetDir, `${name}.lnk`);

  if (!fs.existsSync(electronPath)) {
    console.error('  ❌ electron.cmd not found. Run: npm install');
    return null;
  }

  const esc = s => s.replace(/'/g, "''");
  const iconLine = iconPath ? `$sc.IconLocation = '${esc(iconPath)}';` : '';

  const ps = `$ws = New-Object -ComObject WScript.Shell; $sc = $ws.CreateShortcut('${esc(shortcutPath)}'); $sc.TargetPath = '${esc(electronPath)}'; $sc.Arguments = '"${esc(appPath)}"'; $sc.WorkingDirectory = '${esc(appPath)}'; $sc.Description = 'Token Dock - AI Token Monitor'; ${iconLine} $sc.Save();`;

  try {
    execSync(`powershell -NoProfile -Command "${ps}"`, { stdio: 'pipe' });
    return shortcutPath;
  } catch (e) {
    console.error(`  ❌ Failed: ${shortcutPath}`, e.message);
    return null;
  }
}

function pinToTaskbar(shortcutPath) {
  // Windows 10/11: copy the .lnk to the TaskBar pinned folder
  const taskbarDir = getTaskbarPath();
  if (!taskbarDir || !fs.existsSync(taskbarDir)) {
    // Fallback: try using verb "Pin to taskbar" via PowerShell
    try {
      const ps = `$shell = New-Object -ComObject Shell.Application; $folder = $shell.Namespace((Split-Path '${shortcutPath.replace(/'/g, "''")}')); $item = $folder.ParseName((Split-Path '${shortcutPath.replace(/'/g, "''")}' -Leaf)); $verb = $item.Verbs() | Where-Object { $_.Name -match 'taskbar' }; if ($verb) { $verb.DoIt() }`;
      execSync(`powershell -NoProfile -Command "${ps}"`, { stdio: 'pipe' });
      return true;
    } catch (e) {
      return false;
    }
  }

  // Direct copy method
  try {
    const dest = path.join(taskbarDir, path.basename(shortcutPath));
    fs.copyFileSync(shortcutPath, dest);
    return true;
  } catch (e) {
    return false;
  }
}

function install() {
  console.log('');
  console.log('╔═══════════════════════════════════════════╗');
  console.log('║  🐙 Token Dock — Installing Shortcuts     ║');
  console.log('╚═══════════════════════════════════════════╝');
  console.log('');

  if (!IS_WIN) {
    console.log('ℹ️  Shortcuts are Windows-only.');
    console.log('   On macOS/Linux, run: npm run dock');
    return;
  }

  // 0. Ensure icon.ico exists
  const iconPath = ensureIcon();
  if (iconPath) {
    console.log(`  🎨 Using icon: ${iconPath}`);
  } else {
    console.log('  ⚠️  No icon.ico — shortcuts will use default icon');
  }
  console.log('');

  let created = 0;

  // 1. Desktop shortcut
  const desktop = getDesktopPath();
  if (desktop && fs.existsSync(desktop)) {
    const result = createWindowsShortcut(desktop, APP_NAME, iconPath);
    if (result) {
      console.log(`  ✅ Desktop:    ${result}`);
      created++;
    }
  } else {
    console.log('  ⏭️  Desktop: path not found, skipped');
  }

  // 2. Start Menu shortcut
  const startMenu = getStartMenuPath();
  if (startMenu && fs.existsSync(startMenu)) {
    const result = createWindowsShortcut(startMenu, APP_NAME, iconPath);
    if (result) {
      console.log(`  ✅ Start Menu: ${result}`);
      created++;
    }
  } else {
    console.log('  ⏭️  Start Menu: path not found, skipped');
  }

  // 3. Taskbar pin (uses desktop shortcut as source)
  const desktopLnk = desktop ? path.join(desktop, `${APP_NAME}.lnk`) : null;
  if (desktopLnk && fs.existsSync(desktopLnk)) {
    const pinned = pinToTaskbar(desktopLnk);
    if (pinned) {
      console.log('  ✅ Taskbar:    pinned (may require restart)');
      created++;
    } else {
      console.log('  ⚠️  Taskbar:    auto-pin not available — right-click Desktop shortcut → "Pin to taskbar"');
    }
  }

  console.log('');
  if (created > 0) {
    console.log(`  🎉 ${created} shortcut(s) installed with octopus icon!`);
  } else {
    console.log('  ⚠️  No shortcuts created. Check permissions.');
  }
  console.log('  💡 To launch: search "Token Dock" in Start Menu');
  console.log('');
}

if (require.main === module) {
  install();
}

module.exports = { install };
