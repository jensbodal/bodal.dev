#!/usr/bin/env node

const { execSync } = require('child_process');
const http = require('http');

console.log('🧪 Testing bodal.dev site...\n');

// Test 1: Check dependencies
console.log('1️⃣ Checking dependencies...');
try {
  execSync('bun pm ls --all', { stdio: 'pipe' });
  console.log('✅ All dependencies installed\n');
} catch (error) {
  console.log('❌ Missing dependencies. Run: bun install\n');
  process.exit(1);
}

// Test 2: TypeScript check
console.log('2️⃣ Running TypeScript checks...');
try {
  execSync('bun run typecheck', { stdio: 'pipe' });
  console.log('✅ TypeScript checks passed\n');
} catch (error) {
  console.log('❌ TypeScript errors found\n');
  console.log(error.stdout?.toString());
  process.exit(1);
}

// Test 3: Build test
console.log('3️⃣ Testing production build...');
try {
  console.log('   Building... (this may take a moment)');
  execSync('bun run build', { stdio: 'pipe' });
  console.log('✅ Build completed successfully\n');
} catch (error) {
  console.log('❌ Build failed\n');
  console.log(error.stdout?.toString());
  process.exit(1);
}

// Test 4: Start dev server and check if it's running
console.log('4️⃣ Testing development server...');
const { spawn } = require('child_process');
const devServer = spawn('bun', ['run', 'dev'], {
  detached: false,
  stdio: 'pipe'
});

let serverStarted = false;
let output = '';

devServer.stdout.on('data', (data) => {
  output += data.toString();
  if (data.toString().includes('Ready in') && !serverStarted) {
    serverStarted = true;
    console.log('✅ Dev server started successfully');
    
    // Test if server responds
    setTimeout(() => {
      http.get('http://localhost:3000', (res) => {
        if (res.statusCode === 200) {
          console.log('✅ Server responding on http://localhost:3000\n');
          console.log('🎉 All tests passed! Your site is ready.\n');
          console.log('📝 Next steps:');
          console.log('   1. Run: bun run dev');
          console.log('   2. Open: http://localhost:3000');
          console.log('   3. Try typing "help" in the terminal!\n');
          devServer.kill();
          process.exit(0);
        } else {
          console.log('❌ Server not responding properly\n');
          devServer.kill();
          process.exit(1);
        }
      }).on('error', (err) => {
        console.log('❌ Could not connect to server\n');
        devServer.kill();
        process.exit(1);
      });
    }, 2000);
  }
});

devServer.stderr.on('data', (data) => {
  const error = data.toString();
  if (error.includes('Error') || error.includes('error')) {
    console.log('❌ Dev server error:\n');
    console.log(error);
  }
});

// Timeout after 10 seconds
setTimeout(() => {
  if (!serverStarted) {
    console.log('❌ Dev server failed to start within 10 seconds\n');
    console.log('Output:', output);
    devServer.kill();
    process.exit(1);
  }
}, 10000);

// Handle Ctrl+C
process.on('SIGINT', () => {
  console.log('\n\n⚠️  Test interrupted');
  devServer.kill();
  process.exit(0);
});