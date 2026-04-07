import React, { useEffect, useRef, useState } from 'react'
import Nav from './NaV.JSX'
import { categories } from '../category'
import CategoryCard from './CategoryCard'
import { FaCircleChevronLeft } from "react-icons/fa6";
import { FaCircleChevronRight } from "react-icons/fa6";
import { useSelector } from 'react-redux';
import FoodCard from './FoodCard';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { serverUrl } from '../App';
import toast from 'react-hot-toast';

function UserDashboard() {
  const {currentCity,shopInMyCity,itemsInMyCity,searchItems}=useSelector(state=>state.user)
  const cateScrollRef=useRef()
  const shopScrollRef=useRef()
  const navigate=useNavigate()
  const [showLeftCateButton,setShowLeftCateButton]=useState(false)
  const [showRightCateButton,setShowRightCateButton]=useState(false)
   const [showLeftShopButton,setShowLeftShopButton]=useState(false)
  const [showRightShopButton,setShowRightShopButton]=useState(false)
  const [updatedItemsList,setUpdatedItemsList]=useState([])

const handleFilterByCategory=(category)=>{
if(category=="All"){
  setUpdatedItemsList(itemsInMyCity)
}else{
  const filteredList=itemsInMyCity?.filter(i=>i.category===category)
  setUpdatedItemsList(filteredList)
}

}

useEffect(()=>{
setUpdatedItemsList(itemsInMyCity)
},[itemsInMyCity])


  const updateButton=(ref,setLeftButton,setRightButton)=>{
const element=ref.current
if(element){
setLeftButton(element.scrollLeft>0)
setRightButton(element.scrollLeft+element.clientWidth<element.scrollWidth)

}
  }
  const scrollHandler=(ref,direction)=>{
    if(ref.current){
      ref.current.scrollBy({
        left:direction=="left"?-200:200,
        behavior:"smooth"
      })
    }
  }




  useEffect(()=>{
    if(cateScrollRef.current){
      updateButton(cateScrollRef,setShowLeftCateButton,setShowRightCateButton)
      updateButton(shopScrollRef,setShowLeftShopButton,setShowRightShopButton)
      cateScrollRef.current.addEventListener('scroll',()=>{
        updateButton(cateScrollRef,setShowLeftCateButton,setShowRightCateButton)
      })
      shopScrollRef.current.addEventListener('scroll',()=>{
         updateButton(shopScrollRef,setShowLeftShopButton,setShowRightShopButton)
      })
     
    }

    return ()=>{cateScrollRef?.current?.removeEventListener("scroll",()=>{
        updateButton(cateScrollRef,setShowLeftCateButton,setShowRightCateButton)
      })
         shopScrollRef?.current?.removeEventListener("scroll",()=>{
        updateButton(shopScrollRef,setShowLeftShopButton,setShowRightShopButton)
      })}

  },[categories])


  return (
    <div className='w-screen min-h-screen flex flex-col gap-5 items-center bg-[#fff9f6] overflow-y-auto'>
      <Nav />

      {searchItems && searchItems.length>0 && (
        <div className='w-full max-w-6xl flex flex-col gap-5 items-start p-5 bg-white shadow-md rounded-2xl mt-4'>
<h1 className='text-gray-900 text-2xl sm:text-3xl font-semibold border-b border-gray-200 pb-2'>
  Search Results
</h1>
<div className='w-full h-auto flex flex-wrap gap-6 justify-center'>
  {searchItems.map((item)=>(
    <FoodCard data={item} key={item._id}/>
  ))}
</div>
        </div>
      )}

      <div className="w-full max-w-6xl flex flex-col gap-5 items-start p-[10px]">

        <h1 className='text-gray-800 text-2xl sm:text-3xl'>Inspiration for your first order</h1>
        <div className='w-full relative'>
          {showLeftCateButton &&  <button className='absolute left-0 top-1/2 -translate-y-1/2 bg-[#ff4d2d] text-white p-2 rounded-full shadow-lg hover:bg-[#e64528] z-10' onClick={()=>scrollHandler(cateScrollRef,"left")}><FaCircleChevronLeft />
          </button>}
         

          <div className='w-full flex overflow-x-auto gap-4 pb-2 ' ref={cateScrollRef}>
            {categories.map((cate, index) => (
              <CategoryCard name={cate.category} image={cate.image} key={index} onClick={()=>handleFilterByCategory(cate.category)}/>
            ))}
          </div>
          {showRightCateButton &&  <button className='absolute right-0 top-1/2 -translate-y-1/2 bg-[#ff4d2d] text-white p-2 rounded-full shadow-lg hover:bg-[#e64528] z-10' onClick={()=>scrollHandler(cateScrollRef,"right")}>
<FaCircleChevronRight />
          </button>}
         
        </div>
      </div>

      <div className='w-full max-w-6xl flex flex-col gap-5 items-start p-[10px]'>
 <h1 className='text-gray-800 text-2xl sm:text-3xl'>Restaurants near you</h1>
 <div className='w-full relative'>
          {showLeftShopButton &&  <button className='absolute left-0 top-1/2 -translate-y-1/2 bg-[#ff4d2d] text-white p-2 rounded-full shadow-lg hover:bg-[#e64528] z-10' onClick={()=>scrollHandler(shopScrollRef,"left")}><FaCircleChevronLeft />
          </button>}
         

          <div className='w-full flex overflow-x-auto gap-4 pb-2 ' ref={shopScrollRef}>
            {shopInMyCity?.map((shop, index) => {
              const isViewOnly = shop.distanceKm > 50
              return (
              <div key={index} className='relative shrink-0'>
                <div className={`${isViewOnly ? 'opacity-50 grayscale' : ''} transition-all`}>
                  <CategoryCard name={shop.name} image={shop.image} onClick={()=> !isViewOnly ? navigate(`/shop/${shop._id}`) : toast.error(`This restaurant is ${shop.distanceKm}km away. Ordering available within 50km only.`)}/>
                </div>
                {shop.distanceKm != null && (
                  <div className={`absolute top-2 left-2 px-2 py-0.5 rounded-full text-xs font-bold shadow ${isViewOnly ? 'bg-red-500 text-white' : 'bg-green-500 text-white'}`}>
                    {shop.distanceKm} km
                  </div>
                )}
                {isViewOnly && (
                  <div className='absolute bottom-8 left-1/2 -translate-x-1/2 bg-red-600 text-white text-xs px-2 py-0.5 rounded-full font-semibold whitespace-nowrap'>
                    View Only
                  </div>
                )}
              </div>
            )})}
          </div>
          {showRightShopButton &&  <button className='absolute right-0 top-1/2 -translate-y-1/2 bg-[#ff4d2d] text-white p-2 rounded-full shadow-lg hover:bg-[#e64528] z-10' onClick={()=>scrollHandler(shopScrollRef,"right")}>
<FaCircleChevronRight />
          </button>}
         
        </div>
      </div>

      <div className='w-full max-w-6xl flex flex-col gap-5 items-start p-[10px]'>
       <h1 className='text-gray-800 text-2xl sm:text-3xl'>
        Suggested Food Items
       </h1>

<div className='w-full h-auto flex flex-wrap gap-[20px] justify-center'>
{updatedItemsList?.map((item,index)=>(
  <FoodCard key={index} data={item}/>
))}
</div>


      </div>


    </div>
  )
}

export default UserDashboard
