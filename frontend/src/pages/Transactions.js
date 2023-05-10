import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";

import { fetchTenants } from "../features/tenants/tenantsSlice";
import { submitBankTransaction } from "../features/payments/paymentsSlice";
import { fetchContactGroups } from "../features/contacts/contactsSlice"
import { fetchContactsGroup } from "../features/contacts/contactsSlice"
import { fetchAccountsBank } from "../features/accounts/accountsSlice"

import { fetchTaxRates } from "../features/taxRates/taxRatesSlice";
import "./Invoices.css";

const Transactions = () => {

  const transactionTypes = [[`"RECEIVE"`, `Receive`], [`"SPEND"`, "Spend"]];

  const dispatch = useDispatch();
  const { transactionData, loading, error } = useSelector((state) => state.payments);

  const [tenantIdList, setTenantIdList] = useState([]);
  const [selectedTenantId, setSelectedTenantId] = useState("");
  const [accountCodeList, setAccountCodeList] = useState([]);
  const [transactionAmount, setTransactionAmount] = useState(0);
  const [transactionDate, setTransactionDate] = useState(new Date().toISOString().slice(0, 10));
  const [contactGroupList, setContactGroupList] = useState([]);
  const [selectedContactGroupId, setSelectedContactGroupId] = useState("");
  const [contactsGroup, setContactsGroup] = useState([]);
  const [selectedTransactionType, setSelectedTransactionIdType] = useState(transactionTypes[1][0]);


  const [lineDescription, setLineDescription] = useState("");
  const [lineDescription1, setLineDescription1] = useState("");
  const [lineDescription2, setLineDescription2] = useState("");
  
  const taxRates = useSelector((state) => state.payments.taxRates) || [];

  const [taxName, setTaxName] = useState("");

  useEffect(() => {
    const storedTenants = localStorage.getItem("tenantIdList"); // Retrieve from localStorage
    if (storedTenants) {
      setTenantIdList(JSON.parse(storedTenants));
      setSelectedTenantId(localStorage.getItem("selectedTenantId"));
    } else {
      dispatch(fetchTenants())
        .unwrap()
        .then((data) => {
          const tenants = data.orgs.map(({ tenantId, tenantName }) => [
            tenantId,
            tenantName,
          ]);
          setTenantIdList(tenants);
          localStorage.setItem("tenantIdList", JSON.stringify(tenants));
        })
        .catch((error) => {
          console.error(error);
        });
    }
  }, [dispatch]);

  useEffect(() => {
    if (selectedTenantId) {
      dispatch(fetchAccountsBank(selectedTenantId))
        .unwrap()
        .then((payload) => {
          setAccountCodeList(payload.accounts);
        })
        .catch((error) => {
          console.error(error);
        });
      dispatch(fetchTaxRates(selectedTenantId));

      dispatch(fetchContactGroups(selectedTenantId))
        .unwrap()
        .then((data) => {
          const contactGroups = data.contactGroupsInfo.map((group) => [group[0], group[1]]);
          setContactGroupList(contactGroups);

          // I added this to show contacts of first group
          if (contactGroups.length > 0) {
            // Set the selected contact group ID to the first contact group
            setSelectedContactGroupId(contactGroups[0][0]);

            // TRANSACTIONSXD5NOTE01
            // I commented below, because i know that if I change selectedContactGroupId it will run the funtion dispatch(fetchContactsGroup({tenantId: selectedTenantId, contactGroupId: selectedContactGroupId})) since selectedContactGroupId is dependency in that function. Era processo duplicado e desnecessário, visto que não usava os resultados do dispach.

            // VER EM OUTROS CODE SE NÃO TEM ESTE TIPO DE ERROR

            /*
            // Fetch contacts for the first contact group
            dispatch(fetchContactsGroup({ tenantId: selectedTenantId, contactGroupId: contactGroups[0][0] }));
            */
          }

        })
        .catch((error) => {
          console.error(error);
        });
    }
  }, [selectedTenantId, dispatch]);

  useEffect(() => {
    if (selectedContactGroupId) {
      dispatch(fetchContactsGroup({tenantId: selectedTenantId, contactGroupId: selectedContactGroupId}))
        .unwrap()
        .then((data) => {
          // const accounts = data.accounts.map(({ code, name }) => [code, name]);
          setContactsGroup(data.contacts);
        })
        .catch((error) => {
          console.error(error);
        });
    }
  }, [selectedContactGroupId, dispatch]);



  const handleTenantIdChange = (event) => {
    localStorage.setItem("selectedTenantId", event.target.value); // Save selected tenantId to localStorage
    setSelectedTenantId(event.target.value); // Update the selected tenantId state
  };

  const handleContactGroupIdChange = (event) => {
    setSelectedContactGroupId(event.target.value);
  };

  const handleTransactionAmountChange = (event) => {
    setTransactionAmount(event.target.value);
  };

  const handleTransactionTypeChange = (event) => {
    setSelectedTransactionIdType(event.target.value);
  };

  const formatNumber = (number) => {
    return new Intl.NumberFormat(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(number);
  };

  // const sumPayments = (payments) => {
  //   return payments.reduce((accumulator, payment) => accumulator + payment.amount, 0);
  // };

  const handleSubmit = (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    const transferData = JSON.stringify(Object.fromEntries(formData.entries()));
    dispatch(submitBankTransaction(transferData));
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

        {!loading && transactionData && (
          <div className="payments-control">
            <div>
              <>
                <p>Valor pago: {formatNumber(transactionData.transactionAmount)}</p>
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
            <select className="custom-select" name="transactionType" value={selectedTransactionType} onChange={handleTransactionTypeChange}>
              {transactionTypes.map((transactionType) => (
                <option key={transactionType[0]} value={transactionType[0]}>
                  {transactionType[1]}
                </option>
              ))}
            </select>
          </div>

          {/* <div className="form-control">
            <label>Conta Bancária</label>
            <select className="custom-select" name="accountBankCode">
              {accountCodeList.map((bankAccountName) => (
                <option key={bankAccountName[0]} value={bankAccountName[0]}>
                  {bankAccountName[1]}
                </option>
              ))}
            </select>
          </div> */}

          <div className="form-control">
            <label>Conta Bancária</label>
            <select className="custom-select" name="bankAccountId">
              {accountCodeList.map((bankAccount) => (
                <option key={bankAccount.accountID} value={bankAccount.accountID}>
                  {bankAccount.name}
                </option>
              ))}
            </select>
          </div>

           <div className="form-control">
            <label>Grupo</label>
            <select className="custom-select" name="groupId" onChange={handleContactGroupIdChange} value={selectedContactGroupId}>
              {contactGroupList.map((contactGroup) => (
                <option key={contactGroup[0]} value={contactGroup[0]}>
                  {contactGroup[1]}
                </option>
              ))}
            </select>
          </div>

          <div className="form-control">
            <label>Cliente/Fornecedor</label>
            <select className="custom-select" name="contactId">
              {contactsGroup.map((contact) => (
                <option key={contact.contactID} value={contact.contactID}>
                  {contact.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-control">
            <label>Descrição</label>
            <input
              type="text"
              name="lineDescription"
              value={lineDescription}
              onChange={(event) => setLineDescription(event.target.value)}
            />
          </div>

          <div className="form-control">
            <label>Descrição - Linha 1</label>
            <select className="custom-select" name="lineDescription1">
            </select>
          </div>

          <div className="form-control">
            <label>Descrição - Linha 2</label>
            <select className="custom-select" name="lineDescription2">
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
            <label>Valor - transacção</label>
            <input
              type="number"
              name="transactionAmount"
              step="0.01"
              min="0"
              value={transactionAmount}
              onChange={handleTransactionAmountChange}
            />
          </div>

          <div className="form-control">
            <label>Data - transacção</label>
            <input
              type="date"
              name="transactionDate"
              value={transactionDate}
              onChange={(event) => setTransactionDate(event.target.value)}
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