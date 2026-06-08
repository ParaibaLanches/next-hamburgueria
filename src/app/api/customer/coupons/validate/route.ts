import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function POST(req: Request) {
  try {
    const { code } = await req.json()

    if (!code) {
      return NextResponse.json({ success: false, error: 'Código é obrigatório' }, { status: 400 })
    }

    const coupon = await prisma.coupon.findUnique({
      where: { code: code.toUpperCase() }
    })

    if (!coupon || !coupon.isActive || coupon.deletedAt || new Date(coupon.expiresAt) < new Date()) {
      return NextResponse.json({ success: false, error: 'Cupom inválido ou expirado' }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      data: {
        ...coupon,
        min_purchase: Number(coupon.minPurchase),
        value: Number(coupon.value)
      }
    })
  } catch (error: unknown) {
    return NextResponse.json({ success: false, message: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
}
