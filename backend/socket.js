export const socketHandler = (io) => {
  io.on('connection', (socket) => {
    console.log("Socket connected:", socket.id)
    socket.on('identity', async ({ userId }) => {
        console.log("Mock identifying socket", userId)
    })
    socket.on('updateLocation', async ({ latitude, longitude, userId }) => {
          io.emit('updateDeliveryLocation',{
            deliveryBoyId:userId,
            latitude,
            longitude
          })
    })
    socket.on('disconnect', async () => {
        console.log("Socket disconnected:", socket.id)
    })
  })
}