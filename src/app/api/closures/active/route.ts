import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(req: Request) {
  try {
    const activeClosure = await prisma.closure.findFirst({
      where: { closingTime: null },
      include: { user: true }
    })
    
    return NextResponse.json({ success: true, data: activeClosure })
  } catch (error: unknown) {
    return NextResponse.json({ success: false, message: error instanceof Error ? error.message : String(error) }, { status: 500 })
  }
}
