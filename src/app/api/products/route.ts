import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { productSchema } from '@/lib/validations'
import { z } from 'zod'

export async function GET(req: Request) {
  try {
    const products = await prisma.product.findMany({
      include: { category: true, ingredients: true },
      orderBy: { name: 'asc' }
    })
    return NextResponse.json({ success: true, data: products })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Erro interno'
    return NextResponse.json({ success: false, message: msg }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    let body;
    try {
      body = productSchema.parse(await req.json())
    } catch (e) {
      if (e instanceof z.ZodError) {
        return NextResponse.json({ success: false, message: (e as unknown as { errors: { message: string }[] }).errors[0]?.message || 'Validation error' }, { status: 400 })
      }
      throw e;
    }
    const { name, description, price, categoryId, imageUrl, isFeatured, featuredSlot, promotionLabel, promotionalPrice, available, ingredientIds } = body

    if (!name || price === undefined || !categoryId) {
      return NextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 })
    }

    const product = await prisma.product.create({
      data: {
        name,
        description,
        price,
        categoryId,
        imageUrl,
        isFeatured: isFeatured || false,
        available: available !== undefined ? available : true,
        featuredSlot,
        promotionLabel,
        promotionalPrice,
        ingredients: ingredientIds && ingredientIds.length > 0 ? {
          connect: ingredientIds.map((id: number) => ({ id }))
        } : undefined
      },
      include: { category: true, ingredients: true }
    })

    return NextResponse.json({ success: true, data: product }, { status: 201 })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Erro interno'
    return NextResponse.json({ success: false, message: msg }, { status: 500 })
  }
}
