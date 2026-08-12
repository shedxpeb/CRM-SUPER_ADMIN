const { PrismaClient } = require('@prisma/client');
(async () => {
  const p = new PrismaClient();
  const rows = await p.$queryRawUnsafe('SELECT status, COUNT(*)::int AS n FROM tenants GROUP BY status');
  console.log('statuses:', JSON.stringify(rows));
  const cols = await p.$queryRawUnsafe("SELECT column_name FROM information_schema.columns WHERE table_name='tenants' ORDER BY ordinal_position");
  console.log('cols:', cols.map((x) => x.column_name).join(','));
  await p.$disconnect();
})().catch((e) => { console.error(e.message); process.exit(1); });