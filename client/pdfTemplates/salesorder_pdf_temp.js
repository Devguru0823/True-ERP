import { SalesBoardService } from '../js/sales-service';
import { ReactiveVar } from 'meteor/reactive-var';
import { CoreService } from '../js/core-service';
import { EmployeeProfileService } from "../js/profile-service";
import { AccountService } from "../accounts/account-service";
import { InvoiceService } from "../invoice/invoice-service";
import { UtilityService } from "../utility-service";
import { SideBarService } from '../js/sidebar-service';
import { Random } from 'meteor/random';
import '../lib/global/indexdbstorage.js';
import {Session} from 'meteor/session';
import { Template } from 'meteor/templating';
import './salesorder_pdf_temp.html';

Template.salesorderPrintTemp.onCreated(()=>{
    const templateObject = Template.instance();
    templateObject.salesorderrecords = new ReactiveVar([]);
})

Template.salesorderPrintTemp.onRendered(()=>{
    const templateObject = Template.instance();
    const utilityService = new UtilityService();
    templateObject.getSalesOrderData = function() {
        let salesorderData = [];
        getVS1Data('TSalesOrderEx').then(function(dataObject) {
            if (dataObject.length > 0 ){
                let data = JSON.parse(dataObject[0].data);
                let useData = data.tsalesorderex;
                var added = false;
                let company_name = "";
                for (let d = 0; d < useData.length; d++) {
                        company_name = useData[d].fields.CustomerName;
                        added = true;
                        let lineItems = [];
                        let lineItemObj = {};
                        let lineItemsTable = [];
                        let lineItemTableObj = {};
                        let exchangeCode = useData[d].fields.ForeignExchangeCode;
                        let currencySymbol = Currency;
                        let total = currencySymbol + '' + useData[d].fields.TotalAmount.toLocaleString(undefined, {
                            minimumFractionDigits: 2
                        });
                        let totalInc = currencySymbol + '' + useData[d].fields.TotalAmountInc.toLocaleString(undefined, {
                            minimumFractionDigits: 2
                        });
                        let totalDiscount = utilityService.modifynegativeCurrencyFormat(useData[d].fields.TotalDiscount).toLocaleString(undefined, {
                            minimumFractionDigits: 2
                        });
                        let subTotal = currencySymbol + '' + useData[d].fields.TotalAmount.toLocaleString(undefined, {
                            minimumFractionDigits: 2
                        });
                        let totalTax = currencySymbol + '' + useData[d].fields.TotalTax.toLocaleString(undefined, {
                            minimumFractionDigits: 2
                        });
                        let totalBalance = currencySymbol + '' + useData[d].fields.TotalBalance.toLocaleString(undefined, {
                            minimumFractionDigits: 2
                        });
                        let totalPaidAmount = currencySymbol + '' + useData[d].fields.TotalPaid.toLocaleString(undefined, {
                            minimumFractionDigits: 2
                        });
                        if (useData[d].fields.Lines.length) {
                            for (let i = 0; i < useData[d].fields.Lines.length; i++) {
                                let AmountGbp = currencySymbol + '' + useData[d].fields.Lines[i].fields.TotalLineAmount.toLocaleString(undefined, {
                                    minimumFractionDigits: 2
                                });
                                let currencyAmountGbp = currencySymbol + '' + useData[d].fields.Lines[i].fields.TotalLineAmount.toFixed(2);
                                let TaxTotalGbp = utilityService.modifynegativeCurrencyFormat(useData[d].fields.Lines[i].fields.LineTaxTotal);
                                let TaxRateGbp = (useData[d].fields.Lines[i].fields.LineTaxRate * 100).toFixed(2);
                                lineItemObj = {
                                    lineID: Random.id(),
                                    id: useData[d].fields.Lines[i].fields.ID || '',
                                    item: useData[d].fields.Lines[i].fields.ProductName || '',
                                    description: useData[d].fields.Lines[i].fields.ProductDescription || '',
                                    quantity: useData[d].fields.Lines[i].fields.UOMOrderQty || 0,
                                    unitPrice: utilityService.modifynegativeCurrencyFormat(useData[d].fields.Lines[i].fields.OriginalLinePrice).toLocaleString(undefined, { minimumFractionDigits: 2 }) || 0,
                                    unitPriceInc: utilityService.modifynegativeCurrencyFormat(useData[d].fields.Lines[i].fields.OriginalLinePriceInc).toLocaleString(undefined, { minimumFractionDigits: 2 }) || 0,
                                    TotalAmt: utilityService.modifynegativeCurrencyFormat(useData[d].fields.Lines[i].fields.TotalLineAmount).toLocaleString(undefined, { minimumFractionDigits: 2 }) || 0,
                                    TotalAmtInc: utilityService.modifynegativeCurrencyFormat(useData[d].fields.Lines[i].fields.TotalLineAmountInc).toLocaleString(undefined, { minimumFractionDigits: 2 }) || 0,
                                    lineCost: currencySymbol + '' + useData[d].fields.Lines[i].fields.LineCost.toLocaleString(undefined, {
                                        minimumFractionDigits: 2
                                    }) || 0,
                                    taxRate: (useData[d].fields.Lines[i].fields.LineTaxRate * 100).toFixed(2) || 0,
                                    taxCode: useData[d].fields.Lines[i].fields.LineTaxCode || '',
                                    //TotalAmt: AmountGbp || 0,
                                    curTotalAmt: currencyAmountGbp || currencySymbol + '0',
                                    TaxTotal: TaxTotalGbp || 0,
                                    TaxRate: TaxRateGbp || 0,
                                    DiscountPercent: useData[d].fields.Lines[i].fields.DiscountPercent || 0

                                };

                                var dataListTable = [
                                    useData[d].fields.Lines[i].fields.ProductName || '',
                                    useData[d].fields.Lines[i].fields.ProductDescription || '',
                                    "<div contenteditable='true' class='qty'>" + '' + useData[d].fields.Lines[i].fields.UOMOrderQty + '' + "</div>" || "<div>" + '' + 0 + '' + "</div>",
                                    "<div>" + '' + currencySymbol + '' + useData[d].fields.Lines[i].fields.LinePrice.toFixed(2) + '' + "</div>" || currencySymbol + '' + 0.00,
                                    useData[d].fields.Lines[i].fields.LineTaxCode || '',
                                    AmountGbp || currencySymbol + '' + 0.00,
                                    '<span class="table-remove"><button type="button" class="btn btn-danger btn-rounded btn-sm my-0 btnRemove"><i class="fa fa-remove"></i></button></span>'
                                ];
                                lineItemsTable.push(dataListTable);
                                lineItems.push(lineItemObj);
                            }

                        } else {
                            let AmountGbp = useData[d].fields.Lines.fields.TotalLineAmountInc.toLocaleString(undefined, {
                                minimumFractionDigits: 2
                            });
                            let currencyAmountGbp = currencySymbol + '' + useData[d].fields.Lines.fields.TotalLineAmount.toFixed(2);
                            let TaxTotalGbp = utilityService.modifynegativeCurrencyFormat(useData[d].fields.Lines.fields.LineTaxTotal);
                            let TaxRateGbp = currencySymbol + '' + useData[d].fields.Lines.fields.LineTaxRate;
                            lineItemObj = {
                                lineID: Random.id(),
                                id: useData[d].fields.Lines.fields.ID || '',
                                description: useData[d].fields.Lines.fields.ProductDescription || '',
                                quantity: useData[d].fields.Lines.fields.UOMOrderQty || 0,
                                unitPrice: utilityService.modifynegativeCurrencyFormat(useData[d].fields.Lines[i].fields.OriginalLinePrice).toLocaleString(undefined, { minimumFractionDigits: 2 }) || 0,
                                unitPriceInc: utilityService.modifynegativeCurrencyFormat(useData[d].fields.Lines[i].fields.OriginalLinePriceInc).toLocaleString(undefined, { minimumFractionDigits: 2 }) || 0,
                                TotalAmt: utilityService.modifynegativeCurrencyFormat(useData[d].fields.Lines[i].fields.TotalLineAmount).toLocaleString(undefined, { minimumFractionDigits: 2 }) || 0,
                                TotalAmtInc: utilityService.modifynegativeCurrencyFormat(useData[d].fields.Lines[i].fields.TotalLineAmountInc).toLocaleString(undefined, { minimumFractionDigits: 2 }) || 0,
                                lineCost: useData[d].fields.Lines.fields.LineCost.toLocaleString(undefined, {
                                    minimumFractionDigits: 2
                                }) || 0,
                                taxRate: useData[d].fields.Lines.fields.LineTaxRate || 0,
                                taxCode: useData[d].fields.Lines.fields.LineTaxCode || '',
                                //TotalAmt: AmountGbp || 0,
                                curTotalAmt: currencyAmountGbp || currencySymbol + '0',
                                TaxTotal: TaxTotalGbp || 0,
                                TaxRate: TaxRateGbp || 0
                            };
                            lineItems.push(lineItemObj);
                        }

                        let salesorderrecord = {
                            id: useData[d].fields.ID,
                            lid: 'Edit Sales Order' + ' ' + useData[d].fields.ID,
                            socustomer: useData[d].fields.CustomerName,
                            salesOrderto: useData[d].fields.InvoiceToDesc,
                            shipto: useData[d].fields.ShipToDesc,
                            department: useData[d].fields.SaleClassName,
                            docnumber: useData[d].fields.DocNumber,
                            custPONumber: useData[d].fields.CustPONumber,
                            saledate: useData[d].fields.SaleDate ? moment(useData[d].fields.SaleDate).format('DD/MM/YYYY') : "",
                            duedate: useData[d].fields.DueDate ? moment(useData[d].fields.DueDate).format('DD/MM/YYYY') : "",
                            employeename: useData[d].fields.EmployeeName,
                            status: useData[d].fields.SalesStatus,
                            category: useData[d].fields.SalesCategory,
                            comments: useData[d].fields.Comments,
                            pickmemo: useData[d].fields.PickMemo,
                            ponumber: useData[d].fields.CustPONumber,
                            via: useData[d].fields.Shipping,
                            connote: useData[d].fields.ConNote,
                            reference: useData[d].fields.ReferenceNo,
                            currency: useData[d].fields.ForeignExchangeCode,
                            branding: useData[d].fields.MedType,
                            invoiceToDesc: useData[d].fields.InvoiceToDesc,
                            shipToDesc: useData[d].fields.ShipToDesc,
                            termsName: useData[d].fields.TermsName,
                            Total: totalInc,
                            TotalDiscount: totalDiscount,
                            LineItems: lineItems,
                            TotalTax: totalTax,
                            SubTotal: subTotal,
                            balanceDue: totalBalance,
                            saleCustField1: useData[d].fields.SaleCustField1,
                            saleCustField2: useData[d].fields.SaleCustField2,
                            totalPaid: totalPaidAmount,
                            isConverted: useData[d].fields.Converted,
                            unformattedSaleDate: new Date(useData[d].fields.SaleDate),
                            unformattedDueDate: new Date(useData[d].fields.DueDate)
                        };

                    
                        salesorderData.push(salesorderrecord);
                        templateObject.salesorderrecords.set(salesorderData);

                    
                        if (salesorderrecord) {
                            Meteor.call('readPrefMethod', localStorage.getItem('mycloudLogonID'), 'tblSalesOrderLine', function(error, result) {
                                if (error) {
                                } else {
                                    if (result) {
                                        for (let i = 0; i < result.customFields.length; i++) {
                                            let customcolumn = result.customFields;
                                            let columData = customcolumn[i].label;
                                            let columHeaderUpdate = customcolumn[i].thclass;
                                            let hiddenColumn = customcolumn[i].hidden;
                                            let columnClass = columHeaderUpdate.substring(columHeaderUpdate.indexOf(".") + 1);
                                            let columnWidth = customcolumn[i].width;
                                            $("" + columHeaderUpdate + "").html(columData);
                                            if (columnWidth != 0) {
                                                $("" + columHeaderUpdate + "").css('width', columnWidth);
                                            }
                                            if (hiddenColumn == true) {
                                                $("." + columnClass + "").addClass('hiddenColumn');
                                                $("." + columnClass + "").removeClass('showColumn');
                                            } else if (hiddenColumn == false) {
                                                $("." + columnClass + "").removeClass('hiddenColumn');
                                                $("." + columnClass + "").addClass('showColumn');
                                            }

                                        }
                                    }

                                }
                            });
                        }
                }

            }
        })
    };
    templateObject.getSalesOrderData();
})

Template.salesorderPrintTemp.helpers({
    salesorderrecords:() => {
        return Template.instance().salesorderrecords.get()
    },
    companyaddress1: () => {
        return localStorage.getItem('vs1companyaddress1');
    },
    companyaddress2: () => {
        return localStorage.getItem('vs1companyaddress2');
    },
    city: () => {
        return localStorage.getItem('vs1companyCity');
    },
    state: () => {
        return localStorage.getItem('companyState');
    },
    poBox: () => {
        return localStorage.getItem('vs1companyPOBox');
    },
    companyphone: () => {
        let phone = "Phone: "+ localStorage.getItem('vs1companyPhone');
        return phone;
    },
    companyabn: () => { //Update Company ABN
      let countryABNValue = "ABN: " + localStorage.getItem('vs1companyABN');
      if(LoggedCountry== "South Africa"){
        countryABNValue = "Vat No: " + localStorage.getItem('vs1companyABN');;
      }

        return countryABNValue;
    },
    companyReg: () => { //Add Company Reg
      let countryRegValue = '';
      if(LoggedCountry== "South Africa"){
        countryRegValue = "Reg No: " + localStorage.getItem('vs1companyReg');
      }

        return countryRegValue;
    },
    organizationname: () => {
        return localStorage.getItem('vs1companyName');
    },
    organizationurl: () => {
        return localStorage.getItem('vs1companyURL');
    },
})