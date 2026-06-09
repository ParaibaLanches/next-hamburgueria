import { z } from 'zod'

export const productSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().optional(),
  price: z.number().min(0, 'Preço inválido'),
  categoryId: z.number(),
  imageUrl: z.string().optional(),
  isFeatured: z.boolean().optional(),
  featuredSlot: z.string().optional(),
  promotionLabel: z.string().optional(),
  promotionalPrice: z.number().optional(),
  available: z.boolean().optional(),
  ingredientIds: z.array(z.number()).optional()
})

export const categorySchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().optional()
})

export const clientSchema = z.object({
  name: z.string().optional(),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha muito curta').optional(),
  document: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  cep: z.string().optional(),
  street: z.string().optional(),
  number: z.string().optional(),
  neighborhood: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  complement: z.string().optional()
})

export const orderItemSchema = z.object({
  product_id: z.union([z.number(), z.string()]),
  quantity: z.number().min(1),
  unit_price: z.number().min(0).optional(),
  notes: z.string().optional()
})

export const orderPaymentSchema = z.object({
  method: z.string(),
  amount: z.number().min(0)
})

export const orderSchema = z.object({
  orderType: z.enum(['delivery', 'takeout', 'dine_in']),
  status: z.string().optional(),
  total: z.number().min(0),
  notes: z.string().optional(),
  deliveryFee: z.number().optional(),
  deliveryDistance: z.number().optional(),
  discountAmount: z.number().optional(),
  customerId: z.union([z.number(), z.string()]).optional(),
  items: z.array(orderItemSchema).min(1, 'Pedido vazio'),
  payments: z.array(orderPaymentSchema).optional()
})

export const couponSchema = z.object({
  code: z.string().min(1),
  type: z.enum(['percentage', 'fixed']),
  value: z.number().min(0),
  minOrder: z.number().optional(),
  validUntil: z.string().optional(),
  maxUses: z.number().optional()
})
