import { Request, Response } from "express";
import {
  BankTransaction,
  BankTransactions,
  BankTransfer,
  BankTransfers,
  LineItem, 
} from "xero-node";
import { xero } from "./xeroClient";

export async function bankTransfers(req: Request, res: Response) {
  try {

    const {
      tenantId,
      account1Id,
      account2Id,
      transferReference,
      transferAmount,
      transferDate,
    } = req.body;

    const bankTransfer: BankTransfer = {
      fromBankAccount: {
        accountID: account1Id,
      },
      toBankAccount: {
        accountID: account2Id,
      },
      reference: transferReference,
      date: transferDate,
      amount: parseFloat(transferAmount),
    };

    const bankTransfers: BankTransfers = { bankTransfers: [bankTransfer] };
    const createBankTransfer = await xero.accountingApi.createBankTransfer(
      tenantId,
      bankTransfers
    );
    const getBankTransfer = await xero.accountingApi.getBankTransfer(
      tenantId,
      createBankTransfer.body.bankTransfers[0].bankTransferID
    );

    res.json({
      consentUrl: await xero.buildConsentUrl(),
      createBankTransferId: createBankTransfer.body.bankTransfers[0].bankTransferID,
      getBankTransferId: getBankTransfer.body.bankTransfers[0].bankTransferID,
      transferAmount: parseFloat(transferAmount),
    });
  } catch (e) {
    res.status(res.statusCode);
    res.json({
      consentUrl: await xero.buildConsentUrl(),
      error: e,
    });
  }
};

export async function bankTransactions(req: Request, res: Response) {
  try {

    // Transactions: {"tenantId":"33b67fb1-e1c6-414c-bc39-c4305af2146f","transactionType":"\"SPEND\"","accountBankCode":"B01","groupId":"afb93bc3-3d71-4f61-a10c-eaac506523c3","contactId":"84021a7f-5068-4c8d-80b1-193a062f4da6","lineDescription":"","taxName":"INPUT","transactionAmount":"5","transactionDate":"2023-05-07"}

    const {
      tenantId,
      bankAccountId,
      accountCode, // 🔴🔴🔴 Code in form
      contactId,
      transactionType,
      lineDescription,
      transactionAmount,
      transactionDate,
    } = req.body;

    console.log("Transactions: " + JSON.stringify(req.body))

    const formattedPaymentDate = new Date(transactionDate).toISOString().slice(0, 10);

    // contactID // Make dropdown list
    const useContact = {
      contactID: contactId, // Replace with the appropriate contactID
    };

    const lineItems: LineItem[] = [
      {
        description: lineDescription, //"consulting",
        quantity: 1.0,
        unitAmount: Number(transactionAmount),
        accountCode: accountCode,
      },
    ];

    // accountID
    const useBankAccount = {
      accountID: bankAccountId, //"", // Replace with the appropriate accountID
    };

    // Determine the transaction type based on the request body property 'transactionType'
    const transactionTypeFormatted = transactionType === 'RECEIVE'
      ? BankTransaction.TypeEnum.RECEIVE
      : BankTransaction.TypeEnum.SPEND;

    const newBankTransaction = {
      type: transactionTypeFormatted,
      contact: useContact,
      lineItems,
      bankAccount: useBankAccount,
      date: formattedPaymentDate,
    };

    // Add bank transaction objects to array
    const newBankTransactions = new BankTransactions();
    newBankTransactions.bankTransactions = [newBankTransaction];
    const bankTransactionCreateResponse = await xero.accountingApi.createBankTransactions(
      tenantId,
      newBankTransactions,
      false
    );

    res.json({
      consentUrl: await xero.buildConsentUrl(),
      transactionAmount: bankTransactionCreateResponse.body.bankTransactions[0].total,
    });
  } catch (e) {
    console.error(e);
    res.status(res.statusCode);
    res.json({
      consentUrl: await xero.buildConsentUrl(),
      error: e,
    });
  }
};