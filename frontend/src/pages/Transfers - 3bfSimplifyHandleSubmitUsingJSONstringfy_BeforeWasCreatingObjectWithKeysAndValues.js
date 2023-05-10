import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { fetchTenants, submitBankTransfer } from '../redux/paymentsSlice';
import "./Invoices.css";

const Transfers = () => {

  const walletsAccountPersonTransferReceive = ["", "---------------", "Azaldo", "Melindo", "Tancya", "---------------", "Papai Muthuque", "Mano Emílio"]

  const [tenantIdList, setTenantIdList] = useState([]);
  const [accountCodeList, setAccountCodeList] = useState([]);
  const [selectedTenantId, setSelectedTenantId] = useState("");
  const [transferAmount, setTransferAmount] = useState(0);
  const [transferReference, setTransferReference] = useState("");
  const [transferDate, setTranferDate] = useState(new Date().toISOString().slice(0, 10));
  const [selectedBankAccount1, setSelectedBankAccount1] = useState("");
  const [selectedBankAccount2, setSelectedBankAccount2] = useState("");
  const [selectedWallet, setSelectedWallet] = useState("");
  const [transferReferenceExtra2, setTransferReferenceExtra2] = useState("");

  const dispatch = useDispatch();

  // const paymentsData = useSelector((state) => state.payments.paymentsData);
  const { paymentsData, loading, error } = useSelector((state) => state.payments);

  useEffect(() => {
    // Remove the fetchTenants function definition from here
    const storedTenants = localStorage.getItem("tenantIdList"); // Retrieve from localStorage
    if (storedTenants) {
      setTenantIdList(JSON.parse(storedTenants));
      setSelectedTenantId(localStorage.getItem("selectedTenantId"));
    } else {
      dispatch(fetchTenants()) // Dispatch the fetchTenants action
        .unwrap() // Unwrap the payload from the fulfilled action
        .then((data) => {
          const tenants = data.orgs.map(({ tenantId, tenantName }) => [
            tenantId,
            tenantName,
          ]);
          setTenantIdList(tenants);
          localStorage.setItem("tenantIdList", JSON.stringify(tenants)); // Save to localStorage
        })
        .catch((error) => {
          console.error(error);
        });
    }
  }, [dispatch]);

  useEffect(() => {
    if (selectedTenantId) {
      fetchAccounts(selectedTenantId);
    }
  }, [selectedTenantId]);

  useEffect(() => {
      if (selectedBankAccount1 && selectedBankAccount2) {
        const account1 = accountCodeList.find(([id]) => id === selectedBankAccount1);
        const account2 = accountCodeList.find(([id]) => id === selectedBankAccount2);
        const prefix = getPrefix(selectedTenantId);

        // " • " used X-DIM Banks, "-" used in X-DIM LDA Banks
        const account1Part = account1[1].split(" • ")[0].split("-")[0];
        const account2Part = account2[1].split(" • ")[0].split("-")[0];

        if (account2Part === "WALLET" && selectedWallet && !transferReferenceExtra2) {
          setTransferReference(`${prefix}${account1Part} - ${prefix}${account2Part} - ${selectedWallet}`);

        } else if (account2Part === "WALLET" && !selectedWallet && transferReferenceExtra2) {
          setTransferReference(`${prefix}${account1Part} - ${prefix}${account2Part} - ${transferReferenceExtra2}`);

        } else if (account2Part === "WALLET" && selectedWallet && transferReferenceExtra2) {
          setTransferReference(`${prefix}${account1Part} - ${prefix}${account2Part} - ${selectedWallet} - ${transferReferenceExtra2}`);

        } else {
          setTransferReference(`${prefix}${account1Part} - ${prefix}${account2Part}`);
        }
      }
    }, [selectedBankAccount1, selectedBankAccount2, accountCodeList, selectedTenantId, tenantIdList, selectedWallet, transferReferenceExtra2]);

  const fetchAccounts = async (tenantId) => {
    try {
      const response = await fetch(
        `http://localhost:3000/accounts?tenantId=${tenantId}`
      );
      const data = await response.json();
      const accounts = data.accounts.map(({ accountID, name }) => [accountID, name]);
      setAccountCodeList(accounts);

      // Initialize the selected bank accounts with the first bank account in the list.
      if (accounts.length > 0) {
        setSelectedBankAccount1(accounts[0][0]);
        setSelectedBankAccount2(accounts[0][0]);
      }
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

  const handleBankAccount1Change = (event) => {
    setSelectedBankAccount1(event.target.value);
  };

  const handleBankAccount2Change = (event) => {
    setSelectedBankAccount2(event.target.value);
  };

  const handleWalletChange = (event) => {
    setSelectedWallet(event.target.value);
  };

  const handleTransferReferenceExtra2Change = (event) => {
    setTransferReferenceExtra2(event.target.value);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    // const data = Object.fromEntries(formData.entries());

    // const transferData = {
    //   tenantId: data.tenantId,
    //   account1Id: data.bankAccountName1,
    //   account2Id: data.bankAccountName2,
    //   transferReference: data.transferReference,
    //   transferAmount: parseFloat(data.transferAmount),
    //   transferDate: data.transferDate,
    // };

    const transferData = JSON.stringify(Object.fromEntries(formData.entries()));

    dispatch(submitBankTransfer(transferData));



  };

  const getPrefix = (tenantId) => {
    const tenant = tenantIdList.find(([id]) => id === tenantId);
    if (tenant) {
      const tenantName = tenant[1];
      if (tenantName === "X-DIM") {
        return "W";
      } else if (tenantName === "X-DIM LDA") {
        return "X";
      }
    }
    return "";
  };

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
              <p>Valor transferido: {formatNumber(paymentsData.transferAmount)}</p>
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
          <select className="custom-select" name="account1Id" onChange={handleBankAccount1Change} value={selectedBankAccount1}>
            {accountCodeList.map((bankAccountName) => (
              <option key={bankAccountName[0]} value={bankAccountName[0]}>
                {bankAccountName[1]}
              </option>
            ))}
          </select>
        </div>

        <div className="form-control">
          <label>Conta Bancária 2 /// If Mpesa Code Auto Display Amount Tax & Auto Transaction</label>
          <select className="custom-select" name="account2Id" onChange={handleBankAccount2Change} value={selectedBankAccount2}>
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
          <label>Referência</label>
          <input
            type="text"
            name="transferReference"
            value={transferReference}
            readOnly
          />
        </div>

        {selectedBankAccount2 && accountCodeList.find(([id]) => id === selectedBankAccount2)[1].startsWith("WALLET") && (
          <div className="form-control">
            <label>Referência - Extra 1 - Destinário Wallet não Walter</label>
            <select className="custom-select" name="transferReferenceExtra1" onChange={handleWalletChange} value={selectedWallet}>
              {walletsAccountPersonTransferReceive.map((wallet, index) => (
                <option key={index} value={wallet}>
                  {wallet}
                </option>
              ))}
            </select>
          </div>
        )}

        {selectedBankAccount2 && accountCodeList.find(([id]) => id === selectedBankAccount2)[1].startsWith("WALLET") && (
          <div className="form-control">
            <label>Referência - Extra 2</label>
            <input
              type="text"
              name="transferReferenceExtra2"
              value={transferReferenceExtra2}
              onChange={handleTransferReferenceExtra2Change}
            />
          </div>
    
        )}

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