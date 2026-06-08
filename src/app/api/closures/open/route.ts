import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken } from '@/lib/jwt'

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('authorization')
    let userId = 1 // Default to 1 if no auth logic implemented here
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const decoded = verifyToken(authHeader.split(' ')[1]) as { id: number; email: string; role?: string }
      if (decoded && decoded.id) userId = decoded.id
    }

    const { initial_balance } = await req.json()

    // Check if there is already an active closure
    const active = await prisma.closure.findFirst({ where: { closingTime: null } })
    if (active) {
      return NextResponse.json({ success: false, message: 'Já existe um caixa aberto' }, { status: 400 })
    }

    const closure = await prisma.closure.create({
      data: {
        initialBalance: initial_balance || 0,
        userId: userId,
        openingTime: new Date()
      }
    })

    return NextResponse.json({ success: true, data: closure }, { status: 201 })
  } catch (error: unknown) {
    return NextResponse.json({ success: false, message: error instanceof Error ? error.message : String(error) }, { status: 500 })
  }
}
