// import express from "express";
import express, { Request, Response } from "express";
import {
  home,
  connect,
  callback,
  changeOrganisation,
  refreshToken,
  disconnect,
  revokeToken,
  webhooks,
  invoicePay,
  organisations,
  accounts,
  contactsToPayByInvoices,
  invoicesToPayByContact,
  // invoiceToPay, // COMMENTED TO AVOID ERROR
  // bankTransfer_get,
  bankTransfers,
  accounts_test,
  taxRates,
  contactsTransactions,
  contactGroups,
} from "./controller-xero";
import { authenticationData, ensureAuthenticated } from "./helpers";
import axios from "axios";


const router = express.Router();

router.get("/", home);

// Maybe is processed before/!!! <router.get("/", home);>
router.get("/callback", callback);
// Created by ChatGPT. Useful for future.
// Not avalible in original functions
// Exported but not used
router.get("/connect", connect);

router.post("/change_organisation", changeOrganisation);
router.get("/refresh-token", refreshToken);
router.get("/disconnect", disconnect);
router.get("/revoke-token", revokeToken);
router.post("/webhooks", webhooks);

// -------------- APPING
router.get("/organisation", organisations);
router.get("/organisations", organisations);
router.get("/accounts", accounts);
router.get("/accounts-test", accounts_test);
router.post("/contacts-to-pay", contactsToPayByInvoices);
router.post("/invoices-to-pay", invoicesToPayByContact);

/* // REMOVED IN NES+XT SAVE // COMMENTED TO AVOID ERROR

router.post("/invoice-to-pay", invoiceToPay);

*/

router.post("/invoice-pay", invoicePay);
// router.get("/bankTransfer_get", bankTransfer_get);
router.post("/bank-transfers", bankTransfers);
router.get("/tax-rates", taxRates);
router.get("/contacts-transactions", contactsTransactions);
router.post("/contact-groups", contactGroups);




// USED THIS PROXY, use it like Travervy Media in "https://youtu.be/mvfsC66xqj0?t=2652"
router.get("/proxy", async (req: Request, res: Response) => {
  // const targetUrl = req.query.url as string;
  try {
    const targetUrl = req.query.url as string;

    const response = await axios.get(targetUrl);
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch data from the target URL" });
  }
});

// Use the ensureAuthenticated middleware for the /authenticated-data route
// ensureAuthenticated Is temporary
// router.get("/authenticated-data", ensureAuthenticated, (req, res) => {

//   try {

//     const authData = authenticationData(req, res);
  
//     console.log("authData from authenticated-data: " + authData)
//     console.log("Logged here: " + res)
  
//     res.json(authData);
//   } catch (error) {
//     res.json("Error here");
//   }
// });

// router.get('/access-token', getAccessToken);



export default router;