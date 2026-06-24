const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
async function main() {
  const hash = await bcrypt.hash("admin123", 10);
  const admin = await prisma.platformAdmin.findFirst();
  if (!admin) {
    console.log("No platform admin found! Creating one...");
    await prisma.platformAdmin.create({
      data: { name: "Platform Admin", email: "admin@hrmpro.com", passwordHash: hash, role: "PLATFORM_ADMIN" }
    });
    console.log("Created! Email: admin@hrmpro.com Password: admin123");
  } else {
    await prisma.platformAdmin.update({ where: { id: admin.id }, data: { passwordHash: hash } });
    console.log("Password reset! Email:", admin.email, "Password: admin123");
  }
  await prisma.$disconnect();
}
main().catch(console.error);
