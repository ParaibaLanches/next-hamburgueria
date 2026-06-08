import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Ticket, Infinity, Calendar, Eye, Trash, Loader2 } from 'lucide-react'
import { formatDateTime } from '@/lib/date'
import { formatCurrency } from '@/lib/utils'
import type { Coupon } from '@/types'

interface CouponListProps {
  coupons: Coupon[]
  isLoading: boolean
  onDelete: (id: number) => void
  onViewDetails: (id: number) => void
}

export default function CouponList({ coupons, isLoading, onDelete, onViewDetails }: CouponListProps) {
  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-6">Código</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Público</TableHead>
              <TableHead>Mínimo</TableHead>
              <TableHead>Uso</TableHead>
              <TableHead>Início</TableHead>
              <TableHead>Expiração</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={10} className="h-24 text-center">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : coupons.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="h-24 text-center text-muted-foreground">
                  Nenhum cupom encontrado
                </TableCell>
              </TableRow>
            ) : (
              coupons.map((coupon) => (
                <TableRow key={coupon.id}>
                  <TableCell className="pl-6 font-bold py-4">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-primary/10 rounded">
                        <Ticket className="h-4 w-4 text-primary" />
                      </div>
                      {coupon.code}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {coupon.type === 'percentage' ? 'Percentual (%)' : 'Fixo (R$)'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {coupon.type === 'percentage' ? `${coupon.value}%` : formatCurrency(coupon.value)}
                  </TableCell>
                  <TableCell>
                    {coupon.client_id ? (
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-primary">Privado</span>
                        <span className="text-[10px] text-muted-foreground truncate max-w-[100px]">{coupon.client?.name || `ID: ${coupon.client_id}`}</span>
                      </div>
                    ) : (
                      <Badge variant="secondary" className="text-[10px] font-normal px-1.5 h-4">Público</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {formatCurrency(coupon.min_purchase)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium text-primary">{coupon.used_count}</span>
                      <span className="text-muted-foreground">/</span>
                      <span className="text-muted-foreground">
                        {coupon.usage_limit > 0 ? coupon.usage_limit : <Infinity className="h-3 w-3 inline" />}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{formatDateTime(coupon.starts_at)}</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-sm font-bold">{formatDateTime(coupon.expires_at)}</span>
                      <span className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {coupon.time_left}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={coupon.is_active ? 'default' : 'secondary'}>
                      {coupon.is_active ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-primary hover:bg-primary/10"
                        onClick={() => onViewDetails(coupon.id)}
                        title="Ver detalhes e uso"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => onDelete(coupon.id)}
                        title="Excluir cupom"
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
