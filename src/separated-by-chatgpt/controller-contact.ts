import { Request, Response } from "express";
import { xero } from "./xeroClient";

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