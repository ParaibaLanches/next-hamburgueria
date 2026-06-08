import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const destination = searchParams.get('destination')

    if (!destination) {
      return NextResponse.json({ success: false, message: 'Destination is required' }, { status: 400 })
    }

    // Mock logic
    const distanceKm = Math.random() * 10
    const baseFee = 5.0
    const feePerKm = 1.5
    const fee = baseFee + (distanceKm * feePerKm)

    return NextResponse.json({
      success: true,
      data: {
        fee: Number(fee.toFixed(2)),
        distance: Number(distanceKm.toFixed(2)),
        etaMinutes: Math.ceil(distanceKm * 3 + 15)
      }
    })
  } catch (error: unknown) {
    return NextResponse.json({ success: false, message: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
}
