import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { clientSchema } from '@/lib/validations'
import { z } from 'zod'

export async function GET(req: Request) {
  try {
    const clients = await prisma.client.findMany({
      orderBy: { name: 'asc' }
    })
    return NextResponse.json({ success: true, data: clients })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Erro interno'
    return NextResponse.json({ success: false, message: msg }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    let body;
    try {
      body = clientSchema.parse(await req.json())
    } catch (e) {
      if (e instanceof z.ZodError) {
        return NextResponse.json({ success: false, message: (e as unknown as { errors: { message: string }[] }).errors[0]?.message || 'Validation error' }, { status: 400 })
      }
      throw e;
    }
    const { name, email, password, document, phone, address, cep, street, number, neighborhood, city, state, complement } = body
    
    if (!name || !email) {
      return NextResponse.json({ success: false, message: 'Name and email are required' }, { status: 400 })
    }

    const client = await prisma.client.create({
      data: { name, email, phone, document, password: 'defaultpassword123' }
    })

    return NextResponse.json({ success: true, data: client }, { status: 201 })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Erro interno'
    return NextResponse.json({ success: false, message: msg }, { status: 500 })
  }
}
