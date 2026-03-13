'use server'

import { createClient } from '@supabase/supabase-js'
import { join } from 'path'
import crypto from 'crypto'
import { prisma } from '@/lib/prisma'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from './api/auth/[...nextauth]/route'

export async function submitWork(formData: FormData) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return { error: 'Não autorizado. Faça o login para enviar trabalhos.' }
  }

  const titulo = formData.get('titulo') as string
  const autor = formData.get('autor') as string
  const resumo = formData.get('resumo') as string
  const referencias = formData.get('referencias') as string | null
  const anoStr = formData.get('ano') as string
  const categoria = formData.get('categoria') as string
  const file = formData.get('file') as File

  if (!titulo || !autor || !resumo || !anoStr || !categoria || !file) {
    return { error: 'Por favor, preencha todos os campos e anexe um arquivo.' }
  }

  if (file.type !== 'application/pdf') {
    return { error: 'Formato de arquivo inválido. Apenas PDF é permitido.' }
  }

  const MAX_FILE_SIZE = 20 * 1024 * 1024 // 20MB
  if (file.size > MAX_FILE_SIZE) {
    return { error: 'O arquivo excede o limite estrito de 20MB.' }
  }

  const ano = parseInt(anoStr, 10)
  if (isNaN(ano)) {
    return { error: 'Ano inválido.' }
  }

  // Handle file upload
  const bytes = await file.arrayBuffer()

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // Create unique filename
  const filename = `${crypto.randomUUID()}.pdf`

  try {
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('pdfs_tcc')
      .upload(filename, bytes, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      console.error('Error uploading file to Supabase:', uploadError)
      return { error: 'Falha ao fazer upload do arquivo.' }
    }
  } catch (error) {
    console.error('Unexpected error uploading file:', error)
    return { error: 'Falha ao fazer upload do arquivo.' }
  }

  const { data: publicUrlData } = supabase.storage
    .from('pdfs_tcc')
    .getPublicUrl(filename)

  const url_arquivo = publicUrlData.publicUrl

  let arrayReferencias: string[] = [];
  if (typeof referencias === 'string') {
    // Corta o texto em cada quebra de linha (\n) e remove espaços vazios
    arrayReferencias = referencias.split('\n').map(r => r.trim()).filter(r => r.length > 0);
  } else if (Array.isArray(referencias)) {
    arrayReferencias = referencias;
  }

  // Save to DB
  try {
    await prisma.trabalhoAcademico.create({
      data: {
        titulo,
        autor,
        resumo,
        referencias: arrayReferencias,
        ano,
        categoria,
        url_arquivo
      }
    })
  } catch (error) {
    console.error('Error creating record:', error)
    return { error: 'Falha ao salvar no banco de dados.' }
  }

  revalidatePath('/')

  return { success: true }
}

export async function incrementDownload(id: string) {
  try {
    await prisma.trabalhoAcademico.update({
      where: { id },
      data: {
        downloads: {
          increment: 1,
        },
      },
    })
    return { success: true }
  } catch (error) {
    console.error('Error incrementing download:', error)
    return { error: 'Failed to increment download counter.' }
  }
}

export async function deleteWork(id: string) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return { error: 'Não autorizado. Faça login para excluir trabalhos.' }
  }

  try {
    await prisma.trabalhoAcademico.delete({
      where: { id }
    })
    revalidatePath('/admin')
    revalidatePath('/')
    return { success: true }
  } catch (error) {
    console.error('Error deleting work:', error)
    return { error: 'Falha ao excluir o trabalho do banco de dados.' }
  }
}

export async function atualizarTrabalho(id: string, formData: FormData) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return { error: 'Não autorizado. Faça login para editar trabalhos.' }
  }

  const titulo = formData.get('titulo') as string
  const autor = formData.get('autor') as string
  const resumo = formData.get('resumo') as string
  const referenciasStr = formData.get('referencias') as string | null
  const referencias = referenciasStr ? referenciasStr.split('\n').map(r => r.trim()).filter(Boolean) : []
  const anoStr = formData.get('ano') as string
  const categoria = formData.get('categoria') as string

  if (!titulo || !autor || !resumo || !anoStr || !categoria) {
    return { error: 'Por favor, preencha todos os campos obrigatórios.' }
  }

  const ano = parseInt(anoStr, 10)
  if (isNaN(ano)) {
    return { error: 'Ano inválido.' }
  }

  try {
    await prisma.trabalhoAcademico.update({
      where: { id },
      data: {
        titulo,
        autor,
        resumo,
        referencias,
        ano,
        categoria,
      }
    })
  } catch (error) {
    console.error('Error updating work:', error)
    return { error: 'Falha ao atualizar o trabalho no banco de dados.' }
  }

  revalidatePath('/admin')
  revalidatePath('/')
  redirect('/admin')
}

export async function analisarPDFComIA(formData: FormData) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return { error: 'Não autorizado. Faça login para usar a IA.' }
  }

  const file = formData.get('file') as File
  if (!file) {
    return { error: 'Nenhum arquivo fornecido.' }
  }

  if (file.type !== 'application/pdf') {
    return { error: 'O arquivo deve ser um PDF.' }
  }

  try {
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const base64Data = buffer.toString('base64')

    const pdfPart = {
      inlineData: {
        data: base64Data,
        mimeType: 'application/pdf',
      },
    }

    // Call Gemini
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' })

    const prompt = 'Você é um assistente acadêmico. Analise o texto do TCC/Artigo fornecido e extraia os seguintes campos em formato JSON estrito: titulo, autores (separados por vírgula), categoria, resumo (ou justificativa principal se não houver resumo formal), referencias (apenas a lista bibliográfica) e ano (extraia apenas os 4 dígitos do ano de publicação, que geralmente fica no final da primeira página/capa). Para extrair o campo categoria, procure especificamente no tópico "1 DADOS DE IDENTIFICAÇÃO DO PROJETO" do documento. Leia a linha de pesquisa original que está lá e faça a correspondência para encaixá-la ESTRITAMENTE em uma (e apenas uma) destas 10 Linhas de Pesquisa Oficiais da PMPE: 1. Doutrina de Emprego e Atuação Policial Militar; 2. Gestão Estratégica e Inovação na Segurança Pública; 3. Policiamento Comunitário e Direitos Humanos; 4. Logística e Tecnologia Aplicada à Segurança; 5. Educação e Formação Profissional; 6. Saúde e Qualidade de Vida do Policial Militar; 7. Direito Militar e Legislação Aplicada; 8. Inteligência de Segurança Pública; 9. Prevenção e Controle da Criminalidade e Violência; 10. História, Memória e Cultura Institucional. Não retorne nenhum texto além do JSON válido.'

    const result = await model.generateContent([prompt, pdfPart])
    const response = await result.response
    let textResponse = response.text()

    // Clean up potential markdown formatting from Gemini response
    textResponse = textResponse.replace(/```json\n?/, '').replace(/```\n?$/, '').trim()

    const parsedJson = JSON.parse(textResponse)
    
    if (parsedJson.categoria && !parsedJson.tema) {
      parsedJson.tema = parsedJson.categoria;
    }

    if (Array.isArray(parsedJson.referencias)) {
      parsedJson.referencias = parsedJson.referencias.join('\n\n');
    }

    return { success: true, data: parsedJson }
  } catch (error) {
    console.error('Error analyzing PDF with AI:', error)
    return { error: 'Falha ao analisar o PDF com a IA.' }
  }
}

export async function processarDocumentoLote(formData: FormData) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return { error: 'Não autorizado. Faça login para processar trabalhos.' }
  }

  const file = formData.get('file') as File
  if (!file) {
    return { error: 'Nenhum arquivo fornecido.' }
  }

  if (file.type !== 'application/pdf') {
    return { error: 'Apenas arquivos PDF são aceitos no processo em lote.' }
  }

  try {
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // 1. UPLOAD TO SUPABASE
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const filename = `${crypto.randomUUID()}.pdf`

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('pdfs_tcc')
      .upload(filename, bytes, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      console.error('Error uploading batch file to Supabase:', uploadError)
      return { error: 'Falha ao fazer upload do arquivo para o storage.' }
    }

    const { data: publicUrlData } = supabase.storage
      .from('pdfs_tcc')
      .getPublicUrl(filename)

    const url_arquivo = publicUrlData.publicUrl

    // 2. PARSE PDF WITH GEMINI
    const base64Data = buffer.toString('base64')

    const pdfPart = {
      inlineData: {
        data: base64Data,
        mimeType: 'application/pdf',
      },
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' })

    const prompt = 'Você é um assistente acadêmico. Analise o texto do TCC/Artigo fornecido e extraia os seguintes campos em formato JSON estrito: titulo, autores (separados por vírgula), categoria, resumo (ou justificativa principal se não houver resumo formal), referencias (apenas a lista bibliográfica) e ano (extraia apenas os 4 dígitos do ano de publicação, que geralmente fica no final da primeira página/capa). Para extrair o campo categoria, procure especificamente no tópico "1 DADOS DE IDENTIFICAÇÃO DO PROJETO" do documento. Leia a linha de pesquisa original que está lá e faça a correspondência para encaixá-la ESTRITAMENTE em uma (e apenas uma) destas 10 Linhas de Pesquisa Oficiais da PMPE: 1. Doutrina de Emprego e Atuação Policial Militar; 2. Gestão Estratégica e Inovação na Segurança Pública; 3. Policiamento Comunitário e Direitos Humanos; 4. Logística e Tecnologia Aplicada à Segurança; 5. Educação e Formação Profissional; 6. Saúde e Qualidade de Vida do Policial Militar; 7. Direito Militar e Legislação Aplicada; 8. Inteligência de Segurança Pública; 9. Prevenção e Controle da Criminalidade e Violência; 10. História, Memória e Cultura Institucional. Não retorne nenhum texto além do JSON válido.'

    const result = await model.generateContent([prompt, pdfPart])
    const response = await result.response
    let textResponse = response.text()

    // Clean up potential markdown formatting from Gemini response
    textResponse = textResponse.replace(/```json\n?/, '').replace(/```\n?$/, '').trim()
    const dados = JSON.parse(textResponse)

    // 3. SAVE TO DB 
    // Tratar ano (garantir que seja número ou fallback)
    let anoParaSalvar = new Date().getFullYear()
    if (dados.ano) {
       const parseAno = parseInt(String(dados.ano), 10)
       if (!isNaN(parseAno) && parseAno > 1900 && parseAno <= anoParaSalvar + 1) {
          anoParaSalvar = parseAno
       }
    }

    const trabalho = await prisma.trabalhoAcademico.create({
      data: {
        titulo: dados.titulo || 'Título não identificado',
        autor: dados.autores || 'Autor não identificado',
        resumo: dados.resumo || 'Resumo não extraído',
        referencias: Array.isArray(dados.referencias) ? dados.referencias : (dados.referencias ? [dados.referencias] : []),
        categoria: dados.categoria || dados.tema || 'Geral',
        ano: anoParaSalvar,
        url_arquivo
      }
    })

    revalidatePath('/')
    revalidatePath('/admin')

    return { success: true, titulo: trabalho.titulo }

  } catch (error) {
    console.error('Error processing batch document:', error)
    return { error: 'Ocorreu um erro catastrófico ao processar o documento em lote.' }
  }
}

export async function excluirTrabalhosLote(ids: string[]) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return { error: 'Não autorizado. Faça login para excluir trabalhos.' }
  }

  try {
    await prisma.trabalhoAcademico.deleteMany({
      where: { id: { in: ids } }
    })
    revalidatePath('/admin')
    revalidatePath('/')
    return { success: true }
  } catch (error) {
    console.error('Error deleting batch works:', error)
    return { error: 'Falha ao excluir os trabalhos em lote do banco de dados.' }
  }
}
