import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

export const fetchContactsToPay = createAsyncThunk(
  'payments/fetchContactsToPay',
  async ({ tenantId, startDate, invoiceType }) => {
    const response = await axios.post("http://localhost:3000/contacts-to-pay", {
      tenantId,
      startDate,
      invoiceType
    });
    return response.data;
  }
);

export const fetchContactGroups = createAsyncThunk(
  "payments/fetchContactGroups",
  async (tenantId, { rejectWithValue }) => {
    try {
      const response = await axios.post("http://localhost:3000/contact-groups", { tenantId });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const fetchContactsGroup = createAsyncThunk(
  'payments/fetchContactsGroup',
  async ({ tenantId, contactGroupId }) => {
    
    try {
      const response = await axios.post("http://localhost:3000/contacts-group", {
        tenantId,
        contactGroupId
      });

      // console.log("Contacts: " + JSON.stringify(response.data))

      return response.data;

    } catch (error) {
      console.log(error)
    }
  }
);


const contactsSlice = createSlice({
  name: 'contacts',
  initialState: {
    loading: false,
    error: null,
    contactsToPay: null,
    contactGroups: null,
  },
  reducers: {
    //
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchContactsToPay.fulfilled, (state, action) => { //
        state.contactsToPay = action.payload.contacts;
      })
      .addCase(fetchContactGroups.fulfilled, (state, action) => {
        state.contactGroups = action.payload.contactGroupsInfo;
      })
      .addCase(fetchContactGroups.rejected, (state, action) => {
        state.error = action.payload.error;
      })
      ;
  },
});

export default contactsSlice.reducer;