import { createSlice, current } from "@reduxjs/toolkit";

const userSlice = createSlice({
  name: "user",
  initialState: {
    userData: null,
    currentCity: null,
    currentState: null,
    currentAddress: null,
    customLocation: null,
    shopInMyCity: null,
    itemsInMyCity: null,
    cartItems: [],
    totalAmount: 0,
    myOrders: [],
    searchItems: null,
    socket: null
  },
  reducers: {
    setUserData: (state, action) => {
      state.userData = action.payload
    },
    setCurrentCity: (state, action) => {
      state.currentCity = action.payload
    },
    setCurrentState: (state, action) => {
      state.currentState = action.payload
    },
    setCurrentAddress: (state, action) => {
      state.currentAddress = action.payload
    },
    setCustomLocation: (state, action) => {
      state.customLocation = action.payload
    },
    setShopsInMyCity: (state, action) => {
      state.shopInMyCity = action.payload
    },
    setItemsInMyCity: (state, action) => {
      state.itemsInMyCity = action.payload
    },
    setSocket: (state, action) => {
      state.socket = action.payload
    },
    addToCart: (state, action) => {
      const cartItem = action.payload
      // Enforce single-restaurant cart
      if (state.cartItems.length > 0) {
        const currentShopId = typeof state.cartItems[0].shop === 'object' ? String(state.cartItems[0].shop._id || state.cartItems[0].shop) : String(state.cartItems[0].shop)
        const newShopId = typeof cartItem.shop === 'object' ? String(cartItem.shop._id || cartItem.shop) : String(cartItem.shop)
        
        if (currentShopId !== newShopId) {
          // Clear cart and start fresh with the new restaurant
          state.cartItems = []
        }
      }
      const existingItem = state.cartItems.find(i => i.id == cartItem.id)
      if (existingItem) {
        existingItem.quantity += cartItem.quantity
      } else {
        state.cartItems.push(cartItem)
      }

      state.totalAmount = state.cartItems.reduce((sum, i) => sum + i.price * i.quantity, 0)

    },

    setTotalAmount: (state, action) => {
      state.totalAmount = action.payload
    }

    ,

    updateQuantity: (state, action) => {
      const { id, quantity } = action.payload
      const item = state.cartItems.find(i => i.id == id)
      if (item) {
        item.quantity = quantity
      }
      state.totalAmount = state.cartItems.reduce((sum, i) => sum + i.price * i.quantity, 0)
    },

    removeCartItem: (state, action) => {
      state.cartItems = state.cartItems.filter(i => i.id !== action.payload)
      state.totalAmount = state.cartItems.reduce((sum, i) => sum + i.price * i.quantity, 0)
    },

    setMyOrders: (state, action) => {
      state.myOrders = action.payload
    },
    addMyOrder: (state, action) => {
      state.myOrders = [action.payload, ...state.myOrders]
    }

    ,
    updateOrderStatus: (state, action) => {
      const { orderId, shopId, status } = action.payload
      const order = state.myOrders.find(o => o._id == orderId)
      if (order) {
        if (Array.isArray(order.shopOrders)) {
          const shopOrder = order.shopOrders.find(so => {
            const soShopId = so.shop?._id || so.shop
            return String(soShopId) == String(shopId)
          })
          if (shopOrder) shopOrder.status = status
        } else if (order.shopOrders) {
          const soShopId = order.shopOrders.shop?._id || order.shopOrders.shop
          if (String(soShopId) == String(shopId)) {
            order.shopOrders.status = status
          }
        }
      }
    },

    updateRealtimeOrderStatus: (state, action) => {
      const { orderId, shopId, status } = action.payload
      const order = state.myOrders.find(o => o._id == orderId)
      if (order) {
        if (Array.isArray(order.shopOrders)) {
          const shopOrder = order.shopOrders.find(so => {
            const soShopId = so.shop?._id || so.shop
            return String(soShopId) == String(shopId)
          })
          if (shopOrder) shopOrder.status = status
        } else if (order.shopOrders) {
          const soShopId = order.shopOrders.shop?._id || order.shopOrders.shop
          if (String(soShopId) == String(shopId)) {
            order.shopOrders.status = status
          }
        }
      }
    },

    setSearchItems: (state, action) => {
      state.searchItems = action.payload
    }
  }
})

export const { setUserData, setCurrentAddress, setCurrentCity, setCurrentState, setCustomLocation, setShopsInMyCity, setItemsInMyCity, addToCart, updateQuantity, removeCartItem, setMyOrders, addMyOrder, updateOrderStatus, setSearchItems, setTotalAmount, setSocket ,updateRealtimeOrderStatus} = userSlice.actions
export default userSlice.reducer