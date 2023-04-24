import React, { useState } from "react";
import axios from "axios";
import "./payments.css";

const Payments = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [paymentsData, setPaymentsData] = useState(null);

  const invoiceNumberList = [["XDWFPU221001", "Coop Q17"], ["XDWFAP231001", "Rosa Palate"], ["XDWFAP230901", "Fidalgo Coss"]];
  const accountCodeList = [["B01", "WALLET"], ["B05", "BIM1"], ["B06", "BIm2"]];
  const tenantIdList = [["33b67fb1-e1c6-414c-bc39-c4305af2146f", "X-DIM"], ["ID02", "X-DIM LDA"]];

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData(event.target);

      const response = await axios.get("http://localhost:3000/payments", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Accept: "application/json",
        },
      });

      console.log(response);

      if (response.status !== 200) {
        throw new Error(`HTTP error ${response.status}`);
      }

      const data = response.data;

      console.log(data);

      setPaymentsData(data);
      setLoading(false);
    } catch (e) {
      setError(e.message);
      setLoading(false);
    }
  };

  return (
    <div>
      <h1>Payments</h1>
      <form onSubmit={handleSubmit}>
        <label>Tenant ID:</label>
        <select name="tenantId">
          {tenantIdList.map((tenantId) => (
            <option key={tenantId[0]} value={tenantId[0]}>
              {tenantId[1]}
            </option>
          ))}
        </select>
        <br />

        <label>Invoice Number:</label>
        <select name="invoiceNumber">
          {invoiceNumberList.map((invoiceNumber) => (
            <option key={invoiceNumber[0]} value={invoiceNumber[0]}>
              {invoiceNumber[1]}
            </option>
          ))}
        </select>
        <br />

        <label>Account Code:</label>
        <select name="accountCode">
          {accountCodeList.map((accountCode) => (
            <option key={accountCode[0]} value={accountCode[0]}>
              {accountCode[1]}
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