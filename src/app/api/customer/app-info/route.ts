import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    const activeClosure = await prisma.closure.findFirst({
      where: { status: 'open' }
    })

    return NextResponse.json({
      success: true,
      data: {
        is_open: !!activeClosure,
        min_order_value: 10.0,
        delivery_enabled: true
      }
    })
  } catch (error: unknown) {
    return NextResponse.json({ success: false, message: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
}
