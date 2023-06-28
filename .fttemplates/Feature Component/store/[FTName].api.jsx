import {createApi, fetchBaseQuery} from '@reduxjs/toolkit/query/react'

export const [FTName]Api = createApi({
  reducerPath: '[FTName]/api',
  baseQuery: fetchBaseQuery({
    // Base url API
    baseUrl: 'https://'
  }),
  // Request again when browser window focus
  refetchOnFocus: false,
  endpoints: build => ({
    /** 
     * Describe each endpoints build.query
     */
    endpoint1: build.query({
      query: (search) => ({
        // Configure request
        url: `url`,
        params: {}
      }),
      // Transform response
      transformResponse: (response) => response
    }),
  })
})

export const {  } = [FTName]Api;