import { Request, Response } from "express";
import { Account } from "xero-node";
import { xero } from "./xeroClient";

export async function accountsBank(req: Request, res: Response) {
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
