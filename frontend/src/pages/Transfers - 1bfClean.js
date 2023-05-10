import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { submitBankTransfer } from '../redux/paymentsSlice';
import "./Invoices.css";



const Transfers = () => {

  const [tenantIdList, setTenantIdList] = useState([]);
  const [accountCodeList, setAccountCodeList] = useState([]);
  const [selectedTenantId, setSelectedTenantId] = useState("");
   const [transferAmount, setTransferAmount] = useState(0);
   const [transferReference, setTransferReference] = useState("");
   const [transferDate, setTranferDate] = useState(new Date().toISOString().slice(0, 10));

  const dispatch = useDispatch();

  // const paymentsData = useSelector((state) => state.payments.paymentsData);
  const { paymentsData, loading, error } = useSelector((state) => state.payments);

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
      const accounts = data.accounts.map(({ accountID, name }) => [accountID, name]);
      setAccountCodeList(accounts);
    } catch (error) {
      console.error(error);
    }
  };

  const handleTenantIdChange = (event) => {
    localStorage.setItem("selectedTenantId", event.target.value); // Save selected tenantId to localStorage
    setSelectedTenantId(event.target.value); // Update the selected tenantId state
  };

  const formatNumber = (number) => {
    return new Intl.NumberFormat(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(number);
  };

  const handleTransferAmountChange = (event) => {
    setTransferAmount(event.target.value);
  };

  // const handleSubmit = (event) => {
  //   event.preventDefault();
  //   const formData = new FormData(event.target);
  //   const data = Object.fromEntries(formData.entries());
  //   dispatch(submitBankTransfer(data));
  // };

  const handleSubmit = (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    const data = Object.fromEntries(formData.entries());

    const transferData = {
      tenantId: data.tenantId,
      account1Id: data.bankAccountName1,
      account2Id: data.bankAccountName2,
      transferReference: data.transferReference,
      transferAmount: parseFloat(data.transferAmount),
      transferDate: data.transferDate,
    };

    dispatch(submitBankTransfer(transferData));
  };


  // const handleSubmit = async (event) => {
  //   event.preventDefault();
  //   const formData = new FormData(event.target);
  //   const data = Object.fromEntries(formData.entries());
  //   // dispatch(submitBankTransfer(data));

  //   try {
  //     await dispatch(submitBankTransfer(data)).unwrap();

  //   } catch (error) {
  //     console.error('Error submitting payment:', error);
  //   }
  // };


   return (
   <div>
      <h1>Transferências</h1>

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
              <p>Valor transferido: {formatNumber(paymentsData.paymentAmount)}</p>
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
          <label>Conta Bancária 1</label>
          <select className="custom-select" name="bankAccountName1">
            {accountCodeList.map((bankAccountName) => (
              <option key={bankAccountName[0]} value={bankAccountName[0]}>
                {bankAccountName[1]}
              </option>
            ))}
          </select>
        </div>

        <div className="form-control">
          <label>Conta Bancária 2</label>
          <select className="custom-select" name="bankAccountName2">
            {accountCodeList.map((bankAccountName) => (
              <option key={bankAccountName[0]} value={bankAccountName[0]}>
                {bankAccountName[1]}
              </option>
            ))}
          </select>
        </div>

        <div className="form-control">
          <label>Valor - pagamento</label>
          <input
            type="number"
            name="transferAmount"
            step="0.01"
            min="0"
            value={transferAmount}
            onChange={handleTransferAmountChange}
          />
        </div>

        <div className="form-control">
          <label>Referência (Make automatic)</label>
          <input
            type="text"
            name="transferReference"
            value={transferReference}
            onChange={(event) => setTransferReference(event.target.value)}
          />
        </div>


        <div className="form-control">
          <label>Data</label>
          <input
            type="date"
            name="transferDate"
            value={transferDate}
            onChange={(event) => setTranferDate(event.target.value)}
          />
        </div>

        <div className="form-control">
          <button className="submitButton" type="submit">Submit Transfer</button>
        </div>
      </form>
   </div>
   );
};

export default Transfers;