import { orders, shops, users, assignments } from "../utils/mockDb.js";

export const placeOrder = async (req, res) => {
    const user = users.find(u => String(u._id) === String(req.userId));
    const newOrder = {
        _id: "order_" + Date.now(),
        user: user || { _id: "guest", fullName: "Guest" },
        paymentMethod: req.body.paymentMethod || "cod",
        deliveryAddress: req.body.deliveryAddress || {},
        totalAmount: req.body.totalAmount || 0,
        shopOrders: [{
            _id: "shopOrder_" + Date.now(),
            shop: shops[0],
            owner: shops[0].owner,
            subtotal: req.body.totalAmount || 0,
            shopOrderItems: req.body.cartItems?.map(i => ({
                item: i.id,
                price: i.price,
                quantity: i.quantity,
                name: i.name
            })) || [],
            status: "placed"
        }],
        createdAt: new Date().toISOString(),
        payment: false
    };
    orders.push(newOrder);
    
    if (req.body.paymentMethod === "online") {
        const razorOrder = {
            id: "order_mock_" + Date.now(),
            amount: Math.round(newOrder.totalAmount * 100),
            currency: 'INR'
        };
        return res.status(200).json({
            razorOrder,
            orderId: newOrder._id
        });
    }
    
    return res.status(201).json(newOrder);
};

export const verifyPayment = async (req, res) => {
    const order = orders.find(o => String(o._id) === String(req.body.orderId));
    if(order) {
        order.payment = true;
        order.razorpayPaymentId = req.body.razorpay_payment_id;
    }
    return res.status(200).json(order);
};

export const getMyOrders = async (req, res) => {
    const user = users.find(u => String(u._id) === String(req.userId));
    if(!user) return res.status(400).json([]);
    
    if (user.role === "user") {
        return res.status(200).json(orders.filter(o => String(o.user._id) === String(req.userId)));
    } else if (user.role === "owner") {
        const ownerOrders = orders.filter(o => o.shopOrders.some(so => String(so.owner._id) === String(req.userId)));
        const formatted = ownerOrders.map(order => ({
            _id: order._id,
            paymentMethod: order.paymentMethod,
            user: order.user,
            shopOrders: order.shopOrders.find(so => String(so.owner._id) === String(req.userId)),
            createdAt: order.createdAt,
            deliveryAddress: order.deliveryAddress,
            payment: order.payment
        }));
        return res.status(200).json(formatted);
    }
    return res.status(200).json([]);
};

export const updateOrderStatus = async (req, res) => {
    const { orderId, status } = req.body;
    const order = orders.find(o => String(o._id) === String(orderId));
    if (order) {
        const shopOrder = order.shopOrders.find(so => String(so.owner._id) === String(req.userId));
        if (shopOrder) shopOrder.status = status;
        
        if (status === "out of delivery") {
            const boyId = users.find(u => u.role === "deliveryBoy")?._id || "delivery_123";
            const tempAssignment = {
                _id: "assign_" + Date.now(),
                deliveryBoyId: boyId,
                orderId: order._id,
                shopOrderId: shopOrder?._id,
                status: "pending",
                order: order,
                shop: shopOrder.shop
            };
            assignments.push(tempAssignment);
            
            // Re-emit socket assignment if we had it
            const io = req.app.get('io');
            if (io) {
               io.emit('newAssignment', {
                   assignmentId: tempAssignment._id,
                   orderId: order._id,
                   shopName: shopOrder.shop.name,
                   deliveryAddress: order.deliveryAddress,
                   items: shopOrder.shopOrderItems,
                   subtotal: shopOrder.subtotal
               });
            }
        }
    }
    return res.status(200).json({ message: "Status updated" });
};

export const getDeliveryBoyAssignment = async (req, res) => {
    const active = assignments.filter(a => String(a.deliveryBoyId) === String(req.userId) && a.status === "pending");
    const formatted = active.map(a => ({
        assignmentId: a._id,
        orderId: a.order._id,
        shopName: a.shop.name,
        deliveryAddress: a.order.deliveryAddress,
        items: a.order.shopOrders.find(so => String(so._id) === String(a.shopOrderId))?.shopOrderItems || [],
        subtotal: a.order.shopOrders.find(so => String(so._id) === String(a.shopOrderId))?.subtotal
    }));
    return res.status(200).json(formatted);
};

export const acceptOrder = async (req, res) => {
    const assignment = assignments.find(a => String(a._id) === String(req.params.assignmentId));
    if (assignment) assignment.status = "accepted";
    return res.status(200).json({ message: 'order accepted' });
};

export const getCurrentOrder = async (req, res) => {
    const assignment = assignments.find(a => String(a.deliveryBoyId) === String(req.userId) && a.status === "accepted");
    if (!assignment) return res.status(200).json(null);
    
    const shopOrder = assignment.order.shopOrders.find(so => String(so._id) === String(assignment.shopOrderId));
    
    return res.status(200).json({
        _id: assignment.order._id,
        user: assignment.order.user,
        shopOrder,
        deliveryAddress: assignment.order.deliveryAddress,
        deliveryBoyLocation: { lat: 28.6139, lon: 77.2090 }, // dynamic mocked location
        customerLocation: { 
            lat: assignment.order.deliveryAddress.latitude || 28.6139, 
            lon: assignment.order.deliveryAddress.longitude || 77.2090 
        }
    });
};

export const getOrderById = async (req, res) => res.status(200).json(orders.find(o => String(o._id) === String(req.params.orderId)) || orders[0]);

export const sendDeliveryOtp = async (req, res) => res.status(200).json({ message: "Otp sent" });

export const verifyDeliveryOtp = async (req, res) => {
    const assignment = assignments.find(a => String(a.orderId) === String(req.body.orderId));
    if (assignment) {
        assignment.status = "delivered";
        assignment.deliveredAt = Date.now();
    }
    return res.status(200).json({ message: "Order Delivered" });
};

export const getTodayDeliveries = async (req, res) => {
    const delivered = assignments.filter(a => String(a.deliveryBoyId) === String(req.userId) && a.status === "delivered");
    let stats = {};
    delivered.forEach(a => {
        const hour = new Date(a.deliveredAt || Date.now()).getHours();
        stats[hour] = (stats[hour] || 0) + 1;
    });
    let formattedStats = Object.keys(stats).map(hour => ({
        hour: parseInt(hour),
        count: stats[hour]
    }));
    return res.status(200).json(formattedStats);
};
