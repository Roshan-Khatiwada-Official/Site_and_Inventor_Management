// One-off migration: hash any plaintext passwords already sitting in the
// database (imported from the old Sheets system). Safe to re-run — already
// bcrypt-hashed rows are left untouched (isHashed check).

import 'dotenv/config';
import { prisma } from '../lib/prisma.js';
import { hashPassword, isHashed } from '../lib/auth.js';

async function main() {
  const users = await prisma.user.findMany({ select: { id: true, loginId: true, password: true } });
  let hashed = 0;
  for (const u of users) {
    if (!u.password || isHashed(u.password)) continue;
    await prisma.user.update({ where: { id: u.id }, data: { password: await hashPassword(u.password) } });
    hashed++;
  }
  console.log(`Hashed ${hashed} of ${users.length} users' passwords (rest were already hashed).`);
}

main()
  .catch(err => { console.error(err); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
