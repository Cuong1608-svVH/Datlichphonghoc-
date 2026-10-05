let io = null;

function initSocket(socketIoInstance) {
  io = socketIoInstance;

  io.on('connection', (socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);

    // Join room or date channel if needed
    socket.on('join_date_view', (date) => {
      socket.join(`date_${date}`);
    });

    socket.on('disconnect', () => {
      console.log(`🔌 Client disconnected: ${socket.id}`);
    });
  });
}

function broadcastRoomStatusChange(data) {
  if (io) {
    // Broadcast to everyone
    io.emit('ROOM_STATUS_CHANGED', data);
    console.log('📡 Broadcasted ROOM_STATUS_CHANGED:', data);
  }
}

function broadcastRoomUpdated(roomData) {
  if (io) {
    io.emit('ROOM_UPDATED', roomData);
  }
}

module.exports = {
  initSocket,
  broadcastRoomStatusChange,
  broadcastRoomUpdated,
  getIo: () => io
};
