import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { signToken } from '@/lib/jwt'

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json()

    if (!email || !password) {
      return NextResponse.json({ success: false, error: 'Credenciais inválidas' }, { status: 400 })
    }

    const client = await prisma.client.findUnique({ where: { email } })

    if (!client) {
      return NextResponse.json({ success: false, error: 'Usuário não encontrado' }, { status: 401 })
    }

    const isValid = await bcrypt.compare(password, client.password)

    if (!isValid) {
      return NextResponse.json({ success: false, error: 'Credenciais inválidas' }, { status: 401 })
    }

    // Role will be 'customer' to differentiate from admin users
    const token = signToken({ id: client.id, email: client.email, role: 'customer' })

    return NextResponse.json({
      success: true,
      data: {
        access_token: token,
        refresh_token: token,
        expires_in: 86400
      }
    })
  } catch (error: unknown) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : String(error) }, { status: 500 })
  }
}
