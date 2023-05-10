import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

export const fetchPayments = createAsyncThunk(
  'payments/fetchPayments',
  async (formData) => {
    const response = await axios.post("http://localhost:3000/invoice-pay", formData, {
    // const response = await axios.get("http://localhost:3000/payments", formData, {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });
    return response.data;
  }
);

const paymentsSlice = createSlice({
  name: 'payments',
  initialState: {
    paymentsData: null,
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchPayments.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchPayments.fulfilled, (state, action) => {
        state.loading = false;
        state.paymentsData = action.payload;
      })
      .addCase(fetchPayments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  },
});


export default paymentsSlice.reducer;