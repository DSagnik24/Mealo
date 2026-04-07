import axios from 'axios'
import React, { useEffect } from 'react'
import { serverUrl } from '../App'
import { useDispatch, useSelector } from 'react-redux'
import { setShopsInMyCity, setUserData } from '../redux/userSlice'

function useGetShopByCity() {
    const dispatch=useDispatch()
    const {currentCity, customLocation}=useSelector(state=>state.user)
    
  useEffect(()=>{
  const fetchShops=async () => {
    try {
        if (customLocation?.lat && customLocation?.lon) {
            const result = await axios.get(`${serverUrl}/api/shop/get-nearby?lat=${customLocation.lat}&lon=${customLocation.lon}`, {withCredentials:true})
            dispatch(setShopsInMyCity(result.data))
            return
        }
        if (currentCity) {
            const result=await axios.get(`${serverUrl}/api/shop/get-by-city/${currentCity}`,{withCredentials:true})
            dispatch(setShopsInMyCity(result.data))
        }
    } catch (error) {
        console.log(error)
    }
}
fetchShops()
 
  },[currentCity, customLocation?.lat, customLocation?.lon])
}

export default useGetShopByCity
