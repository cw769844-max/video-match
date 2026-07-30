import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Minimal placeholder seed so `npm run db:seed` has something to do out of
// the box. Real card/set/banlist ingestion from YGOPRODeck lands in a
// dedicated ingestion script (see task: "Build card/set data ingestion").
async function main() {
  await prisma.banlist.upsert({
    where: { id: "unlimited" },
    update: {},
    create: {
      id: "unlimited",
      name: "No Banlist (Unlimited)",
      effectiveDate: new Date("2000-01-01"),
    },
  });
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (err) => {
    console.error(err);
    await prisma.$disconnect();
    process.exit(1);
  });
