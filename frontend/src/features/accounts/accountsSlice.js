import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

export const fetchAccountsBank = createAsyncThunk(
  'payments/fetchAccountsBank',
  async (tenantId) => {
    const response = await axios.get(`http://localhost:3000/accounts-bank?tenantId=${tenantId}`);
    return response.data;
  }
);

const accountsSlice = createSlice({
  name: 'accounts',
  initialState: {
    loading: false,
    error: null,
    accountsBank: null,
  },
  reducers: {
    //
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAccountsBank.fulfilled, (state, action) => {
        state.accountsBank = action.payload.accountsBank;
      })
      ;
  },
});

export default accountsSlice.reducer;