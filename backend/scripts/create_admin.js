require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

function generatePassword(len = 12) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()-_=+';
  let out = '';
  for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

async function main() {
  const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
  if (!ADMIN_EMAIL) {
    console.error('ADMIN_EMAIL is not set in .env');
    process.exit(1);
  }

  let password = process.argv[2] || process.env.NEW_ADMIN_PASSWORD;
  let generated = false;
  if (!password) {
    password = generatePassword(14);
    generated = true;
  }

  if (password.length < 6) {
    console.error('Password must be at least 6 characters');
    process.exit(1);
  }

  const emailNormalized = ADMIN_EMAIL.trim().toLowerCase();
  const username = emailNormalized.split('@')[0];

  const hashed = await bcrypt.hash(password, 10);

  const existing = await prisma.user.findUnique({ where: { email: emailNormalized } });

  if (existing) {
    await prisma.user.update({
      where: { id: existing.id },
      data: {
        password_hash: hashed,
        is_admin: true,
      }
    });
    // ensure admin profile exists
    const adminProfile = await prisma.admin.findUnique({ where: { user_id: existing.id } });
    if (!adminProfile) {
      await prisma.admin.create({ data: { user_id: existing.id, role: 'administrator' } });
    }
    console.log(`Updated existing user (${emailNormalized}) to admin.`);
  } else {
    const user = await prisma.user.create({
      data: {
        username,
        email: emailNormalized,
        password_hash: hashed,
        is_admin: true,
        admin_profile: { create: { role: 'administrator' } }
      }
    });
    console.log(`Created admin user ${emailNormalized} (id=${user.id}).`);
  }

  if (generated) {
    console.log('Generated admin password:', password);
  } else {
    console.log('Admin password set from provided value.');
  }

  await prisma.$disconnect();
}

main().catch(err => {
  console.error('Error creating admin:', err);
  prisma.$disconnect().finally(() => process.exit(1));
});
