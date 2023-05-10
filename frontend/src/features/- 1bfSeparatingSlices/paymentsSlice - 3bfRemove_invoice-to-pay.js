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

export const submitBankTransfer = createAsyncThunk(
  'payments/submitBankTransfer',
  async (data) => {
    const response = await axios.post('http://localhost:3000/bank-transfers', data, {
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });
    return response.data;
  }
);

export const fetchTaxRates = createAsyncThunk(
  'payments/fetchTaxRates',
  async (tenantId) => {
    const response = await axios.get(`http://localhost:3000/tax-rates?tenantId=${tenantId}`);
    return response.data;
  }
);

export const fetchInvoiceDetails = createAsyncThunk(
  "payments/fetchInvoiceDetails",
  async ({ tenantId, invoiceId }, thunkAPI) => {
    try {
      const response = await fetch("http://localhost:3000/invoice-to-pay", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ tenantId, invoiceId }),
      });
      const data = await response.json();
      return data.invoiceInfo;
    } catch (error) {
      return thunkAPI.rejectWithValue(error);
    }
  }
);

export const fetchTenants = createAsyncThunk(
  'payments/fetchTenants',
  async () => {
    const response = await axios.get("http://localhost:3000/organisations");
    return response.data;
  }
);

export const fetchAccounts = createAsyncThunk(
  'payments/fetchAccounts',
  async (tenantId) => {
    const response = await axios.get(`http://localhost:3000/accounts?tenantId=${tenantId}`);
    return response.data;
  }
);

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


const paymentsSlice = createSlice({
  name: 'payments',
  // initialState: {
  //   paymentsData: null,
  //   loading: false,
  //   error: null,
  // },
  initialState: { // ACHO QUE O initialState ANTEROR PODE FUNCIONAR NAO PRECISA DE TUDO ISTO QUE ACRESCENTEI
    paymentsData: null,
    loading: false,
    error: null,
    taxRates: null,
    taxRatesError: null,
    tenants: null,
    accounts: null,
    contactsToPay: null,
    invoicesToPay: null,
    invoiceDetails: null,
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
    builder
      .addCase(submitBankTransfer.pending, (state) => {
        state.loading = true;
      })
      .addCase(submitBankTransfer.fulfilled, (state, action) => {
        state.loading = false;
        state.paymentsData = action.payload;
      })
      .addCase(submitBankTransfer.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
    builder
      .addCase(fetchTaxRates.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchTaxRates.fulfilled, (state, action) => {
        state.loading = false;
        state.taxRates = state.taxRates = action.payload.taxRates;
      })
      .addCase(fetchTaxRates.rejected, (state, action) => {
        state.loading = false;
        state.taxRatesError = action.error.message;
      });
    builder
      .addCase(fetchTenants.fulfilled, (state, action) => {
        state.tenants = action.payload.orgs;
      })
      .addCase(fetchAccounts.fulfilled, (state, action) => {
        state.accounts = action.payload.accounts;
      })
      .addCase(fetchContactsToPay.fulfilled, (state, action) => {
        state.contactsToPay = action.payload.contacts;
      })
      .addCase(fetchInvoicesToPay.fulfilled, (state, action) => {
        state.invoicesToPay = action.payload.invoices;
      })
      .addCase(fetchInvoiceDetails.fulfilled, (state, action) => {
        // state.invoiceDetails = action.payload.invoiceInfo;
         state.invoiceDetails = action.payload;
      })
      .addCase(fetchInvoiceDetails.rejected, (state, action) => {
        state.error = action.payload;
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

export default paymentsSlice.reducer;