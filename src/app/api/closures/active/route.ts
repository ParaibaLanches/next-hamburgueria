import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  try {
    const activeClosure = await prisma.closure.findFirst({
      where: { closingTime: null },
      include: { user: true }
    })
    
    if (!activeClosure) {
      return NextResponse.json({ success: true, data: null })
    }

    // Always fetch latest payments for this closure to ensure absolute accuracy
    const payments = await prisma.payment.findMany({
      where: { order: { closureId: activeClosure.id, status: { not: 'cancelled' } } }
    })

    let totalCash = 0, totalPix = 0, totalCredit = 0, totalDebit = 0;
    for (const p of payments) {
      const amount = Number(p.amount);
      if (p.method === 'cash') totalCash += amount;
      if (p.method === 'pix') totalPix += amount;
      if (p.method === 'credit_card') totalCredit += amount;
      if (p.method === 'debit_card') totalDebit += amount;
    }

    // Optionally update DB to stay synced (fire and forget)
    prisma.closure.update({
      where: { id: activeClosure.id },
      data: { totalCash, totalPix, totalCredit, totalDebit }
    }).catch(() => {})

    const mapped = {
      ...activeClosure,
      opening_time: activeClosure.openingTime,
      total_cash: totalCash,
      total_pix: totalPix,
      total_credit: totalCredit,
      total_debit: totalDebit,
      initial_balance: Number(activeClosure.initialBalance),
    }

    return NextResponse.json({ success: true, data: mapped })
  } catch (error: unknown) {
    return NextResponse.json({ success: false, message: error instanceof Error ? error.message : String(error) }, { status: 500 })
  }
}
