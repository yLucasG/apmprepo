import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PlusCircle, FileText, Eye, Download, UploadCloud } from 'lucide-react'
import Link from 'next/link'
import { SignOutButton } from '@/components/SignOutButton'
import { TrabalhosTable } from '@/components/TrabalhosTable'
import { AdminSearch } from '@/components/AdminSearch'

export const dynamic = 'force-dynamic'

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const session = await getServerSession(authOptions)
  const resolvedParams = await searchParams
  const busca = typeof resolvedParams.busca === 'string' ? resolvedParams.busca : undefined

  // Consultas Prisma
  // Nota: No banco de dados SQLite utilizado com Prisma, 
  // a cláusula 'contains' já é por si só case-insensitive por padrão
  const whereClause = busca ? {
    OR: [
      { titulo: { contains: busca } },
      { autor: { contains: busca } },
    ]
  } : {}

  const trabalhos = await prisma.trabalhoAcademico.findMany({
    where: whereClause,
    orderBy: { ano: 'desc' }
  })
  
  const totalTrabalhos = trabalhos.length
  const stats = await prisma.trabalhoAcademico.aggregate({
    _sum: {
      visualizacoes: true,
      downloads: true,
    }
  })

  const totalVisualizacoes = stats._sum.visualizacoes || 0
  const totalDownloads = stats._sum.downloads || 0

  return (
    <main className="min-h-screen bg-background text-foreground p-6 md:p-12">
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="flex flex-col md:flex-row items-center justify-between gap-4 py-6 border-b border-border/40">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-primary">Painel de Controle</h1>
            <p className="text-muted-foreground mt-2">Gerencie os trabalhos do repositório acadêmico.</p>
          </div>
          <div className="flex items-center gap-4">
            {session?.user && (
              <div className="flex items-center gap-4">
                <span className="text-muted-foreground font-medium text-sm hidden sm:inline-block">Olá, {session.user.name}</span>
                <SignOutButton />
              </div>
            )}
            <div className="flex items-center gap-2">
              <Link href="/admin/lote">
                 <Button variant="secondary" className="gap-2 font-semibold shadow-sm active:scale-95 transition-transform">
                   <UploadCloud className="w-5 h-5" />
                   Upload em Lote
                 </Button>
              </Link>
              <Link href="/admin/novo">
                 <Button className="gap-2 font-semibold shadow-md active:scale-95 transition-transform">
                   <PlusCircle className="w-5 h-5" />
                   Adicionar Trabalho
                 </Button>
              </Link>
            </div>
          </div>
        </header>

        {/* Seção de Métricas (Cards) */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border border-border/60 shadow-sm bg-card/50 hover:shadow-md transition-shadow">
             <CardHeader className="flex flex-row items-center justify-between pb-2">
               <CardTitle className="text-sm font-medium text-muted-foreground">Total de Trabalhos</CardTitle>
               <FileText className="w-5 h-5 text-apmp-blue" />
             </CardHeader>
             <CardContent>
               <div className="text-3xl font-bold text-foreground">{totalTrabalhos}</div>
               <p className="text-xs text-muted-foreground mt-1">Trabalhos publicados no acervo</p>
             </CardContent>
          </Card>
          
          <Card className="border border-border/60 shadow-sm bg-card/50 hover:shadow-md transition-shadow">
             <CardHeader className="flex flex-row items-center justify-between pb-2">
               <CardTitle className="text-sm font-medium text-muted-foreground">Total de Visualizações</CardTitle>
               <Eye className="w-5 h-5 text-apmp-blue" />
             </CardHeader>
             <CardContent>
               <div className="text-3xl font-bold text-foreground">{totalVisualizacoes}</div>
               <p className="text-xs text-muted-foreground mt-1">Soma de visitas em todos os documentos</p>
             </CardContent>
          </Card>
          
          <Card className="border border-border/60 shadow-sm bg-card/50 hover:shadow-md transition-shadow">
             <CardHeader className="flex flex-row items-center justify-between pb-2">
               <CardTitle className="text-sm font-medium text-muted-foreground">Total de Downloads</CardTitle>
               <Download className="w-5 h-5 text-apmp-red" />
             </CardHeader>
             <CardContent>
               <div className="text-3xl font-bold text-foreground">{totalDownloads}</div>
               <p className="text-xs text-muted-foreground mt-1">PDFs baixados ou lidos na plataforma</p>
             </CardContent>
          </Card>
        </section>

        {/* Listagem em Tabela */}
        <section className="mt-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-4">
            <h2 className="text-xl font-bold tracking-tight">Trabalhos Recentes</h2>
            <AdminSearch />
          </div>
          <TrabalhosTable trabalhos={trabalhos} />
        </section>

      </div>
    </main>
  )
}
