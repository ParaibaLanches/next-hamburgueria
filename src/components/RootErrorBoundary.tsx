import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, RefreshCw } from 'lucide-react'

interface Props {
  children: React.ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class RootErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: { componentStack: string }): void {
    console.error('RootErrorBoundary caught an error:', error, info)
  }

  handleReload = (): void => {
    window.location.reload()
  }

  render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-muted/20">
          <Card className="w-full max-w-lg border-destructive/20 shadow-2xl">
            <CardHeader className="border-b bg-destructive/5 py-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="text-destructive h-5 w-5" />
                <CardTitle className="text-destructive text-lg">Erro Crítico de Aplicação</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-6 pt-6">
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">
                  Desculpe, a aplicação encontrou um erro inesperado e não pôde continuar.
                </p>
                <div className="bg-muted p-4 rounded-lg overflow-auto max-h-[200px] border border-border">
                  <code className="text-xs text-destructive font-mono whitespace-pre-wrap">
                    {this.state.error?.name}: {this.state.error?.message}
                  </code>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Button onClick={this.handleReload} className="flex-1 gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Recarregar Aplicativo
                </Button>
                <Button 
                  onClick={() => this.setState({ hasError: false, error: undefined })}
                  variant="outline"
                  className="flex-1"
                >
                  Tentar Recuperar
                </Button>
              </div>
              
              <p className="text-[10px] text-muted-foreground text-center italic">
                Se o erro persistir, por favor entre em contato com o suporte técnico.
              </p>
            </CardContent>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}
