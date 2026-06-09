import { NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ success: false, message: 'Nenhum arquivo enviado' }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Ensure uploads directory exists
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads')
    try {
      await mkdir(uploadsDir, { recursive: true })
    } catch (e) {
      // Directory might already exist, ignore
    }

    // Generate unique filename preserving extension
    const originalName = file.name
    const ext = path.extname(originalName) || ''
    const filename = `${uuidv4()}${ext}`
    
    const filePath = path.join(uploadsDir, filename)
    await writeFile(filePath, buffer)

    // Return the relative URL to be saved in the database
    const imageUrl = `/uploads/${filename}`
    
    return NextResponse.json({ success: true, data: imageUrl })
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message || 'Erro ao fazer upload da imagem' }, { status: 500 })
  }
}
