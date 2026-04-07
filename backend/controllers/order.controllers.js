import DeliveryAssignment from "../models/deliveryAssignment.model.js"
import Order from "../models/order.model.js"
import Shop from "../models/shop.model.js"
import User from "../models/user.model.js"
import { sendDeliveryOtpMail } from "../utils/mail.js"
import uploadOnCloudinary from "../utils/cloudinary.js"
import RazorPay from "razorpay"
import dotenv from "dotenv"

dotenv.config()
let instance = new RazorPay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export const broadcastToDeliveryBoys = async (order, shopOrder, io) => {
    try {
        const { longitude, latitude } = order.deliveryAddress
        const nearByDeliveryBoys = await User.find({
            role: "deliveryBoy",
            location: {
                $near: {
                    $geometry: { type: "Point", coordinates: [Number(longitude), Number(latitude)] },
                    $maxDistance: 50000
                }
            }
        })

        const nearByIds = nearByDeliveryBoys.map(b => b._id)
        const busyIds = await DeliveryAssignment.find({
            assignedTo: { $in: nearByIds },
            status: { $nin: ["brodcasted", "completed"] }
        }).distinct("assignedTo")

        const busyIdSet = new Set(busyIds.map(id => String(id)))
        const availableBoys = nearByDeliveryBoys.filter(b => !busyIdSet.has(String(b._id)))
        const candidates = availableBoys.map(b => b._id)

        if (candidates.length == 0) return;

        const deliveryAssignment = await DeliveryAssignment.create({
            order: order._id,
            shop: shopOrder.shop,
            shopOrderId: shopOrder._id,
            brodcastedTo: candidates,
            status: "brodcasted"
        })

        shopOrder.assignedDeliveryBoy = deliveryAssignment.assignedTo
        shopOrder.assignment = deliveryAssignment._id
        await order.save()

        if (io) {
            availableBoys.forEach(boy => {
                const boySocketId = boy.socketId
                if (boySocketId) {
                    io.to(boySocketId).emit('newAssignment', {
                        sentTo: boy._id,
                        assignmentId: deliveryAssignment._id,
                        orderId: order._id,
                        shopName: shopOrder.shop.name,
                        deliveryAddress: order.deliveryAddress,
                        items: shopOrder.shopOrderItems || [],
                        subtotal: shopOrder.subtotal
                    })
                }
            });
        }
    } catch(err) {
        console.error("broadcast error", err)
    }
}

export const placeOrder = async (req, res) => {
    try {
        const { cartItems, paymentMethod, deliveryAddress, totalAmount } = req.body
        if (cartItems.length == 0 || !cartItems) {
            return res.status(400).json({ message: "cart is empty" })
        }
        if (!deliveryAddress.text || !deliveryAddress.latitude || !deliveryAddress.longitude) {
            return res.status(400).json({ message: "send complete deliveryAddress" })
        }

        // Single-restaurant enforcement — all items must be from the same shop
        const shopIds = [...new Set(cartItems.map(i => {
            return typeof i.shop === 'object' ? String(i.shop._id || i.shop) : String(i.shop)
        }))]
        if (shopIds.length > 1) {
            return res.status(400).json({ message: "You can only order from one restaurant at a time" })
        }

        // 50km distance check
        const targetShop = await Shop.findById(shopIds[0])
        if (targetShop && targetShop.location && targetShop.location.coordinates[0] !== 0) {
            const R = 6371
            const dLat = (deliveryAddress.latitude - targetShop.location.coordinates[1]) * Math.PI / 180
            const dLon = (deliveryAddress.longitude - targetShop.location.coordinates[0]) * Math.PI / 180
            const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(targetShop.location.coordinates[1] * Math.PI / 180) * Math.cos(deliveryAddress.latitude * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2)
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
            const distKm = R * c
            if (distKm > 50) {
                return res.status(400).json({ message: `Restaurant is ${distKm.toFixed(1)}km away. You can only order from restaurants within 50km.` })
            }
        }

        const groupItemsByShop = {}

        cartItems.forEach(item => {
            const shopId = typeof item.shop === 'object' ? String(item.shop._id || item.shop) : String(item.shop)
            if (!groupItemsByShop[shopId]) {
                groupItemsByShop[shopId] = []
            }
            groupItemsByShop[shopId].push(item)
        });

        const shopOrders = await Promise.all(Object.keys(groupItemsByShop).map(async (shopId) => {
            const shop = await Shop.findById(shopId).populate("owner")
            if (!shop) {
                return res.status(400).json({ message: "shop not found" })
            }
            const items = groupItemsByShop[shopId]
            const subtotal = items.reduce((sum, i) => sum + Number(i.price) * Number(i.quantity), 0)
            return {
                shop: shop._id,
                owner: shop.owner._id,
                subtotal,
                shopOrderItems: items.map((i) => ({
                    item: i.id,
                    price: i.price,
                    quantity: i.quantity,
                    name: i.name
                }))
            }
        }
        ))

        if (paymentMethod == "online") {
            const razorOrder = await instance.orders.create({
                amount: Math.round(totalAmount * 100),
                currency: 'INR',
                receipt: `receipt_${Date.now()}`
            })
            const newOrder = await Order.create({
                user: req.userId,
                paymentMethod,
                deliveryAddress,
                totalAmount,
                shopOrders,
                razorpayOrderId: razorOrder.id,
                payment: false
            })

            return res.status(200).json({
                razorOrder,
                orderId: newOrder._id,
            })

        }

        const newOrder = await Order.create({
            user: req.userId,
            paymentMethod,
            deliveryAddress,
            totalAmount,
            shopOrders
        })

        await newOrder.populate("shopOrders.shopOrderItems.item", "name image price")
        await newOrder.populate("shopOrders.shop", "name")
        await newOrder.populate("shopOrders.owner", "name socketId")
        await newOrder.populate("user", "name email mobile")

        const io = req.app.get('io')

        if (io) {
            for (const shopOrder of newOrder.shopOrders) {
                const ownerSocketId = shopOrder.owner.socketId
                if (ownerSocketId) {
                    io.to(ownerSocketId).emit('newOrder', {
                        _id: newOrder._id,
                        paymentMethod: newOrder.paymentMethod,
                        user: newOrder.user,
                        shopOrders: shopOrder,
                        createdAt: newOrder.createdAt,
                        deliveryAddress: newOrder.deliveryAddress,
                        payment: newOrder.payment
                    })
                }
                if (newOrder.paymentMethod === "cod") {
                    await broadcastToDeliveryBoys(newOrder, shopOrder, io);
                }
            }
        }



        return res.status(201).json(newOrder)
    } catch (error) {
        return res.status(500).json({ message: `place order error ${error}` })
    }
}

export const verifyPayment = async (req, res) => {
    try {
        const { razorpay_payment_id, orderId } = req.body
        const payment = await instance.payments.fetch(razorpay_payment_id)
        
        if (!payment) {
            return res.status(400).json({ message: "payment not found" })
        }
        
        // Auto-capture authorized payments to ensure they show up as successful on the dashboard
        if (payment.status === "authorized") {
            try {
                await instance.payments.capture(razorpay_payment_id, payment.amount, payment.currency)
            } catch (err) {
                console.error("Razorpay Capture Error:", err)
                return res.status(400).json({ message: "Failed to capture payment" })
            }
        } else if (payment.status !== "captured") {
            return res.status(400).json({ message: "payment not captured" })
        }
        const order = await Order.findById(orderId)
        if (!order) {
            return res.status(400).json({ message: "order not found" })
        }

        order.payment = true
        order.razorpayPaymentId = razorpay_payment_id
        await order.save()

        await order.populate("shopOrders.shopOrderItems.item", "name image price")
        await order.populate("shopOrders.shop", "name")
        await order.populate("shopOrders.owner", "name socketId")
        await order.populate("user", "name email mobile")

        const io = req.app.get('io')

        if (io) {
            for (const shopOrder of order.shopOrders) {
                const ownerSocketId = shopOrder.owner.socketId
                if (ownerSocketId) {
                    io.to(ownerSocketId).emit('newOrder', {
                        _id: order._id,
                        paymentMethod: order.paymentMethod,
                        user: order.user,
                        shopOrders: shopOrder,
                        createdAt: order.createdAt,
                        deliveryAddress: order.deliveryAddress,
                        payment: order.payment
                    })
                }
                await broadcastToDeliveryBoys(order, shopOrder, io);
            }
        }


        return res.status(200).json(order)

    } catch (error) {
        return res.status(500).json({ message: `verify payment  error ${error}` })
    }
}

export const deleteUnpaidOrder = async (req, res) => {
    try {
        const { orderId } = req.params;
        const order = await Order.findById(orderId);
        if (!order) return res.status(404).json({ message: "Order not found" });
        
        // Ensure requester is the owner of the order
        if (String(order.user) !== String(req.userId)) {
            return res.status(403).json({ message: "Unauthorized" });
        }
        
        // Only delete online unverified payments
        if (order.paymentMethod === "online" && !order.payment) {
            await Order.findByIdAndDelete(orderId);
            return res.status(200).json({ message: "Unpaid order removed successfully" });
        }
        
        return res.status(400).json({ message: "Cannot delete this order" });
    } catch (error) {
        return res.status(500).json({ message: `Delete unpaid order error: ${error}` });
    }
}



export const getMyOrders = async (req, res) => {
    try {
        const user = await User.findById(req.userId)
        
        // Safety query: only return COD orders OR online orders that have completed payment
        const verifiedOrderFilter = {
            $or: [
                { paymentMethod: "cod" },
                { paymentMethod: "online", payment: true }
            ]
        }

        if (user.role == "user") {
            const orders = await Order.find({ user: req.userId, ...verifiedOrderFilter })
                .sort({ createdAt: -1 })
                .populate("shopOrders.shop", "name")
                .populate("shopOrders.owner", "name email mobile")
                .populate("shopOrders.shopOrderItems.item", "name image price")

            return res.status(200).json(orders)
        } else if (user.role == "owner") {
            const orders = await Order.find({ "shopOrders.owner": req.userId, ...verifiedOrderFilter })
                .sort({ createdAt: -1 })
                .populate("shopOrders.shop", "name")
                .populate("user")
                .populate("shopOrders.shopOrderItems.item", "name image price")
                .populate("shopOrders.assignedDeliveryBoy", "fullName mobile")



            const filteredOrders = orders.map((order => ({
                _id: order._id,
                paymentMethod: order.paymentMethod,
                user: order.user,
                shopOrders: order.shopOrders.find(o => o.owner._id == req.userId),
                createdAt: order.createdAt,
                deliveryAddress: order.deliveryAddress,
                payment: order.payment
            })))


            return res.status(200).json(filteredOrders)
        }

    } catch (error) {
        return res.status(500).json({ message: `get User order error ${error}` })
    }
}


export const updateOrderStatus = async (req, res) => {
    try {
        const { orderId, shopId } = req.params
        const { status } = req.body
        const order = await Order.findById(orderId)

        const shopOrder = order.shopOrders.find(o => o.shop == shopId)
        if (!shopOrder) {
            return res.status(400).json({ message: "shop order not found" })
        }
        shopOrder.status = status
        let deliveryBoysPayload = []
        if (status == "out of delivery") {
            if (!shopOrder.billImage) {
                return res.status(400).json({ message: "Please upload the bill/invoice before marking out of delivery" })
            }
        }


        await order.save()
        const updatedShopOrder = order.shopOrders.find(o => o.shop == shopId)
        await order.populate("shopOrders.shop", "name")
        await order.populate("shopOrders.assignedDeliveryBoy", "fullName email mobile")
        await order.populate("user", "socketId")

        const io = req.app.get('io')
        if (io) {
            const userSocketId = order.user.socketId
            if (userSocketId) {
                io.to(userSocketId).emit('update-status', {
                    orderId: String(order._id),
                    shopId: String(updatedShopOrder.shop._id),
                    status: updatedShopOrder.status,
                    userId: String(order.user._id)
                })
            }
            // Notify delivery boy
            if (updatedShopOrder.assignedDeliveryBoy) {
                const deliveryBoy = await User.findById(updatedShopOrder.assignedDeliveryBoy._id || updatedShopOrder.assignedDeliveryBoy)
                if (deliveryBoy && deliveryBoy.socketId) {
                    io.to(deliveryBoy.socketId).emit('update-status', {
                        orderId: String(order._id),
                        shopId: String(updatedShopOrder.shop._id),
                        status: updatedShopOrder.status,
                        userId: String(deliveryBoy._id)
                    })
                }
            }
        }



        return res.status(200).json({
            shopOrder: updatedShopOrder,
            assignedDeliveryBoy: updatedShopOrder?.assignedDeliveryBoy,
            availableBoys: deliveryBoysPayload,
            assignment: updatedShopOrder?.assignment?._id

        })



    } catch (error) {
        return res.status(500).json({ message: `order status error ${error}` })
    }
}


export const getDeliveryBoyAssignment = async (req, res) => {
    try {
        const deliveryBoyId = req.userId
        const assignments = await DeliveryAssignment.find({
            brodcastedTo: deliveryBoyId,
            status: "brodcasted"
        })
            .populate("order")
            .populate("shop")

        const formated = assignments.map(a => ({
            assignmentId: a._id,
            orderId: a.order._id,
            shopName: a.shop.name,
            deliveryAddress: a.order.deliveryAddress,
            items: a.order.shopOrders.find(so => so._id.equals(a.shopOrderId)).shopOrderItems || [],
            subtotal: a.order.shopOrders.find(so => so._id.equals(a.shopOrderId))?.subtotal
        }))

        return res.status(200).json(formated)
    } catch (error) {
        return res.status(500).json({ message: `get Assignment error ${error}` })
    }
}


export const acceptOrder = async (req, res) => {
    try {
        const { assignmentId } = req.params
        const assignment = await DeliveryAssignment.findById(assignmentId)
        if (!assignment) {
            return res.status(400).json({ message: "assignment not found" })
        }
        if (assignment.status !== "brodcasted") {
            return res.status(400).json({ message: "assignment is expired" })
        }

        const alreadyAssigned = await DeliveryAssignment.findOne({
            assignedTo: req.userId,
            status: { $nin: ["brodcasted", "completed"] }
        })

        if (alreadyAssigned) {
            return res.status(400).json({ message: "You are already assigned to another order" })
        }

        assignment.assignedTo = req.userId
        assignment.status = 'assigned'
        assignment.acceptedAt = new Date()
        await assignment.save()

        const order = await Order.findById(assignment.order)
        if (!order) {
            return res.status(400).json({ message: "order not found" })
        }

        let shopOrder = order.shopOrders.id(assignment.shopOrderId)
        shopOrder.assignedDeliveryBoy = req.userId
        await order.save()


        return res.status(200).json({
            message: 'order accepted'
        })
    } catch (error) {
        return res.status(500).json({ message: `accept order error ${error}` })
    }
}



export const getCurrentOrder = async (req, res) => {
    try {
        const assignment = await DeliveryAssignment.findOne({
            assignedTo: req.userId,
            status: "assigned"
        })
            .populate("shop", "name")
            .populate("assignedTo", "fullName email mobile location")
            .populate({
                path: "order",
                populate: [{ path: "user", select: "fullName email location mobile" }]

            })

        if (!assignment) {
            return res.status(400).json({ message: "assignment not found" })
        }
        if (!assignment.order) {
            return res.status(400).json({ message: "order not found" })
        }

        const shopOrder = assignment.order.shopOrders.find(so => String(so._id) == String(assignment.shopOrderId))

        if (!shopOrder) {
            return res.status(400).json({ message: "shopOrder not found" })
        }

        let deliveryBoyLocation = { lat: null, lon: null }
        if (assignment.assignedTo.location.coordinates.length == 2) {
            deliveryBoyLocation.lat = assignment.assignedTo.location.coordinates[1]
            deliveryBoyLocation.lon = assignment.assignedTo.location.coordinates[0]
        }

        let customerLocation = { lat: null, lon: null }
        if (assignment.order.deliveryAddress) {
            customerLocation.lat = assignment.order.deliveryAddress.latitude
            customerLocation.lon = assignment.order.deliveryAddress.longitude
        }

        return res.status(200).json({
            _id: assignment.order._id,
            user: assignment.order.user,
            shopOrder,
            deliveryAddress: assignment.order.deliveryAddress,
            deliveryBoyLocation,
            customerLocation
        })


    } catch (error) {

    }
}

export const getOrderById = async (req, res) => {
    try {
        const { orderId } = req.params
        const order = await Order.findById(orderId)
            .populate("user")
            .populate({
                path: "shopOrders.shop",
                model: "Shop"
            })
            .populate({
                path: "shopOrders.assignedDeliveryBoy",
                model: "User"
            })
            .populate({
                path: "shopOrders.shopOrderItems.item",
                model: "Item"
            })
            .lean()

        if (!order) {
            return res.status(400).json({ message: "order not found" })
        }

        // Strip OTP from response if requester is NOT the order's user
        if (String(order.user._id) !== String(req.userId)) {
            order.shopOrders = order.shopOrders.map(so => ({
                ...so,
                deliveryOtp: undefined,
                otpExpires: undefined
            }))
        }

        return res.status(200).json(order)
    } catch (error) {
        return res.status(500).json({ message: `get by id order error ${error}` })
    }
}

export const sendDeliveryOtp = async (req, res) => {
    try {
        const { orderId, shopOrderId } = req.body
        const order = await Order.findById(orderId).populate("user")
        const shopOrder = order.shopOrders.id(shopOrderId)
        if (!order || !shopOrder) {
            return res.status(400).json({ message: "enter valid order/shopOrderid" })
        }
        const otp = Math.floor(1000 + Math.random() * 9000).toString()
        shopOrder.deliveryOtp = otp
        shopOrder.otpExpires = Date.now() + 5 * 60 * 1000
        await order.save()
        
        try {
            await sendDeliveryOtpMail(order.user, otp)
        } catch(mailError) {
            console.error("Failed sending OTP via email, defaulting to UI notification:", mailError);
        }
        
        const io = req.app.get('io')
        if (io) {
            io.to(`order_${order._id}`).emit('otp-sent', { otp })
        }

        return res.status(200).json({ message: `Otp sent Successfuly to ${order?.user?.fullName}` })
    } catch (error) {
        return res.status(500).json({ message: `delivery otp error ${error}` })
    }
}

export const verifyDeliveryOtp = async (req, res) => {
    try {
        const { orderId, shopOrderId, otp } = req.body
        const order = await Order.findById(orderId).populate("user")
        const shopOrder = order.shopOrders.id(shopOrderId)
        if (!order || !shopOrder) {
            return res.status(400).json({ message: "enter valid order/shopOrderid" })
        }
        if (shopOrder.deliveryOtp !== otp || !shopOrder.otpExpires || shopOrder.otpExpires < Date.now()) {
            return res.status(400).json({ message: "Invalid/Expired Otp" })
        }

        shopOrder.status = "delivered"
        shopOrder.deliveredAt = Date.now()
        shopOrder.deliveryOtp = null
        shopOrder.otpExpires = null
        await order.save()
        await DeliveryAssignment.deleteOne({
            shopOrderId: shopOrder._id,
            order: order._id,
            assignedTo: shopOrder.assignedDeliveryBoy
        })

        const shopIdStr = String(shopOrder.shop)

        const io = req.app.get('io')
        if (io) {
            // Notify User
            const userSocketId = order.user.socketId
            if (userSocketId) {
                io.to(userSocketId).emit('update-status', {
                    orderId: String(order._id),
                    shopId: shopIdStr,
                    status: 'delivered',
                    userId: String(order.user._id)
                })
            }
            // Notify Owner
            const ownerUser = await User.findById(shopOrder.owner)
            if (ownerUser && ownerUser.socketId) {
                io.to(ownerUser.socketId).emit('update-status', {
                    orderId: String(order._id),
                    shopId: shopIdStr,
                    status: 'delivered',
                    userId: String(ownerUser._id)
                })
            }
        }

        return res.status(200).json({ message: "Order Delivered Successfully!" })

    } catch (error) {
        return res.status(500).json({ message: `verify delivery otp error ${error}` })
    }
}

export const getTodayDeliveries=async (req,res) => {
    try {
        const deliveryBoyId=req.userId
        const startsOfDay=new Date()
        startsOfDay.setHours(0,0,0,0)

        const orders=await Order.find({
           "shopOrders.assignedDeliveryBoy":deliveryBoyId,
           "shopOrders.status":"delivered",
           "shopOrders.deliveredAt":{$gte:startsOfDay}
        }).lean()

     let todaysDeliveries=[] 
     
     orders.forEach(order=>{
        order.shopOrders.forEach(shopOrder=>{
            if(shopOrder.assignedDeliveryBoy==deliveryBoyId &&
                shopOrder.status=="delivered" &&
                shopOrder.deliveredAt &&
                shopOrder.deliveredAt>=startsOfDay
            ){
                todaysDeliveries.push(shopOrder)
            }
        })
     })

let stats={}

todaysDeliveries.forEach(shopOrder=>{
    const hour=new Date(shopOrder.deliveredAt).getHours()
    stats[hour]=(stats[hour] || 0) + 1
})

let formattedStats=Object.keys(stats).map(hour=>({
 hour:parseInt(hour),
 count:stats[hour]   
}))

formattedStats.sort((a,b)=>a.hour-b.hour)

return res.status(200).json(formattedStats)
  

    } catch (error) {
        return res.status(500).json({ message: `today deliveries error ${error}` }) 
    }
}


export const getCompletedDeliveries = async (req, res) => {
    try {
        const deliveryBoyId = req.userId;
        const orders = await Order.find({
            "shopOrders.assignedDeliveryBoy": deliveryBoyId,
            "shopOrders.status": "delivered"
        })
        .sort({ "createdAt": -1 })
        .populate("shopOrders.shop", "name")
        .populate("user", "fullName email mobile")
        .lean();

        let pastDeliveries = [];
        orders.forEach(order => {
            order.shopOrders.forEach(shopOrder => {
                if (String(shopOrder.assignedDeliveryBoy) === String(deliveryBoyId) && shopOrder.status === "delivered") {
                    pastDeliveries.push({
                        orderId: order._id,
                        shopName: shopOrder.shop.name,
                        deliveryAddress: order.deliveryAddress,
                        subtotal: shopOrder.subtotal,
                        deliveredAt: shopOrder.deliveredAt,
                        itemsCount: shopOrder.shopOrderItems.length,
                        payout: 50
                    });
                }
            });
        });

        return res.status(200).json(pastDeliveries);
    } catch(err) {
        return res.status(500).json({ message: `completed deliveries error ${err}` })
    }
}

export const uploadBill = async (req, res) => {
    try {
        const { orderId, shopOrderId } = req.body
        if (!req.file) {
            return res.status(400).json({ message: "Please upload a bill image" })
        }
        const order = await Order.findById(orderId)
        if (!order) {
            return res.status(400).json({ message: "Order not found" })
        }
        const shopOrder = order.shopOrders.id(shopOrderId)
        if (!shopOrder) {
            return res.status(400).json({ message: "Shop order not found" })
        }
        const imageUrl = await uploadOnCloudinary(req.file.path)
        if (!imageUrl) {
            return res.status(500).json({ message: "Failed to upload bill image" })
        }
        shopOrder.billImage = imageUrl
        await order.save()
        return res.status(200).json({ message: "Bill uploaded successfully", billImage: imageUrl })
    } catch (error) {
        return res.status(500).json({ message: `upload bill error ${error}` })
    }
}


