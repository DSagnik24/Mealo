import axios from 'axios';
import React from 'react'
import { MdPhone } from "react-icons/md";
import { serverUrl } from '../App';
import { useDispatch } from 'react-redux';
import { updateOrderStatus } from '../redux/userSlice';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useEffect } from 'react';
import toast from 'react-hot-toast';
function OwnerOrderCard({ data }) {
    const [availableBoys,setAvailableBoys]=useState([])
    const [billFile, setBillFile]=useState(null)
    const [billPreview, setBillPreview]=useState(data.shopOrders.billImage || null)
    const [uploading, setUploading]=useState(false)
    const dispatch=useDispatch()
    const navigate=useNavigate()

    const handleUploadBill = async () => {
        if(!billFile) {
            toast.error("Please select a bill image first")
            return
        }
        setUploading(true)
        try {
            const formData = new FormData()
            formData.append("billImage", billFile)
            formData.append("orderId", data._id)
            formData.append("shopOrderId", data.shopOrders._id)
            const result = await axios.post(`${serverUrl}/api/order/upload-bill`, formData, { withCredentials: true })
            setBillPreview(result.data.billImage)
            toast.success("Bill uploaded successfully!")
        } catch(error) {
            toast.error(error?.response?.data?.message || "Failed to upload bill")
            console.log(error)
        }
        setUploading(false)
    }

    const handleUpdateStatus=async (orderId,shopId,status) => {
        try {
            const result=await axios.post(`${serverUrl}/api/order/update-status/${orderId}/${shopId}`,{status},{withCredentials:true})
             dispatch(updateOrderStatus({orderId,shopId,status}))
             setAvailableBoys(result.data.availableBoys)
             console.log(result.data)
        } catch (error) {
            toast.error(error?.response?.data?.message || "Failed to update status")
            console.log(error)
        }
    }


  
    return (
        <div className='bg-white rounded-lg shadow p-4 space-y-4'>
            <div>
                <h2 className='text-lg font-semibold text-gray-800'>{data.user.fullName}</h2>
                <p className='text-sm text-gray-500'>{data.user.email}</p>
                <p className='flex items-center gap-2 text-sm text-gray-600 mt-1'><MdPhone /><span>{data.user.mobile}</span></p>
                {data.paymentMethod=="online"?<p className='gap-2 text-sm text-gray-600'>payment: {data.payment?"true":"false"}</p>:<p className='gap-2 text-sm text-gray-600'>Payment Method: {data.paymentMethod}</p>}
                
            </div>

            <div className='flex items-start flex-col gap-2 text-gray-600 text-sm'>
                <p>{data?.deliveryAddress?.text}</p>
                <p className='text-xs text-gray-500'>Lat: {data?.deliveryAddress.latitude} , Lon {data?.deliveryAddress.longitude}</p>
            </div>

            <div className='flex space-x-4 overflow-x-auto pb-2'>
                {data.shopOrders.shopOrderItems.map((item, index) => (
                    <div key={index} className='flex-shrink-0 w-40 border rounded-lg p-2 bg-white"'>
                        <img src={item.item.image} alt="" className='w-full h-24 object-cover rounded' />
                        <p className='text-sm font-semibold mt-1'>{item.name}</p>
                        <p className='text-xs text-gray-500'>Qty: {item.quantity} x ₹{item.price}</p>
                    </div>
                ))}
            </div>

{/* Bill Upload Section */}
{data.shopOrders.status !== "delivered" && (
<div className='border rounded-lg p-3 bg-blue-50 space-y-2'>
    <p className='text-sm font-semibold text-blue-700'>📄 Upload Bill / Invoice</p>
    {billPreview ? (
        <div className='flex items-center gap-3'>
            <img src={billPreview} alt="Bill" className='w-20 h-20 object-cover rounded-lg border shadow-sm' />
            <span className='text-xs text-green-600 font-semibold'>✅ Bill Uploaded</span>
        </div>
    ) : (
        <div className='flex items-center gap-2'>
            <input type="file" accept="image/*" className='text-sm' onChange={(e) => setBillFile(e.target.files[0])} />
            <button className='bg-blue-500 text-white px-3 py-1 rounded-lg text-sm hover:bg-blue-600 disabled:opacity-50' onClick={handleUploadBill} disabled={uploading}>
                {uploading ? "Uploading..." : "Upload"}
            </button>
        </div>
    )}
</div>
)}

<div className='flex justify-between items-center mt-auto pt-3 border-t border-gray-100'>
<span className='text-sm'>status: <span className='font-semibold capitalize text-[#ff4d2d]'>{data.shopOrders.status}</span>
</span>

{data.shopOrders.status !== "delivered" ? (
<select  className='rounded-md border px-3 py-1 text-sm focus:outline-none focus:ring-2 border-[#ff4d2d] text-[#ff4d2d]' onChange={(e)=>handleUpdateStatus(data._id,data.shopOrders.shop._id,e.target.value)}>
    <option value="">Change Status</option>
<option value="pending">Pending</option>
<option value="preparing">Preparing</option>
<option value="out of delivery">Out Of Delivery</option>
</select>
) : (
    <span className='px-3 py-1 bg-green-100 text-green-700 rounded-md text-sm font-semibold'>Completed</span>
)}
</div>

{data.shopOrders.status=="out of delivery" && 
<div className="mt-3 p-2 border rounded-lg text-sm bg-orange-50 gap-4 flex flex-col">
    <div>
    {data.shopOrders.assignedDeliveryBoy?<p>Assigned Delivery Boy:</p>:<p>Available Delivery Boys:</p>}
   {availableBoys?.length>0?(
     availableBoys.map((b,index)=>(
        <div key={index} className='text-gray-800'>{b.fullName}-{b.mobile}</div>
     ))
   ):data.shopOrders.assignedDeliveryBoy?<div>{data.shopOrders.assignedDeliveryBoy.fullName}-{data.shopOrders.assignedDeliveryBoy.mobile}</div>:<div>Waiting for delivery boy to accept</div>}
   </div>
   {data.shopOrders.assignedDeliveryBoy && <button 
        onClick={() => navigate(`/track-order/${data._id}`)}
        className='mt-2 bg-[#ff4d2d] text-white px-4 py-2 rounded-lg text-sm w-max'
   >
        Track Order
   </button>}
</div>}

<div className='text-right font-bold text-gray-800 text-sm'>
 Total: ₹{data.shopOrders.subtotal}
</div>
        </div>
    )
}

export default OwnerOrderCard

