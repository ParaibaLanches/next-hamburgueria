import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// PATCH /api/settings/[key] — upsert a global setting
export async function PATCH(req: Request, { params }: { params: Promise<{ key: string }> }) {
  try {
    const { key } = await params
    const { value } = await req.json()

    if (value === undefined) return NextResponse.json({ success: false, message: 'Value is required' }, { status: 400 })

    await prisma.$executeRaw`
      INSERT INTO "Setting" (key, value, "userId", "createdAt", "updatedAt")
      VALUES (${key}, ${String(value)}, NULL, NOW(), NOW())
      ON CONFLICT ("userId", key) DO UPDATE SET value = ${String(value)}, "updatedAt" = NOW()
    `
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 })
  }
}
