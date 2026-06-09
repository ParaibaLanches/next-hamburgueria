import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { verifyToken } from '@/lib/jwt'

function getUserId(req: Request): number | null {
  const token = req.headers.get('authorization')?.split(' ')[1]
  if (!token) return null
  const payload = verifyToken(token) as any
  return payload?.id ? Number(payload.id) : null
}

// GET /api/settings/me — returns merged settings for logged-in user
export async function GET(req: Request) {
  try {
    const userId = getUserId(req)

    const globalRows = await prisma.$queryRaw<{ key: string; value: string }[]>`
      SELECT key, value FROM "Setting" WHERE "userId" IS NULL
    `
    const merged: Record<string, string> = {}
    globalRows.forEach((r) => { merged[r.key] = r.value })

    if (userId) {
      const userRows = await prisma.$queryRaw<{ key: string; value: string }[]>`
        SELECT key, value FROM "Setting" WHERE "userId" = ${userId}
      `
      userRows.forEach((r) => { merged[r.key] = r.value })
    }

    return NextResponse.json({ success: true, data: merged })
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 })
  }
}

// POST /api/settings/me — upsert user-specific setting
export async function POST(req: Request) {
  try {
    const userId = getUserId(req)
    if (!userId) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })

    const { key, value } = await req.json()
    if (!key) return NextResponse.json({ success: false, message: 'Key is required' }, { status: 400 })

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

// DELETE /api/settings/me?key=xxx — remove user override
export async function DELETE(req: Request) {
  try {
    const userId = getUserId(req)
    if (!userId) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const key = searchParams.get('key')
    if (!key) return NextResponse.json({ success: false, message: 'Key is required' }, { status: 400 })

    await prisma.$executeRaw`
      DELETE FROM "Setting" WHERE "userId" = ${userId} AND key = ${key}
    `
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 })
  }
}
