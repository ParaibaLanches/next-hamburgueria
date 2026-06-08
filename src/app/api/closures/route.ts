import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    
    let whereClause: any = {}
    
    if (startDate && endDate) {
      whereClause.openingTime = {
        gte: new Date(startDate + 'T00:00:00.000Z'),
        lte: new Date(endDate + 'T23:59:59.999Z')
      }
    }

    const closures = await prisma.closure.findMany({
      where: whereClause,
      include: { user: true },
      orderBy: { openingTime: 'desc' }
    })

    return NextResponse.json({
      success: true,
      data: closures.map(c => ({
        id: c.id,
        user_id: c.userId,
        user: c.user,
        opening_time: c.openingTime,
        closing_time: c.closingTime,
        initial_balance: Number(c.initialBalance),
        final_balance: c.finalBalance ? Number(c.finalBalance) : null,
        total_cash: Number(c.totalCash),
        total_credit: Number(c.totalCredit),
        total_debit: Number(c.totalDebit),
        total_pix: Number(c.totalPix),
        reported_cash: c.reportedCash !== null ? Number(c.reportedCash) : null,
        reported_credit: c.reportedCredit !== null ? Number(c.reportedCredit) : null,
        reported_debit: c.reportedDebit !== null ? Number(c.reportedDebit) : null,
        reported_pix: c.reportedPix !== null ? Number(c.reportedPix) : null,
        withdrawals: c.withdrawals !== null ? Number(c.withdrawals) : 0,
        difference: c.difference !== null ? Number(c.difference) : null,
        status: c.status,
        notes: c.notes
      }))
    })
  } catch (error: unknown) {
    return NextResponse.json({ success: false, message: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
}
