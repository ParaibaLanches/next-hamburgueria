import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Ticket, Loader2 } from 'lucide-react'
import { formatDateTime } from '@/lib/date'
import { formatCurrency } from '@/lib/utils'

interface CouponDetailsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  isLoading: boolean
  details: any
}

export default function CouponDetailsDialog({ open, onOpenChange, isLoading, details }: CouponDetailsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Ticket className="h-5 w-5 text-primary" />
            Uso do Cupom: {details?.coupon?.code}
          </DialogTitle>
        </DialogHeader>
        <div className="pt-4">
          {isLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : details?.usage?.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground italic border rounded-lg bg-muted/20">Este cupom ainda não foi utilizado em nenhum pedido.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Pedido</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Valor Pedido</TableHead>
                  <TableHead>Desconto</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {details?.usage?.map((u: any) => (
                  <TableRow key={u.order_id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-bold text-sm">{u.client_name || 'Cliente'}</span>
                        <span className="text-[10px] text-muted-foreground">{u.client_email}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{u.order_code}</TableCell>
                    <TableCell className="text-xs">{formatDateTime(u.used_at)}</TableCell>
                    <TableCell className="text-xs font-medium">{formatCurrency(u.order_total)}</TableCell>
                    <TableCell className="text-xs font-bold text-primary">-{formatCurrency(u.discount)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
