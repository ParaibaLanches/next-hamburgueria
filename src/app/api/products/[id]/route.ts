import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { productSchema } from '@/lib/validations'
import { z } from 'zod'

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const productId = parseInt(id)
    if (isNaN(productId)) {
      return NextResponse.json({ success: false, message: 'ID inválido' }, { status: 400 })
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { category: true, ingredients: true }
    })

    if (!product) {
      return NextResponse.json({ success: false, message: 'Produto não encontrado' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: product })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Erro interno'
    return NextResponse.json({ success: false, message: msg }, { status: 500 })
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const productId = parseInt(id)
    if (isNaN(productId)) {
      return NextResponse.json({ success: false, message: 'ID inválido' }, { status: 400 })
    }

    const bodyStr = await req.json()
    
    const { 
      name, description, price, categoryId, imageUrl, 
      isFeatured, featuredSlot, promotionLabel, promotionalPrice, available, ingredientIds 
    } = bodyStr

    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (price !== undefined) updateData.price = price
    if (categoryId !== undefined) updateData.categoryId = categoryId
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl
    if (isFeatured !== undefined) updateData.isFeatured = isFeatured
    if (featuredSlot !== undefined) updateData.featuredSlot = featuredSlot
    if (promotionLabel !== undefined) updateData.promotionLabel = promotionLabel
    if (promotionalPrice !== undefined) updateData.promotionalPrice = promotionalPrice
    if (available !== undefined) updateData.available = available
    if (ingredientIds !== undefined) {
      updateData.ingredients = {
        set: ingredientIds.map((ingId: number) => ({ id: ingId }))
      }
    }

    const product = await prisma.product.update({
      where: { id: productId },
      data: updateData,
      include: { category: true, ingredients: true }
    })

    return NextResponse.json({ success: true, data: product })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Erro interno'
    return NextResponse.json({ success: false, message: msg }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const productId = parseInt(id)
    if (isNaN(productId)) {
      return NextResponse.json({ success: false, message: 'ID inválido' }, { status: 400 })
    }

    await prisma.product.delete({
      where: { id: productId }
    })

    return NextResponse.json({ success: true, message: 'Produto removido com sucesso' })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Erro interno'
    return NextResponse.json({ success: false, message: msg }, { status: 500 })
  }
}
