import prisma from '../../src/lib/prisma'
import bcrypt from 'bcryptjs'

export async function seedUsers() {
  console.log('⏳ Seeding users and clients...')

  // 1. Create Admin User
  const hash = await bcrypt.hash('admin123', 10)
  await prisma.user.upsert({
    where: { email: 'admin@admin.com' },
    update: {},
    create: {
      name: 'Admin',
      email: 'admin@admin.com',
      password: hash,
      role: 'admin'
    }
  })
  console.log('✅ Admin user created/verified!')

  // 2. Create Clients
  const clients = [
    { name: 'João Silva', email: 'joao@email.com', phone: '11999999991' },
    { name: 'Maria Souza', email: 'maria@email.com', phone: '11999999992' },
    { name: 'Carlos Santos', email: 'carlos@email.com', phone: '11999999993' }
  ]

  for (const client of clients) {
    const clientHash = await bcrypt.hash('123456', 10)
    await prisma.client.upsert({
      where: { email: client.email },
      update: {},
      create: {
        name: client.name,
        email: client.email,
        phone: client.phone,
        password: clientHash
      }
    })
  }
  console.log('✅ Mock clients created!')
}
