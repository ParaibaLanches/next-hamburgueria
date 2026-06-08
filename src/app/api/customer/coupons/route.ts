import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    const coupons = await prisma.coupon.findMany({
      where: { isActive: true, deletedAt: null, expiresAt: { gt: new Date() } }
    })

    return NextResponse.json({
      success: true,
      data: coupons.map(c => ({
        ...c,
        min_purchase: Number(c.minPurchase),
        value: Number(c.value)
      }))
    })
  } catch (error: unknown) {
    return NextResponse.json({ success: false, message: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
}
