import React, { useState, useEffect } from 'react';

const Payments = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPaymentsData = async () => {
      try {
        const response = await fetch('http://localhost:3000/payments');
        const jsonData = await response.json();
        setData(jsonData);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching payments data:', error);
        setLoading(false);
      }
    };

    fetchPaymentsData();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!data) {
    return <div>Error fetching data</div>;
  }

  return (
    <div>
      <h1>Payments</h1>
      <p>Consent URL: {data.consentUrl}</p>
      <p>Authenticated: {data.authenticated ? 'Yes' : 'No'}</p>
      <p>Count: {data.count}</p>
      <p>New Payment: {data.newPayment}</p>
      <p>Get Payment: {data.getPayment}</p>
      <p>Payment Amount: {data.paymentAmount}</p>
    </div>
  );
};

export default Payments;