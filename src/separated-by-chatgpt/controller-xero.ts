import { Request, Response } from "express";
import {
  // Account,
  // AccountType,
  // BankTransaction,
  // BankTransactions,
  // BankTransfer,
  // BankTransfers,
  // Contact,
  // Invoice,
  // Invoices,
  // LineItem, 
  // Payments,
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

