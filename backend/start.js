#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

// Check if TypeScript is available
const isTypeScriptAvailable = () => {
  try {
    require.resolve('typescript');
    return true;
  } catch {
    return false;
  }
};

// Check if ts-node is available
const isTsNodeAvailable = () => {
  try {
    require.resolve('ts-node');
    return true;
  } catch {
    return false;
  }
};

// Start the server
const startServer = () => {
  const isDev = process.env.NODE_ENV !== 'production';
  
  if (isDev) {
    // Development mode - use ts-node-dev if available
    if (isTsNodeAvailable()) {
      console.log('🚀 Starting development server with ts-node-dev...');
      const child = spawn('npx', ['ts-node-dev', '--respawn', '--transpile-only', 'src/server.ts'], {
        stdio: 'inherit',
        shell: true
      });
      
      child.on('error', (err) => {
        console.error('Failed to start development server:', err);
        process.exit(1);
      });
    } else {
      console.log('⚠️  ts-node-dev not found, building and starting...');
      buildAndStart();
    }
  } else {
    // Production mode - use built JavaScript
    console.log('🚀 Starting production server...');
    const child = spawn('node', ['dist/server.js'], {
      stdio: 'inherit',
      shell: true
    });
    
    child.on('error', (err) => {
      console.error('Failed to start production server:', err);
      process.exit(1);
    });
  }
};

// Build and start
const buildAndStart = () => {
  console.log('🔨 Building TypeScript...');
  const buildProcess = spawn('npx', ['tsc'], {
    stdio: 'inherit',
    shell: true
  });
  
  buildProcess.on('close', (code) => {
    if (code === 0) {
      console.log('✅ Build successful, starting server...');
      const child = spawn('node', ['dist/server.js'], {
        stdio: 'inherit',
        shell: true
      });
      
      child.on('error', (err) => {
        console.error('Failed to start server:', err);
        process.exit(1);
      });
    } else {
      console.error('❌ Build failed');
      process.exit(1);
    }
  });
};

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down server...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n👋 Shutting down server...');
  process.exit(0);
});

// Start the server
startServer();
