import { Request, Response } from "express";
import {
  Account,
  AccountType,
  BankTransaction,
  BankTransactions,
  BankTransfer,
  BankTransfers,
  Contact,
  Invoice,
  Invoices,
  LineItem, 
  Payments,
  TokenSetParameters,
  XeroAccessToken,
  XeroClient,
  XeroIdToken,
} from "xero-node";
import jwtDecode from 'jwt-decode';
import { xero } from "./xeroClient";
import { verifyWebhookEventSignature, authenticationData } from "./helpers";
// import formidable from 
// import formidable from 'formidable';
import axios from "axios";
import moment from 'moment';
import { group } from "console";
import { stringify } from "querystring";

const client_id = process.env.CLIENT_ID;
const client_secret = process.env.CLIENT_SECRET;
/*
COMPANY INFO
X-DIM
const tenantId = "33b67fb1-e1c6-414c-bc39-c4305af2146f"
const tenantName = "X-DIM"


X-DIM LDA
const tenantId = "89a7e972-1cbb-441a-a98d-00f101c5dd8f"
const tenantName = "X-DIM LDA"

*/


// Xero start or before to include ALL. 🔴🔴🔴 Undefined raises error
// const ifModifiedSinceDate = `2015/01/01`


export async function home(req: Request, res: Response) {
  
  try {
    if (req.session.tokenSet) {
      await xero.setTokenSet(req.session.tokenSet)
      // xero.setTokenSet(req.session.tokenSet)
      await xero.updateTenants(false)
    }
    const authData = authenticationData(req, res)

    res.render("home", {
      consentUrl: await xero.buildConsentUrl(),
      authenticated: authData,
      // accessToken: req.session.tokenSet ? req.session.tokenSet.access_token : null, // Pass the access token to the client
    });
  } catch (e) {
    res.status(res.statusCode);
    res.render("shared/error", {
      consentUrl: await xero.buildConsentUrl(),
      error: e
    });
  }
}

export async function callback(req: Request, res: Response) {
  try {
    // calling apiCallback will setup all the client with
    // and return the orgData of each authorized tenant
    const tokenSet: TokenSetParameters = await xero.apiCallback(req.url);
    await xero.updateTenants(false)

    console.log('xero.config.state: ', xero.config.state)

    // this is where you can associate & save your
    // `tokenSet` to a user in your Database
    req.session.tokenSet = tokenSet
    if (tokenSet.id_token) {
      const decodedIdToken: XeroIdToken = jwtDecode(tokenSet.id_token)
      req.session.decodedIdToken = decodedIdToken
    }
    const decodedAccessToken: XeroAccessToken = jwtDecode(tokenSet.access_token)
    req.session.decodedAccessToken = decodedAccessToken
    req.session.tokenSet = tokenSet
    req.session.allTenants = xero.tenants
    req.session.activeTenant = xero.tenants[0]

    // res.json( {
    res.render("callback", {
      consentUrl: await xero.buildConsentUrl(),
      authenticated: authenticationData(req, res)
    });
  } catch (e) {
    res.status(res.statusCode);
    // res.json( {
    res.render("shared/error", {
      consentUrl: await xero.buildConsentUrl(),
      error: e
    });
  }
}

// Created by ChatGPT. Useful for future.
// Not avalible in original functions
// Exported but not used
export async function connect(_req: Request, res: Response) {
  try {
    const consentUrl = await xero.buildConsentUrl();
    res.redirect(consentUrl);
  } catch (err) {
    console.log("Error: ", err);
    res.render("error", { err: err.message });
  }
}

export async function changeOrganisation(req: Request, res: Response) {
  try {
    const activeOrgId = req.body.active_org_id
    const picked = xero.tenants.filter((tenant) => tenant.tenantId == activeOrgId)[0]
    req.session.activeTenant = picked
    const authData = authenticationData(req, res)

    res.render("home", {
      consentUrl: await xero.buildConsentUrl(),
      authenticated: authenticationData(req, res)
    });
  } catch (e) {
    res.status(res.statusCode);
    res.render("shared/error", {
      consentUrl: await xero.buildConsentUrl(),
      error: e
    });
  }
}

export async function refreshToken(req: Request, res: Response) {
  try {
    const tokenSet = await xero.readTokenSet();
    console.log('tokenSet.expires_in: ', tokenSet.expires_in, ' seconds')
    console.log('tokenSet.expires_at: ', tokenSet.expires_at, ' milliseconds')
    console.log('Readable expiration: ', new Date(tokenSet.expires_at * 1000).toLocaleString())
    console.log('tokenSet.expired(): ', tokenSet.expired());

    if (tokenSet.expired()) {
      console.log('tokenSet is currently expired: ', tokenSet)
    } else {
      console.log('tokenSet is not expired: ', tokenSet)
    }

    // you can refresh the token using the fully initialized client levereging openid-client
    await xero.refreshToken()

    // or if you already generated a tokenSet and have a valid (< 60 days refresh token),
    // you can initialize an empty client and refresh by passing the client, secret, and refresh_token
    const newXeroClient = new XeroClient()
    const newTokenSet = await newXeroClient.refreshWithRefreshToken(client_id, client_secret, tokenSet.refresh_token)
    const decodedIdToken: XeroIdToken = jwtDecode(newTokenSet.id_token);
    const decodedAccessToken: XeroAccessToken = jwtDecode(newTokenSet.access_token)

    req.session.decodedIdToken = decodedIdToken
    req.session.decodedAccessToken = decodedAccessToken
    req.session.tokenSet = newTokenSet
    req.session.allTenants = xero.tenants
    req.session.activeTenant = xero.tenants[0]

    const authData = authenticationData(req, res)

    res.render("home", {
      consentUrl: await xero.buildConsentUrl(),
      authenticated: authenticationData(req, res)
    });
  } catch (e) {
    res.status(res.statusCode);
    res.render("shared/error", {
      consentUrl: await xero.buildConsentUrl(),
      error: e
    });
  }
}

export async function disconnect(req: Request, res: Response) {
  try {
    const updatedTokenSet: TokenSetParameters = await xero.disconnect(req.session.activeTenant.id)
    await xero.updateTenants(false)

    if (xero.tenants.length > 0) {
      const decodedIdToken: XeroIdToken = jwtDecode(updatedTokenSet.id_token);
      const decodedAccessToken: XeroAccessToken = jwtDecode(updatedTokenSet.access_token)
      req.session.decodedIdToken = decodedIdToken
      req.session.decodedAccessToken = decodedAccessToken
      req.session.tokenSet = updatedTokenSet
      req.session.allTenants = xero.tenants
      req.session.activeTenant = xero.tenants[0]
    } else {
      req.session.decodedIdToken = undefined
      req.session.decodedAccessToken = undefined
      req.session.allTenants = undefined
      req.session.activeTenant = undefined
    }
    const authData = authenticationData(req, res)

    res.render("home", {
      consentUrl: await xero.buildConsentUrl(),
      authenticated: authData
    });
  } catch (e) {
    res.status(res.statusCode);
    res.render("shared/error", {
      consentUrl: await xero.buildConsentUrl(),
      error: e
    });
  }
}

export async function revokeToken(req: Request, res: Response) {
  try {
    await xero.revokeToken();
    req.session.decodedIdToken = undefined
    req.session.decodedAccessToken = undefined
    req.session.tokenSet = undefined
    req.session.allTenants = undefined
    req.session.activeTenant = undefined

    res.render("home", {
      consentUrl: await xero.buildConsentUrl(),
      authenticated: authenticationData(req, res)
    });
  } catch (e) {
    res.status(res.statusCode);
    res.render("shared/error", {
      consentUrl: await xero.buildConsentUrl(),
      error: e
    });
  }
}

export async function webhooks(req: Request, res: Response) {
   console.log("webhook event received!", req.headers, req.body, JSON.parse(req.body));
  verifyWebhookEventSignature(req) ? res.status(200).send() : res.status(401).send();
}

// export async function getAccessToken(req: Request, res: Response) {
//   try {
//     if (req.session.tokenSet) {
//       res.status(200).json({ access_token: req.session.tokenSet.access_token });
//     } else {
//       throw new Error('Not authenticated');
//     }
//   } catch (error) {
//     res.status(401).json({ error: error.message });
//   }
// }




// export async function organisation(req: Request, res: Response) {
//   try {

//     var tenantId = "33b67fb1-e1c6-414c-bc39-c4305af2146f"

//     //GET ALL
//     const getOrganizationsResponse = await xero.accountingApi.getOrganisations(tenantId);

//     res.status(200).json({
//       consentUrl: await xero.buildConsentUrl(),
//       // authenticated: this.authenticationData(req, res),
//       orgs: getOrganizationsResponse.body.organisations
//     });

//   } catch (e) {
//     res.status(res.statusCode);
//     res.json({
//       consentUrl: await xero.buildConsentUrl(),
//       error: e
//     });
//   }
// };

export async function organisations(req: Request, res: Response) {
  try {

    const allOrganisations = xero.tenants

    res.status(200).json({
      consentUrl: await xero.buildConsentUrl(),
      orgs: allOrganisations
    });

  } catch (e) {
    res.status(res.statusCode);
    res.json({
      consentUrl: await xero.buildConsentUrl(),
      error: e
    });
  }
};

// export async function accounts(req: Request, res: Response) {

//   var tenantId = "33b67fb1-e1c6-414c-bc39-c4305af2146f"

//   try {
    
//     const where = 'Status=="' + Account.StatusEnum.ACTIVE + '" AND Type=="' + Account.BankAccountTypeEnum.BANK + '"';
//     const accountsGetResponse = await xero.accountingApi.getAccounts(tenantId, null, where);

//     res.json({
//       consentUrl: await xero.buildConsentUrl(),
//       accounts: accountsGetResponse.body.accounts,
//     });
//   } catch (e) {
//     res.status(res.statusCode);
//     res.json({
//       consentUrl: await xero.buildConsentUrl(),
//       error: e
//     });
//   }
// }

export async function accounts(req: Request, res: Response) {
  try {
    const tenantId = req.query.tenantId as string;

    if (!tenantId) {
      res.status(400);
      res.json({ error: "Missing tenantId query parameter" });
      return;
    }

    const where =
      'Status=="' +
      Account.StatusEnum.ACTIVE +
      '" AND Type=="' +
      Account.BankAccountTypeEnum.BANK +
      '"';
    const accountsGetResponse = await xero.accountingApi.getAccounts(
      tenantId,
      null,
      where
    );

    res.json({
      consentUrl: await xero.buildConsentUrl(),
      accounts: accountsGetResponse.body.accounts,
    });
  } catch (e) {
    res.status(res.statusCode);
    res.json({
      consentUrl: await xero.buildConsentUrl(),
      error: e,
    });
  }
}

export async function accounts_test(req: Request, res: Response) {
  try {
    // const tenantId = req.query.tenantId as string;
    const tenantId = "33b67fb1-e1c6-414c-bc39-c4305af2146f"

    if (!tenantId) {
      res.status(400);
      res.json({ error: "Missing tenantId query parameter" });
      return;
    }

    const where =
      'Status=="' +
      Account.StatusEnum.ACTIVE +
      '" AND Type=="' +
      Account.BankAccountTypeEnum.BANK +
      '"';
    const accountsGetResponse = await xero.accountingApi.getAccounts(
      tenantId,
      null,
      where
    );

    res.json({
      consentUrl: await xero.buildConsentUrl(),
      accounts: accountsGetResponse.body.accounts,
    });
  } catch (e) {
    res.status(res.statusCode);
    res.json({
      consentUrl: await xero.buildConsentUrl(),
      error: e,
    });
  }
}

export async function contactsToPayByInvoices(req: Request, res: Response) {
  try {
    var { invoiceType, tenantId, startDate } = req.body;

    if (invoiceType == "undefined") {
      var invoiceType = undefined
    }

    const [yyyy, mm, dd] = startDate.split("-")
    const ifModifiedSinceDate = `${yyyy}/${mm}/01`

    try {
      const invoices = await xero.accountingApi.getInvoices(
        tenantId,
        new Date(ifModifiedSinceDate),
        invoiceType, // undefined, //
        undefined,
        undefined,
        undefined,
        undefined,
        ['AUTHORISED'],
        0,
        false,
        false,
        4,
        true,
        {
          headers: {
            'contentType': 'application/json',
          },
        }
      );

      const startDateMoment = moment(startDate);

      const filteredInvoices = invoices.body.invoices.filter((invoice) => {
        const invoiceDateMoment = moment(invoice.date);
        return invoiceDateMoment.isSameOrAfter(startDateMoment);
      });

      const contactsToPay = [];
      for (let i = 0; i < filteredInvoices.length; i++) {
        const contact = filteredInvoices[i].contact;
        const contactInfo = [contact.contactID, contact.name];

        if (!contactsToPay.toString().includes(contactInfo[1])) {
          contactsToPay.push(contactInfo);
        }
      }

      res.json({
        consentUrl: await xero.buildConsentUrl(),
        contacts: contactsToPay,
      });

    } catch (error) {
      console.log(error);
    }

  } catch (e) {
    res.setHeader("Content-Type", "application/json");
    res.status(res.statusCode);
    res.json({
      error: e.message,
      consentUrl: await xero.buildConsentUrl(),
    });
  }
}

export async function invoicesToPayByContact(req: Request, res: Response) {

  try {

    const { contactId, startDate, tenantId } = req.body;

    // -------
    const recordsPerPage = 100;
    let currentPage = 1;
    let totalPages = 0;
    let invoices: Invoice[] = [];

    try {

      while (true) {
        // const result = await xero.accountingApi.getInvoices(xero.tenants[0].tenantId, { page: currentPage });
        
        const result = await xero.accountingApi.getInvoices(
          tenantId,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          [contactId],
          ['AUTHORISED'],
          currentPage, //0,
          false,
          false,
          4,
          false, //true,
          {
            headers: {
              'contentType': 'application/json',
            },
          }
        );

        const currentPageInvoices = result.body.invoices;

        if (currentPageInvoices.length === recordsPerPage) {
          totalPages++;
          currentPage++;
          invoices = invoices.concat(currentPageInvoices);
        } else {
          totalPages++;
          invoices = invoices.concat(currentPageInvoices);
          break;
        }
      }
      
      const startDateMoment = moment(startDate);

      const filteredInvoices = invoices.filter((invoice) => {
        const invoiceDateMoment = moment(invoice.date);
        return invoiceDateMoment.isSameOrAfter(startDateMoment);
      });

      res.json({
        consentUrl: await xero.buildConsentUrl(),
        invoices: filteredInvoices //invoices.body.invoices,
      });

    } catch (error) {
      console.log(error);
    }

  } catch (e) {
    res.setHeader("Content-Type", "application/json");
    res.status(res.statusCode);
    res.json({
      error: e.message,
      consentUrl: await xero.buildConsentUrl(),
    });
  }

}

let isProcessingPayment = false;

export async function invoicePay(req: Request, res: Response) {
  try {
    // If a payment is already being processed, return an error response.
    if (isProcessingPayment) {
      return res.status(409).json({ error: 'A payment is already being processed. Please try again later.' });
    }

    // Set the flag to indicate a payment is being processed.
    isProcessingPayment = true;

    // const data = req.body;

    // // const invoiceNumber = data.invoiceNumber;
    // const invoiceId = data.invoice;
    // var tenantId = data.tenantId 
    // const accountCode = data.bankAccountName;
    // const paymentDate = new Date(data.paymentDate);
    // const formattedPaymentDate = paymentDate.toISOString().slice(0, 10);
    // var paymentReference = data.paymentReference
    // var amountNum = Number(data.paymentAmount) //1010

    console.log("FormData: " + JSON.stringify(req.body))

    const {
      tenantId,
      invoiceId,
      accountCode,
      paymentDate,
      paymentReference,
      paymentAmount
    } = req.body

    const formattedPaymentDate = new Date(paymentDate).toISOString().slice(0, 10);

    //GET ALL
    const getPaymentsResponse = await xero.accountingApi.getPayments(tenantId);

    try {

      const invoices = await xero.accountingApi.getInvoices(
        tenantId, //req.session.activeTenant.tenantId, // xeroTenantId: string        
        undefined, //ew Date(ifModifiedSinceDate), // undefined, (not accepted) // ifModifiedSince?: Date
        undefined, //'Type=="ACCREC"', // where?: string
        
        undefined, // order?: string // 'reference DESC'
        [invoiceId], //undefined, // iDs?: string[]            
        undefined, //[invoiceNumber], // undefined// invoiceNumbers?: string[]
        undefined, // contactIDs?: string[]
        undefined, //['AUTHORISED'], // statuses?: string[] // ['AUTHORISED', 'PAID', 'DRAFT']
        0, // page?: number            
        false, // includeArchived?: boolean
        false, // createdByMyApp?: boolean
        4, // unitdp?: number // It stands for "Unit Decimal Places" and specifies the number of decimal places to use for the unit amount on the invoice line items.            
        true, // summaryOnly?: boolean / false if you need payments listing
        {
          headers: {
            'contentType': 'application/json'
          }
        }
      )

      // const invoices2 = invoices.body.invoices[0]
      // var invoiceIDFound = invoices2.invoiceID
      var invoiceIDFound = invoices.body.invoices[0].invoiceID

    } catch (error) {
      console.log(error);
    }

    const payments: Payments = {
      payments: [
        {
          invoice: {
            invoiceID: invoiceIDFound
          },
          account: {
            code: accountCode
          },
          date: formattedPaymentDate, //yyyy__mm__dd, //"2020-03-12",
          amount: Number(paymentAmount),
          reference: paymentReference
        },
      ]
    };
    
    const createPaymentResponse = await xero.accountingApi.createPayments(tenantId, payments);

    const getPaymentResponse = await xero.accountingApi.getPayment(tenantId, createPaymentResponse.body.payments[0].paymentID);

    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.status(200).json({
      consentUrl: await xero.buildConsentUrl(),
      authenticated: authenticationData(req, res),
      count: getPaymentsResponse.body.payments.length,
      newPayment: createPaymentResponse.body.payments[0].paymentID,
      getPayment: getPaymentResponse.body.payments[0].invoice.contact.name,
      paymentAmount: paymentAmount
    });

  } catch (e) {
    // Handle errors as before.
    res.setHeader("Content-Type", "application/json");
    res.status(res.statusCode);
    res.json({
      error: e.message,
      consentUrl: await xero.buildConsentUrl(),
    });
  } finally {
    // Reset the flag once the payment processing has completed, regardless of success or failure.
    isProcessingPayment = false;
  }
}

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

export async function taxRates(req: Request, res: Response) {
  try {
    const tenantId = req.query.tenantId as string;
    const taxRatesResponse = (await xero.accountingApi.getTaxRates(tenantId)).body;

    const taxRates = taxRatesResponse.taxRates.map(taxRate => ({
      name: taxRate.name,
      taxType: taxRate.taxType
    }));

    res.json({
      consentUrl: await xero.buildConsentUrl(),
      taxRates, // Return the transformed taxRates array
    });
  } catch (e) {
    console.error(e);
    res.status(res.statusCode);
    res.json({
      consentUrl: await xero.buildConsentUrl(),
      error: e,
    });
  }
}

export async function accountsTaxType(req: Request, res: Response) {
  try {
    const tenantId = "33b67fb1-e1c6-414c-bc39-c4305af2146f"

    if (!tenantId) {
      res.status(400);
      res.json({ error: "Missing tenantId query parameter" });
      return;
    }

    // Update the where parameter to filter tax type accounts
    const where = 'Status == "ACTIVE" AND TaxType != null';

    const accountsGetResponse = await xero.accountingApi.getAccounts(
      tenantId,
      null,
      where
    );

    res.json({
      consentUrl: await xero.buildConsentUrl(),
      accounts: accountsGetResponse.body.accounts,
    });
  } catch (e) {
    res.status(res.statusCode);
    res.json({
      consentUrl: await xero.buildConsentUrl(),
      error: e,
    });
  }
}

export async function contactGroups(req: Request, res: Response) {
  try {
    const tenantId = req.body.tenantId;
    const contactGroups = await xero.accountingApi.getContactGroups(tenantId);
    const contactGroupsInfo = contactGroups.body.contactGroups.map(group => [group.contactGroupID, group.name])

    res.json({
      consentUrl: await xero.buildConsentUrl(),
      contactGroupsInfo: contactGroupsInfo,
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

export async function contactsGroup(req: Request, res: Response) {
  try {
    // // const tenantId = "33b67fb1-e1c6-414c-bc39-c4305af2146f";
    // const tenantId = "89a7e972-1cbb-441a-a98d-00f101c5dd8f"
    // const contactGroupId = "0d620928-3d75-4066-8366-371943778340"

    const {
      tenantId,
      contactGroupId,
    } = req.body;

    console.log("contactGroupId: " + contactGroupId)
    console.log("tenantId: " + tenantId)

    const contactsGroup = await xero.accountingApi.getContactGroup(tenantId, contactGroupId);
    
    res.json({
      consentUrl: await xero.buildConsentUrl(),
      contacts: contactsGroup.body.contactGroups[0].contacts
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

export async function bankTransactions(req: Request, res: Response) {
  try {
    const tenantId = "33b67fb1-e1c6-414c-bc39-c4305af2146f";

    // taxType // Make drodown list
    const validAccountCode = "";

    // contactID // Make dropdown list
    const useContact = {
      contactID: "", // Replace with the appropriate contactID
    };

    const lineItems: LineItem[] = [
      {
        description: "consulting",
        quantity: 1.0,
        unitAmount: 20.0,
        accountCode: validAccountCode,
      },
    ];

    // accountID
    const useBankAccount = {
      accountID: "", // Replace with the appropriate accountID
    };

    // Determine the transaction type based on the request body property 'transactionType'
    const transactionType = req.body.transactionType === 'RECEIVE'
      ? BankTransaction.TypeEnum.RECEIVE
      : BankTransaction.TypeEnum.SPEND;

    const newBankTransaction = {
      type: transactionType,
      contact: useContact,
      lineItems,
      bankAccount: useBankAccount,
      date: "2023-04-30",
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