import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json()
    const { name, email, role } = body
    
    const user = await prisma.user.update({
      where: { id: Number(params.id) },
      data: { name, email, role }
    })

    return NextResponse.json({ 
      success: true, 
      data: { id: user.id, name: user.name, email: user.email, role: user.role } 
    })
  } catch (error: unknown) {
    return NextResponse.json({ success: false, message: error instanceof Error ? error.message : String(error) }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    await prisma.user.update({
      where: { id: Number(params.id) },
      data: { deletedAt: new Date() }
    })
    return NextResponse.json({ success: true, message: 'Deleted' })
  } catch (error: unknown) {
    return NextResponse.json({ success: false, message: error instanceof Error ? error.message : String(error) }, { status: 500 })
  }
}
