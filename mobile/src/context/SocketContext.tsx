import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { getBackendUrl } from '../api/client';

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
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [lastEvent, setLastEvent] = useState<RoomStatusEvent | null>(null);

  useEffect(() => {
    let s: Socket | null = null;
    let isMounted = true;

    async function initSocket() {
      const url = await getBackendUrl();
      if (!isMounted) return;

      s = io(url, {
        transports: ['websocket', 'polling'],
        autoConnect: true,
      });

      s.on('connect', () => {
        console.log('⚡ Mobile Socket connected to:', url);
        setIsConnected(true);
      });

      s.on('disconnect', () => {
        console.log('❌ Mobile Socket disconnected');
        setIsConnected(false);
      });

      s.on('ROOM_STATUS_CHANGED', (data: RoomStatusEvent) => {
        console.log('🔔 Mobile received ROOM_STATUS_CHANGED:', data);
        setLastEvent(data);
      });

      setSocket(s);
    }

    initSocket();

    return () => {
      isMounted = false;
      if (s) s.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        lastEvent,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) throw new Error('useSocket must be used within a SocketProvider');
  return context;
};
