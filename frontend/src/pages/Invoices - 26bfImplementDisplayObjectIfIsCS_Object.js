import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { fetchTenants, fetchAccounts, fetchContactsToPay, fetchPayments, fetchInvoicesToPay, fetchInvoiceDetails } from "../redux/paymentsSlice";
import "./Invoices.css";

// ----- XD5
// import { getCSs } from '../../../../LibraryNodeXD5/project_lib.js';
import { getCSs } from 'LibraryNodeXD5/project_lib/project_lib.js';

const Invoices = () => {

  /* // NOTES
  // CONSIDERAR:
  --- DONE
  consultancyCateg
  
  --- NOT YET
  if is ACCREC or ACCPAY - options are diferentes
  if (isConsultancyCS) {
  walletAccountPersonInvoicePayReceive
  invoiceIdentifier
  Functions: invoiceUpdate and updateInvoicePAndCFolderName
  Check all form invoice payment

  // 100 invoices limitatons
  // AFTER PAYMENT DOES NOT SHOW CUSTOMERS In "Todas" OPTION
  // FIX THIS WITH 100 IMVOICES LIMITATIONS BREAK

  */
  
  const consultancyObjects = ["Casa da Cultura", "Monumento de Magul", "---------------", "Condomínio", "Muro de Vedação", "Residências Geminadas", "Residência Unifamiliar", "Residência Unifamiliar (Anexo)", "---------------", "Casa de Veraneio", "Centro de Acampamento", "Complexo Turístico", "---------------", "Complexo Comercial", "Lojas", "Lojas & Pensão", "---------------", "Escola", "Escritórios", "Estrutura de Reservatórios de Água", "Salão de Culto"];

  const paymentTypes = ["Banco", "Cheque", "Dinheiro", "Mpesa", "ContaMovel", "EMola"];
  const invoiceType = [[`Type=="ACCREC"`, `Cliente`], [`Type=="ACCPAY"`, "Fornecedor"], ["undefined", "Todas"]];

  
  const dispatch = useDispatch();
  // const {paymentsData, loading, error} = useSelector((state) => state.payments);
  const { paymentsData, invoiceDetails, loading, error } = useSelector((state) => state.payments);

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
  const [selectedInvoiceId, setSelectedInvoiceId] = useState("");
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10));
  const [paymentReference, setPaymentReference] = useState(consultancyObjects[0] + " / " + paymentTypes[0]);
  const [selectedInvoiceType, setSelectedInvoiceIdType] = useState(invoiceType[2][0]);

  const [consultancyObject, setConsultancyObject] = useState(consultancyObjects[0]);
  const [paymentType, setPaymentType] = useState(paymentTypes[0]);

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
      // fetchAccounts(selectedTenantId);
      dispatch(fetchAccounts(selectedTenantId));
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
            dispatch(fetchInvoiceDetails(null));
            setSelectedInvoiceId("");
          }
        })
        .catch((error) => {
          console.error(error);
        });
    }
  }, [selectedTenantId, startDate, selectedInvoiceType, dispatch]);


  // 🔴🔴🔴 USEFUL BELOW?!!
  useEffect(() => {
    if (selectedTenantId && startDate) {
      dispatch(fetchContactsToPay({ tenantId: selectedTenantId, startDate, invoiceType: selectedInvoiceType }))
        .unwrap()
        .then((data) => {
          // ...
        })
        .catch((error) => {
          console.error(error);
        });
    }
  }, [selectedTenantId, startDate, selectedInvoiceType, dispatch]);

  useEffect(() => {
    if (selectedTenantId && startDate) {
      dispatch(fetchContactsToPay({ tenantId: selectedTenantId, startDate, invoiceType: selectedInvoiceType }));
    }
  }, [selectedTenantId, startDate, selectedInvoiceType, dispatch]);

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

  const handleTenantIdChange = (event) => {
    localStorage.setItem("selectedTenantId", event.target.value); // Save selected tenantId to localStorage
    setSelectedTenantId(event.target.value); // Update the selected tenantId state
    setContactsToPay([]); // Clear contactsToPay when tenantId changes
    dispatch(fetchInvoiceDetails(null)); // Clear the invoice details when tenantId changes
  };

  const handleStartDateChange = (event) => {
    setStartDate(event.target.value);
  };

  // const handleConsultancyObjectChange = (event) => {
  //   setConsultancyObject(event.target.value);
  //   setPaymentReference(event.target.value + " / " + paymentType);
  // };

  const handleConsultancyObjectChange = (event) => {
    setConsultancyObject(event.target.value);
    setPaymentReference(generatePaymentReference(invoicesToPay[0]?.invoiceNumber || "", event.target.value, paymentType));
  };

  // const handlePaymentTypeChange = (event) => {
  //   setPaymentType(event.target.value);
  //   setPaymentReference(consultancyObject + " / " + event.target.value);
  // };

  const handlePaymentTypeChange = (event) => {
    setPaymentType(event.target.value);
    setPaymentReference(generatePaymentReference(invoicesToPay[0]?.invoiceNumber || "", consultancyObject, event.target.value));
  };

  const handleCustomerChange = (event) => {
    const contactId = event.target.value;
    dispatch(fetchInvoicesToPay({ tenantId: selectedTenantId, startDate, contactId })) // Dispatch the fetchInvoicesToPay action
      .unwrap()
      .then((fetchedInvoicesToPay) => {

        // fetchedInvoicesToPay.sort((a, b) => new Date(a.date) - new Date(b.date));

        fetchedInvoicesToPay.sort((a, b) => {
          const aDate = new Date(a.date);
          const bDate = new Date(b.date);

          // Compare only the year, month, and day parts of the date
          const aDateString = aDate.toISOString().slice(0, 10);
          const bDateString = bDate.toISOString().slice(0, 10);
          const dateComparison = new Date(aDateString) - new Date(bDateString);

          // If the dates are equal, compare the invoice numbers with proper alphanumeric ordering
          if (dateComparison === 0) {
            return a.invoiceNumber.localeCompare(b.invoiceNumber, undefined, { numeric: true });
          }

          // Otherwise, return the date comparison result
          return dateComparison;
        });

        setInvoicesToPay(fetchedInvoicesToPay);

        if (fetchedInvoicesToPay.length > 0) {
          const defaultInvoiceId = fetchedInvoicesToPay[0].invoiceID; // Get the first invoice ID
          setSelectedInvoiceId(defaultInvoiceId); // Update the selected invoice state
          dispatch(fetchInvoiceDetails({ tenantId: selectedTenantId, invoiceId: defaultInvoiceId }));

          const defaultInvoiceNumber = fetchedInvoicesToPay[0].invoiceNumber;
          setPaymentReference(generatePaymentReference(defaultInvoiceNumber, consultancyObject, paymentType));

        } else {
          // Clear the invoice details and selected invoice state when there are no invoices
          dispatch(fetchInvoiceDetails(null)); // Clear the invoice details when tenantId changes
          setSelectedInvoiceId('');
          setPaymentReference("");
        }

        localStorage.setItem('selectedCustomerName', event.target.value); // Save selected customer name to localStorage
      })
      .catch((error) => {
        console.error(error);
      });
  };

  const handleInvoiceChange = (event) => {
    setSelectedInvoiceId(event.target.value);
    const invoiceNumber = event.target.options[event.target.selectedIndex].text.split(" ")[0];
    setPaymentReference(generatePaymentReference(invoiceNumber, consultancyObject, paymentType));
    dispatch(fetchInvoiceDetails({ tenantId: selectedTenantId, invoiceId: event.target.value }));
  };

  const handlePaymentAmountChange = (event) => {
    setPaymentAmount(event.target.value);
  };

  const handleInvoiceTypeChange = (event) => {
    setSelectedInvoiceIdType(event.target.value);
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

  const sumPayments = (payments) => {
    return payments.reduce((accumulator, payment) => accumulator + payment.amount, 0);
  };

  const formatNumber = (number) => {
    return new Intl.NumberFormat(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(number);
  };

  const getReferencePart = (invoice) => {
    if (invoice.reference) {

      if (invoice.reference.includes(" - ")) {
        return " — " + invoice.reference.split(" - ")[1];
      
      } else {
        return " — " + invoice.reference
      }

    } else {
      return "";
    }
  };

  const generatePaymentReference = (invoiceNumber, consultancyObject, paymentType) => {

    const invoiceCSs = getCSs(invoiceNumber);

    if (invoiceCSs) {
      console.log("Found CS: " + invoiceCSs);

      var consultancyCateg = `X${invoiceNumber.slice(3,6)}5 `
    
    } else {
      console.log("No Found CS");

      var consultancyCateg = ``
    }
    

    // return invoiceNumber + " " + consultancyObject + " / " + paymentType;
    return  consultancyCateg + consultancyObject + " / " + paymentType;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    const data = JSON.stringify(Object.fromEntries(formData.entries()));

    try {
      // Wait for the action to complete
      await dispatch(fetchPayments(data)).unwrap();

      // Update invoice details
      if (selectedInvoiceId) {
        fetchInvoiceDetails(selectedTenantId, selectedInvoiceId);
      }

      // Clear paymentReference
      setPaymentReference("");
    } catch (error) {
      console.error('Error submitting payment:', error);
    }
  };

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
            {contactsToPay
              .sort((a, b) => a[1].localeCompare(b[1]))
              .map((customer) => (
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
              <option key={invoice.invoiceID} value={invoice.invoiceID}>
                {invoice.invoiceNumber + getReferencePart(invoice)}
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
                  .slice() // slice() - creates a new - should prevent the error caused by attempting to assign to a readonly property.
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
        
        {/* XFAP5 Residência Unifamiliar / Banco */}
        <div className="form-control">
          <label>Referência</label>
          <input
            type="text"
            name="paymentReference"
            value={paymentReference}
            // readOnly
            onChange={(event) => setPaymentReference(event.target.value)}
          />
        </div>

        <div className="form-control">
          <label>Objecto de consultoria</label>
          <select className="custom-select" name="consultancyObject" onChange={handleConsultancyObjectChange}>
            {consultancyObjects.map((object, index) => (
                <option key={index} value={object}>
                  {object}
                </option>
              ))}
            </select>
        </div>

        
        <div className="form-control">
          <label>Via de Pagamento</label>
          <select className="custom-select" name="paymentType" onChange={handlePaymentTypeChange}>
            {paymentTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
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