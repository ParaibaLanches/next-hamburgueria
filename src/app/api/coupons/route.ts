import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(req: Request) {
  try {
    const coupons = await prisma.coupon.findMany({
      orderBy: { createdAt: 'desc' }
    })
    return NextResponse.json({ success: true, data: coupons })
  } catch (error: unknown) {
    return NextResponse.json({ success: false, message: error instanceof Error ? error.message : String(error) }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { code, type, value, minOrder, validUntil, maxUses } = body
    
    const coupon = await prisma.coupon.create({
      data: {
        code: code.toUpperCase(),
        type,
        value,
        minPurchase: minOrder || 0,
        expiresAt: validUntil ? new Date(validUntil) : new Date(Date.now() + 30*24*60*60*1000), // default 30 days
        usageLimit: maxUses || 0
      }
    })

    return NextResponse.json({ success: true, data: coupon }, { status: 201 })
  } catch (error: unknown) {
    return NextResponse.json({ success: false, message: error instanceof Error ? error.message : String(error) }, { status: 500 })
  }
}
