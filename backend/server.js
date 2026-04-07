import('./server.mjs').catch((err) => {
  console.error('Failed to start ES module server:', err);
  process.exit(1);
});
