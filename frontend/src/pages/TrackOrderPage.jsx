import axios from 'axios'
import React from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { serverUrl } from '../App'
import { useEffect } from 'react'
import { useState } from 'react'
import { IoIosArrowRoundBack } from "react-icons/io";
import DeliveryBoyTracking from '../components/DeliveryBoyTracking'
import { useSelector } from 'react-redux'
import toast from 'react-hot-toast'

function TrackOrderPage() {
    const { orderId } = useParams()
    const [currentOrder, setCurrentOrder] = useState() 
    const navigate = useNavigate()
    const {socket, userData}=useSelector(state=>state.user)
    const [liveLocations,setLiveLocations]=useState({})
    const [receivedOtp, setReceivedOtp]=useState(null)
    const handleGetOrder = async () => {
        try {
            const result = await axios.get(`${serverUrl}/api/order/get-order-by-id/${orderId}`, { withCredentials: true })
            setCurrentOrder(result.data)
        } catch (error) {
            console.log(error)
        }
    }

    useEffect(()=>{
if(socket && orderId) {
    socket.emit('joinOrderRoom', orderId);

    const handleUpdate = ({deliveryBoyId,latitude,longitude})=>{
        setLiveLocations(prev=>({
          ...prev,
          [deliveryBoyId]:{lat:latitude,lon:longitude}
        }))
    };

    const handleOtpSent = ({ otp }) => {
        setReceivedOtp(otp)
        toast.success("Delivery OTP generated! Provide to driver.")
    }

    const handleUpdateStatus = ({ orderId: updatedOrderId, status }) => {
        if (updatedOrderId === orderId) {
            handleGetOrder()
            if (status === "delivered") {
                 toast.success("Order Delivered Successfully!")
                 setReceivedOtp(null)
            }
        }
    }

    socket.on('updateDeliveryLocation', handleUpdate)
    socket.on('otp-sent', handleOtpSent)
    socket.on('update-status', handleUpdateStatus)

    return () => {
        socket.emit('leaveOrderRoom', orderId);
        socket.off('updateDeliveryLocation', handleUpdate);
        socket.off('otp-sent', handleOtpSent);
        socket.off('update-status', handleUpdateStatus);
    }
}
    },[socket, orderId])

    useEffect(() => {
        handleGetOrder()
    }, [orderId])

    const handleDownloadBill = async (billUrl) => {
        try {
            const response = await fetch(billUrl)
            const blob = await response.blob()
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `invoice_${orderId.slice(-6)}.jpg`
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            window.URL.revokeObjectURL(url)
            toast.success("Invoice downloaded!")
        } catch(e) {
            toast.error("Failed to download invoice")
        }
    }

    return (
        <div className='max-w-4xl mx-auto p-4 flex flex-col gap-6'>
            <div className='relative flex items-center gap-4 top-[20px] left-[20px] z-[10] mb-[10px]' onClick={() => navigate("/")}>
                <IoIosArrowRoundBack size={35} className='text-[#ff4d2d]' />
                <h1 className='text-2xl font-bold md:text-center'>Track Order</h1>
            </div>
      {currentOrder?.shopOrders?.map((shopOrder,index)=>(
        <div className='bg-white p-4 rounded-2xl shadow-md border border-orange-100 space-y-4' key={index}>
         <div>
            <p className='text-lg font-bold mb-2 text-[#ff4d2d]'>{shopOrder.shop.name}</p>
            <p className='font-semibold'><span>Items:</span> {shopOrder.shopOrderItems?.map(i=>i.name).join(", ")}</p>
            <p><span className='font-semibold'>Subtotal:</span> ₹{shopOrder.subtotal}</p>
            <p className='mt-6'><span className='font-semibold'>Delivery address:</span> {currentOrder.deliveryAddress?.text}</p>
         </div>

{/* STATUS: PENDING */}
{shopOrder.status === "pending" && (
  <div className='p-4 bg-yellow-50 border border-yellow-200 rounded-xl text-center'>
    <p className='text-yellow-700 font-semibold'>⏳ Your order is pending. The restaurant will start preparing it soon.</p>
  </div>
)}

{/* STATUS: PREPARING */}
{shopOrder.status === "preparing" && (
  <div className='space-y-4'>
    <div className='p-4 bg-orange-50 border border-orange-200 rounded-xl'>
      <p className='text-orange-700 font-semibold text-lg mb-2'>👨‍🍳 Your food is being prepared!</p>
      <div className='w-full bg-gray-200 rounded-full h-3 overflow-hidden'>
        <div className='bg-orange-500 h-3 rounded-full animate-pulse' style={{width: '60%'}}></div>
      </div>
      <p className='text-sm text-gray-600 mt-2'>Estimated delivery time: <span className='font-bold text-orange-600'>25-35 mins</span></p>
    </div>
    {currentOrder.deliveryAddress && (
      <div className="h-[300px] w-full rounded-2xl overflow-hidden shadow-md">
        <DeliveryBoyTracking data={{
          deliveryBoyLocation: {
            lat: currentOrder.deliveryAddress.latitude,
            lon: currentOrder.deliveryAddress.longitude
          },
          customerLocation: {
            lat: currentOrder.deliveryAddress.latitude,
            lon: currentOrder.deliveryAddress.longitude
          }
        }} />
      </div>
    )}
  </div>
)}

{/* STATUS: OUT OF DELIVERY */}
{shopOrder.status === "out of delivery" && (
  <div className='space-y-4'>
    {shopOrder.assignedDeliveryBoy ? (
      <div className='text-sm text-gray-700'>
        <p className='font-semibold'><span>Delivery Boy Name:</span> {shopOrder.assignedDeliveryBoy.fullName}</p>
        <p className='font-semibold'><span>Delivery Boy contact No.:</span> {shopOrder.assignedDeliveryBoy.mobile}</p>
      </div>
    ) : (
      <p className='font-semibold'>Delivery Boy is not assigned yet.</p>
    )}

    {userData?.role === 'user' && (receivedOtp || shopOrder.deliveryOtp) && (
      <div className='bg-orange-50 border border-orange-200 p-4 rounded-xl shadow-inner'>
        <p className='text-sm text-gray-700 font-medium mb-1'>Share this OTP with the delivery driver:</p>
        <p className='text-3xl font-bold tracking-widest text-[#ff4d2d]'>{receivedOtp || shopOrder.deliveryOtp}</p>
      </div>
    )}

    {shopOrder.assignedDeliveryBoy && (
      <div className="h-[400px] w-full rounded-2xl overflow-hidden shadow-md">
        <DeliveryBoyTracking data={{
          deliveryBoyLocation:liveLocations[shopOrder.assignedDeliveryBoy._id] || {
            lat: shopOrder.assignedDeliveryBoy.location?.coordinates?.[1] || currentOrder.deliveryAddress.latitude,
            lon: shopOrder.assignedDeliveryBoy.location?.coordinates?.[0] || currentOrder.deliveryAddress.longitude
          },
          customerLocation: {
            lat: currentOrder.deliveryAddress.latitude,
            lon: currentOrder.deliveryAddress.longitude
          }
        }} />
      </div>
    )}
  </div>
)}

{/* STATUS: DELIVERED — Invoice */}
{shopOrder.status === "delivered" && (
  <div className='space-y-4'>
    <div className='p-4 bg-green-50 border border-green-200 rounded-xl'>
      <p className='text-green-700 font-bold text-lg'>✅ Order Delivered Successfully!</p>
      {shopOrder.deliveredAt && (
        <p className='text-sm text-gray-500 mt-1'>Delivered at: {new Date(shopOrder.deliveredAt).toLocaleString('en-GB')}</p>
      )}
    </div>

    {/* Invoice Card */}
    <div className='border-2 border-dashed border-gray-300 rounded-2xl p-6 bg-gray-50'>
      <div className='flex justify-between items-center mb-4'>
        <h2 className='text-xl font-bold text-gray-800'>🧾 Invoice</h2>
        <span className='text-xs text-gray-400'>Order #{currentOrder._id.slice(-6)}</span>
      </div>
      
      <div className='space-y-2 mb-4'>
        <p className='text-sm'><span className='font-semibold'>Restaurant:</span> {shopOrder.shop.name}</p>
        <p className='text-sm'><span className='font-semibold'>Customer:</span> {currentOrder.user.fullName}</p>
        <p className='text-sm'><span className='font-semibold'>Date:</span> {new Date(currentOrder.createdAt).toLocaleString('en-GB')}</p>
        <p className='text-sm'><span className='font-semibold'>Payment:</span> {currentOrder.paymentMethod?.toUpperCase()}</p>
      </div>

      <div className='border-t border-gray-200 pt-3 mb-3'>
        <p className='text-xs font-bold text-gray-500 mb-2 uppercase'>Items</p>
        {shopOrder.shopOrderItems.map((item, idx) => (
          <div key={idx} className='flex justify-between text-sm py-1'>
            <span>{item.name} x {item.quantity}</span>
            <span className='font-semibold'>₹{item.price * item.quantity}</span>
          </div>
        ))}
      </div>

      <div className='border-t border-gray-300 pt-3 flex justify-between items-center'>
        <span className='text-lg font-bold'>Total</span>
        <span className='text-lg font-bold text-[#ff4d2d]'>₹{shopOrder.subtotal}</span>
      </div>

      {/* Bill Image from Owner */}
      {shopOrder.billImage && (
        <div className='mt-4 space-y-2'>
          <p className='text-sm font-semibold text-gray-700'>📄 Bill from Restaurant:</p>
          <img src={shopOrder.billImage} alt="Restaurant Bill" className='w-full max-h-[500px] object-contain rounded-xl border shadow-md' />
          <button 
            onClick={() => handleDownloadBill(shopOrder.billImage)}
            className='w-full mt-2 bg-[#ff4d2d] text-white py-2 rounded-lg font-semibold hover:bg-[#e64526] transition-all flex items-center justify-center gap-2'
          >
            📥 Download Invoice
          </button>
        </div>
      )}
    </div>
  </div>
)}

        </div>
      ))}



        </div>
    )
}

export default TrackOrderPage
