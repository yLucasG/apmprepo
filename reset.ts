import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  console.log('Dropping table TrabalhoAcademico to release any DB locks and schema caching...')
  await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS "TrabalhoAcademico" CASCADE;`)
  console.log('Drop successful.')
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect())
