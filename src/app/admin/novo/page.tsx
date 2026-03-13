'use client'

import { useState, useCallback } from 'react'
import { signOut, useSession } from 'next-auth/react'
import { useDropzone } from 'react-dropzone'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { submitWork, analisarPDFComIA } from '../../actions'
import { UploadCloud, File, Trash2, CheckCircle2, ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'

export default function AdminNovoPage() {
  const { data: session } = useSession()
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [isLoadingAI, setIsLoadingAI] = useState(false)
  const [status, setStatus] = useState<{ success?: boolean; error?: string } | null>(null)
  const [formValues, setFormValues] = useState({
    titulo: '',
    autor: '',
    resumo: '',
    referencias: '',
    categoria: '',
    ano: ''
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormValues(prev => ({ ...prev, [name]: value }))
  }

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const selectedFile = acceptedFiles[0]
      setFile(selectedFile)
      setStatus(null)

      setIsLoadingAI(true)
      const aiFormData = new FormData()
      aiFormData.append('file', selectedFile)

      try {
        const res = await analisarPDFComIA(aiFormData)
        if (res?.success && res.data) {
          setFormValues(prev => ({
            ...prev,
            titulo: res.data.titulo || prev.titulo,
            autor: res.data.autores || prev.autor,
            resumo: res.data.resumo || prev.resumo,
            referencias: res.data.referencias || prev.referencias,
            categoria: res.data.tema || prev.categoria,
            ano: res.data.ano ? String(res.data.ano) : prev.ano
          }))
        } else if (res?.error) {
          console.error("AI Error:", res.error)
        }
      } catch (err) {
         console.error("Failed to analyze PDF with AI", err)
      } finally {
        setIsLoadingAI(false)
      }
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    onDropRejected: () => {
      setStatus({ error: 'Apenas arquivos PDF até 20MB são permitidos.' })
    },
    maxFiles: 1,
    maxSize: 20 * 1024 * 1024, // 20MB
    accept: {
      'application/pdf': ['.pdf'],
    }
  })

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!file) {
      setStatus({ error: 'Por favor, anexe um arquivo.' })
      return
    }

    setLoading(true)
    setStatus(null)

    const formData = new FormData(e.currentTarget)
    formData.append('file', file)

    const res = await submitWork(formData)

    if (res?.error) {
      setStatus({ error: res.error })
    } else {
      setStatus({ success: true })
      setFile(null)
      setFormValues({ titulo: '', autor: '', resumo: '', referencias: '', categoria: '', ano: '' })
      const form = e.target as HTMLFormElement
      form.reset()
    }
    
    setLoading(false)
  }

  return (
    <main className="min-h-screen bg-background text-foreground p-6 md:p-12 flex flex-col items-center justify-center">
      <div className="w-full max-w-2xl mb-4">
        <Link href="/admin">
          <Button variant="ghost" className="gap-2 hover:text-apmp-blue">
            <ArrowLeft className="w-4 h-4" />
            Voltar para o Painel
          </Button>
        </Link>
      </div>
      <Card className="w-full max-w-2xl shadow-xl border-border/60 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-primary/50" />
        <CardHeader className="text-center pb-8 pt-6 relative">
          {session?.user && (
            <div className="absolute top-4 right-4 text-sm flex items-center gap-3">
              <span className="text-muted-foreground font-medium hidden sm:inline-block">Olá, {session.user.name}</span>
              <Button variant="outline" size="sm" onClick={() => signOut()}>Sair</Button>
            </div>
          )}
          <CardTitle className="text-3xl font-extrabold tracking-tight mt-6">Painel de Submissão</CardTitle>
          <p className="text-muted-foreground mt-2">Envie novos trabalhos acadêmicos para o repositório</p>
        </CardHeader>
        <CardContent>
           {/* ...rest of the code is unchanged functionally, just continuing the exact form from previous file */}
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {status?.success && (
               <div className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 p-4 rounded-xl flex items-center gap-3 border border-emerald-500/20">
                 <CheckCircle2 className="w-5 h-5" />
                 <p className="font-medium text-sm">Trabalho enviado com sucesso!</p>
               </div>
            )}

            {status?.error && (
               <div className="bg-destructive/10 text-destructive p-4 rounded-xl text-sm font-medium border border-destructive/20">
                 {status.error}
               </div>
            )}

            {isLoadingAI && (
               <div className="bg-blue-500/10 text-blue-600 dark:text-blue-400 p-4 rounded-xl flex items-center gap-3 border border-blue-500/20">
                 <Loader2 className="w-5 h-5 animate-spin" />
                 <p className="font-medium text-sm">Analisando documento com Inteligência Artificial...</p>
               </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold">Título do Trabalho</label>
                <Input name="titulo" value={formValues.titulo} onChange={handleInputChange} required placeholder="Ex: Análise de Dados..." className="h-11" disabled={isLoadingAI || loading} />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-semibold">Autor</label>
                <Input name="autor" value={formValues.autor} onChange={handleInputChange} required placeholder="Ex: João da Silva" className="h-11" disabled={isLoadingAI || loading} />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold">Resumo</label>
              <textarea 
                name="resumo" 
                value={formValues.resumo}
                onChange={handleInputChange}
                required 
                rows={4} 
                disabled={isLoadingAI || loading}
                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
                placeholder="Um breve resumo do documento..."
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold">Referências Bibliográficas</label>
              <Textarea 
                name="referencias" 
                value={formValues.referencias}
                onChange={handleInputChange}
                rows={4} 
                disabled={isLoadingAI || loading}
                className="bg-transparent transition-colors"
                placeholder="Insira as referências do documento..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold">Ano de Publicação</label>
                <Input name="ano" value={formValues.ano} onChange={handleInputChange} type="number" required placeholder="Ex: 2024" min="1900" max={new Date().getFullYear() + 1} className="h-11" disabled={isLoadingAI || loading} />
              </div>

               <div className="space-y-2">
                <label className="text-sm font-semibold">Categoria</label>
                <Input name="categoria" value={formValues.categoria} onChange={handleInputChange} required placeholder="Ex: Prevenção ao Crime" className="h-11" disabled={isLoadingAI || loading} />
              </div>
            </div>

            <div className="space-y-2">
               <label className="text-sm font-semibold">Arquivo (PDF)</label>
               
               {!file ? (
                 <div 
                   {...getRootProps()} 
                   className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all duration-300 ease-in-out bg-muted/20 hover:bg-muted/50 ${
                     isDragActive ? 'border-primary bg-primary/5 scale-[1.02]' : 'border-border/60 hover:border-primary/50'
                   }`}
                 >
                   <input {...getInputProps()} />
                   <UploadCloud className={`w-12 h-12 mx-auto mb-4 ${isDragActive ? 'text-primary' : 'text-muted-foreground'}`} />
                   {isDragActive ? (
                     <p className="text-primary font-medium">Solte o PDF aqui...</p>
                   ) : (
                     <div className="space-y-1">
                        <p className="text-sm font-medium">Arraste e solte o PDF aqui, ou clique para selecionar</p>
                        <p className="text-xs text-muted-foreground">Apenas arquivos .pdf são suportados</p>
                     </div>
                   )}
                 </div>
               ) : (
                 <div className="relative border rounded-xl p-4 flex items-center gap-4 bg-primary/5 border-primary/20">
                    <div className="bg-primary/10 p-3 rounded-lg">
                      <File className="w-8 h-8 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{file.name}</p>
                      <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => setFile(null)}
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive shrink-0"
                    >
                      <Trash2 className="w-5 h-5" />
                    </Button>
                 </div>
               )}
            </div>

            <Button type="submit" className="w-full h-12 text-base font-semibold" disabled={loading}>
              {loading ? 'Enviando e Processando...' : 'Enviar Trabalho Acadêmico'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}
