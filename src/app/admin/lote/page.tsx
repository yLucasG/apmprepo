'use client'

import { useState, useCallback } from 'react'
import { signOut, useSession } from 'next-auth/react'
import { useDropzone } from 'react-dropzone'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { processarDocumentoLote } from '../../actions'
import { UploadCloud, CheckCircle2, ArrowLeft, Loader2, FileText, AlertCircle } from 'lucide-react'
import Link from 'next/link'

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export default function LotePage() {
  const { data: session } = useSession()
  const [isBatchUploading, setIsBatchUploading] = useState(false)
  const [isWaitingDelay, setIsWaitingDelay] = useState(false)
  const [totalFiles, setTotalFiles] = useState(0)
  const [currentFileIndex, setCurrentFileIndex] = useState(0)
  const [sucessos, setSucessos] = useState<string[]>([])
  const [erros, setErros] = useState<{ filename: string; reason: string }[]>([])
  const [status, setStatus] = useState<{ finished?: boolean; error?: string } | null>(null)

  const processFiles = async (files: File[]) => {
    setIsBatchUploading(true)
    setTotalFiles(files.length)
    setCurrentFileIndex(0)
    setSucessos([])
    setErros([])
    setStatus(null)

    for (let i = 0; i < files.length; i++) {
      setCurrentFileIndex(i + 1)
      
      const formData = new FormData()
      formData.append('file', files[i])
      
      try {
        // Aguarda o upload e a IA terminarem COMPLETAMENTE
        const res = await processarDocumentoLote(formData)
        
        if (res?.success && res.titulo) {
          setSucessos(prev => [...prev, res.titulo as string])
        } else {
          setErros(prev => [...prev, { filename: files[i].name, reason: res?.error || 'Erro desconhecido' }])
        }
        
        // Força um respiro real de 10 segundos antes de ler o próximo PDF
        if (i < files.length - 1) {
          setIsWaitingDelay(true)
          await delay(10000) 
          setIsWaitingDelay(false)
        }
      } catch (error) {
        console.error("Erro no arquivo:", files[i].name, error)
        setErros(prev => [...prev, { filename: files[i].name, reason: 'Falha na conexão com o servidor' }])
      }
    }

    setIsBatchUploading(false)
    setStatus({ finished: true })
  }

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      if (!isBatchUploading) {
        processFiles(acceptedFiles)
      }
    }
  }, [isBatchUploading])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    onDropRejected: () => {
      if (!status?.finished) setStatus({ error: 'Alguns arquivos foram rejeitados. Apenas PDFs até 20MB são permitidos.' })
    },
    multiple: true,
    maxSize: 20 * 1024 * 1024, // 20MB
    accept: {
      'application/pdf': ['.pdf'],
    }
  })

  const progressPercentage = totalFiles > 0 ? Math.round((currentFileIndex / totalFiles) * 100) : 0

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
          <CardTitle className="text-3xl font-extrabold tracking-tight mt-6">Upload em Lote com IA</CardTitle>
          <p className="text-muted-foreground mt-2">Envie dezenas de trabalhos acadêmicos de uma só vez. A IA irá extrair e salvar os dados automaticamente.</p>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {status?.error && (
             <div className="bg-destructive/10 text-destructive p-4 rounded-xl text-sm font-medium border border-destructive/20 flex items-center gap-3">
               <AlertCircle className="w-5 h-5 shrink-0" />
               <p>{status.error}</p>
             </div>
          )}

          {!isBatchUploading && (
             <div 
               {...getRootProps()} 
               className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-300 ease-in-out bg-muted/10 hover:bg-muted/30 ${
                 isDragActive ? 'border-primary bg-primary/5 scale-[1.02]' : 'border-border/60 hover:border-primary/50'
               }`}
             >
               <input {...getInputProps()} />
               <UploadCloud className={`w-16 h-16 mx-auto mb-4 ${isDragActive ? 'text-primary' : 'text-muted-foreground'}`} />
               {isDragActive ? (
                 <p className="text-primary font-medium text-lg">Solte os PDFs aqui...</p>
               ) : (
                 <div className="space-y-2">
                    <p className="text-lg font-medium">Arraste e solte vários PDFs aqui</p>
                    <p className="text-sm text-muted-foreground">Ou clique para selecionar os arquivos no seu computador.</p>
                 </div>
               )}
             </div>
          )}

          {isBatchUploading && (
            <div className="space-y-4 p-6 border rounded-xl bg-muted/10">
                 <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold text-lg flex items-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin text-primary" />
                    {isWaitingDelay ? 'Aguardando tempo de respiro da IA...' : 'Processando Arquivos...'}
                  </span>
                  <span className="text-sm font-medium text-muted-foreground">
                    {currentFileIndex} de {totalFiles}
                  </span>
               </div>
               
               <div className="h-4 w-full bg-muted rounded-full overflow-hidden">
                 <div 
                   className="h-full bg-primary transition-all duration-500 ease-out" 
                   style={{ width: `${progressPercentage}%` }}
                 />
               </div>
               <p className="text-sm text-right text-muted-foreground mt-1">{progressPercentage}% concluído</p>
            </div>
          )}

          {status?.finished && !isBatchUploading && (
            <div className="space-y-4 mt-8 animate-in fade-in slide-in-from-bottom-4">
              <div className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 p-4 rounded-xl border border-emerald-500/20 text-center">
                <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-500" />
                <h3 className="font-bold text-lg">Upload em Lote Concluído!</h3>
                <p className="text-sm opacity-90">Processamento finalizado com {sucessos.length} sucessos e {erros.length} erros.</p>
              </div>

              {sucessos.length > 0 && (
                <div className="border rounded-xl overflow-hidden">
                  <div className="bg-muted px-4 py-2 border-b">
                    <h4 className="font-semibold text-sm flex items-center gap-2">
                       <FileText className="w-4 h-4 text-emerald-500" />
                       Trabalhos Adicionados ({sucessos.length})
                    </h4>
                  </div>
                  <ul className="divide-y max-h-60 overflow-y-auto">
                    {sucessos.map((titulo, i) => (
                      <li key={i} className="px-4 py-3 text-sm flex items-start gap-3">
                        <span className="text-emerald-500 mt-0.5">•</span>
                        <span className="font-medium">{titulo}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {erros.length > 0 && (
                 <div className="border border-destructive/20 rounded-xl overflow-hidden">
                  <div className="bg-destructive/10 px-4 py-2 border-b border-destructive/20">
                    <h4 className="font-semibold text-sm text-destructive flex items-center gap-2">
                       <AlertCircle className="w-4 h-4" />
                       Falhas no Processamento ({erros.length})
                    </h4>
                  </div>
                  <ul className="divide-y divide-destructive/10 max-h-60 overflow-y-auto">
                    {erros.map((erro, i) => (
                      <li key={i} className="px-4 py-3 text-sm flex flex-col">
                        <span className="font-medium text-destructive">{erro.filename}</span>
                        <span className="text-xs text-muted-foreground mt-1">{erro.reason}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

        </CardContent>
      </Card>
    </main>
  )
}
