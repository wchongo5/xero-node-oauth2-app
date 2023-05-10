import { Request, Response } from "express";
import {
  Invoice,
  Payments,
} from "xero-node";
import { xero } from "./xeroClient";
import { authenticationData } from "./helpers";
import moment from 'moment';


export async function contactsToPayByInvoices(req: Request, res: Response) {
  try {
    var { invoiceType, tenantId, startDate } = req.body;

    if (invoiceType == "undefined") {
      var invoiceType = undefined
    }

    const [yyyy, mm, dd] = startDate.split("-")
    const ifModifiedSinceDate = `${yyyy}/${mm}/01`

    try {
      const invoices = await xero.accountingApi.getInvoices(
        tenantId,
        new Date(ifModifiedSinceDate),
        invoiceType, // undefined, //
        undefined,
        undefined,
        undefined,
        undefined,
        ['AUTHORISED'],
        0,
        false,
        false,
        4,
        true,
        {
          headers: {
            'contentType': 'application/json',
          },
        }
      );

      const startDateMoment = moment(startDate);

      const filteredInvoices = invoices.body.invoices.filter((invoice) => {
        const invoiceDateMoment = moment(invoice.date);
        return invoiceDateMoment.isSameOrAfter(startDateMoment);
      });

      const contactsToPay = [];
      for (let i = 0; i < filteredInvoices.length; i++) {
        const contact = filteredInvoices[i].contact;
        const contactInfo = [contact.contactID, contact.name];

        if (!contactsToPay.toString().includes(contactInfo[1])) {
          contactsToPay.push(contactInfo);
        }
      }

      res.json({
        consentUrl: await xero.buildConsentUrl(),
        contacts: contactsToPay,
      });

    } catch (error) {
      console.log(error);
    }

  } catch (e) {
    res.setHeader("Content-Type", "application/json");
    res.status(res.statusCode);
    res.json({
      error: e.message,
      consentUrl: await xero.buildConsentUrl(),
    });
  }
}

export async function invoicesToPayByContact(req: Request, res: Response) {

  try {

    const { contactId, startDate, tenantId } = req.body;

    // -------
    const recordsPerPage = 100;
    let currentPage = 1;
    let totalPages = 0;
    let invoices: Invoice[] = [];

    try {

      while (true) {
        // const result = await xero.accountingApi.getInvoices(xero.tenants[0].tenantId, { page: currentPage });
        
        const result = await xero.accountingApi.getInvoices(
          tenantId,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          [contactId],
          ['AUTHORISED'],
          currentPage, //0,
          false,
          false,
          4,
          false, //true,
          {
            headers: {
              'contentType': 'application/json',
            },
          }
        );

        const currentPageInvoices = result.body.invoices;

        if (currentPageInvoices.length === recordsPerPage) {
          totalPages++;
          currentPage++;
          invoices = invoices.concat(currentPageInvoices);
        } else {
          totalPages++;
          invoices = invoices.concat(currentPageInvoices);
          break;
        }
      }
      
      const startDateMoment = moment(startDate);

      const filteredInvoices = invoices.filter((invoice) => {
        const invoiceDateMoment = moment(invoice.date);
        return invoiceDateMoment.isSameOrAfter(startDateMoment);
      });

      res.json({
        consentUrl: await xero.buildConsentUrl(),
        invoices: filteredInvoices //invoices.body.invoices,
      });

    } catch (error) {
      console.log(error);
    }

  } catch (e) {
    res.setHeader("Content-Type", "application/json");
    res.status(res.statusCode);
    res.json({
      error: e.message,
      consentUrl: await xero.buildConsentUrl(),
    });
  }

}

let isProcessingPayment = false;

export async function invoicePay(req: Request, res: Response) {
  try {
    // If a payment is already being processed, return an error response.
    if (isProcessingPayment) {
      return res.status(409).json({ error: 'A payment is already being processed. Please try again later.' });
    }

    // Set the flag to indicate a payment is being processed.
    isProcessingPayment = true;

    console.log("FormData: " + JSON.stringify(req.body))

    const {
      tenantId,
      invoiceId,
      accountCode,
      paymentDate,
      paymentReference,
      paymentAmount
    } = req.body

    const formattedPaymentDate = new Date(paymentDate).toISOString().slice(0, 10);

    //GET ALL
    const getPaymentsResponse = await xero.accountingApi.getPayments(tenantId);

    try {

      const invoices = await xero.accountingApi.getInvoices(
        tenantId, //req.session.activeTenant.tenantId, // xeroTenantId: string        
        undefined, //ew Date(ifModifiedSinceDate), // undefined, (not accepted) // ifModifiedSince?: Date
        undefined, //'Type=="ACCREC"', // where?: string
        
        undefined, // order?: string // 'reference DESC'
        [invoiceId], //undefined, // iDs?: string[]            
        undefined, //[invoiceNumber], // undefined// invoiceNumbers?: string[]
        undefined, // contactIDs?: string[]
        undefined, //['AUTHORISED'], // statuses?: string[] // ['AUTHORISED', 'PAID', 'DRAFT']
        0, // page?: number            
        false, // includeArchived?: boolean
        false, // createdByMyApp?: boolean
        4, // unitdp?: number // It stands for "Unit Decimal Places" and specifies the number of decimal places to use for the unit amount on the invoice line items.            
        true, // summaryOnly?: boolean / false if you need payments listing
        {
          headers: {
            'contentType': 'application/json'
          }
        }
      )

      var invoiceIDFound = invoices.body.invoices[0].invoiceID

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
          date: formattedPaymentDate,
          amount: Number(paymentAmount),
          reference: paymentReference
        },
      ]
    };
    
    const createPaymentResponse = await xero.accountingApi.createPayments(tenantId, payments);

    const getPaymentResponse = await xero.accountingApi.getPayment(tenantId, createPaymentResponse.body.payments[0].paymentID);

    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.status(200).json({
      consentUrl: await xero.buildConsentUrl(),
      authenticated: authenticationData(req, res),
      count: getPaymentsResponse.body.payments.length,
      newPayment: createPaymentResponse.body.payments[0].paymentID,
      getPayment: getPaymentResponse.body.payments[0].invoice.contact.name,
      paymentAmount: paymentAmount
    });

  } catch (e) {
    // Handle errors as before.
    res.setHeader("Content-Type", "application/json");
    res.status(res.statusCode);
    res.json({
      error: e.message,
      consentUrl: await xero.buildConsentUrl(),
    });
  } finally {
    // Reset the flag once the payment processing has completed, regardless of success or failure.
    isProcessingPayment = false;
  }
}