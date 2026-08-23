/**
 * `npm run web` — start the Metro dev server and the web preview server
 * together, and tear both down on Ctrl+C.
 */

'use strict';

const { spawn } = require('child_process');
const path = require('path');

const root = path.join(__dirname, '..');
const rnBin = path.join(root, 'node_modules', '.bin', 'react-native');

const children = [];

function start(command, args) {
  const child = spawn(command, args, { cwd: root, stdio: 'inherit' });
  children.push(child);
  child.on('exit', code => process.exit(code ?? 0));
  return child;
}

start(rnBin, ['start']);
start(process.execPath, [path.join(__dirname, 'server.js')]);

const shutdown = signal => {
  console.log(`\n[web] received ${signal}, stopping…`);
  children.forEach(child => child.kill(signal === 'SIGINT' ? 'SIGINT' : 'SIGTERM'));
  process.exit(130);
};
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
