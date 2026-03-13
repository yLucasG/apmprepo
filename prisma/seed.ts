import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Limpar tabela Admin
  await prisma.admin.deleteMany()

  // Criar hash da senha
  const senhaHash = await bcrypt.hash('password123', 10)

  // Inserir Admin padrão
  await prisma.admin.create({
    data: {
      usuario: 'admin',
      senhaHash
    }
  })

  console.log('Admin padrão criado com sucesso.')

  const count = await prisma.trabalhoAcademico.count()
  if (count === 0) {
    await prisma.trabalhoAcademico.createMany({
      data: [
        {
          titulo: 'A Importância do Policiamento Comunitário nas Metrópoles',
          autor: 'João da Silva',
          resumo: 'Este trabalho analisa a eficácia do policiamento comunitário nas grandes cidades e seus impactos na redução da criminalidade local, propondo um novo modelo de integração entre a sociedade e as polícias.',
          ano: 2023,
          categoria: 'Estratégias de Policiamento',
          url_arquivo: 'https://exemplo.com/doc1.pdf'
        },
        {
          titulo: 'Análise de Dados Preditivos na Prevenção ao Crime',
          autor: 'Maria Oliveira',
          resumo: 'Um estudo aprofundado sobre como a tecnologia e a análise de dados (Big Data e AI) podem auxiliar as forças de segurança a mapear manchas criminais e evitar delitos antes que aconteçam.',
          ano: 2024,
          categoria: 'Prevenção ao Crime',
          url_arquivo: 'https://exemplo.com/doc2.pdf'
        },
        {
          titulo: 'Otimizando Recursos: Nova Gestão Operacional',
          autor: 'Carlos Eduardo',
          resumo: 'Metodologias modernas e algoritmos eficientes para a otimização de recursos vitais, alocação de viaturas e patrulhas para cobrir as áreas mais críticas da cidade de forma ágil.',
          ano: 2022,
          categoria: 'Gestão Operacional',
          url_arquivo: 'https://exemplo.com/doc3.pdf'
        }
      ]
    })
    console.log('Seed de trabalhos acadêmicos completo!')
  }
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })
