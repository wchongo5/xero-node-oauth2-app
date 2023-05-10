import React from "react";
import { useSelector, useDispatch } from "react-redux";
// import { fetchPayments } from "../redux/paymentsSlice";
import { fetchPayments } from '../redux/paymentsSlice';
import "./payments.css";

const Payments = () => {
  const dispatch = useDispatch();
  const paymentsData = useSelector((state) => state.payments.paymentsData);
  const loading = useSelector((state) => state.payments.loading);
  const error = useSelector((state) => state.payments.error);

  const tenantIdList = [["33b67fb1-e1c6-414c-bc39-c4305af2146f", "X-DIM"], ["89a7e972-1cbb-441a-a98d-00f101c5dd8f", "X-DIM LDA"]];
  const accountCodeList = [["B01", "WALLET"], ["B05", "BIM1"], ["B06", "BIm2"]];
  const invoiceNumberList = [["XDWFPU221001", "Coop Q17"], ["XDWFAP231001", "Rosa Palate"], ["XDWFAP230901", "Fidalgo Coss"]];

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
        <select name="tenantId">
          {tenantIdList.map((tenantId) => (
            <option key={tenantId[0]} value={tenantId[0]}>
              {tenantId[1]}
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

        <label>Invoice Number:</label>
        <select name="invoiceNumber">
          {invoiceNumberList.map((invoiceNumber) => (
            <option key={invoiceNumber[0]} value={invoiceNumber[0]}>
              {invoiceNumber[1]}
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