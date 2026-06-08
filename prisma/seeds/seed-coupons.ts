import prisma from '../../src/lib/prisma'

export async function seedCoupons() {
  console.log('⏳ Seeding coupons...')

  await prisma.coupon.deleteMany({})
  await prisma.coupon.createMany({
    data: [
      {
        code: 'BEMVIN',
        type: 'percentage',
        value: 10,
        minPurchase: 50.00,
        usageLimit: 100,
        usedCount: 0,
        isActive: true,
        expiresAt: new Date(new Date().setMonth(new Date().getMonth() + 1))
      },
      {
        code: 'FRETE',
        type: 'fixed',
        value: 10.00,
        minPurchase: 30.00,
        usageLimit: 50,
        usedCount: 0,
        isActive: true,
        expiresAt: new Date(new Date().setMonth(new Date().getMonth() + 1))
      }
    ]
  })
  console.log('✅ Coupons created!')
}
