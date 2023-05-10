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
  'payments/fetchInvoiceDetails',
  async ({ tenantId, invoiceId }) => {
    const response = await axios.post("http://localhost:3000/invoice-to-pay", {
      tenantId,
      invoiceId
    });
    return response.data;
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
  async ({ tenantId, contactId }) => {
    const response = await axios.post("http://localhost:3000/invoices-to-pay", {
      tenantId,
      contactId
    });
    return response.data;
  }
);


const paymentsSlice = createSlice({
  name: 'payments',
  // initialState: {
  //   paymentsData: null,
  //   loading: false,
  //   error: null,
  // },
  initialState: {
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
        state.invoiceDetails = action.payload.invoiceInfo;
      });
  },
});


export default paymentsSlice.reducer;