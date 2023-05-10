import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

export const invoicePay = createAsyncThunk(
  'payments/invoicePay',
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

export const submitBankTransfer = createAsyncThunk(
  'payments/submitBankTransfer',
  async (formData) => {

    const response = await axios.post('http://localhost:3000/bank-transfers', formData, {
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });
    return response.data;
  }
);

export const submitBankTransaction = createAsyncThunk(
  'payments/submitBankTransaction',
  async (formData) => {

    const response = await axios.post('http://localhost:3000/bank-transactions', formData, {
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });
    return response.data;
  }
);

const paymentsSlice = createSlice({
  name: 'payments',
  initialState: {
    invoicePayData: null,
    transferData: null,
    transactionData: null,
    loading: false,
    error: null,
  },
  reducers: {
    //
  },
  extraReducers: (builder) => {
    builder
      .addCase(invoicePay.pending, (state) => {
        state.loading = true;
      })
      .addCase(invoicePay.fulfilled, (state, action) => {
        state.loading = false;
        state.invoicePayData = action.payload;
      })
      .addCase(invoicePay.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
    builder
      .addCase(submitBankTransfer.pending, (state) => {
        state.loading = true;
      })
      .addCase(submitBankTransfer.fulfilled, (state, action) => {
        state.loading = false;
        state.transferData = action.payload;
      })
      .addCase(submitBankTransfer.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });

    builder
      .addCase(submitBankTransaction.pending, (state) => {
        state.loading = true;
      })
      .addCase(submitBankTransaction.fulfilled, (state, action) => {
        state.loading = false;
        state.transactionData = action.payload;
      })
      .addCase(submitBankTransaction.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  },
});

export default paymentsSlice.reducer;