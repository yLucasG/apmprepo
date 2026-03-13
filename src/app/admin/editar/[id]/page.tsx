import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import EditForm from './EditForm'

export const dynamic = 'force-dynamic'

interface Props {
  params: {
    id: string
  }
}

export default async function EditarTrabalhoPage({ params }: Props) {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect('/admin/login')
  }

  const resolvedParams = await Promise.resolve(params)
  const id = resolvedParams.id

  const trabalho = await prisma.trabalhoAcademico.findUnique({
    where: { id }
  })

  if (!trabalho) {
    redirect('/admin')
  }

  // Prepara os dados pro EditForm para remover proxies indesejados caso os haja.
  const initialData = {
    id: trabalho.id,
    titulo: trabalho.titulo,
    autor: trabalho.autor,
    resumo: trabalho.resumo,
    referencias: trabalho.referencias || "",
    ano: trabalho.ano.toString(),
    categoria: trabalho.categoria,
  }

  return (
    <main className="min-h-screen bg-background text-foreground p-6 md:p-12 flex flex-col items-center justify-center">
      <EditForm initialData={initialData} />
    </main>
  )
}
