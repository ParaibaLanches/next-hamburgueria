import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken } from '@/lib/jwt'

function getUserId(req: Request): number | null {
  const token = req.headers.get('authorization')?.split(' ')[1]
  if (!token) return null
  const payload = verifyToken(token) as any
  return payload?.id ? Number(payload.id) : null
}

// PATCH /api/settings/me/[key] — upsert user setting override
export async function PATCH(req: Request, { params }: { params: Promise<{ key: string }> }) {
  try {
    const { key } = await params
    const userId = getUserId(req)
    if (!userId) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })

    const { value } = await req.json()
    if (value === undefined) return NextResponse.json({ success: false, message: 'Value is required' }, { status: 400 })

    await prisma.$executeRaw`
      INSERT INTO "Setting" (key, value, "userId", "createdAt", "updatedAt")
      VALUES (${key}, ${String(value)}, ${userId}, NOW(), NOW())
      ON CONFLICT ("userId", key) DO UPDATE SET value = ${String(value)}, "updatedAt" = NOW()
    `
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 })
  }
}

// DELETE /api/settings/me/[key] — remove user override
export async function DELETE(req: Request, { params }: { params: Promise<{ key: string }> }) {
  try {
    const { key } = await params
    const userId = getUserId(req)
    if (!userId) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })

    await prisma.$executeRaw`
      DELETE FROM "Setting" WHERE "userId" = ${userId} AND key = ${key}
    `
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 })
  }
}
