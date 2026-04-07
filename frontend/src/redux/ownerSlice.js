import { createSlice } from "@reduxjs/toolkit";

const ownerSlice=createSlice({
    name:"owner",
    initialState:{
        myShopsData:null
    },
    reducers:{
        setMyShopsData:(state,action)=>{
        state.myShopsData=action.payload
        }
    }
})

export const {setMyShopsData}=ownerSlice.actions
export default ownerSlice.reducer