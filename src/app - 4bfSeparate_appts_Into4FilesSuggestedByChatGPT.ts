require("dotenv").config();
import * as bodyParser from "body-parser";
import * as crypto from 'crypto';
import express from "express";
import { Request, Response } from "express";
import { TokenSetParameters } from 'xero-node'
import {
  Payments,
  XeroAccessToken,
  XeroClient,
  XeroIdToken,
} from "xero-node";
// import Helper from "./helper";
import jwtDecode from 'jwt-decode';

const session = require("express-session");
var FileStore = require('session-file-store')(session);
const path = require("path");
// const mime = require("mime-types");

const client_id = process.env.CLIENT_ID;
const client_secret = process.env.CLIENT_SECRET;
const redirectUrl = process.env.REDIRECT_URI;
const scopes = "offline_access openid profile email accounting.transactions accounting.budgets.read accounting.reports.read accounting.journals.read accounting.settings accounting.settings.read accounting.contacts accounting.contacts.read accounting.attachments accounting.attachments.read files files.read assets assets.read projects projects.read payroll.employees payroll.payruns payroll.payslip payroll.timesheets payroll.settings";

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

const app = express();
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));

app.use(bodyParser.urlencoded({ extended: false }));
app.use('/webhooks', bodyParser.raw({ type: 'application/json' }));
app.use(bodyParser.json());

const fileStoreOptions = {}
app.use(session({
  secret: "something crazy",
  store: new FileStore(fileStoreOptions),
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false },
}));

// helpers
function authenticationData(req: Request, _res: Response) {
  return {
    decodedIdToken: req.session.decodedIdToken,
    tokenSet: req.session.tokenSet,
    decodedAccessToken: req.session.decodedAccessToken,
    accessTokenExpires: timeSince(req.session.decodedAccessToken),
    allTenants: req.session.allTenants,
    activeTenant: req.session.activeTenant
  }
}

function timeSince(token) {
  if (token) {
    const timestamp = token['exp']
    const myDate = new Date(timestamp * 1000)
    return myDate.toLocaleString()
  } else {
    return ''
  }
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
};

function verifyWebhookEventSignature(req: Request) {
  let computedSignature = crypto.createHmac('sha256', process.env.WEBHOOK_KEY).update(req.body.toString()).digest('base64');
  let xeroSignature = req.headers['x-xero-signature'];

  if (xeroSignature === computedSignature) {
    console.log('Signature passed! This is from Xero!');
    return true;
  } else {
    console.log('Signature failed. Webhook might not be from Xero or you have misconfigured something...');
    console.log(`Got {${computedSignature}} when we were expecting {${xeroSignature}}`);
    return false;
  }
};


// Add all the routes here, for example:

const router = express.Router();

// Add all the routes here, for example:
router.get("/", async (req: Request, res: Response) => {
  if (req.session.tokenSet) {
    // This reset the session and required data on the xero client after ts recompile
    await xero.setTokenSet(req.session.tokenSet)
    await xero.updateTenants(false)
  }

  try {
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
});

router.get("/connect", async (_req: Request, res: Response) => {
  try {
    const consentUrl = await xero.buildConsentUrl();
    res.redirect(consentUrl);
  } catch (err) {
    console.log("Error: ", err);
    res.render("error", { err: err.message });
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
      authenticated: authenticationData(req, res)
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
      authenticated: authenticationData(req, res)
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
  verifyWebhookEventSignature(req) ? res.status(200).send() : res.status(401).send();
});

router.get("/payments", async (req: Request, res: Response) => {
  try {

    var cs = "XDWFPU221001" // Cooperativa Q17
    const yy = cs.slice(6,8)
    const startDateStr = `20${yy}/01/01`

    var referenceStr = 'XFAP5 Residência Unifamiliar / Banco'
    var referenceStr = 'XFUP5 Plano de Pormenor / Banco'
    var accountCode = "B01" // WALLET
    var accountCode = "B05" // BIM1
    // var accountCode = "B06" // BIM2

    var yyyy__mm__dd = "2023-04-16"
    var amountNum = 333

    //GET ALL
    const getPaymentsResponse = await xero.accountingApi.getPayments(req.session.activeTenant.tenantId);

    try {

      const invoices = await xero.accountingApi.getInvoices(
        req.session.activeTenant.tenantId, // xeroTenantId: string        
        new Date(startDateStr), // undefined, (not accepted) // ifModifiedSince?: Date
        'Type=="ACCREC"', // where?: string
        
        undefined, // order?: string // 'reference DESC'
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
      )

      var invoicesContacts = invoices.body.invoices.map(item => item.contact.name)
      var invoicesContacts = invoicesContacts.sort()
      invoicesContacts.forEach(item => console.log(item))

      const invoices2 = invoices.body.invoices[0]
      var invoiceIDFound = invoices2.invoiceID

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
          date: yyyy__mm__dd, //"2020-03-12",
          amount: amountNum,
          reference: referenceStr
        },
      ]
    };
    
    const createPaymentResponse = await xero.accountingApi.createPayments(req.session.activeTenant.tenantId, payments);

    const getPaymentResponse = await xero.accountingApi.getPayment(req.session.activeTenant.tenantId, createPaymentResponse.body.payments[0].paymentID);

    res.render("payments", {
      // consentUrl: await xero.buildConsentUrl(), // Not used in Views
      // authenticated: authenticationData(req, res), // Not used in Views
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



app.use("/", router);

/* // IN "src/server.ts"
import app from "./app";

const PORT = process.env.PORT || 3000; // Was 5000
app.listen(PORT, () => console.log(`App listening on port ${PORT}!`));
*/

export default app;

