import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken } from '@/lib/jwt'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import crypto from 'crypto'

async function getClientFromToken(req: Request) {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null

  const token = authHeader.split(' ')[1]
  const decoded = verifyToken(token) as any
  if (!decoded || !decoded.id) return null

  return prisma.client.findUnique({ where: { id: decoded.id } })
}

export async function GET(req: Request) {
  try {
    const client = await getClientFromToken(req)
    if (!client) {
      return NextResponse.json({ success: false, message: 'Não autorizado' }, { status: 401 })
    }

    return NextResponse.json({
      success: true,
      data: {
        id: client.id,
        name: client.name,
        email: client.email,
        phone: client.phone,
        document: client.document,
        address: client.address,
        cep: client.cep,
        street: client.street,
        number: client.number,
        neighborhood: client.neighborhood,
        city: client.city,
        state: client.state,
        complement: client.complement,
        avatar_url: client.avatarUrl
      }
    })
  } catch (error: unknown) {
    return NextResponse.json({ success: false, message: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const client = await getClientFromToken(req)
    if (!client) {
      return NextResponse.json({ success: false, message: 'Não autorizado' }, { status: 401 })
    }

    const data = await req.json()
    const updateData: any = {}
    
    if (data.name !== undefined) updateData.name = data.name
    if (data.phone !== undefined) updateData.phone = data.phone
    if (data.document !== undefined) updateData.document = data.document
    if (data.cep !== undefined) updateData.cep = data.cep
    if (data.street !== undefined) updateData.street = data.street
    if (data.number !== undefined) updateData.number = data.number
    if (data.neighborhood !== undefined) updateData.neighborhood = data.neighborhood
    if (data.city !== undefined) updateData.city = data.city
    if (data.state !== undefined) updateData.state = data.state
    if (data.complement !== undefined) updateData.complement = data.complement

    const updated = await prisma.client.update({
      where: { id: client.id },
      data: updateData
    })

    return NextResponse.json({
      success: true,
      data: {
        id: updated.id,
        name: updated.name,
        email: updated.email,
        phone: updated.phone,
        document: updated.document,
        address: updated.address,
        cep: updated.cep,
        street: updated.street,
        number: updated.number,
        neighborhood: updated.neighborhood,
        city: updated.city,
        state: updated.state,
        complement: updated.complement,
        avatar_url: updated.avatarUrl
      }
    })
  } catch (error: unknown) {
    return NextResponse.json({ success: false, message: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const client = await getClientFromToken(req)
    if (!client) {
      return NextResponse.json({ success: false, message: 'Não autorizado' }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get('image') as File | null

    if (!file) {
      return NextResponse.json({ success: false, message: 'Nenhuma imagem enviada' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    
    const ext = file.name.split('.').pop() || 'jpg'
    const fileName = `avatar-${client.id}-${crypto.randomBytes(4).toString('hex')}.${ext}`
    
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'avatars')
    try {
      await mkdir(uploadDir, { recursive: true })
    } catch (e) {
      // Ignore if exists
    }

    const filePath = path.join(uploadDir, fileName)
    await writeFile(filePath, buffer)

    const avatarUrl = `/uploads/avatars/${fileName}`

    const updated = await prisma.client.update({
      where: { id: client.id },
      data: { avatarUrl }
    })

    return NextResponse.json({
      success: true,
      data: {
        avatar_url: updated.avatarUrl
      }
    })
  } catch (error: unknown) {
    return NextResponse.json({ success: false, message: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
}
