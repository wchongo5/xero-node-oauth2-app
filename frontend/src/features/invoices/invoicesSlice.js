import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

export const fetchInvoicesToPay = createAsyncThunk(
  'payments/fetchInvoicesToPay',
  async ({ tenantId, startDate, contactId }, { rejectWithValue }) => {
    try {
      const response = await fetch('http://localhost:3000/invoices-to-pay', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tenantId, startDate, contactId }),
      });
      const data = await response.json();
      return data.invoices; //.map((invoice) => [invoice[0], invoice[1]]);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const invoicesSlice = createSlice({
  name: 'invoices',
  initialState: {
    loading: false,
    error: null,
    invoicesToPay: null,
  },
  reducers: {
    //
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchInvoicesToPay.fulfilled, (state, action) => {
        state.invoicesToPay = action.payload.invoices;
      })
      ;
  },
});

export default invoicesSlice.reducer;
