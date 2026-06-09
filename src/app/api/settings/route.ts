import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// Default global settings
const DEFAULTS: Record<string, string> = {
  app_name: 'Paraíba Lanches',
  app_description: '',
  app_logo_url: '',
  app_contact_whatsapp: '',
  app_contact_instagram: '',
  payment_cash_enabled: 'true',
  payment_credit_card_enabled: 'true',
  payment_debit_card_enabled: 'true',
  payment_pix_enabled: 'true',
  order_local_enabled: 'true',
  order_pickup_enabled: 'true',
  order_delivery_enabled: 'false',
  delivery_min_fee: '5',
  delivery_fee_per_km: '2',
  delivery_max_radius: '30',
  delivery_allowed_cities: '',
  store_address: '',
  google_maps_api_key: '',
  sidebar_collapsed_default: 'false',
}

// GET /api/settings — returns all global settings (merged with defaults)
export async function GET() {
  try {
    const rows = await prisma.$queryRaw<{ key: string; value: string }[]>`
      SELECT key, value FROM "Setting" WHERE "userId" IS NULL
    `
    const dbMap: Record<string, string> = {}
    rows.forEach((r) => { dbMap[r.key] = r.value })

    return NextResponse.json({ success: true, data: { ...DEFAULTS, ...dbMap } })
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 })
  }
}

// POST /api/settings — upsert a global setting
export async function POST(req: Request) {
  try {
    const { key, value } = await req.json()
    if (!key) return NextResponse.json({ success: false, message: 'Key is required' }, { status: 400 })

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
