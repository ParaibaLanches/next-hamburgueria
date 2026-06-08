import prisma from '../../src/lib/prisma'
import { seedUsers } from './seed-users'
import { seedCategoriesAndProducts } from './seed-products'
import { seedCoupons } from './seed-coupons'

async function main() {
  console.log('🌱 Starting modular seed...')
  
  await seedUsers()
  await seedCategoriesAndProducts()
  await seedCoupons()

  console.log('🎉 Seed completed successfully!')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
