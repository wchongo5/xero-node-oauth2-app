import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { fetchTaxRates, fetchTenants, fetchAccounts, fetchContactGroups, fetchContactsGroup } from "../redux/paymentsSlice";
import "./Invoices.css";

const Transactions = () => {
  const dispatch = useDispatch();
  const { paymentsData, loading, error } = useSelector((state) => state.payments);

  const [tenantIdList, setTenantIdList] = useState([]);
  const [selectedTenantId, setSelectedTenantId] = useState("");
  const [accountCodeList, setAccountCodeList] = useState([]);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10));
  const [contactGroupList, setContactGroupList] = useState([]);
  const [selectedContactGroupId, setSelectedContactGroupId] = useState("");
  const [contactsGroup, setContactsGroup] = useState([]);


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

  // useEffect(() => {
  //   if (selectedTenantId) {
  //     dispatch(fetchAccounts(selectedTenantId))
  //       .unwrap()
  //       .then((data) => {
  //         const accounts = data.accounts.map(({ code, name }) => [code, name]);
  //         setAccountCodeList(accounts);
  //       })
  //       .catch((error) => {
  //         console.error(error);
  //       });
  //     dispatch(fetchTaxRates(selectedTenantId));
  //   }
  // }, [selectedTenantId, dispatch]);

  // useEffect(() => {
  //   if (selectedTenantId) {
  //     dispatch(fetchContactGroups(selectedTenantId))
  //       .unwrap()
  //       .then((data) => {
  //         const contactGroups = data.contactGroupsInfo.map((group) => [group[0], group[1]]);
  //         setContactGroupList(contactGroups);
  //       })
  //       .catch((error) => {
  //         console.error(error);
  //       });
  //   }
  // }, [selectedTenantId, dispatch]);

  useEffect(() => {
    if (selectedTenantId) {
      dispatch(fetchAccounts(selectedTenantId))
        .unwrap()
        .then((data) => {
          const accounts = data.accounts.map(({ code, name }) => [code, name]);
          setAccountCodeList(accounts);
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
            <label>Cliente</label>
            <select className="custom-select" name="customerId">
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