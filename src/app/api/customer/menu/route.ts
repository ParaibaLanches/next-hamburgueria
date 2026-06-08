import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      where: { available: true, deletedAt: null },
      include: { category: true }
    })

    const mappedProducts = products.map(p => ({
      ...p,
      category_id: p.categoryId,
      image_url: p.imageUrl,
      is_featured: p.isFeatured,
      featured_slot: p.featuredSlot,
      promotion_label: p.promotionLabel,
      promotional_price: p.promotionalPrice ? Number(p.promotionalPrice.toString()) : null,
      price: Number(p.price.toString())
    }))

    return NextResponse.json({
      success: true,
      data: mappedProducts
    })
  } catch (error: unknown) {
    return NextResponse.json({ success: false, message: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
}
