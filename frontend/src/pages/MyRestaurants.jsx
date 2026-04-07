import React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { FaPlus, FaEdit, FaUtensils, FaTrash } from 'react-icons/fa'
import { setMyShopsData } from '../redux/ownerSlice'
import axios from 'axios'
import { serverUrl } from '../App'
import toast from 'react-hot-toast'

function MyRestaurants() {
    const { myShopsData } = useSelector(state => state.owner)
    const navigate = useNavigate()
    const dispatch = useDispatch()

    const handleDeleteShop = async (shopId) => {
        if (!window.confirm("Are you sure you want to delete this restaurant and all its items? This action cannot be undone.")) return
        try {
            const result = await axios.delete(`${serverUrl}/api/shop/delete/${shopId}`, { withCredentials: true })
            dispatch(setMyShopsData(result.data))
            toast.success("Shop deleted successfully")
        } catch (error) {
            console.log(error)
            toast.error(error?.response?.data?.message || "Failed to delete shop")
        }
    }

    return (
        <div className='min-h-screen bg-gray-50 p-6 pt-24'>
            <div className='max-w-7xl mx-auto'>
                <div className='flex justify-between items-center mb-8'>
                    <h1 className='text-3xl font-bold text-gray-900'>My Restaurants</h1>
                    <button 
                        onClick={() => navigate('/create-shop')}
                        className='bg-[#ff4d2d] text-white px-6 py-2 rounded-full font-medium shadow-md hover:bg-orange-600 hover:shadow-lg transition flex items-center gap-2'
                    >
                        <FaPlus /> Add Restaurant
                    </button>
                </div>

                {!myShopsData || myShopsData.length === 0 ? (
                    <div className='bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center'>
                        <div className='bg-orange-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4'>
                            <FaUtensils className='text-[#ff4d2d] text-3xl' />
                        </div>
                        <h2 className='text-xl font-bold text-gray-800 mb-2'>No restaurants yet</h2>
                        <p className='text-gray-500 mb-6'>Add your first restaurant to start managing menu items.</p>
                        <button 
                            onClick={() => navigate('/create-shop')}
                            className='bg-[#ff4d2d] text-white px-6 py-2 rounded-full font-medium inline-flex items-center gap-2 hover:bg-orange-600'
                        >
                            <FaPlus /> Build Your Shop
                        </button>
                    </div>
                ) : (
                    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
                        {myShopsData.map(shop => (
                            <div key={shop._id} className='bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition group'>
                                <div className='h-48 overflow-hidden relative'>
                                    <img src={shop.image} alt={shop.name} className='w-full h-full object-cover group-hover:scale-105 transition duration-500' />
                                    <div className='absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4'>
                                        <h2 className='text-xl font-bold text-white'>{shop.name}</h2>
                                    </div>
                                    {/* Delete Button Overlay */}
                                    <button 
                                        onClick={() => handleDeleteShop(shop._id)}
                                        className='absolute top-3 right-3 bg-red-500 text-white p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-red-600'
                                    >
                                        <FaTrash size={14} />
                                    </button>
                                </div>
                                <div className='p-5'>
                                    <p className='text-gray-500 text-sm mb-4 line-clamp-1'>{shop.address}, {shop.city}</p>
                                    <div className='flex justify-between items-center text-sm mb-4'>
                                        <span className='bg-orange-100 text-[#ff4d2d] font-semibold px-3 py-1 rounded-full'>
                                            {shop.items?.length || 0} Items
                                        </span>
                                    </div>
                                    <div className='flex gap-2 flex-wrap'>
                                        <button 
                                            onClick={() => navigate(`/edit-shop/${shop._id}`)}
                                            className='flex-1 border border-gray-200 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-50 transition flex items-center justify-center gap-2'
                                        >
                                            <FaEdit /> Edit Shop
                                        </button>
                                        <button 
                                            onClick={() => navigate(`/add-item/${shop._id}`)}
                                            className='flex-1 bg-[#ff4d2d] text-white py-2 rounded-lg font-medium hover:bg-orange-600 transition flex items-center justify-center gap-2'
                                        >
                                            <FaPlus /> Add Food
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

export default MyRestaurants
