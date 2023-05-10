import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

export const fetchTenants = createAsyncThunk(
  'payments/fetchTenants',
  async () => {
    const response = await axios.get("http://localhost:3000/organisations");
    return response.data;
  }
);

const tenantsSlice = createSlice({
  name: 'tenants',

  initialState: {
    loading: false,
    error: null,
    tenants: null,
  },
  reducers: {
    //
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTenants.fulfilled, (state, action) => {
        state.tenants = action.payload.orgs;
      })
      ;
  },
});

export default tenantsSlice.reducer;