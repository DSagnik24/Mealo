import connectDb from "./config/db.js";
import Order from "./models/order.model.js";

async function run() {
    await connectDb();
    const orders = await Order.find({});
    const specificOrders = orders.filter(o => 
        String(o._id).endsWith('e2537e') || 
        String(o._id).endsWith('ca9757')
    );
    console.log(JSON.stringify(specificOrders, null, 2));
    process.exit(0);
}
run();
