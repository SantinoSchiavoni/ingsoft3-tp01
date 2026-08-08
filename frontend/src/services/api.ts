import {
  CreateOrderPayload,
  CreateProductPayload,
  Order,
  OrderStatus,
  Product,
  UpdateOrderPayload,
  UpdateProductPayload,
  ApiErrorResponse,
} from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorData: ApiErrorResponse;
    try {
      errorData = await response.json();
    } catch {
      throw new Error(`HTTP Error ${response.status}: ${response.statusText}`);
    }

    const message = Array.isArray(errorData.message)
      ? errorData.message.join(', ')
      : errorData.message || 'Error inesperado';
    
    const customError = new Error(message);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (customError as any).code = errorData.code;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (customError as any).statusCode = errorData.statusCode;
    throw customError;
  }
  return response.json();
}

export const api = {
  // Products
  async getProducts(): Promise<Product[]> {
    const res = await fetch(`${API_URL}/api/products`);
    return handleResponse<Product[]>(res);
  },

  async getProductById(id: number): Promise<Product> {
    const res = await fetch(`${API_URL}/api/products/${id}`);
    return handleResponse<Product>(res);
  },

  async createProduct(data: CreateProductPayload): Promise<Product> {
    const res = await fetch(`${API_URL}/api/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<Product>(res);
  },

  async updateProduct(id: number, data: UpdateProductPayload): Promise<Product> {
    const res = await fetch(`${API_URL}/api/products/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<Product>(res);
  },

  async deactivateProduct(id: number): Promise<Product> {
    const res = await fetch(`${API_URL}/api/products/${id}/deactivate`, {
      method: 'PATCH',
    });
    return handleResponse<Product>(res);
  },

  // Orders
  async getOrders(filters?: { status?: OrderStatus; customerName?: string }): Promise<Order[]> {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.customerName) params.append('customerName', filters.customerName);

    const queryString = params.toString();
    const url = `${API_URL}/api/orders${queryString ? `?${queryString}` : ''}`;
    const res = await fetch(url);
    return handleResponse<Order[]>(res);
  },

  async getOrderById(id: number): Promise<Order> {
    const res = await fetch(`${API_URL}/api/orders/${id}`);
    return handleResponse<Order>(res);
  },

  async createOrder(data: CreateOrderPayload): Promise<Order> {
    const res = await fetch(`${API_URL}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<Order>(res);
  },

  async updateOrder(id: number, data: UpdateOrderPayload): Promise<Order> {
    const res = await fetch(`${API_URL}/api/orders/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<Order>(res);
  },

  async confirmOrder(id: number): Promise<Order> {
    const res = await fetch(`${API_URL}/api/orders/${id}/confirm`, {
      method: 'POST',
    });
    return handleResponse<Order>(res);
  },

  async startPreparingOrder(id: number): Promise<Order> {
    const res = await fetch(`${API_URL}/api/orders/${id}/start-preparing`, {
      method: 'POST',
    });
    return handleResponse<Order>(res);
  },

  async deliverOrder(id: number): Promise<Order> {
    const res = await fetch(`${API_URL}/api/orders/${id}/deliver`, {
      method: 'POST',
    });
    return handleResponse<Order>(res);
  },

  async cancelOrder(id: number): Promise<Order> {
    const res = await fetch(`${API_URL}/api/orders/${id}/cancel`, {
      method: 'POST',
    });
    return handleResponse<Order>(res);
  },
};
