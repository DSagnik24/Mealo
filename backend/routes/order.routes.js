import express from "express"
import isAuth from "../middlewares/isAuth.js"
import { acceptOrder, getCurrentOrder, getDeliveryBoyAssignment, getMyOrders, getOrderById, getTodayDeliveries, getCompletedDeliveries, placeOrder, sendDeliveryOtp, updateOrderStatus, uploadBill, verifyDeliveryOtp, verifyPayment, deleteUnpaidOrder } from "../controllers/order.controllers.js"
import { upload } from "../middlewares/multer.js"




const orderRouter=express.Router()

orderRouter.post("/place-order",isAuth,placeOrder)
orderRouter.post("/verify-payment",isAuth,verifyPayment)
orderRouter.delete("/delete-unpaid/:orderId",isAuth,deleteUnpaidOrder)
orderRouter.get("/my-orders",isAuth,getMyOrders)
orderRouter.get("/get-assignments",isAuth,getDeliveryBoyAssignment)
orderRouter.get("/get-current-order",isAuth,getCurrentOrder)
orderRouter.post("/send-delivery-otp",isAuth,sendDeliveryOtp)
orderRouter.post("/verify-delivery-otp",isAuth,verifyDeliveryOtp)
orderRouter.post("/update-status/:orderId/:shopId",isAuth,updateOrderStatus)
orderRouter.post("/upload-bill", isAuth, upload.single("billImage"), uploadBill)
orderRouter.get('/accept-order/:assignmentId',isAuth,acceptOrder)
orderRouter.get('/get-order-by-id/:orderId',isAuth,getOrderById)
orderRouter.get('/get-today-deliveries',isAuth,getTodayDeliveries)
orderRouter.get('/get-completed-deliveries', isAuth, getCompletedDeliveries)

export default orderRouter