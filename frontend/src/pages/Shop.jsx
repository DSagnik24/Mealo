import axios from 'axios'
import React, { useEffect, useState } from 'react'
import { serverUrl } from '../App'
import { useNavigate, useParams } from 'react-router-dom'
import { FaStore } from "react-icons/fa6";
import { FaLocationDot } from "react-icons/fa6";
import { FaUtensils } from "react-icons/fa";
import FoodCard from '../components/FoodCard';
import { FaArrowLeft } from "react-icons/fa";
import { useSelector } from 'react-redux';

function Shop() {
    const {shopId}=useParams()
    const [items,setItems]=useState([])
    const [shop,setShop]=useState([])
    const [distanceKm, setDistanceKm]=useState(null)
    const navigate=useNavigate()
    const { location: mapLocation } = useSelector(state=>state.map)
    const { customLocation } = useSelector(state=>state.user)
    
    // Prefer custom selected location over GPS
    const activeLocation = customLocation || mapLocation

    const handleShop=async () => {
        try {
           const result=await axios.get(`${serverUrl}/api/item/get-by-shop/${shopId}`,{withCredentials:true}) 
           setShop(result.data.shop)
           setItems(result.data.items)
           
           // Calculate distance if we have both locations
           const shopData = result.data.shop
           if (shopData?.location?.coordinates && activeLocation?.lat && activeLocation?.lon) {
               const shopLat = shopData.location.coordinates[1]
               const shopLon = shopData.location.coordinates[0]
               if (shopLat !== 0 && shopLon !== 0) {
                   const R = 6371
                   const dLat = (activeLocation.lat - shopLat) * Math.PI / 180
                   const dLon = (activeLocation.lon - shopLon) * Math.PI / 180
                   const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(shopLat * Math.PI / 180) * Math.cos(activeLocation.lat * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2)
                   const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
                   setDistanceKm(Math.round(R * c * 10) / 10)
               }
           }
        } catch (error) {
            console.log(error)
        }
    }

    useEffect(()=>{
handleShop()
    },[shopId])

    const isTooFar = distanceKm !== null && distanceKm > 50

  return (
    <div className='min-h-screen bg-gray-50'>
        <button className='absolute top-4 left-4 z-20 flex items-center gap-2 bg-black/50 hover:bg-black/70 text-white px-3 py-2 rounded-full shadow-md transition' onClick={()=>navigate("/")}>
        <FaArrowLeft />
<span>Back</span>
        </button>
      {shop && <div className='relative w-full h-64 md:h-80 lg:h-96'>
          <img src={shop.image} alt="" className='w-full h-full object-cover'/>
          <div className='absolute inset-0 bg-gradient-to-b from-black/70 to-black/30 flex flex-col justify-center items-center text-center px-4'>
          <FaStore className='text-white text-4xl mb-3 drop-shadow-md'/>
          <h1 className='text-3xl md:text-5xl font-extrabold text-white drop-shadow-lg'>{shop.name}</h1>
          <div className='flex items-center  gap-[10px]'>
          <FaLocationDot size={22} color='red'/>
             <p className='text-lg font-medium text-gray-200 mt-[10px]'>{shop.address}</p>
             </div>
             {distanceKm !== null && (
               <span className={`mt-2 px-3 py-1 rounded-full text-sm font-bold ${isTooFar ? 'bg-red-500 text-white' : 'bg-green-500 text-white'}`}>
                   📍 {distanceKm} km away
               </span>
             )}
          </div>
       
        </div>}

{/* Too-far warning banner */}
{isTooFar && (
    <div className='bg-red-50 border-b-2 border-red-400 px-6 py-4 text-center'>
        <p className='text-red-700 font-semibold text-lg'>⚠️ This restaurant is {distanceKm}km away from you</p>
        <p className='text-red-500 text-sm'>You can only order from restaurants within 50km. You can browse the menu but ordering is disabled.</p>
    </div>
)}

<div className='max-w-7xl mx-auto px-6 py-10'>
<h2 className='flex items-center justify-center gap-3 text-3xl font-bold mb-10 text-gray-800'><FaUtensils color='red'/> Our Menu</h2>

{items.length>0?(
    <div className='flex flex-wrap justify-center gap-8'>
        {items.map((item)=>(
            <FoodCard data={item} key={item._id} disabled={isTooFar}/>
        ))}
    </div>
):<p className='text-center text-gray-500 text-lg'>No Items Available</p>}
</div>



    </div>
  )
}

export default Shop
