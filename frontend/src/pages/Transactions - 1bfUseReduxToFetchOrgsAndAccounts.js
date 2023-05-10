import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { fetchTaxRates } from "../redux/paymentsSlice";
import "./Invoices.css";
// import { isPending } from "@reduxjs/toolkit";

const Transactions = () => {
    
  const dispatch = useDispatch();
  const {paymentsData, loading, error} = useSelector((state) => state.payments);

  const [tenantIdList, setTenantIdList] = useState([]);
  const [accountCodeList, setAccountCodeList] = useState([]);
  const [selectedTenantId, setSelectedTenantId] = useState("");
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10));
  const [lineName, setLineName] = useState("");

  const taxRates = useSelector((state) => state.payments.taxRates) || [];
  console.log('taxRates:', taxRates);

  const [taxName, setTaxName] = useState('');

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
      // Call both fetchAccounts and fetchTaxRates functions
      fetchAccounts(selectedTenantId);
      dispatch(fetchTaxRates(selectedTenantId));
    }
  }, [selectedTenantId, dispatch]); // Add dispatch to the dependency array, as it's used inside the hook


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

  const handleTenantIdChange = (event) => {
    localStorage.setItem("selectedTenantId", event.target.value); // Save selected tenantId to localStorage
    setSelectedTenantId(event.target.value); // Update the selected tenantId state
  };

  const handlePaymentAmountChange = (event) => {
    setPaymentAmount(event.target.value);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    const data = JSON.stringify(Object.fromEntries(formData.entries()));
  };

  const formatNumber = (number) => {
    return new Intl.NumberFormat(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(number);
  };

  const sumPayments = (payments) => {
    return payments.reduce((accumulator, payment) => accumulator + payment.amount, 0);
  };


   return (
   <div>
      <h1>Transacções</h1>

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
          <label>Imposto</label>
          <select
            className="custom-select"
            name="taxName"
            value={taxName}
            onChange={(e) => setTaxName(e.target.value)}
          >
            <option value="" disabled>
              Select tax
            </option>
            {taxRates.map((taxRate) => (
              <option key={taxRate.taxType} value={`${taxRate.taxType}`}>
                {taxRate.name} ({taxRate.taxType})
              </option>
            ))}
          </select>
        </div>

        <div className="form-control">
          <label>Cliente</label>
          <select className="custom-select" name="customerName">
          </select>
        </div>

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
          <label>Line name</label>
          <input
            type="text"
            name="lineName"
            value={lineName}
            onChange={(event) => setLineName(event.target.value)}
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
          <button disabled={loading} className="submitButton" type="submit">Submit Transaction</button>
        </div>
      </form>
   </div>
   );
};

export default Transactions;