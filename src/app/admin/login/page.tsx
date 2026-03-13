'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Lock } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const usuario = formData.get('usuario') as string
    const senha = formData.get('senha') as string

    try {
      const res = await signIn('credentials', {
        redirect: false,
        usuario,
        senha,
      })

      if (res?.error) {
         setError('Usuário ou senha inválidos.')
         setLoading(false)
      } else {
         router.push('/admin')
         router.refresh()
      }
    } catch (e) {
      setError('Ocorreu um erro ao tentar fazer login.')
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl border-border/60 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-primary/50" />
        <CardHeader className="text-center pb-6 pt-8 space-y-4">
          <div className="mx-auto bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center">
             <Lock className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">Acesso Restrito</CardTitle>
          <p className="text-sm text-muted-foreground">Área administrativa do repositório</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-destructive/10 text-destructive text-sm font-medium p-3 rounded-lg border border-destructive/20 text-center">
                {error}
              </div>
            )}
            
            <div className="space-y-2">
              <label className="text-sm font-semibold">Usuário</label>
              <Input name="usuario" required placeholder="Digite seu usuário..." className="h-11" />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold">Senha</label>
              <Input name="senha" type="password" required placeholder="••••••••" className="h-11" />
            </div>

            <Button type="submit" className="w-full h-11 mt-4 font-semibold text-base shadow-sm" disabled={loading}>
              {loading ? 'Acessando...' : 'Entrar'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}
