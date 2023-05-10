


import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { fetchPayments } from "../redux/paymentsSlice";
import "./payments.css";

const Payments = () => {
  const dispatch = useDispatch();
  const paymentsData = useSelector((state) => state.payments.paymentsData);
  const loading = useSelector((state) => state.payments.loading);
  const error = useSelector((state) => state.payments.error);

  const [tenantIdList, setTenantIdList] = useState([]);
  const [accountCodeList, setAccountCodeList] = useState([]);
  const [selectedTenantId, setSelectedTenantId] = useState("");

   const getMonthsAgo = () => {
    const date = new Date();
    date.setMonth(date.getMonth() - 6);
    return date.toISOString().slice(0, 10);
  };
  const [startDate, setStartDate] = useState(getMonthsAgo()); // "2023-01-01"
  const [contactsToPay, setContactsToPay] = useState([]);
  const [invoicesToPay, setInvoicesToPay] = useState([]);

  useEffect(() => {
    const fetchTenants = async () => {
      try {
        const response = await fetch("http://localhost:3000/organisations");
        const data = await response.json();
        const tenants = data.orgs.map(({ tenantId, tenantName }) => [
          tenantId,
          tenantName,
        ]);
        setTenantIdList(tenants);
      } catch (error) {
        console.error(error);
      }
    };
    const storedTenants = localStorage.getItem("tenantIdList"); // Retrieve from localStorage
    if (storedTenants) {
      setTenantIdList(JSON.parse(storedTenants));
      setSelectedTenantId(localStorage.getItem("selectedTenantId"));
    } else {
      fetchTenants();
    }
  }, []);

  useEffect(() => {
    if (selectedTenantId) {
      fetchAccounts(selectedTenantId);
    }
  }, [selectedTenantId]);

  const fetchAccounts = async (tenantId) => {
    try {
      const response = await fetch(
        `http://localhost:3000/accounts?tenantId=${tenantId}`
      );
      const data = await response.json();
      const accounts = data.accounts.map(({ code, name }) => [code, name]);
      setAccountCodeList(accounts);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchContactsToPay = async (tenantId, startDate) => {
    try {
      const response = await fetch("http://localhost:3000/contacts-to-pay", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ tenantId, startDate }),
      });
      const data = await response.json();

      console.log("Contacts to pay data:", data);

      setContactsToPay(data.contacts.map((contact) => [contact[0], contact[1]]));
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (selectedTenantId && startDate) {
      fetchContactsToPay(selectedTenantId, startDate);
    }
  }, [selectedTenantId, startDate]);

  // Clear contactsToPay when tenantId changes
  useEffect(() => {
    setContactsToPay([]);
  }, [selectedTenantId]);

  const fetchInvoicesToPay = async (tenantId, contactId) => {
    try {
      const response = await fetch("http://localhost:3000/invoices-to-pay", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ tenantId, contactId }),
      });
      const data = await response.json();
      // setInvoicesToPay(data.contacts.map((invoice) => [invoice[0], invoice[1]]));
      setInvoicesToPay(data.invoices.map((invoice) => [invoice[0], invoice[1]]));
    } catch (error) {
      console.error(error);
    }
  };

  const handleTenantIdChange = (event) => {
    localStorage.setItem("selectedTenantId", event.target.value); // Save selected tenantId to localStorage
    setSelectedTenantId(event.target.value); // Update the selected tenantId state
    setContactsToPay([]); // Clear contactsToPay when tenantId changes
  };


  const handleStartDateChange = (event) => {
    setStartDate(event.target.value);
  };

  const handleCustomerChange = (event) => {
    fetchInvoicesToPay(selectedTenantId, event.target.value);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    const data = JSON.stringify(Object.fromEntries(formData.entries()));
    dispatch(fetchPayments(data));
  };

   return (
   <div>
      <h1>Payments</h1>
      <form onSubmit={handleSubmit}>
         <label>Tenant ID:</label>
         <select name="tenantId" onChange={handleTenantIdChange} value={selectedTenantId}>
         {tenantIdList.map((tenantId) => (
            <option key={tenantId[0]} value={tenantId[0]}>
               {tenantId[1]}
            </option>
         ))}
         </select>
         <br />

         <label>Bank Account Name:</label>
         <select name="bankAccountName">
         {accountCodeList.map((bankAccountName) => (
            <option key={bankAccountName[0]} value={bankAccountName[0]}>
               {bankAccountName[1]}
            </option>
         ))}
         </select>
         <br />

         <label>Start Date:</label>
         <input type="date" name="startDate" value={startDate} onChange={handleStartDateChange} />
         <br />

         <label>Customer:</label>
         <select name="customerName" onChange={handleCustomerChange}>
         {contactsToPay.map((customer) => (
            <option key={customer[0]} value={customer[0]}>
               {customer[1]}
            </option>
         ))}
         </select>
         <br />

         {/* <label>{invoicesToPay[0][0]}</label> */}
         <br />

         <label>Invoices</label>
         <select name="invoice">
         {invoicesToPay.map((invoice) => (
            <option key={invoice[0]} value={invoice[0]}>
               {invoice[1]}
            </option>
         ))}
         </select>
         <br />

         <label>Invoice Details</label>
         <br />

         <label>Payment Amount:</label>
         <input type="number" name="paymentAmount" step="0.01" min="0" />
         <br />

         <label>Payment Reference:</label>
         <input type="text" name="paymentReference" />
         <br />

         <label>Payment Date:</label>
         <input type="date" name="paymentDate" />
         <br />

         <button type="submit">Submit Payment</button>
      </form>

      {loading && <p>Loading...</p>}
      {error && <p>Error: {error}</p>}
      {paymentsData && (
         <div>
         <h2>Payments List</h2>
         <>
            <p>Count: {paymentsData.count}</p>
            <p>New Payment: {paymentsData.newPayment}</p>
            <p>Get Payment: {paymentsData.getPayment}</p>
            <p>Payment Amount: {paymentsData.paymentAmount}</p>
         </>
         </div>
      )}
   </div>
   );
}

export default Payments;