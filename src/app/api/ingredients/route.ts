import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { z } from 'zod'

const ingredientSchema = z.object({
  name: z.string().min(1, 'Nome do ingrediente é obrigatório'),
})

export async function GET() {
  try {
    const ingredients = await prisma.ingredient.findMany({
      orderBy: { name: 'asc' }
    })
    return NextResponse.json({ success: true, data: ingredients })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Erro interno'
    return NextResponse.json({ success: false, message: msg }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { name } = ingredientSchema.parse(body)

    const existing = await prisma.ingredient.findUnique({
      where: { name }
    })

    if (existing) {
      return NextResponse.json({ success: false, message: 'Ingrediente com este nome já existe' }, { status: 400 })
    }

    const ingredient = await prisma.ingredient.create({
      data: { name }
    })

    return NextResponse.json({ success: true, data: ingredient }, { status: 201 })
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, message: error.errors[0]?.message || 'Erro de validação' }, { status: 400 })
    }
    const msg = error instanceof Error ? error.message : 'Erro interno'
    return NextResponse.json({ success: false, message: msg }, { status: 500 })
  }
}
