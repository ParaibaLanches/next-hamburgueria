import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import type { CategorySale, PaymentSale } from '@/types'
import { PrivacyMask } from '@/components/ui/privacy-mask'

interface SalesChartsProps {
  byCategory: CategorySale[]
  byPayment: PaymentSale[]
  isUnmasked: boolean
}

export function SalesCharts({ byCategory = [], byPayment = [], isUnmasked }: SalesChartsProps) {
  const maxCategory = Math.max(...(byCategory || []).map((c) => c?.total || 0), 1)
  const maxPayment = Math.max(...(byPayment || []).map((p) => p?.total || 0), 1)

  const paymentLabels: Record<string, string> = {
    cash: 'Dinheiro',
    pix: 'Pix',
    credit_card: 'Crédito',
    debit_card: 'Débito',
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card className="shadow-sm border-none bg-background">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-black uppercase tracking-widest text-muted-foreground">Vendas por Categoria</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {(byCategory || []).length === 0 ? (
            <p className="text-sm text-muted-foreground italic py-4">Sem dados de categorias</p>
          ) : (
            (byCategory || []).map((c, i) => (
              <div key={i} className="space-y-1">
                <div className="flex justify-between text-xs font-bold">
                  <span className="truncate max-w-[150px]">{c.category}</span>
                  <PrivacyMask isUnmasked={isUnmasked}>
                    <span className="text-primary">{formatCurrency(c.total)}</span>
                  </PrivacyMask>
                </div>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary rounded-full transition-all duration-1000 ease-out"
                    style={{ 
                      width: `${(c.total / maxCategory) * 100}%`,
                      background: 'linear-gradient(90deg, var(--primary) 0%, #a855f7 100%)'
                    }}
                  />
                </div>
                <div className="flex justify-end">
                   <span className="text-[10px] text-muted-foreground">{c.count} pedidos</span>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card className="shadow-sm border-none bg-background">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-black uppercase tracking-widest text-muted-foreground">Métodos de Pagamento</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {(byPayment || []).length === 0 ? (
            <p className="text-sm text-muted-foreground italic py-4">Sem dados de pagamento</p>
          ) : (
            (byPayment || []).map((p, i) => (
              <div key={i} className="space-y-1">
                <div className="flex justify-between text-xs font-bold">
                  <span>{paymentLabels[p.method] || p.method}</span>
                  <PrivacyMask isUnmasked={isUnmasked}>
                    <span className="text-primary">{formatCurrency(p.total)}</span>
                  </PrivacyMask>
                </div>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-emerald-500 rounded-full transition-all duration-1000 ease-out"
                    style={{ 
                      width: `${(p.total / maxPayment) * 100}%`,
                      background: 'linear-gradient(90deg, #10b981 0%, #3b82f6 100%)'
                    }}
                  />
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
