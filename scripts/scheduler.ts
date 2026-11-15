import './runtime-env';
if (!process.env.CRON_SECRET) throw new Error('Falta CRON_SECRET');
const base = process.env.BETTER_AUTH_URL || 'http://localhost:3000';
async function tick() {
  try {
    const response = await fetch(`${base}/api/jobs/publish`, {
      headers: { authorization: `Bearer ${process.env.CRON_SECRET}` },
      signal: AbortSignal.timeout(15000),
    });
    console.log(`Publicador: HTTP ${response.status}`);
  } catch {
    console.error('Publicador temporalmente no disponible; se reintentará.');
  }
}
await tick();
setInterval(tick, 30000);
