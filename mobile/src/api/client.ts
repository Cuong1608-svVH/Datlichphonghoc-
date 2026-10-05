import AsyncStorage from '@react-native-async-storage/async-storage';

// Cloudflare Quick Tunnel for Backend (High-speed HKG Edge, no reminder pages, full WebSocket support)
export const DEFAULT_BACKEND_URL = 'https://engines-persistent-retain-hospitals.trycloudflare.com';
export let BACKEND_TUNNEL_URL = DEFAULT_BACKEND_URL;
export let API_BASE_URL = `${BACKEND_TUNNEL_URL}/api`;
export let SOCKET_URL = BACKEND_TUNNEL_URL;

export async function getBackendUrl(): Promise<string> {
  const custom = await AsyncStorage.getItem('custom_server_url');
  if (custom && custom.trim().length > 0) {
    return custom.trim().replace(/\/+$/, '');
  }
  return DEFAULT_BACKEND_URL;
}

export async function setBackendUrl(url: string): Promise<void> {
  const clean = url.trim().replace(/\/+$/, '');
  await AsyncStorage.setItem('custom_server_url', clean);
  BACKEND_TUNNEL_URL = clean;
  API_BASE_URL = `${clean}/api`;
  SOCKET_URL = clean;
}

export async function resetBackendUrl(): Promise<void> {
  await AsyncStorage.removeItem('custom_server_url');
  BACKEND_TUNNEL_URL = DEFAULT_BACKEND_URL;
  API_BASE_URL = `${DEFAULT_BACKEND_URL}/api`;
  SOCKET_URL = DEFAULT_BACKEND_URL;
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: 'STUDENT' | 'ADMIN';
  student_id?: string;
  department?: string;
  phone?: string;
  avatar?: string;
  created_at: string;
}

export interface Slot {
  id: number;
  name: string;
  start_time: string;
  end_time: string;
  slot_order: number;
}

export interface Room {
  id: number;
  name: string;
  code: string;
  floor: number;
  capacity: number;
  image_url: string;
  description?: string;
  status: 'AVAILABLE' | 'MAINTENANCE';
  is_booked?: boolean;
  is_available?: boolean;
  is_maintenance?: boolean;
  current_booking?: {
    booking_id: number;
    booked_by_user_id: number;
    booked_by_name: string;
  } | null;
}

export interface Booking {
  id: number;
  user_id: number;
  room_id: number;
  booking_date: string;
  slot_id: number;
  status: 'CONFIRMED' | 'CANCELLED';
  notes?: string;
  created_at: string;
  cancelled_at?: string;
  hours_remaining?: number;
  is_past?: boolean;
  can_cancel?: boolean;
  room_name?: string;
  room_code?: string;
  floor?: number;
  capacity?: number;
  image_url?: string;
  slot_name?: string;
  start_time?: string;
  end_time?: string;
  user_name?: string;
  user_email?: string;
  student_id?: string;
  department?: string;
}

export interface DashboardStats {
  rooms: {
    total: number;
    available: number;
    maintenance: number;
  };
  today: {
    total: number;
    confirmed: number;
    cancelled: number;
  };
  allTime: {
    total: number;
    confirmed: number;
    cancelled: number;
  };
}

async function getBaseApiUrl(): Promise<string> {
  const root = await getBackendUrl();
  return `${root}/api`;
}

async function getAuthHeader(): Promise<Record<string, string>> {
  const token = await AsyncStorage.getItem('token');
  const baseHeaders: Record<string, string> = {};
  if (token) {
    baseHeaders['Authorization'] = `Bearer ${token}`;
  }
  return baseHeaders;
}

export const api = {
  // Connection Test Ping
  async ping(): Promise<{ ok: boolean; timeMs: number; error?: string }> {
    const start = Date.now();
    try {
      const baseUrl = await getBaseApiUrl();
      const res = await fetch(`${baseUrl}/rooms/slots`);
      const elapsed = Date.now() - start;
      if (res.ok) {
        return { ok: true, timeMs: elapsed };
      }
      return { ok: false, timeMs: elapsed, error: `HTTP ${res.status}` };
    } catch (err: any) {
      return { ok: false, timeMs: Date.now() - start, error: err.message || 'Lỗi kết nối' };
    }
  },

  // Auth
  async login(credentials: { email: string; password: string }) {
    const baseUrl = await getBaseApiUrl();
    const headers = await getAuthHeader();
    const res = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify(credentials),
    });
    return res.json();
  },

  async register(data: any) {
    const baseUrl = await getBaseApiUrl();
    const headers = await getAuthHeader();
    const res = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async getMe() {
    const baseUrl = await getBaseApiUrl();
    const headers = await getAuthHeader();
    const res = await fetch(`${baseUrl}/auth/me`, { headers });
    return res.json();
  },

  async updateProfile(data: any) {
    const baseUrl = await getBaseApiUrl();
    const headers = await getAuthHeader();
    const res = await fetch(`${baseUrl}/auth/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  // Rooms & Slots
  async getSlots(): Promise<{ success: boolean; slots: Slot[] }> {
    const baseUrl = await getBaseApiUrl();
    const headers = await getAuthHeader();
    const res = await fetch(`${baseUrl}/rooms/slots`, { headers });
    return res.json();
  },

  async getRooms(params: {
    date?: string;
    slot_id?: number | string;
    floor?: number | string;
    capacity_min?: number;
    capacity_max?: number;
    search?: string;
    status?: string;
    only_available?: boolean;
  }): Promise<{ success: boolean; rooms: Room[] }> {
    const baseUrl = await getBaseApiUrl();
    const headers = await getAuthHeader();
    const query = new URLSearchParams();
    if (params.date) query.append('date', params.date);
    if (params.slot_id) query.append('slot_id', String(params.slot_id));
    if (params.floor) query.append('floor', String(params.floor));
    if (params.capacity_min) query.append('capacity_min', String(params.capacity_min));
    if (params.capacity_max) query.append('capacity_max', String(params.capacity_max));
    if (params.search) query.append('search', params.search);
    if (params.status) query.append('status', params.status);
    if (params.only_available !== undefined) query.append('only_available', String(params.only_available));

    const res = await fetch(`${baseUrl}/rooms?${query.toString()}`, { headers });
    return res.json();
  },

  async createRoom(data: Partial<Room>) {
    const baseUrl = await getBaseApiUrl();
    const headers = await getAuthHeader();
    const res = await fetch(`${baseUrl}/rooms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async updateRoom(roomId: number, data: Partial<Room>) {
    const baseUrl = await getBaseApiUrl();
    const headers = await getAuthHeader();
    const res = await fetch(`${baseUrl}/rooms/${roomId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async deleteRoom(roomId: number) {
    const baseUrl = await getBaseApiUrl();
    const headers = await getAuthHeader();
    const res = await fetch(`${baseUrl}/rooms/${roomId}`, {
      method: 'DELETE',
      headers,
    });
    return res.json();
  },

  // Bookings
  async bookRoom(data: { room_id: number; booking_date: string; slot_id: number; notes?: string }) {
    const baseUrl = await getBaseApiUrl();
    const headers = await getAuthHeader();
    const res = await fetch(`${baseUrl}/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async cancelBooking(bookingId: number) {
    const baseUrl = await getBaseApiUrl();
    const headers = await getAuthHeader();
    const res = await fetch(`${baseUrl}/bookings/${bookingId}/cancel`, {
      method: 'PUT',
      headers,
    });
    return res.json();
  },

  async getUserBookings(): Promise<{ success: boolean; bookings: Booking[] }> {
    const baseUrl = await getBaseApiUrl();
    const headers = await getAuthHeader();
    const res = await fetch(`${baseUrl}/bookings/my`, { headers });
    return res.json();
  },

  async getAllBookings(params?: {
    date?: string;
    room_id?: number;
    status?: string;
    search?: string;
  }): Promise<{ success: boolean; bookings: Booking[] }> {
    const baseUrl = await getBaseApiUrl();
    const headers = await getAuthHeader();
    const query = new URLSearchParams();
    if (params?.date) query.append('date', params.date);
    if (params?.room_id) query.append('room_id', String(params.room_id));
    if (params?.status) query.append('status', params.status);
    if (params?.search) query.append('search', params.search);

    const res = await fetch(`${baseUrl}/bookings/admin/all?${query.toString()}`, { headers });
    return res.json();
  },

  // Stats
  async getDashboardStats(): Promise<{ success: boolean; stats: DashboardStats }> {
    const baseUrl = await getBaseApiUrl();
    const headers = await getAuthHeader();
    const res = await fetch(`${baseUrl}/stats/dashboard`, { headers });
    return res.json();
  },
};
