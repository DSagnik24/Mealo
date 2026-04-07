import User from "./models/user.model.js"

export const socketHandler = (io) => {
  io.on('connection', (socket) => {
    console.log(socket.id)
    socket.on('identity', async ({ userId }) => {
      try {
        const user = await User.findByIdAndUpdate(userId, {
          socketId: socket.id, isOnline: true
        }, { new: true })
      } catch (error) {
        console.log(error)
      }
    })

    socket.on('joinOrderRoom', (orderId) => {
        if(orderId) {
            socket.join(`order_${orderId}`);
            console.log(`Socket ${socket.id} joined room: order_${orderId}`);
        }
    })

    socket.on('leaveOrderRoom', (orderId) => {
        if(orderId) {
            socket.leave(`order_${orderId}`);
            console.log(`Socket ${socket.id} left room: order_${orderId}`);
        }
    })

    socket.on('updateLocation', async ({ latitude, longitude, userId, orderId }) => {
      try {
        const user = await User.findByIdAndUpdate(userId, {
          location: {
            type: 'Point',
            coordinates: [longitude, latitude]
          },
          isOnline: true,
          socketId: socket.id
        })

        if (user && orderId) {
          io.to(`order_${orderId}`).emit('updateDeliveryLocation',{
            deliveryBoyId:userId,
            latitude,
            longitude
          })
        }


      } catch (error) {
          console.log('updateDeliveryLocation error')
      }
    })




    socket.on('disconnect', async () => {
      try {

        await User.findOneAndUpdate({ socketId: socket.id }, {
          socketId: null,
          isOnline: false
        })
      } catch (error) {
        console.log(error)
      }

    })
  })
}