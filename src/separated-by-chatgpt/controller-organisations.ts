import { Request, Response } from "express";
import { xero } from "./xeroClient";

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