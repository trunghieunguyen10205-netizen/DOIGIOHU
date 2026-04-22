module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // Nhân viên join room
    socket.on('join:staff_room', () => {
      socket.join('staff_room');
      console.log(`Socket ${socket.id} joined staff_room`);
    });

    // Khách join room theo đơn hàng
    socket.on('join:order_room', (orderCode) => {
      socket.join(`order_${orderCode}`);
      console.log(`Socket ${socket.id} joined order_${orderCode}`);
    });

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });
};
