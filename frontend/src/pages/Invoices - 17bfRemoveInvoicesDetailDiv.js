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
  const [startDate, setStartDate] = useState(getMonthsAgo());
  const [contactsToPay, setContactsToPay] = useState([]);
  const [invoicesToPay, setInvoicesToPay] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState("");
  const [invoiceDetails, setInvoiceDetails] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10));

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

  useEffect(() => {
    if (invoiceDetails) {
      setPaymentAmount(invoiceDetails[2]);
    }
  }, [invoiceDetails]);

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
      const fetchedContactsToPay = data.contacts.map(
        (contact) => [contact[0], contact[1]]
      );
      setContactsToPay(fetchedContactsToPay);

      // Fetch invoices for the first contact in the list
      if (fetchedContactsToPay.length > 0) {
        const firstContactId = fetchedContactsToPay[0][0];
        handleCustomerChange({ target: { value: firstContactId } });
      } else {
        // Clear the invoice details and selected invoice state when there are no contacts
        setInvoiceDetails(null);
        setSelectedInvoice("");
      }
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
      return data.invoices.map((invoice) => [invoice[0], invoice[1]]);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchInvoiceDetails = async (tenantId, invoiceId) => {
    try {
      const response = await fetch("http://localhost:3000/invoice-to-pay", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ tenantId, invoiceId }),
      });
      const data = await response.json();

      console.log("Invoice details data:", data);
      console.log("Invoice details from server:", data.invoiceInfo); // Add this line

      setInvoiceDetails(data.invoiceInfo);
    } catch (error) {
      console.error(error);
    }
  };

  const handleTenantIdChange = (event) => {
    localStorage.setItem("selectedTenantId", event.target.value); // Save selected tenantId to localStorage
    setSelectedTenantId(event.target.value); // Update the selected tenantId state
    setContactsToPay([]); // Clear contactsToPay when tenantId changes
    setInvoiceDetails(null); // Clear the invoice details when tenantId changes
  };


  const handleStartDateChange = (event) => {
    setStartDate(event.target.value);
  };

  const handleCustomerChange = async (event) => {
    const contactId = event.target.value;
    const fetchedInvoicesToPay = await fetchInvoicesToPay(selectedTenantId, contactId); // Fetch invoices for the selected customer

    setInvoicesToPay(fetchedInvoicesToPay);

    // Fetch details for the default selected invoice
    if (fetchedInvoicesToPay.length > 0) {
      const defaultInvoiceId = fetchedInvoicesToPay[0][0]; // Get the first invoice ID
      setSelectedInvoice(defaultInvoiceId); // Update the selected invoice state
      fetchInvoiceDetails(selectedTenantId, defaultInvoiceId);
    } else {
      // Clear the invoice details and selected invoice state when there are no invoices
      setInvoiceDetails(null);
      setSelectedInvoice("");
    }
  };

  const handleInvoiceChange = (event) => {
    setSelectedInvoice(event.target.value);
    console.log("Selected invoice:", event.target.value); // Add this line
    fetchInvoiceDetails(selectedTenantId, event.target.value);
  };

  const handlePaymentAmountChange = (event) => {
    setPaymentAmount(event.target.value);
  };

  // const handleSubmit = async (event) => {
  //   event.preventDefault();
  //   const formData = new FormData(event.target);
  //   const data = JSON.stringify(Object.fromEntries(formData.entries()));
  //   dispatch(fetchPayments(data));
  // };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    const data = JSON.stringify(Object.fromEntries(formData.entries()));

    try {
      // Wait for the action to complete
      await dispatch(fetchPayments(data)).unwrap();

      // Update invoice details
      if (selectedInvoice) {
        fetchInvoiceDetails(selectedTenantId, selectedInvoice);
      }
    } catch (error) {
      console.error('Error submitting payment:', error);
    }
  };




  const sumPayments = (payments) => {
    return payments.reduce((accumulator, payment) => accumulator + payment.amount, 0);
  };

  console.log("Invoice details state:", invoiceDetails); // Add this line

   return (
   <div>
      <h1>Payments</h1>

      <div className="payments-control">
        {loading && <p>Loading...</p>}
        {error && <p>Error: {error}</p>}
        {paymentsData && (
          <div>
          <h2>Pagamento</h2>
          <>
              {/* <p>Count: {paymentsData.count}</p> */}
              {/* <p>New Payment: {paymentsData.newPayment}</p> */}
              <p>Cliente: {paymentsData.getPayment}</p>
              <p>Valor: {paymentsData.paymentAmount}</p>
          </>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-control">
          <label>Empresa</label>
          <select className="custom-select" name="tenantId" onChange={handleTenantIdChange} value={selectedTenantId}>
            {tenantIdList.map((tenantId) => (
              <option key={tenantId[0]} value={tenantId[0]}>
                {tenantId[1]}
              </option>
            ))}
          </select>
        </div>

        <div className="form-control">
          <label>Conta Bancária</label>
          <select className="custom-select" name="bankAccountName">
            {accountCodeList.map((bankAccountName) => (
              <option key={bankAccountName[0]} value={bankAccountName[0]}>
                {bankAccountName[1]}
              </option>
            ))}
          </select>
        </div>

        <div className="form-control">
          <label>Data — Início do filtro de facturas</label>
          <input type="date" name="startDate" value={startDate} onChange={handleStartDateChange} />
        </div>

        <div className="form-control">
          <label>Cliente</label>
          <select className="custom-select" name="customerName" onChange={handleCustomerChange}>
            {contactsToPay.map((customer) => (
              <option key={customer[0]} value={customer[0]}>
                {customer[1]}
              </option>
            ))}
          </select>
        </div>

        <div className="form-control">
          <label>Facturas</label>
          <select className="custom-select" name="invoice" onChange={handleInvoiceChange}>
            {invoicesToPay.map((invoice) => (
              <option key={invoice[0]} value={invoice[0]}>
                {invoice[1]}
              </option>
            ))}
          </select>
        </div>

        {invoiceDetails && (
          <div className="form-control">
            <label>Factura - Situação financeira</label>
            <div>
              <div>Total: {invoiceDetails[0]}</div>
              <div>
                Pagamentos: {sumPayments(invoiceDetails[1])}
                {invoiceDetails[1].map((payment, index) => (
                  <div key={index}>
                    {new Date(payment.date).toLocaleDateString()} - {payment.amount}
                  </div>
                ))}
              </div>
              <div>Remanescente: {invoiceDetails[2]}</div>
            </div>
          </div>
        )}

        <div className="form-control">
          <label>Payment Amount:</label>
          <input
            type="number"
            name="paymentAmount"
            step="0.01"
            min="0"
            value={paymentAmount}
            onChange={handlePaymentAmountChange}
          />
        </div>

        <div className="form-control">
          <label>Payment Reference:</label>
          <input type="text" name="paymentReference" />
        </div>

        <div className="form-control">
          <label>Payment Date:</label>
          <input
            type="date"
            name="paymentDate"
            value={paymentDate}
            onChange={(event) => setPaymentDate(event.target.value)}
          />
        </div>

        <div className="form-control">
          <button type="submit">Submit Payment</button>
        </div>
      </form>

      {/* {loading && <p>Loading...</p>}
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
      )} */}
   </div>
   );
};

export default Payments;