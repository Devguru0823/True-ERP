import {PaymentsService} from '../payments/payments-service';
import { ReactiveVar } from 'meteor/reactive-var';
import { CoreService } from '../js/core-service';
import {EmployeeProfileService} from "../js/profile-service";
import {AccountService} from "../accounts/account-service";
import {UtilityService} from "../utility-service";
import { SideBarService } from '../js/sidebar-service';
import '../lib/global/indexdbstorage.js';

import { Template } from 'meteor/templating';
import './customerPayments.html';
import { FlowRouter } from 'meteor/ostrio:flow-router-extra';

let sideBarService = new SideBarService();
let utilityService = new UtilityService();
Template.customerpayment.onCreated(function(){
    const templateObject = Template.instance();
    templateObject.datatablerecords = new ReactiveVar([]);
    templateObject.tableheaderrecords = new ReactiveVar([]);

    templateObject.getDataTableList = function (data) {
        let amount = utilityService.modifynegativeCurrencyFormat(data.Amount)|| 0.00;
        let applied = utilityService.modifynegativeCurrencyFormat(data.Applied) || 0.00;
        let balance = utilityService.modifynegativeCurrencyFormat(data.Balance)|| 0.00;
        let totalPaid = utilityService.modifynegativeCurrencyFormat(data.TotalPaid)|| 0.00;
        let totalOutstanding = utilityService.modifynegativeCurrencyFormat(data.TotalBalance)|| 0.00;

        let paystatus = data.QuoteStatus || '';
        if(data.Deleted == true){
          paystatus = "Deleted";
        }else if (data.Reconciled == true){
          paystatus = "Rec";
        }else if(data.Deleted != true){
          if (data.PaidInFull == "Yes"){
           paystatus = "Full";
          }else{
           paystatus = "Part";
          }
        };
        var dataList = [
            data.PaymentID || '',
            data.PaymentDate !=''? moment(data.PaymentDate).format("YYYY/MM/DD"): data.PaymentDate,
            data.CompanyName || '',
            data.PaymentNo || "",
            data.ReferenceNo || "",
            amount || 0.00,
            data.BankAccountName || '',
            data.Department || '',
            applied || 0.00,
            data.PaymentMethodName || '',
            data.Notes || '',
            paystatus
        ];
        return dataList;
    }

    let headerStructure = [
        { index: 0, label: 'ID', class: 'colSortDate', active: false, width: "80", display: true },
        { index: 1, label: 'Date', class: 'colPaymentDate', active: true, width: "80", display: true },
        { index: 2, label: 'Customer Name', class: 'colCustomerName', active: true, width: "200", display: true },
        { index: 3, label: 'Payment', class: 'colPaymentNo', active: true, width: "110", display: true },
        { index: 4, label: 'Ref No.', class: 'colReceiptNo', active: true, width: "200", display: true },
        { index: 5, label: 'Amount', class: 'colPaymentAmount', active: true, width: "110", display: true },
        { index: 6, label: 'Bank', class: 'colBankAccount', active: true, width: "110" , display: true},
        { index: 7, label: 'Department', class: 'colDepartment', active: true, width: "200", display: true },
        { index: 8, label: 'Custom Field 1', class: 'colRefNo', active: false, width: "200" , display: true},
        { index: 9, label: 'Custom Field 2', class: 'colPaymentMethod', active: false, width: "200", display: true },
        { index: 10, label: 'Comments', class: 'colComments', active: true, width: "550", display: true },
        { index: 11, label: 'Status', class: 'colStatus', active: true, width: "120", display: true },
        ];
      templateObject.tableheaderrecords.set(headerStructure);

});

Template.customerpayment.onRendered(function() {
    $('.fullScreenSpin').css('display','inline-block');
    let templateObject = Template.instance();
    let paymentService = new PaymentsService();
    const customerList = [];
    let salesOrderTable;
    var splashArray = new Array();
    const dataTableList = [];
    const tableHeaderList = [];

    var today = moment().format('DD/MM/YYYY');
    var currentDate = new Date();
    var begunDate = moment(currentDate).format("DD/MM/YYYY");
    let fromDateMonth = (currentDate.getMonth() + 1);
    let fromDateDay = currentDate.getDate();
    if ((currentDate.getMonth() + 1) < 10) {
        fromDateMonth = "0" + (currentDate.getMonth() + 1);
    }

    if (currentDate.getDate() < 10) {
        fromDateDay = "0" + currentDate.getDate();
    }
    var fromDate = fromDateDay + "/" + (fromDateMonth) + "/" + currentDate.getFullYear();

    $("#date-input,#dateTo,#dateFrom").datepicker({
        showOn: 'button',
        buttonText: 'Show Date',
        buttonImageOnly: true,
        buttonImage: '/img/imgCal2.png',
        dateFormat: 'dd/mm/yy',
        showOtherMonths: true,
        selectOtherMonths: true,
        changeMonth: true,
        changeYear: true,
        yearRange: "-90:+10",
        onChangeMonthYear: function(year, month, inst){
        // Set date to picker
        $(this).datepicker('setDate', new Date(year, inst.selectedMonth, inst.selectedDay));
        // Hide (close) the picker
        // $(this).datepicker('hide');
        // // Change ttrigger the on change function
        // $(this).trigger('change');
       }
    });

    $("#dateFrom").val(fromDate);
    $("#dateTo").val(begunDate);

    $('#tblCustomerPayment tbody').on( 'click', 'tr', function () {
        var listData = $(this).closest('tr').attr('id');
        var checkDeleted = $(this).closest('tr').find('.colStatus').text() || '';
        if(listData){
          // if(checkDeleted == "Deleted"){
          //   swal('You Cannot View This Transaction', 'Because It Has Been Deleted', 'info');
          // }else{
            FlowRouter.go('/paymentcard?id=' + listData);
        //  }
        }
    });

    let urlParametersDateFrom = FlowRouter.current().queryParams.fromDate;
    let urlParametersDateTo = FlowRouter.current().queryParams.toDate;
    let urlParametersIgnoreDate = FlowRouter.current().queryParams.ignoredate;
    if (urlParametersDateFrom) {
        if (urlParametersIgnoreDate == true) {
            $('#dateFrom').attr('readonly', true);
            $('#dateTo').attr('readonly', true);
        } else {

            $("#dateFrom").val(urlParametersDateFrom != '' ? moment(urlParametersDateFrom).format("DD/MM/YYYY") : urlParametersDateFrom);
            $("#dateTo").val(urlParametersDateTo != '' ? moment(urlParametersDateTo).format("DD/MM/YYYY") : urlParametersDateTo);
        }
    }
    tableResize();
});

Template.customerpayment.events({
    'click #newSalesOrder' : function(event){
        FlowRouter.go('/salesordercard');
    },
    'click .salesOrderList' : function(event){
        FlowRouter.go('/salesorderslist');
    },
    'click #newInvoice' : function(event){
        FlowRouter.go('/invoicecard');
    },
    'click .invoiceList' : function(event){
        FlowRouter.go('/invoicelist');
    },
    'click #newQuote' : function(event){
        FlowRouter.go('/quotecard');
    },
    'click .QuoteList' : function(event){
        FlowRouter.go('/quoteslist');
    },
    'click .chkDatatable' : function(event){
        var columns = $('#tblCustomerPayment th');
        let columnDataValue = $(event.target).closest("div").find(".divcolumn").text();

        $.each(columns, function(i,v) {
            let className = v.classList;
            let replaceClass = className[1];

            if(v.innerText == columnDataValue){
                if($(event.target).is(':checked')){
                    $("."+replaceClass+"").css('display','table-cell');
                    $("."+replaceClass+"").css('padding','.75rem');
                    $("."+replaceClass+"").css('vertical-align','top');
                }else{
                    $("."+replaceClass+"").css('display','none');
                }
            }
        });
    },
    'keyup #tblCustomerPayment_filter input': function (event) {
          if($(event.target).val() != ''){
            $(".btnRefreshCustomerPayment").addClass('btnSearchAlert');
          }else{
            $(".btnRefreshCustomerPayment").removeClass('btnSearchAlert');
          }
          if (event.keyCode == 13) {
             $(".btnRefreshCustomerPayment").trigger("click");
          }
        },
    'click .btnRefreshCustomerPayment':function(event){
        let templateObject = Template.instance();
        let utilityService = new UtilityService();
        let tableProductList;
        const dataTableList = [];
        var splashArrayInvoiceList = new Array();
        const lineExtaSellItems = [];
        $('.fullScreenSpin').css('display', 'inline-block');
        let dataSearchName = $('#tblCustomerPayment_filter input').val();
        if (dataSearchName.replace(/\s/g, '') != '') {
            sideBarService.getNewCustomerPaymentByNameOrID(dataSearchName).then(function (data) {
                $(".btnRefreshCustomerPayment").removeClass('btnSearchAlert');
                let lineItems = [];
                let lineItemObj = {};
                if (data.tcustomerpayment.length > 0) {
                  for (let i = 0; i < data.tcustomerpayment.length; i++) {
                    let amount = utilityService.modifynegativeCurrencyFormat(data.tcustomerpayment[i].fields.Amount)|| 0.00;
                  let applied = utilityService.modifynegativeCurrencyFormat(data.tcustomerpayment[i].fields.Applied) || 0.00;
                  // Currency+''+data.tcustomerpayment[i].TotalTax.toLocaleString(undefined, {minimumFractionDigits: 2});
                  let balance = utilityService.modifynegativeCurrencyFormat(data.tcustomerpayment[i].fields.Balance)|| 0.00;
                  let totalPaid = utilityService.modifynegativeCurrencyFormat(data.tcustomerpayment[i].fields.TotalPaid)|| 0.00;
                  let totalOutstanding = utilityService.modifynegativeCurrencyFormat(data.tcustomerpayment[i].fields.TotalBalance)|| 0.00;

                  let paystatus = '';
                  if(data.tcustomerpayment[i].fields.Deleted == true){
                    paystatus = "Deleted";
                  }else if(data.tcustomerpayment[i].fields.Lines == null){
                    paystatus = "Deleted";
                  }else if(data.tcustomerpayment[i].fields.Deleted != true){
                    if(data.tcustomerpayment[i].fields.Payment == true){
                      paystatus = "Full";
                    }else if ((data.tcustomerpayment[i].fields.Applied > 0) && (data.tcustomerpayment[i].fields.Amount > data.tcustomerpayment[i].fields.Applied)){
                      paystatus = "Part";
                    }else if (data.tcustomerpayment[i].fields.Reconciled == true){
                      paystatus = "Rec";
                    }
                  };

                  var dataList = {
                      id: data.tcustomerpayment[i].fields.ID || '',
                      sortdate: data.tcustomerpayment[i].fields.PaymentDate !=''? moment(data.tcustomerpayment[i].fields.PaymentDate).format("YYYY/MM/DD"): data.tcustomerpayment[i].fields.PaymentDate,
                      paymentdate: data.tcustomerpayment[i].fields.PaymentDate !=''? moment(data.tcustomerpayment[i].fields.PaymentDate).format("DD/MM/YYYY"): data.tcustomerpayment[i].fields.PaymentDate,
                      customername: data.tcustomerpayment[i].fields.CompanyName || '',
                      paymentamount: amount || 0.00,
                      applied: applied || 0.00,
                      balance: balance || 0.00,
                      paystatus:paystatus||'',
                      bankaccount: data.tcustomerpayment[i].fields.AccountName || '',
                      department: data.tcustomerpayment[i].fields.DeptClassName || '',
                      refno: data.tcustomerpayment[i].fields.ReferenceNo || '',
                      paymentmethod: data.tcustomerpayment[i].fields.PaymentMethodName || '',
                      notes: data.tcustomerpayment[i].fields.Notes || ''
                    };

                        //if(data.tinvoiceex[i].fields.Deleted == false){
                        //splashArrayInvoiceList.push(dataList);
                        dataTableList.push(dataList);
                        //}


                        //}
                    }
                    templateObject.datatablerecords.set(dataTableList);

                    let item = templateObject.datatablerecords.get();
                    $('.fullScreenSpin').css('display', 'none');
                    if (dataTableList) {
                        var datatable = $('#tblCustomerPayment').DataTable();
                        $("#tblCustomerPayment > tbody").empty();
                        for (let x = 0; x < item.length; x++) {
                            $("#tblCustomerPayment > tbody").append(
                                ' <tr class="dnd-moved" id="' + item[x].id + '" style="cursor: pointer;">' +
                                '<td contenteditable="false" class="colSortDate hiddenColumn">' + item[x].sortdate + '</td>' +
                                '<td contenteditable="false" class="colPaymentDate" ><span style="display:none;">' + item[x].sortdate + '</span>' + item[x].paymentdate + '</td>' +
                                '<td contenteditable="false" class="colPaymentNo">' + item[x].id + '</td>' +
                                '<td contenteditable="false" class="colReceiptNo" >' + item[x].refno + '</td>' +
                                '<td contenteditable="false" class="colPaymentAmount">' + item[x].paymentamount + '</td>' +
                                '<td contenteditable="false" class="colCustomerName">' + item[x].customername + '</td>' +
                                '<td contenteditable="false" class="colBankAccount">' + item[x].bankaccount + '</td>' +
                                '<td contenteditable="false" class="colDepartment">' + item[x].department + '</td>' +
                                '<td contenteditable="false" class="colStatus">' + item[x].paystatus + '</td>' +
                                '<td contenteditable="false" class="colRefNo hiddenColumn">' + item[x].refno + '</td>' +
                                '<td contenteditable="false" class="colPaymentMethod hiddenColumn">' + item[x].paymentmethod + '</td>' +
                                '<td contenteditable="false" class="colNotes">' + item[x].notes + '</td>' +
                                '</tr>');

                        }
                        $('.dataTables_info').html('Showing ' + data.tcustomerpayment.length + ' of ' + data.tcustomerpayment.length + ' entries');

                    }

                } else {
                    $('.fullScreenSpin').css('display', 'none');

                    swal({
                        title: 'Question',
                        text: "Payment does not exist, would you like to create it?",
                        type: 'question',
                        showCancelButton: true,
                        confirmButtonText: 'Yes',
                        cancelButtonText: 'No'
                    }).then((result) => {
                        if (result.value) {
                            FlowRouter.go('/customerawaitingpayments');
                        } else if (result.dismiss === 'cancel') {
                            //$('#productListModal').modal('toggle');
                        }
                    });
                }
                MakeNegative();
            }).catch(function (err) {
                $('.fullScreenSpin').css('display', 'none');
            });
        } else {

          $(".btnRefresh").trigger("click");
        }

        function MakeNegative() {
            $('td').each(function(){
                if($(this).text().indexOf('-'+Currency) >= 0) $(this).addClass('text-danger')
            });
            $('td.colStatus').each(function(){
                if($(this).text() == "Deleted") $(this).addClass('text-deleted');
            });
        };
    },
    'click #exportbtn': function () {

        $('.fullScreenSpin').css('display','inline-block');
        jQuery('#tblCustomerPayment_wrapper .dt-buttons .btntabletocsv').click();
        $('.fullScreenSpin').css('display','none');

    },
    'click .btnNewPayment': function () {
        FlowRouter.go('/paymentcard');
    },
    'click .btnAwaitingPayment': function () {
        FlowRouter.go('/customerawaitingpayments');
    },
    'click .btnRefresh': function () {
        $('.fullScreenSpin').css('display','inline-block');
        let templateObject = Template.instance();

        var currentBeginDate = new Date();
        var begunDate = moment(currentBeginDate).format("DD/MM/YYYY");
        let fromDateMonth = (currentBeginDate.getMonth() + 1);

        let fromDateDay = currentBeginDate.getDate();
        if ((currentBeginDate.getMonth()+1) < 10) {
            fromDateMonth = "0" + (currentBeginDate.getMonth() + 1);
        } else {
            fromDateMonth = (currentBeginDate.getMonth() + 1);
        }


        if (currentBeginDate.getDate() < 10) {
            fromDateDay = "0" + currentBeginDate.getDate();
        }
        var toDate = currentBeginDate.getFullYear() + "-" + (fromDateMonth) + "-" + (fromDateDay);
        let prevMonth11Date = (moment().subtract(reportsloadMonths, 'months')).format("YYYY-MM-DD");

        sideBarService.getTCustomerPaymentList(initialDataLoad,0).then(function(data) {
            addVS1Data('TCustomerPayment',JSON.stringify(data)).then(function (datareturn) {

            }).catch(function (err) {

            });
        }).catch(function(err) {

        });


        sideBarService.getTPaymentList(prevMonth11Date, toDate, true, initialReportLoad, 0,'').then(function(dataPaymentList) {
            addVS1Data('TPaymentList', JSON.stringify(dataPaymentList)).then(function(datareturn) {
                sideBarService.getAllTSupplierPaymentListData(prevMonth11Date, toDate, true, initialReportLoad, 0).then(function(dataSuppPay) {
                    addVS1Data('TSupplierPaymentList', JSON.stringify(dataSuppPay)).then(function(datareturn) {
                        sideBarService.getAllTCustomerPaymentListData(prevMonth11Date, toDate, true, initialReportLoad, 0).then(function(dataCustPay) {
                            addVS1Data('TCustomerPaymentList', JSON.stringify(dataCustPay)).then(function(datareturn) {
                              setTimeout(function () {
                                window.open('/customerpayment', '_self');
                              }, 2000);
                            }).catch(function(err) {
                              setTimeout(function () {
                                window.open('/customerpayment', '_self');
                              }, 2000);
                            });
                        }).catch(function(err) {
                          setTimeout(function () {
                            window.open('/customerpayment', '_self');
                          }, 2000);
                        });
                    }).catch(function(err) {
                        setTimeout(function () {
                            window.open('/customerpayment', '_self');
                         }, 2000);
                    });
                }).catch(function(err) {
                  setTimeout(function () {
                    window.open('/customerpayment', '_self');
                  }, 2000);
                });
            }).catch(function(err) {
              setTimeout(function () {
                window.open('/customerpayment', '_self');
              }, 2000);
            });
        }).catch(function(err) {
          setTimeout(function () {
            window.open('/customerpayment', '_self');
          }, 2000);

        });

    }


});
Template.customerpayment.helpers({
    datatablerecords : () => {
        return Template.instance().datatablerecords.get().sort(function(a, b){
            if (a.paymentdate == 'NA') {
                return 1;
            }
            else if (b.paymentdate == 'NA') {
                return -1;
            }
            return (a.paymentdate.toUpperCase() > b.paymentdate.toUpperCase()) ? 1 : -1;
        });
    },
    tableheaderrecords: () => {
        return Template.instance().tableheaderrecords.get();
    },
    salesCloudPreferenceRec: () => {
        return CloudPreference.findOne({userid:localStorage.getItem('mycloudLogonID'),PrefName:'tblCustomerPayment'});
    },
    loggedCompany: () => {
        return localStorage.getItem("mySession") || "";
      },
    
      // custom fields displaysettings
      custfields: () => {
        return Template.instance().custfields.get();
      },
    
      // custom fields displaysettings
      displayfields: () => {
        return Template.instance().displayfields.get();
      },
      convertedStatus: () => {
        return Template.instance().convertedStatus.get()
      },
    
      apiFunction:function() { // do not use arrow function
        return sideBarService.getAllTCustomerPaymentListData
      },
    
      searchAPI: function() {
        return sideBarService.getAllTCustomerPaymentListDataByPaymentID
      },
    
      apiParams: function() {
        return ['dateFrom', 'dateTo', 'ignoredate', 'limitCount', 'limitFrom', 'deleteFilter'];
      },
    
      service: ()=>{
        return sideBarService;
      },
    
      datahandler: function () {
        let templateObject = Template.instance();
        return function(data) {
            let dataReturn =  templateObject.getDataTableList(data)
            return dataReturn
        }
      },
    
      exDataHandler: function() {
        let templateObject = Template.instance();
        return function(data) {
          let dataReturn = templateObject.getDataTableList(data);
          return dataReturn
        }
      }

});
