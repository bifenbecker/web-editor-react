import { createSlice } from '@reduxjs/toolkit'


/** Initial state for [FTName] feature */
const initialState = {}

export const [FTName]Slice = createSlice({
  name: '[FTName]',
  initialState,
  reducers: {
    reducer1(state, action) {},
  },
})

// Action creators are generated for each case reducer function
export const [FTName]Actions = [FTName]Slice.actions

export const [FTName]Reducer = [FTName]Slice.reducer