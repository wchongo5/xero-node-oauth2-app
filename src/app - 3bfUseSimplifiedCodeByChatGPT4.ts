require("dotenv").config();
import * as bodyParser from "body-parser";
import * as crypto from 'crypto';
import express from "express";
import { Request, Response } from "express";
import { RepeatingInvoices, Schedule, TokenSetParameters } from 'xero-node'
import * as fs from "fs";
import {
  Account,
  Accounts,
  AccountType,
  Allocation,
  Allocations,
  BankTransaction,
  BankTransactions,
  BankTransfer,
  BankTransfers,
  BatchPayment,
  BatchPaymentDelete,
  BatchPaymentDeleteByUrlParam,
  BatchPayments,
  Contact,
  ContactGroups,
  ContactPerson,
  Contacts,
  Currency,         // Used for creating new currency from /currencies endpoint
  CurrencyCode,     // Used for creating new currency from /currencies endpoint
  Employees,
  HistoryRecords,
  Invoice,
  Invoices,
  Item,
  Items,
  LineAmountTypes,
  LineItem,
  LinkedTransaction,
  LinkedTransactions,
  ManualJournal,
  ManualJournals,
  Payments,
  PaymentServices,
  PurchaseOrder,
  PurchaseOrders,
  Quote,
  Quotes,
  Receipt,
  Receipts,
  RepeatingInvoice,
  TaxRate,
  TaxRates,
  TrackingCategory,
  TrackingOption,
  XeroAccessToken,
  XeroClient,
  XeroIdToken,
  CreditNotes,
  CreditNote,
} from "xero-node";
import Helper from "./helper";
import jwtDecode from 'jwt-decode';
import { Asset } from "xero-node/dist/gen/model/assets/asset";
import { AssetStatus, AssetStatusQueryParam } from "xero-node/dist/gen/model/assets/models";
import { 
  Amount, 
  ChargeType, 
  CurrencyCode as ProjectCurrencyCode, 
  ProjectCreateOrUpdate, 
  ProjectPatch, 
  ProjectStatus, 
  TaskCreateOrUpdate, 
  TimeEntryCreateOrUpdate 
} from 'xero-node/dist/gen/model/projects/models';
import { 
  Employee as AUPayrollEmployee, 
  HomeAddress, 
  State 
} from 'xero-node/dist/gen/model/payroll-au/models';
import { 
  FeedConnections, 
  FeedConnection, 
  CountryCode, 
  Statements, 
  CreditDebitIndicator, 
  CurrencyCode as BankfeedsCurrencyCode 
} from 'xero-node/dist/gen/model/bankfeeds/models';
import { 
  Employee as UKPayrollEmployee, 
  Employment                                    // Used for getting employment from /employment endpoint
} from 'xero-node/dist/gen/model/payroll-uk/models';
import { 
  Employment as NZPayrollEmployment,            // Used for getting employment from /payroll-nz-employment endpoint
  EmployeeLeaveSetup as NZEmployeeLeaveSetup,   // Used for getting leave setup from /payroll-nz-employees-leave-setup endpoint
  Employee as NZEmployee  
} from 'xero-node/dist/gen/model/payroll-nz/models';
import { ObjectGroup } from "xero-node/dist/gen/model/files/models";
import { Console } from "console";

const session = require("express-session");
var FileStore = require('session-file-store')(session);
const path = require("path");
const mime = require("mime-types");

const client_id = process.env.CLIENT_ID;
const client_secret = process.env.CLIENT_SECRET;
const redirectUrl = process.env.REDIRECT_URI;
const scopes = "offline_access openid profile email accounting.transactions accounting.budgets.read accounting.reports.read accounting.journals.read accounting.settings accounting.settings.read accounting.contacts accounting.contacts.read accounting.attachments accounting.attachments.read files files.read assets assets.read projects projects.read payroll.employees payroll.payruns payroll.payslip payroll.timesheets payroll.settings";
// bankfeeds
// finance.accountingactivity.read finance.bankstatementsplus.read finance.cashvalidation.read finance.statements.read


const xero = new XeroClient({
  clientId: client_id,
  clientSecret: client_secret,
  redirectUris: [redirectUrl],
  scopes: scopes.split(" "),
  state: "imaParam=look-at-me-go",
  httpTimeout: 2000
});

if (!client_id || !client_secret || !redirectUrl) {
  throw Error('Environment Variables not all set - please check your .env file in the project root or create one!')
}


class App {
  public app: express.Application;
  public consentUrl: Promise<string>

  constructor() {
    this.app = express();
    this.config();
    this.routes();
    this.app.set("views", path.join(__dirname, "views"));
    this.app.set("view engine", "ejs");
    this.app.use(express.static(path.join(__dirname, "public")));

    this.consentUrl = xero.buildConsentUrl()
  }

  private config(): void {
    this.app.use(bodyParser.urlencoded({ extended: false }));
    this.app.use('/webhooks', bodyParser.raw({ type: 'application/json' }));
    this.app.use(bodyParser.json());
  }

  // helpers
  authenticationData(req, _res) {
    return {
      decodedIdToken: req.session.decodedIdToken,
      tokenSet: req.session.tokenSet,
      decodedAccessToken: req.session.decodedAccessToken,
      accessTokenExpires: this.timeSince(req.session.decodedAccessToken),
      allTenants: req.session.allTenants,
      activeTenant: req.session.activeTenant
    }
  }

  timeSince(token) {
    if (token) {
      const timestamp = token['exp']
      const myDate = new Date(timestamp * 1000)
      return myDate.toLocaleString()
    } else {
      return ''
    }
  }

  sleep(ms) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  };

  verifyWebhookEventSignature(req: Request) {
    let computedSignature = crypto.createHmac('sha256', process.env.WEBHOOK_KEY).update(req.body.toString()).digest('base64');
    let xeroSignature = req.headers['x-xero-signature'];

    if (xeroSignature === computedSignature) {
      console.log('Signature passed! This is from Xero!');
      return true;
    } else {
      // If this happens someone who is not Xero is sending you a webhook
      console.log('Signature failed. Webhook might not be from Xero or you have misconfigured something...');
      console.log(`Got {${computedSignature}} when we were expecting {${xeroSignature}}`);
      return false;
    }
  };

  private routes(): void {
    const router = express.Router();

    router.get("/", async (req: Request, res: Response) => {
      if (req.session.tokenSet) {
        // This reset the session and required data on the xero client after ts recompile
        await xero.setTokenSet(req.session.tokenSet)
        await xero.updateTenants(false)
      }

      try {
        const authData = this.authenticationData(req, res)

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
    });

    router.get("/callback", async (req: Request, res: Response) => {
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

        res.render("callback", {
          consentUrl: await xero.buildConsentUrl(),
          authenticated: this.authenticationData(req, res)
        });
      } catch (e) {
        res.status(res.statusCode);
        res.render("shared/error", {
          consentUrl: await xero.buildConsentUrl(),
          error: e
        });
      }
    });

    router.post("/change_organisation", async (req: Request, res: Response) => {
      try {
        const activeOrgId = req.body.active_org_id
        const picked = xero.tenants.filter((tenant) => tenant.tenantId == activeOrgId)[0]
        req.session.activeTenant = picked
        const authData = this.authenticationData(req, res)

        res.render("home", {
          consentUrl: await xero.buildConsentUrl(),
          authenticated: this.authenticationData(req, res)
        });
      } catch (e) {
        res.status(res.statusCode);
        res.render("shared/error", {
          consentUrl: await xero.buildConsentUrl(),
          error: e
        });
      }
    });

    router.get("/refresh-token", async (req: Request, res: Response) => {
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

        const authData = this.authenticationData(req, res)

        res.render("home", {
          consentUrl: await xero.buildConsentUrl(),
          authenticated: this.authenticationData(req, res)
        });
      } catch (e) {
        res.status(res.statusCode);
        res.render("shared/error", {
          consentUrl: await xero.buildConsentUrl(),
          error: e
        });
      }
    });

    router.get("/disconnect", async (req: Request, res: Response) => {
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
        const authData = this.authenticationData(req, res)

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
    });

    router.get("/revoke-token", async (req: Request, res: Response) => {
      try {
        await xero.revokeToken();
        req.session.decodedIdToken = undefined
        req.session.decodedAccessToken = undefined
        req.session.tokenSet = undefined
        req.session.allTenants = undefined
        req.session.activeTenant = undefined

        res.render("home", {
          consentUrl: await xero.buildConsentUrl(),
          authenticated: this.authenticationData(req, res)
        });
      } catch (e) {
        res.status(res.statusCode);
        res.render("shared/error", {
          consentUrl: await xero.buildConsentUrl(),
          error: e
        });
      }
    })

    router.post("/webhooks", async (req: Request, res: Response) => {
      console.log("webhook event received!", req.headers, req.body, JSON.parse(req.body));
      this.verifyWebhookEventSignature(req) ? res.status(200).send() : res.status(401).send();
    });

    // ********************************* ACCOUNTING API

    // router.get("/customer-invoices", async (req: Request, res: Response) => {
    //   try {
    //     //GET ALL
    //     const getPaymentsResponse = await xero.accountingApi.getPayments(req.session.activeTenant.tenantId);

    //     try {

    //       const invoices = await xero.accountingApi.getInvoices(
    //         req.session.activeTenant.tenantId, // req.session.activeTenant.tenantId: This is the ID of the tenant (or organization) for which you want to retrieve invoices.
            
    //         new Date("2023/01/01"), //undefined, // new Date("2023/01/01"), //new Date(2018) Exige inclusão de Mês e dia assim new Date(2018, 1, 1), // new Date(2018): This specifies the start date for the date range of invoices to retrieve. In this case, it's set to January 1, 2018.
    //         'Type=="ACCREC"', // 'Type=="ACCREC"': This is a filter to retrieve only invoices of the type "Accounts Receivable".
    //         undefined, // 'reference DESC': This is the order in which the results will be returned. In this case, the invoices will be sorted in descending order by their reference field.
    //         // 🔴🔴🔴 Any parameter that is empty for some invoices, will raise undefined of invoices like 'reference DESC'
    //         undefined, // undefined: This parameter specifies which page of results to return. Since it's set to undefined, the first page of results will be returned.
    //         undefined, // undefined: This parameter specifies the number of results to return per page. Since it's set to undefined, the default number of results per page will be used.
    //         undefined, // undefined: This parameter specifies the currency code to filter by. Since it's set to undefined, no currency filter will be applied.
    //         ['AUTHORISED'], // ['AUTHORISED', 'PAID', 'DRAFT']: This parameter specifies the status of invoices to retrieve. In this case, invoices with a status of "PAID" or "DRAFT" will be returned. // XD5 Noted in Notes — DRAFT, SUBMITTED, AUTHORISED (Once an invoice is fully paid invoice the status will change to PAID). Note that if invoice is partially paid is AUTHORISED
    //         0, // 0: This parameter specifies the minimum total amount for invoices to retrieve. In this case, invoices with a total amount greater than or equal to zero will be returned.
    //         undefined, // true: This parameter specifies whether to include an If-Modified-Since header in the request. If set to true, the server will only return invoices that have been modified since the specified date (not included in this example).
    //         false, // false: This parameter specifies whether to include an If-None-Match header in the request. If set to true, the server will only return invoices that have a different ETag value than the one specified (not included in this example).
    //         100000000000, // 4: This parameter specifies the maximum number of results to return. In this case, a maximum of 4 invoices will be returned.
    //         // It returns 100 invices, even if you increase this number
    //         // 🔴 How to include get more than 100 invoices.
    //         true, // true: This parameter specifies whether to include a Content-Type header in the request. If set to true, the request will include a Content-Type header with the value application/json.

    //         { // { headers: { 'contentType': 'application/json' } }: This is an optional parameter that specifies additional headers to include in the request. In this case, it includes a Content-Type header with the value application/json.
    //           headers: {
    //             'contentType': 'application/json'
    //           }
    //         }
    //       )

    //       var invoicesContacts = invoices.body.invoices.map(item => item.contact.name)
    //       var invoicesContacts = invoicesContacts.sort()
    //       invoicesContacts.forEach(item => console.log(item))

    //       var invoicesFiltered = invoices.body.invoices.filter(item => item.contact.contactID == req.body.customerId)


    //       // console.log("THANKS: " + invoicesFiltered[0].contact.name)

    //       res.render("shared/customer-invoices", {
    //         consentUrl: await xero.buildConsentUrl(),
    //         // invoicesContacts: invoicesContacts
    //         // invoices: invoices,
    //         invoices: invoicesFiltered,
    //         // selectedCustomerId: invoices.body.invoices[0].contact.contactID
    //         selectedCustomerId: invoicesFiltered[0].contact.contactID
    //       });

    //     } catch (error) {
    //       console.log(error);
    //     }

    //   } catch (e) {
    //     res.status(res.statusCode);

    //     res.render("shared/error", {
    //       consentUrl: await xero.buildConsentUrl(),
    //       error: e
    //     });
    //   }
    // });


    router.get("/invoice-payment", async (req: Request, res: Response) => {
      try {
        //GET ALL
        const getPaymentsResponse = await xero.accountingApi.getPayments(req.session.activeTenant.tenantId);

        try {

          const invoices = await xero.accountingApi.getInvoices(
            req.session.activeTenant.tenantId, // req.session.activeTenant.tenantId: This is the ID of the tenant (or organization) for which you want to retrieve invoices.
            
            new Date("2023/01/01"), //undefined, // new Date("2023/01/01"), //new Date(2018) Exige inclusão de Mês e dia assim new Date(2018, 1, 1), // new Date(2018): This specifies the start date for the date range of invoices to retrieve. In this case, it's set to January 1, 2018.
            'Type=="ACCREC"', // 'Type=="ACCREC"': This is a filter to retrieve only invoices of the type "Accounts Receivable".
            undefined, // 'reference DESC': This is the order in which the results will be returned. In this case, the invoices will be sorted in descending order by their reference field.
            // 🔴🔴🔴 Any parameter that is empty for some invoices, will raise undefined of invoices like 'reference DESC'
            undefined, // undefined: This parameter specifies which page of results to return. Since it's set to undefined, the first page of results will be returned.
            undefined, // undefined: This parameter specifies the number of results to return per page. Since it's set to undefined, the default number of results per page will be used.
            undefined, // undefined: This parameter specifies the currency code to filter by. Since it's set to undefined, no currency filter will be applied.
            ['AUTHORISED'], // ['AUTHORISED', 'PAID', 'DRAFT']: This parameter specifies the status of invoices to retrieve. In this case, invoices with a status of "PAID" or "DRAFT" will be returned. // XD5 Noted in Notes — DRAFT, SUBMITTED, AUTHORISED (Once an invoice is fully paid invoice the status will change to PAID). Note that if invoice is partially paid is AUTHORISED
            0, // 0: This parameter specifies the minimum total amount for invoices to retrieve. In this case, invoices with a total amount greater than or equal to zero will be returned.
            undefined, // true: This parameter specifies whether to include an If-Modified-Since header in the request. If set to true, the server will only return invoices that have been modified since the specified date (not included in this example).
            false, // false: This parameter specifies whether to include an If-None-Match header in the request. If set to true, the server will only return invoices that have a different ETag value than the one specified (not included in this example).
            100000000000, // 4: This parameter specifies the maximum number of results to return. In this case, a maximum of 4 invoices will be returned.
            // It returns 100 invices, even if you increase this number
            // 🔴 How to include get more than 100 invoices.
            true, // true: This parameter specifies whether to include a Content-Type header in the request. If set to true, the request will include a Content-Type header with the value application/json.

            { // { headers: { 'contentType': 'application/json' } }: This is an optional parameter that specifies additional headers to include in the request. In this case, it includes a Content-Type header with the value application/json.
              headers: {
                'contentType': 'application/json'
              }
            }
          )

          var invoicesContacts = invoices.body.invoices.map(item => item.contact.name)
          var invoicesContacts = invoicesContacts.sort()
          invoicesContacts.forEach(item => console.log(item))

          // var invoicesFiltered = invoices.body.invoices.filter(item => item.contact.name.includes("Zimpeto"))

          var invoicesFiltered = invoices.body.invoices

          // console.log("THANKS: " + invoicesFiltered[0].contact.name)

          res.render("invoice-payment", {
            consentUrl: await xero.buildConsentUrl(),
            // invoicesContacts: invoicesContacts
            // invoices: invoices,
            invoices: invoicesFiltered,
            // selectedCustomerId: invoices.body.invoices[0].contact.contactID
            selectedCustomerId: invoicesFiltered[0].contact.contactID
          });

        } catch (error) {
          console.log(error);
        }

      } catch (e) {
        res.status(res.statusCode);

        res.render("shared/error", {
          consentUrl: await xero.buildConsentUrl(),
          error: e
        });
      }
    });

    router.get("/payments", async (req: Request, res: Response) => {
      try {

        var cs = "XDWFPU221001" // Cooperativa Q17
        // var cs = "XDWFAP231001" // Rosa
        // var cs = "XDWFAP230901" // Fidalgo Youri Cossa

        const yy = cs.slice(6,8)
        const startDateStr = `20${yy}/01/01`

        var referenceStr = 'XFAP5 Residência Unifamiliar / Banco'
        var referenceStr = 'XFUP5 Plano de Pormenor / Banco'
        var accountCode = "B01" // WALLET
        var accountCode = "B05" // BIM1
        // var accountCode = "B06" // BIM2

        var yyyy__mm__dd = "2023-04-16"
        var amountNum = 30

        //GET ALL
        const getPaymentsResponse = await xero.accountingApi.getPayments(req.session.activeTenant.tenantId);

        // 🔴🔴🔴 GET INVOICE

        try {

          // GET invoices without filters - returns Bills (ACCPAY) and Invoices (ACCREC)
          // const invoices = await xero.accountingApi.getInvoices(req.session.activeTenant.tenantId);

          console.log("THANKS GOD - START 8")

          // GET invoices with filters

          const invoices = await xero.accountingApi.getInvoices(
            req.session.activeTenant.tenantId, // xeroTenantId: string        
            new Date(startDateStr), // undefined, (not accepted) // ifModifiedSince?: Date
            // new Date(2018) Exige inclusão de Mês e dia assim new Date(2018
            'Type=="ACCREC"', // where?: string
            
            // ?where=Type=="ACCPAY" AND Status=="AUTHORISED"

            undefined, // order?: string // 'reference DESC'
            // 🔴🔴🔴 Any parameter that is empty for some invoices, will raise undefined of invoices like 'reference DESC'
            undefined, // iDs?: string[]            
            ["XDWFPU221001"], // undefined// invoiceNumbers?: string[]
            undefined, // contactIDs?: string[]
            ['AUTHORISED'], // statuses?: string[] // ['AUTHORISED', 'PAID', 'DRAFT']
            0, // page?: number            
            false, // includeArchived?: boolean
            false, // createdByMyApp?: boolean
            4, // unitdp?: number // It stands for "Unit Decimal Places" and specifies the number of decimal places to use for the unit amount on the invoice line items.            
            true, // summaryOnly?: boolean
            {
              headers: {
                'contentType': 'application/json'
              }
            }
            // options?: { headers: { [name: string]: string; }; }): Promise<{ response: IncomingMessage; body: Invoices; }
          )

          console.log("THANKS GOD - Y")

          console.log(invoices)

          var invoicesContacts = invoices.body.invoices.map(item => item.contact.name)
          var invoicesContacts = invoicesContacts.sort()
          invoicesContacts.forEach(item => console.log(item))
          
          // Get invoice using contact
          // const invoices2 = invoices.body.invoices.filter(item => item.contact.name.includes("Rosa"))[0] // "Rosa" "FFH"

          // Get invoice using invoiceNumber

          // const invoices2 = invoices.body.invoices.filter(item => item.invoiceNumber == cs)[0]
          const invoices2 = invoices.body.invoices[0]

          var invoiceIDFound = invoices2.invoiceID

          console.log(invoiceIDFound)
          console.log(invoices2.payments)
          console.log(invoices2.contact.name)
          console.log(invoices2.invoiceNumber)

        } catch (error) {
          console.log(error);
        }

        const payments: Payments = {
          payments: [
            {
              invoice: {
                // invoiceID: createInvoiceResponse.body.invoices[0].invoiceID
                invoiceID: invoiceIDFound
              },
              account: {
                code: accountCode
              },
              date: yyyy__mm__dd, //"2020-03-12",
              amount: amountNum,
              reference: referenceStr
            },
          ]
        };
        
        const createPaymentResponse = await xero.accountingApi.createPayments(req.session.activeTenant.tenantId, payments);

        // GET ONE
        const getPaymentResponse = await xero.accountingApi.getPayment(req.session.activeTenant.tenantId, createPaymentResponse.body.payments[0].paymentID);

        // DELETE
        // spec needs to be updated, it's trying to modify a payment but that throws a validation error

        res.render("payments", {
          consentUrl: await xero.buildConsentUrl(),
          authenticated: this.authenticationData(req, res),
          count: getPaymentsResponse.body.payments.length, // XD5 // Usei 3
          newPayment: createPaymentResponse.body.payments[0].paymentID,
          getPayment: getPaymentResponse.body.payments[0].invoice.contact.name,
          paymentAmount: amountNum.toString()
        });

      } catch (e) {
        res.status(res.statusCode);
        res.render("shared/error", {
          consentUrl: await xero.buildConsentUrl(),
          error: e
        });
      }
    });

    // 🔴🔴🔴 *************** FUTURE

    // router.get("/quotes", async (req: Request, res: Response)
    // router.get("/reports", async (req: Request, res: Response)
    // router.get("/invoices", async (req: Request, res: Response)
    // router.get("/invoices-filtered", async (req: Request, res: Response)
    // router.get("/attachment-invoice", async (req: Request, res: Response)
    // router.get("/invoice-as-pdf", async (req: Request, res: Response)
    // router.get("/banktranfers", async (req: Request, res: Response)
    // router.get("/banktransactions", async (req: Request, res: Response)
    // router.get("/contacts", async (req: Request, res: Response)
    // router.get("/accounts", async (req: Request, res: Response)
    // router.get("/organisations", async (req: Request, res: Response)
    // router.get("/receipts", async (req: Request, res: Response)

    // ********************************* ASSETS API

    // ********************************* PROJECTS API

    // ********************************* payroll-au

    // ********************************* BANKFEEDS API

    // ********************************* payroll-uk

    // ********************************* payroll-nz

    const fileStoreOptions = {}

    this.app.use(session({
      secret: "something crazy",
      store: new FileStore(fileStoreOptions),
      resave: false,
      saveUninitialized: false,
      cookie: { secure: false },
    }));

    this.app.use("/", router);
  }
}

export default new App().app;
