import prisma from '../../src/lib/prisma'

export async function seedCategoriesAndProducts() {
  console.log('⏳ Seeding categories and products...')

  // Create Categories
  const categoriesData = [
    { name: 'Hambúrgueres' },
    { name: 'Combos' },
    { name: 'Porções' },
    { name: 'Bebidas' },
    { name: 'Sobremesas' }
  ]

  const categories = []
  for (const cat of categoriesData) {
    const created = await prisma.category.upsert({
      where: { name: cat.name },
      update: {},
      create: { name: cat.name }
    })
    categories.push(created)
  }
  console.log('✅ Categories created!')

  const burgerCatId = categories.find(c => c.name === 'Hambúrgueres')!.id
  const comboCatId = categories.find(c => c.name === 'Combos')!.id
  const friesCatId = categories.find(c => c.name === 'Porções')!.id
  const drinksCatId = categories.find(c => c.name === 'Bebidas')!.id
  const dessertCatId = categories.find(c => c.name === 'Sobremesas')!.id

  const fallbackImage = '' 
  
  const productsData = [
    { name: 'Classic Burger', description: 'Pão brioche, blend 160g, queijo prato, maionese da casa.', price: 28.00, categoryId: burgerCatId, isFeatured: true, promotionalPrice: 25.00, promotionLabel: 'Oferta do Dia' },
    { name: 'Bacon Blast', description: 'Pão australiano, blend 160g, cheddar duplo, muito bacon crocante, molho barbecue.', price: 34.00, categoryId: burgerCatId, isFeatured: true },
    { name: 'Cheddar Melt', description: 'Pão brioche, blend 160g, creme de cheddar artesanal, cebola caramelizada.', price: 32.00, categoryId: burgerCatId },
    { name: 'Chicken Crispy', description: 'Pão brioche, peito de frango empanado super crocante, alface americana, maionese de limão siciliano.', price: 29.00, categoryId: burgerCatId },
    { name: 'Smash Duplo', description: 'Pão brioche, 2 smash burgers de 80g, duplo american cheese, picles, ketchup e mostarda.', price: 26.00, categoryId: burgerCatId, isFeatured: true },
    { name: 'Smash Triplo', description: 'Pão brioche, 3 smash burgers de 80g, triplo american cheese, bacon em cubos.', price: 32.00, categoryId: burgerCatId },
    { name: 'Veggie Burger', description: 'Pão integral, hambúrguer de grão de bico 150g, alface, tomate, maionese vegana.', price: 30.00, categoryId: burgerCatId },
    { name: 'Picanha Premium', description: 'Pão brioche, blend de picanha 200g, queijo coalho tostado, geleia de pimenta.', price: 42.00, categoryId: burgerCatId, promotionalPrice: 38.00, promotionLabel: 'Especial' },
    { name: 'Gorgonzola Lovers', description: 'Pão brioche, blend 160g, creme de gorgonzola, cebola crispy.', price: 36.00, categoryId: burgerCatId },
    { name: 'X-Tudo Monstro', description: 'Pão de hambúrguer, 2 blends 160g, queijo, presunto, ovo, bacon, alface, tomate, milho, ervilha.', price: 45.00, categoryId: burgerCatId },

    { name: 'Combo Classic', description: '1 Classic Burger + Batata Frita P + Refri Lata', price: 45.00, categoryId: comboCatId, isFeatured: true },
    { name: 'Combo Casal', description: '2 Smash Duplo + Batata Frita G + Refri 1L', price: 75.00, categoryId: comboCatId, promotionalPrice: 69.90, promotionLabel: 'Para Dividir' },
    { name: 'Combo Familia', description: '4 Classic Burgers + 2 Batatas Fritas G + Refri 2L', price: 130.00, categoryId: comboCatId },
    { name: 'Combo Kids', description: '1 Smash Simples + Batata Sorriso + Suco de Laranja', price: 30.00, categoryId: comboCatId },
    { name: 'Combo Bacon Blast', description: '1 Bacon Blast + Onion Rings + Refri Lata', price: 50.00, categoryId: comboCatId },

    { name: 'Batata Frita Tradicional (M)', description: 'Porção média de batatas fritas crocantes.', price: 15.00, categoryId: friesCatId },
    { name: 'Batata Frita Tradicional (G)', description: 'Porção grande de batatas fritas crocantes.', price: 20.00, categoryId: friesCatId },
    { name: 'Batata com Cheddar e Bacon', description: 'Batata frita grande coberta com creme de cheddar artesanal e cubos de bacon.', price: 32.00, categoryId: friesCatId, isFeatured: true },
    { name: 'Onion Rings', description: 'Porção de anéis de cebola empanados.', price: 18.00, categoryId: friesCatId },
    { name: 'Nuggets (10 unid.)', description: 'Nuggets de frango crocantes, acompanha molho barbecue.', price: 22.00, categoryId: friesCatId },
    { name: 'Iscas de Frango', description: 'Iscas de peito de frango empanadas com farinha panko.', price: 28.00, categoryId: friesCatId },

    { name: 'Coca-Cola Lata 350ml', description: 'Refrigerante lata.', price: 6.00, categoryId: drinksCatId },
    { name: 'Coca-Cola Zero Lata 350ml', description: 'Refrigerante lata sem açúcar.', price: 6.00, categoryId: drinksCatId },
    { name: 'Guaraná Antarctica Lata 350ml', description: 'Refrigerante lata.', price: 6.00, categoryId: drinksCatId },
    { name: 'Fanta Laranja Lata 350ml', description: 'Refrigerante lata.', price: 6.00, categoryId: drinksCatId },
    { name: 'Suco de Laranja Natural 400ml', description: 'Feito na hora.', price: 10.00, categoryId: drinksCatId },
    { name: 'Água Mineral sem Gás 500ml', description: '', price: 4.00, categoryId: drinksCatId },
    { name: 'Água Mineral com Gás 500ml', description: '', price: 4.50, categoryId: drinksCatId },

    { name: 'Brownie com Sorvete', description: 'Brownie de chocolate belga aquecido com bola de sorvete de creme.', price: 22.00, categoryId: dessertCatId, isFeatured: true },
    { name: 'Pudim de Leite Condensado', description: 'Pudim tradicional sem furinhos.', price: 12.00, categoryId: dessertCatId },
    { name: 'Milkshake de Morango 400ml', description: 'Sorvete de morango, leite e calda.', price: 20.00, categoryId: dessertCatId },
    { name: 'Milkshake de Nutella 400ml', description: 'Sorvete de creme batido com muita Nutella.', price: 25.00, categoryId: dessertCatId }
  ]

  await prisma.product.deleteMany({})

  for (const prod of productsData) {
    await prisma.product.create({
      data: {
        ...prod,
        imageUrl: fallbackImage,
      }
    })
  }
  console.log('✅ Products created!')
}
