import React, { useState, useEffect } from "react";
import axios from "axios";

const Payments = () => { // Era PaymentsComponent
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [paymentsData, setPaymentsData] = useState(null);

  useEffect(() => {
      const fetchData = async () => {
        try {
          const response = await axios.get("http://localhost:3000/payments", {
            headers: {
              "Accept": "application/json"
            }
          });

          console.log(response);

          if (response.status !== 200) {
            throw new Error(`HTTP error ${response.status}`);
          }

          const data = response.data;

          // console.log(data);

          setPaymentsData(data);
          setLoading(false);
        } catch (e) {
          setError(e.message);
          setLoading(false);
        }
      };

      fetchData();
    }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div>
      <h1>Payments</h1>
      <p>Count: {paymentsData.count}</p>
      <p>New Payment: {paymentsData.newPayment}</p>
      <p>Get Payment: {paymentsData.getPayment}</p>
      <p>Payment Amount: {paymentsData.paymentAmount}</p>
    </div>
  );
};

export default Payments; // Era PaymentsComponent