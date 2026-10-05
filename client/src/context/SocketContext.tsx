import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

export interface RoomStatusEvent {
  action: 'BOOKED' | 'CANCELLED';
  roomId: number;
  bookingDate: string;
  slotId: number;
  status: 'BOOKED' | 'AVAILABLE';
  bookingId?: number;
  cancelledBookingId?: number;
  bookedBy?: string;
  bookedByUserId?: number;
}

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  lastEvent: RoomStatusEvent | null;
  liveNotifications: Array<{ id: string; text: string; type: 'info' | 'success' | 'warning'; timestamp: Date }>;
  dismissNotification: (id: string) => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [lastEvent, setLastEvent] = useState<RoomStatusEvent | null>(null);
  const [liveNotifications, setLiveNotifications] = useState<
    Array<{ id: string; text: string; type: 'info' | 'success' | 'warning'; timestamp: Date }>
  >([]);

  useEffect(() => {
    const socketUrl = (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'))
      ? '/'
      : (localStorage.getItem('custom_server_url') || 'https://engines-persistent-retain-hospitals.trycloudflare.com');

    const s = io(socketUrl, {
      transports: ['websocket', 'polling'],
    });

    s.on('connect', () => {
      console.log('⚡ Connected to Realtime WebSocket Server');
      setIsConnected(true);
    });

    s.on('disconnect', () => {
      console.log('❌ Disconnected from Realtime WebSocket Server');
      setIsConnected(false);
    });

    s.on('ROOM_STATUS_CHANGED', (data: RoomStatusEvent) => {
      console.log('🔔 Received Realtime Event:', data);
      setLastEvent(data);

      const notificationId = Math.random().toString(36).substring(7);
      const text =
        data.action === 'BOOKED'
          ? `⚡ Phòng vừa được ${data.bookedBy || 'người dùng khác'} đặt thành công (Ca ${data.slotId}, ${data.bookingDate})`
          : `✨ Một phòng vừa được nhả chỗ và sẵn sàng để đặt (Ca ${data.slotId}, ${data.bookingDate})`;

      setLiveNotifications((prev) => [
        {
          id: notificationId,
          text,
          type: data.action === 'BOOKED' ? 'warning' : 'success',
          timestamp: new Date(),
        },
        ...prev.slice(0, 4), // keep max 5
      ]);

      // Auto-dismiss after 6 seconds
      setTimeout(() => {
        setLiveNotifications((prev) => prev.filter((n) => n.id !== notificationId));
      }, 6000);
    });

    setSocket(s);

    return () => {
      s.disconnect();
    };
  }, []);

  const dismissNotification = (id: string) => {
    setLiveNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        lastEvent,
        liveNotifications,
        dismissNotification,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
