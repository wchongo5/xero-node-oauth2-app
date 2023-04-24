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
  payments,
  getAccessToken
} from "./controllers";
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
router.get("/payments", payments);
// router.post("/payments", payments);

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
router.get("/authenticated-data", ensureAuthenticated, (req, res) => {

  try {

    const authData = authenticationData(req, res);
  
    console.log("authData from authenticated-data: " + authData)
    console.log("Logged here: " + res)
  
    res.json(authData);
  } catch (error) {
    res.json("Error here");
  }
});

router.get('/access-token', getAccessToken);



export default router;