const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting Plesk deployment build...');

// 1. Run standard Next.js build
console.log('\n📦 Running next build...');
execSync('npm run build', { stdio: 'inherit' });

// 2. Fix server.js for IIS named pipes
console.log('\n🔧 Fixing server.js for IIS named pipes...');
const serverJsPath = path.join(__dirname, '.next', 'standalone', 'server.js');
let serverJs = fs.readFileSync(serverJsPath, 'utf8');
serverJs = serverJs.replace(
  'const currentPort = parseInt(process.env.PORT, 10) || 3000',
  'const currentPort = process.env.PORT || 3000'
);
fs.writeFileSync(serverJsPath, serverJs);

// 3. Copy public and static files
console.log('\n📁 Copying static assets...');
const copyRecursiveSync = (src, dest) => {
  const exists = fs.existsSync(src);
  const stats = exists && fs.statSync(src);
  const isDirectory = exists && stats.isDirectory();
  if (isDirectory) {
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    fs.readdirSync(src).forEach((childItemName) => {
      copyRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName));
    });
  } else {
    fs.copyFileSync(src, dest);
  }
};

copyRecursiveSync(
  path.join(__dirname, 'public'),
  path.join(__dirname, '.next', 'standalone', 'public')
);

copyRecursiveSync(
  path.join(__dirname, '.next', 'static'),
  path.join(__dirname, '.next', 'standalone', '.next', 'static')
);

// 4. Zip the standalone folder
console.log('\n🗜️ Zipping files into plesk-deploy.zip...');
try {
  // Using PowerShell to zip
  execSync('powershell.exe -Command "Compress-Archive -Path .next\\standalone\\* -DestinationPath plesk-deploy.zip -Force"', { stdio: 'inherit' });
  console.log('\n✅ Successfully created plesk-deploy.zip!');
} catch (err) {
  console.error('\n❌ Failed to zip files. You can manually zip the contents of .next/standalone');
}
