import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const destination = searchParams.get('destination')
    
    if (!destination) {
      return NextResponse.json({ success: false, message: 'Destination is required' }, { status: 400 })
    }

    // TODO: Implement actual Google Maps Distance Matrix API call here.
    // Mocking distance and fee for now.
    const distanceKm = 3.5
    const fee = distanceKm * 1.5 // 1.5 BRL per Km

    return NextResponse.json({
      success: true,
      data: {
        distance: distanceKm,
        fee: fee
      }
    })
  } catch (error: unknown) {
    return NextResponse.json({ success: false, message: error instanceof Error ? error.message : String(error) }, { status: 500 })
  }
}
