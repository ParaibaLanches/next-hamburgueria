import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { z } from 'zod'

const ingredientSchema = z.object({
  name: z.string().min(1, 'Nome do ingrediente é obrigatório'),
})

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ingredientId = parseInt(id)
    if (isNaN(ingredientId)) {
      return NextResponse.json({ success: false, message: 'ID inválido' }, { status: 400 })
    }

    const body = await req.json()
    const { name } = ingredientSchema.parse(body)

    const existing = await prisma.ingredient.findUnique({
      where: { name }
    })

    if (existing && existing.id !== ingredientId) {
      return NextResponse.json({ success: false, message: 'Ingrediente com este nome já existe' }, { status: 400 })
    }

    const ingredient = await prisma.ingredient.update({
      where: { id: ingredientId },
      data: { name }
    })

    return NextResponse.json({ success: true, data: ingredient })
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, message: error.errors[0]?.message || 'Erro de validação' }, { status: 400 })
    }
    const msg = error instanceof Error ? error.message : 'Erro interno'
    return NextResponse.json({ success: false, message: msg }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ingredientId = parseInt(id)
    if (isNaN(ingredientId)) {
      return NextResponse.json({ success: false, message: 'ID inválido' }, { status: 400 })
    }

    // Check if ingredient is used in any product
    const ingredient = await prisma.ingredient.findUnique({
      where: { id: ingredientId },
      include: {
        _count: {
          select: { products: true }
        }
      }
    })

    if (!ingredient) {
      return NextResponse.json({ success: false, message: 'Ingrediente não encontrado' }, { status: 404 })
    }

    if (ingredient._count.products > 0) {
      return NextResponse.json({ 
        success: false, 
        message: `Não é possível remover. Este ingrediente está sendo usado em ${ingredient._count.products} produto(s).` 
      }, { status: 400 })
    }

    await prisma.ingredient.delete({
      where: { id: ingredientId }
    })

    return NextResponse.json({ success: true, message: 'Ingrediente removido' })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Erro interno'
    return NextResponse.json({ success: false, message: msg }, { status: 500 })
  }
}
