// ========== Models (espelham JSON tags da API) ==========
 
export interface Client {
  id: number
  name: string
  email: string
  document: string
  phone: string
  address: string
  cep?: string
  street?: string
  number?: string
  neighborhood?: string
  city?: string
  state?: string
  complement?: string
}

export interface Coupon {
  id: number
  code: string
  type: 'percentage' | 'fixed'
  value: number
  min_purchase: number
  usage_limit: number
  used_count: number
  starts_at: string
  expires_at: string
  is_active: boolean
  client_id?: number
  client?: Client
  distribution_id?: number
  time_left?: string
}

export interface Category {
  id: number
  name: string
  description: string
  created_at?: string
  updated_at?: string
}

export interface Ingredient {
  id: number
  name: string
  icon?: string
  created_at?: string
  updated_at?: string
}


export interface User {
  id: number
  name: string
  email: string
  role: 'admin' | 'cashier' | 'kitchen'
  created_at?: string
  updated_at?: string
}

export interface Product {
  id: number
  name: string
  description: string
  price: number
  category_id: number
  category: Category
  image_url: string
  is_featured: boolean
  featured_slot: string
  promotion_label: string
  promotional_price?: number | null
  available: boolean
  ingredients?: Ingredient[]
  created_at?: string
  updated_at?: string
}

export interface MerchandisingSection {
  id: number
  title: string
  subtitle: string
  layout_type: 'hero' | 'bento' | 'horizontal_list' | 'grid' | 'custom'
  fixed_layout: boolean
  custom_styles: string
  order_index: number
  active: boolean
  products?: Product[]
  created_at?: string
  updated_at?: string
}

export interface PromotionRule {
  id: number
  name: string
  description: string
  type: 'percentage' | 'amount' | 'buy_x_get_y' | 'bundle'
  discount_value: number
  min_quantity: number
  buy_quantity: number
  get_quantity: number
  reward_product_id?: number
  active: boolean
  start_date?: string
  end_date?: string
  products?: Product[]
}

export interface OrderItem {
  id: number
  order_id: number
  product_id: number
  product?: Product
  quantity: number
  unit_price: number
  notes: string
}

export interface Payment {
  id: number
  method: 'cash' | 'credit_card' | 'debit_card' | 'pix'
  amount: number
  created_at?: string
}

export type OrderStatus = 'pending' | 'preparing' | 'ready' | 'delivered' | 'cancelled'
export type OrderType = 'local' | 'delivery' | 'pickup'

export interface Order {
  id: number
  user_id?: number
  user?: User
  customer_id?: number
  customer?: Client
  client_id?: number
  client?: Client
  code: string
  order_type: OrderType
  status: OrderStatus
  total: number
  notes: string
  closure_id?: number
  closure?: any
  coupon_id?: number
  discount_amount?: number
  items?: OrderItem[]
  payments?: Payment[]
  created_at: string
  updated_at: string
}

export interface Closure {
  id: number
  user_id: number
  user?: User
  opening_time: string
  closing_time?: string
  initial_balance: number
  final_balance?: number
  total_cash: number
  total_credit: number
  total_debit: number
  total_pix: number
  reported_cash?: number
  reported_credit?: number
  reported_debit?: number
  reported_pix?: number
  difference?: number
  status: 'open' | 'closed'
  notes: string
  created_at: string
  updated_at: string
}

// ========== DTOs — Request ==========

export interface LoginRequest {
  email: string
  password: string
}

export interface TokenResponse {
  access_token: string
  refresh_token: string
}

export interface RefreshRequest {
  refresh_token: string
}

export interface CreateOrderRequest {
  client_id?: number
  order_type: OrderType
  notes: string
  items: OrderItemRequest[]
  payments: PaymentRequest[]
  coupon_code?: string
}

export interface CreateCouponRequest {
  code: string
  type: 'percentage' | 'fixed'
  value: number
  min_purchase: number
  usage_limit: number
  months: number
  starts_at?: string
  expires_at?: string
  client_id?: number
}

export interface ValidateCouponRequest {
  code: string
  amount: number
  client_id?: number
}

export interface DistributeRequest {
  name?: string
  template_id?: number
  type?: 'percentage' | 'fixed'
  value?: number
  min_purchase?: number
  audience: 'random' | 'all'
  quantity?: number
  months: number
  starts_at?: string
  expires_at?: string
}

export interface CouponDistributionResponse {
  id: number
  name: string
  template_id?: number
  audience: 'all' | 'random'
  quantity: number
  type: 'percentage' | 'fixed'
  value: number
  min_purchase: number
  starts_at: string
  expires_at: string
  created_at: string
  used_count: number
}

export interface CouponDistributionRecipient {
  client: Client
  code: string
  used_at: string | null
}

export interface OrderItemRequest {
  product_id: number
  quantity: number
  notes: string
}

export interface PaymentRequest {
  method: 'cash' | 'credit_card' | 'debit_card' | 'pix'
  amount: number
}

export interface UpdateStatusRequest {
  status: OrderStatus
}

export interface CreateProductRequest {
  name: string
  description: string
  price: number
  category_id: number
  image_url?: string
  is_featured?: boolean
  featured_slot?: string
  promotion_label?: string
  promotional_price?: number
  discount_percentage?: number
  ingredient_ids?: number[]
  available?: boolean
}

export interface UpdateProductRequest {
  name?: string
  description?: string
  price?: number
  category_id?: number
  image_url?: string
  is_featured?: boolean
  featured_slot?: string
  promotion_label?: string
  promotional_price?: number
  discount_percentage?: number
  ingredient_ids?: number[]
  available?: boolean
}

export interface RegisterRequest {
  name: string
  email: string
  password: string
}

export interface UpdateUserRequest {
  name: string
  email: string
  role: string
}

export interface UpdateProfileRequest {
  name: string
  email: string
}

// ========== DTOs — Response ==========

export type ApiResponse<T> = 
  | { success: true; data: T; error?: never }
  | { success: false; data?: never; error: string }

export interface PaginatedResponse<T> {
  data: T[]
  page: number
  limit: number
  total: number
  total_pages: number
}

export interface UserResponse {
  id: number
  name: string
  email: string
  role: string
}

// ========== WebSocket ==========

export interface WSMessage {
  event: 'new_order' | 'order_updated'
  data: Order
}

// ========== Reports ==========

export interface CategorySale {
  category: string
  total: number
  count: number
}

export interface PaymentSale {
  method: string
  total: number
}

export interface SalesSummary {
  total_sales: number
  order_count: number
  by_category: CategorySale[]
  by_payment: PaymentSale[]
  start_date: string
  end_date: string
}

export interface CartItem {
  product: Product
  quantity: number
  notes: string
}
