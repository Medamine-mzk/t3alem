import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  const adminPassword = await bcrypt.hash("admin123456", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@t3alem.com" },
    update: {},
    create: {
      email: "admin@t3alem.com",
      username: "admin",
      passwordHash: adminPassword,
      firstName: "Admin",
      lastName: "User",
      className: "Administration",
      specialization: "Platform Management",
      role: "ADMIN",
    },
  });

  console.log("Admin user created:", admin.email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
