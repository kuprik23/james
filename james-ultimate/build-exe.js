/**
 * James Ultimate - Secure Executable Builder
 * Uses @vercel/ncc and nexe as safer alternatives to pkg
 * 
 * Copyright © 2025 Emersa Ltd.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('');
console.log('========================================');
console.log('  James Ultimate - Executable Builder');
console.log('========================================');
console.log('');

// Parse command line arguments
const args = process.argv.slice(2);
const buildAll = args.includes('--all');
const useNexe = args.includes('--nexe');
const usePkg = args.includes('--pkg');

// Default to nexe (more secure than pkg)
const preferredTool = usePkg ? 'pkg' : (useNexe ? 'nexe' : 'nexe');

console.log(`Build tool: ${preferredTool}`);
console.log(`Build all platforms: ${buildAll}`);
console.log('');

// Ensure dist directory exists
if (!fs.existsSync('dist')) {
    console.log('ERROR: dist/ directory not found. Run "npm run build:ts" first.');
    process.exit(1);
}

// Check if main.js exists
if (!fs.existsSync('dist/main.js')) {
    console.log('ERROR: dist/main.js not found. Run "npm run build:ts" first.');
    process.exit(1);
}

console.log('[1/3] Preparing build...');

// Create output directory
const outputDir = path.join(__dirname, 'dist');

try {
    if (preferredTool === 'nexe') {
        console.log('[2/3] Building with nexe (secure alternative)...');
        
        if (buildAll) {
            // Build for all platforms
            console.log('  Building for Windows x64...');
            execSync('npx nexe dist/main.js -t windows-x64-18.0.0 -o dist/James-win.exe', { stdio: 'inherit' });
            
            console.log('  Building for macOS x64...');
            execSync('npx nexe dist/main.js -t macos-x64-18.0.0 -o dist/James-macos', { stdio: 'inherit' });
            
            console.log('  Building for Linux x64...');
            execSync('npx nexe dist/main.js -t linux-x64-18.0.0 -o dist/James-linux', { stdio: 'inherit' });
        } else {
            // Build for current platform only
            console.log('  Building for Windows x64...');
            execSync('npx nexe dist/main.js -t windows-x64-18.0.0 -o dist/James.exe', { stdio: 'inherit' });
        }
        
        console.log('[3/3] Build complete!');
        console.log('');
        console.log('========================================');
        console.log('  BUILD SUCCESSFUL!');
        console.log('========================================');
        console.log('');
        
        if (buildAll) {
            console.log('Executables created:');
            console.log('  - dist/James-win.exe (Windows)');
            console.log('  - dist/James-macos (macOS)');
            console.log('  - dist/James-linux (Linux)');
        } else {
            console.log('Executable created: dist/James.exe');
        }
        
    } else if (preferredTool === 'pkg') {
        console.log('[2/3] Building with pkg (legacy mode)...');
        console.log('');
        console.log('⚠ WARNING: pkg has known security issues (GHSA-22r3-9w55-cj54)');
        console.log('Consider using nexe instead: npm run build:exe');
        console.log('');
        
        if (buildAll) {
            execSync('npx pkg dist/main.js --targets node18-win-x64,node18-macos-x64,node18-linux-x64 --out-path dist', { stdio: 'inherit' });
        } else {
            execSync('npx pkg dist/main.js --targets node18-win-x64 --output dist/James.exe', { stdio: 'inherit' });
        }
        
        console.log('[3/3] Build complete!');
    }
    
    console.log('');
    console.log('You can now run the executable!');
    console.log('');
    
} catch (error) {
    console.error('');
    console.error('========================================');
    console.error('  BUILD FAILED!');
    console.error('========================================');
    console.error('');
    console.error('Error:', error.message);
    console.error('');
    console.error('Troubleshooting:');
    console.error('1. Ensure TypeScript is compiled: npm run build:ts');
    console.error('2. Check Node.js version: node --version (18+ required)');
    console.error('3. Try alternative tool: npm run build:exe -- --pkg');
    console.error('');
    process.exit(1);
}
