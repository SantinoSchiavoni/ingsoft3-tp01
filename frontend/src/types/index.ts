export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PREPARING'
  | 'DELIVERED'
  | 'CANCELLED';

export interface Product {
  id: number;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface OrderItem {
  id?: number;
  orderId?: number;
  productId: number;
  productName: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
}

export interface Order {
  id: number;
  customerName: string;
  status: OrderStatus;
  total: number;
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrderItemInput {
  productId: number;
  quantity: number;
}

export interface CreateOrderPayload {
  customerName: string;
  items: CreateOrderItemInput[];
}

export interface UpdateOrderPayload {
  customerName?: string;
  items?: CreateOrderItemInput[];
}

export interface CreateProductPayload {
  name: string;
  description?: string;
  price: number;
  stock: number;
}

export interface UpdateProductPayload {
  name?: string;
  description?: string;
  price?: number;
  stock?: number;
  active?: boolean;
}

export interface ApiErrorResponse {
  statusCode: number;
  code: string;
  message: string | string[];
}
