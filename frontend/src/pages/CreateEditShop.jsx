import React from 'react'
import { IoIosArrowRoundBack } from "react-icons/io";
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { FaUtensils } from "react-icons/fa";
import { useState, useRef, useEffect, useCallback } from 'react';
import axios from 'axios';
import { serverUrl } from '../App';
import { setMyShopsData } from '../redux/ownerSlice';
import { ClipLoader } from 'react-spinners';
import toast from 'react-hot-toast';

function CreateEditShop() {
    const navigate = useNavigate()
    const { shopId } = useParams()
    const { myShopsData } = useSelector(state => state.owner)
    const currentShop = myShopsData?.find(s => s._id === shopId)
     const { currentCity,currentState,currentAddress } = useSelector(state => state.user)
     const [name,setName]=useState(currentShop?.name || "")
     const [address,setAddress]=useState(currentShop?.address || currentAddress)
     const [city,setCity]=useState(currentShop?.city || currentCity)
     const [state,setState]=useState(currentShop?.state || currentState)
     const [latitude,setLatitude]=useState(currentShop?.location?.coordinates?.[1] || null)
     const [longitude,setLongitude]=useState(currentShop?.location?.coordinates?.[0] || null)
     const [frontendImage,setFrontendImage]=useState(currentShop?.image || null)
       const [backendImage,setBackendImage]=useState(null)
       const [loading,setLoading]=useState(false)
       const [err,setErr]=useState("")
       const dispatch=useDispatch()

       // Nominatim autocomplete
       const [locationQuery, setLocationQuery] = useState(currentShop?.address || "")
       const [suggestions, setSuggestions] = useState([])
       const [showSuggestions, setShowSuggestions] = useState(false)
       const debounceTimer = useRef(null)
       const suggestionsRef = useRef(null)

       const fetchSuggestions = useCallback(async (query) => {
           if (query.length < 3) {
               setSuggestions([])
               return
           }
           try {
               const res = await axios.get(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`)
               setSuggestions(res.data)
           } catch (e) {
               console.log("Nominatim error:", e)
           }
       }, [])

       const handleLocationInput = (e) => {
           const val = e.target.value
           setLocationQuery(val)
           setAddress(val)
           if (debounceTimer.current) clearTimeout(debounceTimer.current)
           debounceTimer.current = setTimeout(() => {
               fetchSuggestions(val)
               setShowSuggestions(true)
           }, 500)
       }

       const handleSelectSuggestion = (suggestion) => {
           const addr = suggestion.address || {}
           const displayName = suggestion.display_name
           setLocationQuery(displayName)
           setAddress(displayName)
           setCity(addr.city || addr.town || addr.village || addr.county || "")
           setState(addr.state || "")
           setLatitude(parseFloat(suggestion.lat))
           setLongitude(parseFloat(suggestion.lon))
           setSuggestions([])
           setShowSuggestions(false)
       }

       // Close suggestions on outside click
       useEffect(() => {
           const handler = (e) => {
               if (suggestionsRef.current && !suggestionsRef.current.contains(e.target)) {
                   setShowSuggestions(false)
               }
           }
           document.addEventListener("mousedown", handler)
           return () => document.removeEventListener("mousedown", handler)
       }, [])

       const handleImage=(e)=>{
        const file=e.target.files[0]
        setBackendImage(file)
        setFrontendImage(URL.createObjectURL(file))
       }

       const handleSubmit=async (e)=>{
        e.preventDefault()
        setLoading(true)
        try {
           const formData=new FormData()
           formData.append("name",name) 
           formData.append("city",city) 
           formData.append("state",state) 
           formData.append("address",address) 
           if (latitude && longitude) {
               formData.append("latitude", latitude)
               formData.append("longitude", longitude)
           }
           if(shopId) {
             formData.append("shopId", shopId)
           }
           if(backendImage){
            formData.append("image",backendImage)
           }
           const result=await axios.post(`${serverUrl}/api/shop/create-edit`,formData,{withCredentials:true})
           dispatch(setMyShopsData(result.data))
          setLoading(false)
          toast.success(shopId ? "Restaurant updated!" : "Restaurant created!")
          navigate("/my-restaurants")
        } catch (error) {
            console.log(error)
            setErr(error?.response?.data?.message || "Something went wrong")
            setLoading(false)
        }
       }
    return (
        <div className='flex justify-center flex-col items-center p-6 bg-gradient-to-br from-orange-50 relative to-white min-h-screen'>
            <div className='absolute top-[20px] left-[20px] z-[10] mb-[10px]' onClick={() => navigate("/my-restaurants")}>
                <IoIosArrowRoundBack size={35} className='text-[#ff4d2d]' />
            </div>

            <div className='max-w-lg w-full bg-white shadow-xl rounded-2xl p-8 border border-orange-100'>
                <div className='flex flex-col items-center mb-6'>
                    <div className='bg-orange-100 p-4 rounded-full mb-4'>
                        <FaUtensils className='text-[#ff4d2d] w-16 h-16' />
                    </div>
                    <div className="text-3xl font-extrabold text-gray-900">
                        {shopId ? "Edit Shop" : "Add Shop"}
                    </div>
                </div>
                <form className='space-y-5' onSubmit={handleSubmit}>
                    <div>
                        <label className='block text-sm font-medium text-gray-700 mb-1'>Name</label>
                        <input type="text" placeholder='Enter Shop Name' className='w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500'
                        onChange={(e)=>setName(e.target.value)}
                        value={name}
                        />
                    </div>
                    <div>
                        <label className='block text-sm font-medium text-gray-700 mb-1'>Shop Image</label>
                        <input type="file" accept='image/*' className='w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500' onChange={handleImage}  />
                        {frontendImage &&   <div className='mt-4'>
                            <img src={frontendImage} alt="" className='w-full h-48 object-cover rounded-lg border'/>
                        </div>}
                      
                    </div>

                    {/* Location Autocomplete */}
                    <div className='relative' ref={suggestionsRef}>
                        <label className='block text-sm font-medium text-gray-700 mb-1'>📍 Location (type to search)</label>
                        <input 
                            type="text" 
                            placeholder='Search address, city or area...' 
                            className='w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500'
                            onChange={handleLocationInput}
                            value={locationQuery}
                            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                        />
                        {showSuggestions && suggestions.length > 0 && (
                            <div className='absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto'>
                                {suggestions.map((s, idx) => (
                                    <div 
                                        key={idx} 
                                        className='px-4 py-3 hover:bg-orange-50 cursor-pointer text-sm border-b border-gray-100 last:border-b-0 transition-colors'
                                        onClick={() => handleSelectSuggestion(s)}
                                    >
                                        <p className='font-medium text-gray-800 truncate'>{s.display_name}</p>
                                        <p className='text-xs text-gray-400 mt-0.5'>{s.type} • {s.address?.state || ''}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                        {latitude && longitude && (
                            <p className='text-xs text-green-600 mt-1'>✅ Coordinates: {latitude.toFixed(5)}, {longitude.toFixed(5)}</p>
                        )}
                    </div>

                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                        <div>
                           <label className='block text-sm font-medium text-gray-700 mb-1'>City</label>
                        <input type="text" placeholder='City' className='w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-gray-50' onChange={(e)=>setCity(e.target.value)}
                        value={city} readOnly/> 
                        </div>
                        <div>
                            <label className='block text-sm font-medium text-gray-700 mb-1'>State</label>
                        <input type="text" placeholder='State' className='w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-gray-50' onChange={(e)=>setState(e.target.value)}
                        value={state} readOnly/> 
                        </div>
                    </div>
                    <button className='w-full bg-[#ff4d2d] text-white px-6 py-3 rounded-lg font-semibold shadow-md hover:bg-orange-600 hover:shadow-lg transition-all duration-200 cursor-pointer' disabled={loading}>
                        {loading?<ClipLoader size={20} color='white'/>:"Save"}
                    
                    </button>
                    {err && <p className='text-red-500 text-center text-sm font-medium mt-2'>*{err}</p>}
                </form>
            </div>
                


        </div>
    )
}

export default CreateEditShop
