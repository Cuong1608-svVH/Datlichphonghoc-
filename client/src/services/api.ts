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
  // Joined fields
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
  topRooms: Array<{
    id: number;
    name: string;
    code: string;
    floor: number;
    capacity: number;
    booking_count: number;
  }>;
  floorStats: Array<{
    floor: number;
    count: number;
  }>;
}

const BACKEND_BASE = (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'))
  ? ''
  : (localStorage.getItem('custom_server_url') || 'https://engines-persistent-retain-hospitals.trycloudflare.com');

const API_BASE = `${BACKEND_BASE}/api`;

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const api = {
  // Auth
  async login(credentials: { email: string; password: string }) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
    return res.json();
  },

  async register(data: any) {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async getMe() {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: { ...getAuthHeader() },
    });
    return res.json();
  },

  async updateProfile(data: any) {
    const res = await fetch(`${API_BASE}/auth/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  // Rooms & Slots
  async getSlots(): Promise<{ success: boolean; slots: Slot[] }> {
    const res = await fetch(`${API_BASE}/rooms/slots`);
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
    const query = new URLSearchParams();
    if (params.date) query.append('date', params.date);
    if (params.slot_id) query.append('slot_id', String(params.slot_id));
    if (params.floor) query.append('floor', String(params.floor));
    if (params.capacity_min) query.append('capacity_min', String(params.capacity_min));
    if (params.capacity_max) query.append('capacity_max', String(params.capacity_max));
    if (params.search) query.append('search', params.search);
    if (params.status) query.append('status', params.status);
    if (params.only_available !== undefined) query.append('only_available', String(params.only_available));

    const res = await fetch(`${API_BASE}/rooms?${query.toString()}`);
    return res.json();
  },

  async getRoomSchedule(roomId: number, date?: string) {
    const query = date ? `?date=${date}` : '';
    const res = await fetch(`${API_BASE}/rooms/${roomId}/schedule${query}`);
    return res.json();
  },

  async createRoom(data: Partial<Room>) {
    const res = await fetch(`${API_BASE}/rooms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async updateRoom(roomId: number, data: Partial<Room>) {
    const res = await fetch(`${API_BASE}/rooms/${roomId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async deleteRoom(roomId: number) {
    const res = await fetch(`${API_BASE}/rooms/${roomId}`, {
      method: 'DELETE',
      headers: { ...getAuthHeader() },
    });
    return res.json();
  },

  // Bookings
  async bookRoom(data: { room_id: number; booking_date: string; slot_id: number; notes?: string }) {
    const res = await fetch(`${API_BASE}/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async cancelBooking(bookingId: number) {
    const res = await fetch(`${API_BASE}/bookings/${bookingId}/cancel`, {
      method: 'PUT',
      headers: { ...getAuthHeader() },
    });
    return res.json();
  },

  async getUserBookings(): Promise<{ success: boolean; bookings: Booking[] }> {
    const res = await fetch(`${API_BASE}/bookings/my`, {
      headers: { ...getAuthHeader() },
    });
    return res.json();
  },

  async getAllBookings(params?: {
    date?: string;
    room_id?: number;
    status?: string;
    search?: string;
  }): Promise<{ success: boolean; bookings: Booking[] }> {
    const query = new URLSearchParams();
    if (params?.date) query.append('date', params.date);
    if (params?.room_id) query.append('room_id', String(params.room_id));
    if (params?.status) query.append('status', params.status);
    if (params?.search) query.append('search', params.search);

    const res = await fetch(`${API_BASE}/bookings/admin/all?${query.toString()}`, {
      headers: { ...getAuthHeader() },
    });
    return res.json();
  },

  // Stats
  async getDashboardStats(): Promise<{ success: boolean; stats: DashboardStats }> {
    const res = await fetch(`${API_BASE}/stats/dashboard`, {
      headers: { ...getAuthHeader() },
    });
    return res.json();
  },
};
