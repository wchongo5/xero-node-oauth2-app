
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

export const fetchTaxRates = createAsyncThunk(
  'payments/fetchTaxRates',
  async (tenantId) => {
    const response = await axios.get(`http://localhost:3000/tax-rates?tenantId=${tenantId}`);
    return response.data;
  }
);

const taxRatesSlice = createSlice({
  name: 'taxRates',
  initialState: {
    loading: false,
    error: null,
    taxRates: null,
    taxRatesError: null,
  },
  reducers: {
    //
  },
  extraReducers: (builder) => {

    builder
      .addCase(fetchTaxRates.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchTaxRates.fulfilled, (state, action) => {
        state.loading = false;
        state.taxRates = action.payload.taxRates;
      })
      .addCase(fetchTaxRates.rejected, (state, action) => {
        state.loading = false;
        state.taxRatesError = action.error.message;
      });
  },
});

export default taxRatesSlice.reducer;