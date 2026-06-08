import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { categorySchema } from '@/lib/validations'
import { z } from 'zod'

export async function GET(req: Request) {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' }
    })
    return NextResponse.json({ success: true, data: categories })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Erro interno'
    return NextResponse.json({ success: false, message: msg }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    let body;
    try {
      body = categorySchema.parse(await req.json())
    } catch (e) {
      if (e instanceof z.ZodError) {
        return NextResponse.json({ success: false, message: (e as unknown as { errors: { message: string }[] }).errors[0]?.message || 'Validation error' }, { status: 400 })
      }
      throw e;
    }
    const { name, description } = body
    
    const category = await prisma.category.create({
      data: { name, description }
    })

    return NextResponse.json({ success: true, data: category }, { status: 201 })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Erro interno'
    return NextResponse.json({ success: false, message: msg }, { status: 500 })
  }
}
