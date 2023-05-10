import { Request, Response } from "express";
import { xero } from "./xeroClient";

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