const { createClient } = require('redis');

let client = null;
let connected = false;

async function getClient() {
  const host = process.env.REDIS_HOST;
  const port = process.env.REDIS_PORT;
  const password = process.env.REDIS_PASSWORD;

  if (!host) return null;
  if (client && connected) return client;

  try {
    client = createClient({
      username: 'default',
      password,
      socket: {
        host,
        port: parseInt(port || '6379', 10),
      },
    });
    client.on('error', err => { connected = false; console.error('[Redis]', err.message); });
    client.on('ready', () => { connected = true; });
    await client.connect();
    connected = true;
    console.log('[Redis] Connected ✓');
  } catch (err) {
    console.error('[Redis] Connection failed:', err.message);
    client = null;
  }

  return client;
}

module.exports = { getClient };
