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

  const contactsToPay = [
    ["Coop Q17"],
    ["Rosa Palate"],
    ["Fidalgo Coss"],
  ];

  const handleTenantIdChange = (event) => {
    localStorage.setItem("selectedTenantId", event.target.value); // Save selected tenantId to localStorage
    setSelectedTenantId(event.target.value); // Update the selected tenantId state
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
        <select
          name="tenantId"
          onChange={handleTenantIdChange}
          value={selectedTenantId}
        >
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
        <input type="date" name="startDate" />
        <br />

        <label>Customer:</label>
        <select name="customerName">
          {contactsToPay.map((customerName) => (
            <option key={customerName[0]} value={customerName[0]}>
              {customerName[0]}
            </option>
          ))}
        </select>
        <br />

        <label>Payment Reference:</label>
        <input type="text" name="paymentReference" />
        <br />

        <label>Payment Amount:</label>
        <input type="number" name="paymentAmount" />
        <br />

        <label>Payment Date:</label>
        <input type="date" name="paymentDate" />
        <br />

        <button type="submit">Submit</button>
      </form>

      {loading && <div>Loading...</div>}
      {error && <div>Error: {error}</div>}
      {paymentsData && (
        <div>
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
};

export default Payments;