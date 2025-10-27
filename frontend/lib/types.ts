// API Response Types
export interface ApiResponse<T = any> {
  data?: T;
  message?: string;
  error?: string;
}

// User Types
export interface User {
  id: number;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  role: "CUSTOMER" | "ADMIN" | "STAFF";
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  password: string;
  confirmPassword: string;
}

export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  email?: string;
}

// Menu Types
export interface Category {
  _id: string;
  name: string;
  display_order: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MenuItem {
  _id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  available: boolean;
  image_url?: string;
  preparation_time: number;
  created_at: string;
  updated_at: string;
}

// Order Types
export interface OrderItem {
  id: number;
  menu_item_id: string;
  item_name: string;
  quantity: number;
  price: number;
  total_price: number;
  special_instructions?: string;
}

export interface Order {
  id: number;
  user_id: number;
  items: OrderItem[];
  total_amount: number;
  status:
    | "placed"
    | "confirmed"
    | "preparing"
    | "ready"
    | "completed"
    | "cancelled";
  special_instructions?: string;
  created_at: string;
  updated_at: string;
  estimated_ready_time?: string;
}

export interface CreateOrderRequest {
  user_id: number;
  items: {
    menu_item_id: string;
    quantity: number;
    special_instructions?: string;
  }[];
  special_instructions?: string;
}

// Queue Types
export interface QueueItem {
  order_id: number;
  user_id: number;
  queue_number: number;
  position?: number; // For frontend display
  status: "waiting" | "preparing" | "ready" | "completed";
  estimated_wait_time: number;
  created_at: string;
}

export interface QueueStats {
  total_orders_today?: number;
  active_orders_count: number;
  average_wait_time: number;
  total_orders?: number;
  waiting_orders?: number;
  preparing_orders?: number;
}

// Payment Types
export interface Payment {
  id: number;
  payment_id: string;
  order_id: number;
  user_id: number;
  amount: number;
  status: "pending" | "success" | "failed" | "cancelled";
  payment_method: string;
  created_at: string;
  updated_at: string;
}

export interface CreatePaymentRequest {
  order_id: number;
  user_id: number;
  amount: number;
  payment_method?: string;
}

// Cart Types (Frontend only)
export interface CartItem {
  menuItem: MenuItem;
  quantity: number;
  specialInstructions?: string;
}

export interface Cart {
  items: CartItem[];
  total: number;
}

// WebSocket Types
export interface WebSocketMessage {
  type: "queue_update" | "status_update" | "queue_removed";
  data: any;
}
