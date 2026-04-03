export const users = [
  { _id: "60d21b4667d0d8992e610c85", fullName: "SAGNIK DUTTA", email: "kingsagnik11@gmail.com", mobile: "8240251269", role: "user", location: { type: "Point", coordinates: [77.2090, 28.6139] } },
  { _id: "owner_123", fullName: "Shop Owner", email: "owner@vingo.com", mobile: "9999999999", role: "owner", location: { type: "Point", coordinates: [77.2090, 28.6139] } },
  { _id: "delivery_123", fullName: "Delivery Boy", email: "delivery@vingo.com", mobile: "8888888888", role: "deliveryBoy", location: { type: "Point", coordinates: [77.2090, 28.6139] } }
];

export const shops = [
  { _id: "shop1", name: "Vingo Pizzeria", city: "delhi", state: "Delhi", address: "CP", image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&q=80", owner: { _id: "owner_123", name: "Shop Owner", _idObj: "owner_123", socketId: null }, items: [] },
  { _id: "shop2", name: "Burger King", city: "delhi", state: "Delhi", address: "Rajiv Chowk", image: "https://images.unsplash.com/photo-1550547660-d9450f859349?w=500&q=80", owner: { _id: "owner_123", name: "Shop Owner", socketId: null }, items: [] },
  { _id: "shop3", name: "Desi Dhaba", city: "delhi", state: "Delhi", address: "Karol Bagh", image: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=500&q=80", owner: { _id: "owner_123", name: "Shop Owner", socketId: null }, items: [] },
  { _id: "shop4", name: "Sweet Tooth", city: "delhi", state: "Delhi", address: "Lajpat Nagar", image: "https://images.unsplash.com/photo-1551024506-0bccd828d307?w=500&q=80", owner: { _id: "owner_123", name: "Shop Owner", socketId: null }, items: [] }
];

export const items = [
  { _id: "item1", name: "Classic Margherita Pizza", category: "Pizza", foodType: "veg", price: 299, image: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=500&q=80", rating: { count: 18, average: 4.8 }, shop: { _id: shops[0]._id, name: shops[0].name } },
  { _id: "item2", name: "Spicy Chicken Burger", category: "Burgers", foodType: "non-veg", price: 199, image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&q=80", rating: { count: 42, average: 4.3 }, shop: { _id: shops[1]._id, name: shops[1].name } },
  { _id: "item3", name: "Paneer Tikka Sandwich", category: "Sandwiches", foodType: "veg", price: 149, image: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=500&q=80", rating: { count: 15, average: 4.5 }, shop: { _id: shops[0]._id, name: shops[0].name } },
  { _id: "item4", name: "Samosa Chaat", category: "Snacks", foodType: "veg", price: 99, image: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=500&q=80", rating: { count: 120, average: 4.6 }, shop: { _id: shops[2]._id, name: shops[2].name } },
  { _id: "item5", name: "Butter Chicken", category: "Main Course", foodType: "non-veg", price: 399, image: "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=500&q=80", rating: { count: 88, average: 4.9 }, shop: { _id: shops[2]._id, name: shops[2].name } },
  { _id: "item6", name: "Chocolate Truffle Cake", category: "Desserts", foodType: "veg", price: 499, image: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=500&q=80", rating: { count: 56, average: 4.7 }, shop: { _id: shops[3]._id, name: shops[3].name } },
  { _id: "item7", name: "Masala Dosa", category: "South Indian", foodType: "veg", price: 150, image: "https://images.unsplash.com/photo-1645177628172-a94c1f96e6db?w=500&q=80", rating: { count: 200, average: 4.4 }, shop: { _id: shops[2]._id, name: shops[2].name } },
  { _id: "item8", name: "Dal Makhani", category: "North Indian", foodType: "veg", price: 250, image: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=500&q=80", rating: { count: 90, average: 4.5 }, shop: { _id: shops[2]._id, name: shops[2].name } },
  { _id: "item9", name: "Hakka Noodles", category: "Chinese", foodType: "veg", price: 180, image: "https://images.unsplash.com/photo-1585032226651-759b368d7246?w=500&q=80", rating: { count: 77, average: 4.2 }, shop: { _id: shops[1]._id, name: shops[1].name } },
  { _id: "item10", name: "French Fries", category: "Fast Food", foodType: "veg", price: 120, image: "https://images.unsplash.com/photo-1576107232684-1279f390859f?w=500&q=80", rating: { count: 150, average: 4.1 }, shop: { _id: shops[1]._id, name: shops[1].name } }
];

shops[0].items.push(items[0], items[2]);
shops[1].items.push(items[1], items[8], items[9]);
shops[2].items.push(items[3], items[4], items[6], items[7]);
shops[3].items.push(items[5]);

export const orders = [];
export const assignments = [];
