import { configureStore } from '@reduxjs/toolkit';

import accountsReducer from '../features/accounts/accountsSlice'
import contactsReducer from '../features/contacts/contactsSlice'
import invoicesReducer from '../features/invoices/invoicesSlice'
import paymentsReducer from '../features/payments/paymentsSlice';
import taxRatesReducer from '../features/taxRates/taxRatesSlice'
import tenantsReducer from '../features/tenants/tenantsSlice'

export const store = configureStore({
  reducer: {
    accounts: accountsReducer,
    contacts: contactsReducer,
    invoices: invoicesReducer,
    payments: paymentsReducer,
    taxRates: taxRatesReducer,
    tenants: tenantsReducer,
  },
});