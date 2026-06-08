import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    const featuredProducts = await prisma.product.findMany({
      where: { isFeatured: true, available: true, deletedAt: null },
      include: { category: true }
    })

    const coupons = await prisma.coupon.findMany({
      where: { isActive: true, deletedAt: null, expiresAt: { gt: new Date() } }
    })

    return NextResponse.json({
      success: true,
      data: {
        featured_products: featuredProducts.map(p => ({
          ...p,
          category_id: p.categoryId,
          image_url: p.imageUrl,
          is_featured: p.isFeatured,
          featured_slot: p.featuredSlot,
          promotion_label: p.promotionLabel,
          promotional_price: p.promotionalPrice ? Number(p.promotionalPrice.toString()) : null,
          price: Number(p.price.toString())
        })),
        active_coupons: coupons.map(c => ({
          ...c,
          min_purchase: Number(c.minPurchase.toString()),
          value: Number(c.value.toString())
        }))
      }
    })
  } catch (error: unknown) {
    return NextResponse.json({ success: false, message: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
}
