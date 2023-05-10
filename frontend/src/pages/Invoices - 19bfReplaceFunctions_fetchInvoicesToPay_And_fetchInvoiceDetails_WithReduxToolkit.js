import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { fetchTenants, fetchAccounts, fetchContactsToPay, fetchPayments } from "../redux/paymentsSlice";
import "./Invoices.css";

const Invoices = () => {
  
  const invoiceType = [[`Type=="ACCREC"`, `Cliente`], [`Type=="ACCPAY"`, "Fornecedor"], ["undefined", "Todas"]]
  
  const dispatch = useDispatch();
  const {paymentsData, loading, error} = useSelector((state) => state.payments);

  const [tenantIdList, setTenantIdList] = useState([]);
  const [accountCodeList, setAccountCodeList] = useState([]);
  const [selectedTenantId, setSelectedTenantId] = useState("");

  console.log(selectedTenantId)

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
  const [paymentReference, setPaymentReference] = useState("");
  const [selectedInvoiceType, setSelectedInvoiceType] = useState(invoiceType[2][0]);

  useEffect(() => {
    dispatch(fetchTenants())
      .then(({ payload }) => {
        const tenants = payload.orgs.map(({ tenantId, tenantName }) => [
          tenantId,
          tenantName,
        ]);
        setTenantIdList(tenants);

        // Set the selectedTenantId to the first tenant in the list if it's not set
        if (!selectedTenantId && tenants.length > 0) {
          setSelectedTenantId(tenants[0][0]);
        }
      })
      .catch((error) => {
        console.error(error);
      });
  }, [dispatch, selectedTenantId]);

  useEffect(() => {
    if (selectedTenantId) {
      fetchAccounts(selectedTenantId);
    }
  }, [selectedTenantId, dispatch]); // Add selectedTenantId here

  useEffect(() => {
    if (invoiceDetails) {
      setPaymentAmount(invoiceDetails[2]);
    }
  }, [invoiceDetails]);

  useEffect(() => {
    if (selectedTenantId) {
      dispatch(fetchAccounts(selectedTenantId))
        .then(({ payload }) => {
          const accounts = payload.accounts.map(({ code, name }) => [code, name]);
          setAccountCodeList(accounts);
        })
        .catch((error) => {
          console.error(error);
        });
    }
  }, [selectedTenantId, dispatch]);

  useEffect(() => {
    if (selectedTenantId && startDate) {
      dispatch(fetchContactsToPay({ tenantId: selectedTenantId, startDate, invoiceType: selectedInvoiceType }))
        .unwrap()
        .then((data) => {
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
        })
        .catch((error) => {
          console.error(error);
        });
    }
  }, [selectedTenantId, startDate, selectedInvoiceType, dispatch]);

  useEffect(() => {
    if (selectedTenantId && startDate) {
      fetchContactsToPay(selectedTenantId, startDate, selectedInvoiceType);
    }
  }, [selectedTenantId, startDate, selectedInvoiceType]);

  useEffect(() => {
    if (contactsToPay.length > 0) {
      const firstContactId = contactsToPay[0][0];
      handleCustomerChange({ target: { value: firstContactId } });
    }
  }, [selectedInvoiceType]);

  // Clear contactsToPay when tenantId changes
  useEffect(() => {
    setContactsToPay([]);
  }, [selectedTenantId]);

  useEffect(() => {
    if (invoiceDetails) {
      setPaymentAmount(invoiceDetails[3]);
    }
  }, [invoiceDetails]);

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

    localStorage.setItem("selectedCustomerName", event.target.value); // Save selected customer name to localStorage
  };

  const handleInvoiceChange = (event) => {
    setSelectedInvoice(event.target.value);
    console.log("Selected invoice:", event.target.value); // Add this line
    fetchInvoiceDetails(selectedTenantId, event.target.value);
  };

  const handlePaymentAmountChange = (event) => {
    setPaymentAmount(event.target.value);
  };

  const handleInvoiceTypeChange = (event) => {
    setSelectedInvoiceType(event.target.value);
  };

  const formatNumber = (number) => {
    return new Intl.NumberFormat(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(number);
  };

  const getLabel = () => {
    if (selectedInvoiceType === 'Type=="ACCREC"') {
      return "Cliente";
    } else if (selectedInvoiceType === 'Type=="ACCPAY"') {
      return "Fornecedor";
    } else {
      return "Cliente/Fornecedor";
    }
  };

  const getInvoiceLabel = (invoiceType) => {
    if (invoiceType === "ACCREC") {
      return "Cliente";
    } else if (invoiceType === "ACCPAY") {
      return "Fornecedor";
    }
  };

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

      // Clear paymentReference
      setPaymentReference("");
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
      <h1>Facturas — Pagamentos</h1>

      {loading && (
        <div className="payments-control">
          <p>Processando...</p>
        </div>
      )}

      {error && (
        <div className="payments-control">
          <p>Error: {error}</p>
        </div>
      )}

      {!loading && paymentsData && (
        <div className="payments-control">
          <div>
            <>
              <p>Valor pago: {formatNumber(paymentsData.paymentAmount)}</p>
            </>
          </div>
        </div>
      )}

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
          <label>Tipo</label>
          <select className="custom-select" name="invoiceType" value={selectedInvoiceType} onChange={handleInvoiceTypeChange}>
            {invoiceType.map((type) => (
              <option key={type[0]} value={type[0]}>
                {type[1]}
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
          <label>Data - início do filtro de facturas</label>
          <input type="date" name="startDate" value={startDate} onChange={handleStartDateChange} />
        </div>

        <div className="form-control">
          <label>{getLabel()}</label>
          <select className="custom-select" name="customerName" onChange={handleCustomerChange}>
            {contactsToPay.map((customer) => (
              <option key={customer[0]} value={customer[0]}>
                {customer[1]}
              </option>
            ))}
          </select>
        </div>

        <div className="form-control">
          <label>Número</label>
          <select className="custom-select" name="invoice" onChange={handleInvoiceChange}>
            {invoicesToPay.map((invoice) => (
              <option key={invoice[0]} value={invoice[0]}>
                {invoice[1]}
              </option>
            ))}
          </select>
        </div>

        {invoiceDetails && (
          <div className="form-control-finance">
            <label>Factura - situação financeira</label>
            <div>

              {selectedInvoiceType === "undefined" && (
                <div>Tipo de factura: {getInvoiceLabel(invoiceDetails[0])}</div>
              )}

              <div>Total: {formatNumber(invoiceDetails[1])}</div>
              <div>
                Pagamentos: {formatNumber(sumPayments(invoiceDetails[2]))}
                {invoiceDetails[2]
                  .sort((a, b) => new Date(a.date) - new Date(b.date))
                  .map((payment, index) => (
                    <div key={index}>
                      {new Date(payment.date).toLocaleDateString()} - {formatNumber(payment.amount)}
                    </div>
                  ))}
              </div>
              <div>Remanescente: {formatNumber(invoiceDetails[3])}</div>
            </div>
          </div>
        )}

        <div className="form-control">
          <label>Valor - pagamento</label>
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
          <label>Referência (Make A dropdown list - maybe more than 1)</label>
          <input
            type="text"
            name="paymentReference"
            value={paymentReference}
            onChange={(event) => setPaymentReference(event.target.value)}
          />
        </div>


        <div className="form-control">
          <label>Data - pagamento</label>
          <input
            type="date"
            name="paymentDate"
            value={paymentDate}
            onChange={(event) => setPaymentDate(event.target.value)}
          />
        </div>

        <div className="form-control">
          <button disabled={loading} className="submitButton" type="submit">Submit Payment</button>
        </div>
      </form>
   </div>
   );
};

export default Invoices;