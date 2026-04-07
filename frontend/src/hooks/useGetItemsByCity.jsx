import axios from 'axios'
import React, { useEffect } from 'react'
import { serverUrl } from '../App'
import { useDispatch, useSelector } from 'react-redux'
import { setItemsInMyCity, setShopsInMyCity, setUserData } from '../redux/userSlice'

function useGetItemsByCity() {
    const dispatch=useDispatch()
    const {currentCity, customLocation}=useSelector(state=>state.user)
  useEffect(()=>{
  const fetchItems=async () => {
    try {
        if (customLocation?.lat && customLocation?.lon) {
            const result = await axios.get(`${serverUrl}/api/item/get-nearby?lat=${customLocation.lat}&lon=${customLocation.lon}`, {withCredentials:true})
            dispatch(setItemsInMyCity(result.data))
            return
        }
        if (currentCity) {
            const result=await axios.get(`${serverUrl}/api/item/get-by-city/${currentCity}`,{withCredentials:true})
            dispatch(setItemsInMyCity(result.data))
        }
    } catch (error) {
        console.log(error)
    }
}
fetchItems()
 
  },[currentCity, customLocation?.lat, customLocation?.lon])
}

export default useGetItemsByCity
