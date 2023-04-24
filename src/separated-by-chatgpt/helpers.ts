import { Request, Response } from "express";
import * as crypto from 'crypto';

// helpers
export function authenticationData(req: Request, _res: Response) {
   return {
      decodedIdToken: req.session.decodedIdToken,
      tokenSet: req.session.tokenSet,
      decodedAccessToken: req.session.decodedAccessToken,
      accessTokenExpires: timeSince(req.session.decodedAccessToken),
      allTenants: req.session.allTenants,
      activeTenant: req.session.activeTenant
   }
}

// Modified ensureAuthenticated
export function ensureAuthenticated(req: Request, res: Response, next: Function) {
  if (req.session && req.session.decodedIdToken && req.session.tokenSet && req.session.decodedAccessToken && req.session.allTenants && req.session.activeTenant) {
    return next();
  } else {
    res.redirect('/connect'); // Redirect to the proper authentication flow
  }
}

export function timeSince(token) {
  if (token) {
    const timestamp = token['exp']
    const myDate = new Date(timestamp * 1000)
    return myDate.toLocaleString()
  } else {
    return ''
  }
}

export function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
};

export function verifyWebhookEventSignature(req: Request) {
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