'use client'

import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { atualizarTrabalho } from '@/app/actions'
import { CheckCircle2, ArrowLeft, Info } from 'lucide-react'
import Link from 'next/link'

interface EditFormProps {
  initialData: {
    id: string
    titulo: string
    autor: string
    resumo: string
    referencias: string
    ano: string
    categoria: string
  }
}

export default function EditForm({ initialData }: EditFormProps) {
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<{ success?: boolean; error?: string } | null>(null)

  async function action(formData: FormData) {
    setLoading(true)
    setStatus(null)

    const res = await atualizarTrabalho(initialData.id, formData)

    if (res?.error) {
      setStatus({ error: res.error })
      setLoading(false)
    }
    // caso não tenha erro, a action no server faz o redirect automático,
    // não precisando mudar o estado aqui em caso de success
  }

  return (
    <div className="w-full max-w-2xl">
      <div className="mb-4">
        <Link href="/admin">
          <Button variant="ghost" className="gap-2 hover:text-apmp-blue">
            <ArrowLeft className="w-4 h-4" />
            Voltar para o Painel
          </Button>
        </Link>
      </div>

      <Card className="shadow-xl border-border/60 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-apmp-blue to-apmp-red" />
        <CardHeader className="text-center pb-8 pt-6 relative">
          <CardTitle className="text-3xl font-extrabold tracking-tight mt-6">Editar Metadados</CardTitle>
          <p className="text-muted-foreground mt-2">Atualize as informações do trabalho acadêmico</p>
        </CardHeader>
        
        <CardContent>
          <div className="mb-8 bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-200 p-4 rounded-xl flex items-start gap-3 border border-amber-200 dark:border-amber-800/50 text-sm leading-relaxed">
             <Info className="w-5 h-5 shrink-0 mt-0.5" />
             <p><strong>Nota:</strong> A substituição do arquivo PDF não está disponível na edição. Para trocar o arquivo, exclua este registro e crie um novo.</p>
          </div>

          <form action={action} className="space-y-6">
            {status?.success && (
               <div className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 p-4 rounded-xl flex items-center gap-3 border border-emerald-500/20">
                 <CheckCircle2 className="w-5 h-5" />
                 <p className="font-medium text-sm">Trabalho atualizado com sucesso!</p>
               </div>
            )}

            {status?.error && (
               <div className="bg-destructive/10 text-destructive p-4 rounded-xl text-sm font-medium border border-destructive/20">
                 {status.error}
               </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold">Título do Trabalho</label>
                <Input name="titulo" defaultValue={initialData.titulo} required className="h-11" />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-semibold">Autor</label>
                <Input name="autor" defaultValue={initialData.autor} required className="h-11" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold">Resumo</label>
              <textarea 
                name="resumo" 
                defaultValue={initialData.resumo}
                required 
                rows={4} 
                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring transition-colors"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold">Referências Bibliográficas</label>
              <Textarea 
                name="referencias" 
                defaultValue={initialData.referencias}
                rows={4} 
                className="bg-transparent transition-colors"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold">Ano de Publicação</label>
                <Input name="ano" type="number" defaultValue={initialData.ano} required min="1900" max={new Date().getFullYear() + 1} className="h-11" />
              </div>

               <div className="space-y-2">
                <label className="text-sm font-semibold">Categoria</label>
                <Input name="categoria" defaultValue={initialData.categoria} required className="h-11" />
              </div>
            </div>

            <Button type="submit" className="w-full h-12 text-base font-semibold" disabled={loading}>
              {loading ? 'Salvando Alterações...' : 'Salvar Alterações'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
