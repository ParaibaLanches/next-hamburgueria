import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params
    const id = parseInt(resolvedParams.id)
    if (isNaN(id)) return NextResponse.json({ success: false, message: 'Invalid ID' }, { status: 400 })

    const closure = await prisma.closure.findUnique({ where: { id } })
    if (!closure) return NextResponse.json({ success: false, message: 'Closure not found' }, { status: 404 })
    if (closure.status === 'closed') return NextResponse.json({ success: false, message: 'Closure is already closed' }, { status: 400 })

    const data = await req.json()
    const {
      reported_cash,
      reported_credit,
      reported_debit,
      reported_pix,
      withdrawals,
      notes
    } = data

    // Safe casting reported values
    const repCash = Number(reported_cash) || 0
    const repCredit = Number(reported_credit) || 0
    const repDebit = Number(reported_debit) || 0
    const repPix = Number(reported_pix) || 0
    const wth = Number(withdrawals) || 0

    // Retrieve expected (system) values from the DB
    const sysCash = Number(closure.totalCash)
    const sysCredit = Number(closure.totalCredit)
    const sysDebit = Number(closure.totalDebit)
    const sysPix = Number(closure.totalPix)
    const initial = Number(closure.initialBalance)

    // Calculate difference (Quebra de caixa)
    // Expected physical cash = initial_balance + total_cash - withdrawals
    // Difference = Reported Cash - Expected Cash
    const expectedCash = initial + sysCash - wth
    const cashDifference = repCash - expectedCash
    
    // Total Difference = Cash Diff + Pix Diff + Credit Diff + Debit Diff
    const totalDifference = cashDifference + (repPix - sysPix) + (repCredit - sysCredit) + (repDebit - sysDebit)

    const updated = await prisma.closure.update({
      where: { id },
      data: {
        status: 'closed',
        closingTime: new Date(),
        reportedCash: repCash,
        reportedCredit: repCredit,
        reportedDebit: repDebit,
        reportedPix: repPix,
        withdrawals: wth,
        difference: totalDifference,
        notes: notes || null
      }
    })

    return NextResponse.json({ success: true, data: updated })
  } catch (error: unknown) {
    return NextResponse.json({ success: false, message: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
}
