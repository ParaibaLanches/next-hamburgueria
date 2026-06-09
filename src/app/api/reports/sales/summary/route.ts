import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const startDateParam = searchParams.get('startDate')
    const endDateParam = searchParams.get('endDate')

    const where: any = {
      status: { notIn: ['cancelled'] }
    }

    if (startDateParam && endDateParam) {
      where.createdAt = {
        gte: new Date(startDateParam),
        lte: new Date(endDateParam)
      }
    }

    // Fetch all completed orders in the period
    const orders = await prisma.order.findMany({
      where,
      include: {
        items: {
          include: {
            product: {
              include: {
                category: true
              }
            }
          }
        },
        payments: true
      }
    })

    let totalSales = 0
    let orderCount = orders.length
    
    const categoriesMap = new Map<string, { total: number; count: number }>()
    const paymentsMap = new Map<string, number>()

    for (const order of orders) {
      totalSales += Number(order.total)
      
      // Calculate by payment method
      for (const payment of order.payments) {
        const method = payment.method
        const current = paymentsMap.get(method) || 0
        paymentsMap.set(method, current + Number(payment.amount))
      }

      // Calculate by category
      for (const item of order.items) {
        const categoryName = item.product?.category?.name || 'Sem Categoria'
        const current = categoriesMap.get(categoryName) || { total: 0, count: 0 }
        
        current.total += Number(item.unitPrice) * item.quantity
        current.count += item.quantity
        
        categoriesMap.set(categoryName, current)
      }
    }

    const byCategory = Array.from(categoriesMap.entries()).map(([category, data]) => ({
      category,
      total: data.total,
      count: data.count
    }))

    const byPayment = Array.from(paymentsMap.entries()).map(([method, total]) => ({
      method,
      total
    }))

    return NextResponse.json({
      success: true,
      data: {
        total_sales: totalSales,
        order_count: orderCount,
        by_category: byCategory,
        by_payment: byPayment,
        start_date: startDateParam || '',
        end_date: endDateParam || ''
      }
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 })
  }
}
