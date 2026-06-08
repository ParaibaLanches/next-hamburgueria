import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { signToken } from '@/lib/jwt'

export async function POST(req: Request) {
  try {
    const { 
      name, email, password, phone, 
      address, cep, street, number, neighborhood, city, state, complement 
    } = await req.json()

    if (!email || !password || !name) {
      return NextResponse.json({ success: false, error: 'Nome, email e senha são obrigatórios' }, { status: 400 })
    }

    const existingClient = await prisma.client.findUnique({ where: { email } })

    if (existingClient) {
      return NextResponse.json({ success: false, error: 'Email já cadastrado' }, { status: 400 })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const client = await prisma.client.create({
      data: {
        name,
        email,
        password: hashedPassword,
        phone,
        address,
        cep,
        street,
        number,
        neighborhood,
        city,
        state,
        complement
      }
    })

    const token = signToken({ id: client.id, email: client.email, role: 'customer' })

    return NextResponse.json({
      success: true,
      data: {
        access_token: token,
        refresh_token: token,
        expires_in: 86400,
        user: {
          id: client.id,
          name: client.name,
          email: client.email
        }
      }
    }, { status: 201 })
  } catch (error: unknown) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : String(error) }, { status: 500 })
  }
}
