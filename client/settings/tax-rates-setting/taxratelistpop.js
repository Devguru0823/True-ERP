import {
    TaxRateService
} from "../settings-service";
import {
    ReactiveVar
} from 'meteor/reactive-var';
import {
    SideBarService
} from '../../js/sidebar-service';
import '../../lib/global/indexdbstorage.js';

import { Template } from 'meteor/templating';
import './taxratelistpop.html';
import { FlowRouter } from 'meteor/ostrio:flow-router-extra';
import moment from "moment";

let taxRateService = new TaxRateService();
let sideBarService = new SideBarService();

Template.taxratelistpop.onCreated(function () {
    let templateObject = Template.instance();
    templateObject.tableheaderrecords = new ReactiveVar([]);

    templateObject.getDataTableList = function(data) {
        let taxRate = (data.Rate * 100).toFixed(2) + "%";
    let tdPurchaseDef = "";
    let tdSalesDef = "";
    // Check if Purchase Default is checked
    if (data.IsDefaultPurchase == true) {
      tdPurchaseDef =
        '<span style="display:none;">' +
        data.IsDefaultPurchase +
        '</span><div class="custom-control custom-switch chkBox text-center"><input class="custom-control-input chkBox" type="checkbox" id="isPurchasedefault-' +
        data.TaxCodeID +
        '" checked><label class="custom-control-label chkBox" for="isPurchasedefault-' +
        data.TaxCodeID +
        '"></label></div>';
    } else {
      tdPurchaseDef =
        '<span style="display:none;">' +
        data.IsDefaultPurchase +
        '</span><div class="custom-control custom-switch chkBox text-center"><input class="custom-control-input chkBox" type="checkbox" id="isPurchasedefault-' +
        data.TaxCodeID +
        '"><label class="custom-control-label chkBox" for="isPurchasedefault-' +
        data.TaxCodeID +
        '"></label></div>';
    }
    // Check if Sales Default is checked
    if (data.IsDefaultSales == true) {
      tdSalesDef =
        '<span style="display:none;">' +
        data.IsDefaultSales +
        '</span><div class="custom-control custom-switch chkBox text-center"><input class="custom-control-input chkBox" type="checkbox" id="isSalesdefault-' +
        data.TaxCodeID +
        '" checked><label class="custom-control-label chkBox" for="isSalesdefault-' +
        data.TaxCodeID +
        '"></label></div>';
    } else {
      tdSalesDef =
        '<span style="display:none;">' +
        data.IsDefaultSales +
        '</span><div class="custom-control custom-switch chkBox text-center"><input class="custom-control-input chkBox" type="checkbox" id="isSalesdefault-' +
        data.TaxCodeID +
        '"><label class="custom-control-label chkBox" for="isSalesdefault-' +
        data.TaxCodeID +
        '"></label></div>';
    }
    let dataList = [
      data.TaxCodeID || "",
      data.Name || "",
      data.Description || "",
      taxRate || "",
      tdPurchaseDef,
      tdSalesDef,
      data.Active ? "" : "In-Active",
    ];
    return dataList;
  };

  let headerStructure = [
    { index: 0, label: "ID", class: "colTaxRateId", active: false, display: true, width: "20" },
    { index: 1, label: "Name", class: "colTaxRateName", active: true, display: true, width: "200" },
    { index: 2, label: "Description", class: "colTaxRateDesc", active: true, display: true, width: "840" },
    { index: 3, label: "Rate", class: "colTaxRate", active: true, display: true, width: "100" },
    { index: 4, label: "Purchase Default", class: "colTaxRatePurchaseDefault", active: true, display: true, width: "180" },
    { index: 5, label: "Sales Default", class: "colTaxRateSalesDefault", active: true, display: true, width: "180" },
    { index: 6, label: "Status", class: "colStatus", active: true, display: true, width: "120" },
  ];
  templateObject.tableheaderrecords.set(headerStructure);
});

Template.taxratelistpop.onRendered(function () {
    let templateObject = Template.instance();

    let prefix = templateObject.data.custid ? templateObject.data.custid : '';
    $(`#taxRateListModal${prefix}`).on('shown.bs.modal', function(){
        setTimeout(function() {
            $(`#tblTaxRate${prefix}_filter .form-control-sm`).get(0).focus()
        }, 500);
    });
    templateObject.saveTaxRate = function (maiaMode=false, isMakeActive) {
        playSaveAudio();
        let taxRateService = new TaxRateService();
        setTimeout(function () {
          $(".fullScreenSpin").css("display", "inline-block");
          var url = FlowRouter.current().path;
    
          let taxSelected = $("#taxSelected").val();
          let taxtID = $("#edtTaxID").val();
          let taxName = $("#edtTaxName").val();
          let taxDesc = $("#edtTaxDesc").val();
          let taxRate = parseFloat($("#edtTaxRate").val() / 100);
          let active = $("#view-in-active button").hasClass("btnDeleteTaxRate");
          if (maiaMode) {
            active = isMakeActive;
          }
          let isDefaultPurchase = $("#isDefaultPurchase").is(':checked');
          let isDefaultSales = $("#isDefaultSales").is(':checked');
          let objDetails = "";
          if (taxName === "") {
            Bert.alert("<strong>WARNING:</strong> Tax Rate cannot be blank!", "warning");
            $(".fullScreenSpin").css("display", "none");
            e.preventDefault();
          }
    
          if (taxtID === "") {
            taxRateService
              .checkTaxRateByName(taxName)
              .then(function (data) {
                taxtID = data.ttaxcode[0].Id;
                objDetails = {
                  type: "TTaxcode",
                  fields: {
                    ID: parseInt(taxtID),
                    Active: active,
                    CodeName: taxName,
                    Description: taxDesc,
                    Rate: taxRate,
                    IsDefaultPurchase: isDefaultPurchase,
                    IsDefaultSales: isDefaultSales,
                    PublishOnVS1: true,
                  },
                };
                taxRateService
                  .saveTaxRate(objDetails)
                  .then(function (objDetails) {
                    sideBarService
                      .getTaxRateVS1List()
                      .then(function (dataReload) {
                        addVS1Data("TTaxcodeVS1List", JSON.stringify(dataReload))
                          .then(function (datareturn) {
                            if (url.includes("/productview")) {
                              if (taxSelected === "sales") {
                                $("#slttaxcodesales").val(taxName);
                              } else if (taxSelected === "purchase") {
                                $("#slttaxcodepurchase").val(taxName);
                              } else {
                                $("#sltTaxCode").val(taxName);
                              }
                            }
    
                            if (url.includes("/accountsoverview")) {
                              $("#sltTaxCode").val(taxName);
                            }
                            $("#addTaxRateModal").modal("toggle");
                            $(".fullScreenSpin").css("display", "none");
                            location.reload(true);
                          })
                          .catch(function (err) {
                            if (url.includes("/productview")) {
                              if (taxSelected === "sales") {
                                $("#slttaxcodesales").val(taxName);
                              } else if (taxSelected === "purchase") {
                                $("#slttaxcodepurchase").val(taxName);
                              } else {
                                $("#sltTaxCode").val(taxName);
                              }
                            }
    
                            if (url.includes("/accountsoverview")) {
                              $("#sltTaxCode").val(taxName);
                            }
                            $("#addTaxRateModal").modal("toggle");
                            $(".fullScreenSpin").css("display", "none");
                          });
                      })
                      .catch(function (err) {
                        if (url.includes("/productview")) {
                          if (taxSelected === "sales") {
                            $("#slttaxcodesales").val(taxName);
                          } else if (taxSelected === "purchase") {
                            $("#slttaxcodepurchase").val(taxName);
                          } else {
                            $("#sltTaxCode").val(taxName);
                          }
                        }
                        if (url.includes("/accountsoverview")) {
                          $("#sltTaxCode").val(taxName);
                        }
                        $("#addTaxRateModal").modal("toggle");
                        $(".fullScreenSpin").css("display", "none");
                      });
                    var selectLineID = $("#selectLineID").val();
                    if (selectLineID) {
                      $("#" + selectLineID + " .lineTaxCode").val(taxName);
                    }
                  })
                  .catch(function (err) {
                    swal({
                      title: "Oooops...",
                      text: err,
                      type: "error",
                      showCancelButton: false,
                      confirmButtonText: "Try Again",
                    }).then((result) => {
                      if (result.value) {
                        // Meteor._reload.reload();
                        $("#addTaxRateModal").modal("toggle");
                        $(".fullScreenSpin").css("display", "none");
                      } else if (result.dismiss === "cancel") {
                      }
                    });
                    $(".fullScreenSpin").css("display", "none");
                  });
              })
              .catch(function (err) {
                objDetails = {
                  type: "TTaxcode",
                  fields: {
                    // Id: taxCodeId,
                    Active: active,
                    CodeName: taxName,
                    Description: taxDesc,
                    Rate: taxRate,
                    IsDefaultPurchase: isDefaultPurchase,
                    IsDefaultSales: isDefaultSales,
                    PublishOnVS1: true,
                  },
                };
    
                taxRateService
                  .saveTaxRate(objDetails)
                  .then(function (objDetails) {
                    sideBarService
                      .getTaxRateVS1List()
                      .then(function (dataReload) {
                        addVS1Data("TTaxcodeVS1List", JSON.stringify(dataReload))
                          .then(function (datareturn) {
                            if (url.includes("/productview")) {
                              if (taxSelected === "sales") {
                                $("#slttaxcodesales").val(taxName);
                              } else if (taxSelected === "purchase") {
                                $("#slttaxcodepurchase").val(taxName);
                              } else {
                                $("#sltTaxCode").val(taxName);
                              }
                            }
                            if (url.includes("/accountsoverview")) {
                              $("#sltTaxCode").val(taxName);
                            }
                            $("#addTaxRateModal").modal("toggle");
                            $(".fullScreenSpin").css("display", "none");
                            location.reload(true);
                          })
                          .catch(function (err) {
                            if (url.includes("/productview")) {
                              if (taxSelected === "sales") {
                                $("#slttaxcodesales").val(taxName);
                              } else if (taxSelected === "purchase") {
                                $("#slttaxcodepurchase").val(taxName);
                              } else {
                                $("#sltTaxCode").val(taxName);
                              }
                            }
                            if (url.includes("/accountsoverview")) {
                              $("#sltTaxCode").val(taxName);
                            }
                            $("#addTaxRateModal").modal("toggle");
                            $(".fullScreenSpin").css("display", "none");
                          });
                      })
                      .catch(function (err) {
                        if (url.includes("/productview")) {
                          if (taxSelected === "sales") {
                            $("#slttaxcodesales").val(taxName);
                          } else if (taxSelected === "purchase") {
                            $("#slttaxcodepurchase").val(taxName);
                          } else {
                            $("#sltTaxCode").val(taxName);
                          }
                        }
                        if (url.includes("/accountsoverview")) {
                          $("#sltTaxCode").val(taxName);
                        }
                        $("#addTaxRateModal").modal("toggle");
                        $(".fullScreenSpin").css("display", "none");
                      });
                    var selectLineID = $("#selectLineID").val();
                    if (selectLineID) {
                      $("#" + selectLineID + " .lineTaxCode").val(taxName);
                    }
                  })
                  .catch(function (err) {
                    swal({
                      title: "Oooops...",
                      text: err,
                      type: "error",
                      showCancelButton: false,
                      confirmButtonText: "Try Again",
                    }).then((result) => {
                      if (result.value) {
                        // Meteor._reload.reload();
                        $("#addTaxRateModal").modal("toggle");
                        $(".fullScreenSpin").css("display", "none");
                      } else if (result.dismiss === "cancel") {
                      }
                    });
                    $(".fullScreenSpin").css("display", "none");
                  });
              });
          } else {
            objDetails = {
              type: "TTaxcode",
              fields: {
                ID: parseInt(taxtID),
                Active: active,
                CodeName: taxName,
                Description: taxDesc,
                Rate: taxRate,
                IsDefaultPurchase: isDefaultPurchase,
                IsDefaultSales: isDefaultSales,
                PublishOnVS1: true,
              },
            };
            taxRateService
              .saveTaxRate(objDetails)
              .then(function (objDetails) {
                sideBarService
                  .getTaxRateVS1List()
                  .then(function (dataReload) {
                    addVS1Data("TTaxcodeVS1List", JSON.stringify(dataReload))
                      .then(function (datareturn) {
                        if (url.includes("/productview")) {
                          if (taxSelected === "sales") {
                            $("#slttaxcodesales").val(taxName);
                          } else if (taxSelected === "purchase") {
                            $("#slttaxcodepurchase").val(taxName);
                          } else {
                            $("#sltTaxCode").val(taxName);
                          }
                        }
    
                        if (url.includes("/accountsoverview")) {
                          $("#sltTaxCode").val(taxName);
                        }
                        $("#addTaxRateModal").modal("toggle");
                        $(".fullScreenSpin").css("display", "none");
                        location.reload(true);
                      })
                      .catch(function (err) {
                        // Meteor._reload.reload();
                        $("#addTaxRateModal").modal("toggle");
                        $(".fullScreenSpin").css("display", "none");
                      });
                  })
                  .catch(function (err) {
                    if (url.includes("/productview")) {
                      if (taxSelected === "sales") {
                        $("#slttaxcodesales").val(taxName);
                      } else if (taxSelected === "purchase") {
                        $("#slttaxcodepurchase").val(taxName);
                      } else {
                        $("#sltTaxCode").val(taxName);
                      }
                    }
                    if (url.includes("/accountsoverview")) {
                      $("#sltTaxCode").val(taxName);
                    }
                    $("#addTaxRateModal").modal("toggle");
                    $(".fullScreenSpin").css("display", "none");
                  });
                var selectLineID = $("#selectLineID").val();
                if (selectLineID) {
                  $("#" + selectLineID + " .lineTaxCode").val(taxName);
                }
              })
              .catch(function (err) {
                swal({
                  title: "Oooops...",
                  text: err,
                  type: "error",
                  showCancelButton: false,
                  confirmButtonText: "Try Again",
                }).then((result) => {
                  if (result.value) {
                    // Meteor._reload.reload();
                    $("#addTaxRateModal").modal("toggle");
                    $(".fullScreenSpin").css("display", "none");
                  } else if (result.dismiss === "cancel") {
                  }
                });
                $(".fullScreenSpin").css("display", "none");
              });
          }
        }, delayTimeAfterSound);
      }
});

Template.taxratelistpop.events({
    'click .btnRefreshTax': function (event) {
        let templateObject = Template.instance();
        $('.fullScreenSpin').css('display', 'inline-block');
        const customerList = [];
        const clientList = [];
        let salesOrderTable;
        var splashArray = new Array();
        var splashArrayTaxRateList = new Array();
        const dataTableList = [];
        const tableHeaderList = [];

        let dataSearchName = $('#tblTaxRate_filter input').val();
        var currentLoc = FlowRouter.current().route.path;
        if (dataSearchName.replace(/\s/g, '') != '') {
            sideBarService.getTaxRateVS1ByName(dataSearchName).then(function (data) {
                let lineItems = [];
                let lineItemObj = {};
                if (data.ttaxcodevs1.length > 0) {
                    for (let i = 0; i < data.ttaxcodevs1.length; i++) {
                        let taxRate = (data.ttaxcodevs1[i].fields.Rate * 100).toFixed(2);
                        var dataList = [
                            data.ttaxcodevs1[i].fields.ID || '',
                            data.ttaxcodevs1[i].fields.CodeName || '',
                            data.ttaxcodevs1[i].fields.Description || '-',
                            taxRate || 0,
                        ];

                        let taxcoderecordObj = {
                            codename: data.ttaxcodevs1[i].fields.CodeName || ' ',
                            coderate: taxRate || ' ',
                        };

                        // taxCodesList.push(taxcoderecordObj);

                        splashArrayTaxRateList.push(dataList);
                    }

                    var datatable = $('#tblTaxRate').DataTable();
                    datatable.clear();
                    datatable.rows.add(splashArrayTaxRateList);
                    datatable.draw(false);

                    $('.fullScreenSpin').css('display', 'none');
                } else {

                    $('.fullScreenSpin').css('display', 'none');
                    $('#taxRateListModal').modal('toggle');
                    swal({
                        title: 'Question',
                        text: "Tax Code does not exist, would you like to create it?",
                        type: 'question',
                        showCancelButton: true,
                        confirmButtonText: 'Yes',
                        cancelButtonText: 'No'
                    }).then((result) => {
                        if (result.value) {
                            $('#newTaxRateModal').modal('toggle');
                            $('#edtTaxNamePop').val(dataSearchName);
                        } else if (result.dismiss === 'cancel') {
                            $('#newTaxRateModal').modal('toggle');
                        }
                    });

                }

            }).catch(function (err) {
                $('.fullScreenSpin').css('display', 'none');
            });
        } else {
            sideBarService.getTaxRateVS1().then(function (data) {

                let records = [];
                let inventoryData = [];
                for (let i = 0; i < data.ttaxcodevs1.length; i++) {
                    let taxRate = (data.ttaxcodevs1[i].fields.Rate * 100).toFixed(2);
                    var dataList = [
                        data.ttaxcodevs1[i].fields.Id || '',
                        data.ttaxcodevs1[i].fields.CodeName || '',
                        data.ttaxcodevs1[i].fields.Description || '-',
                        taxRate || 0,
                    ];

                    let taxcoderecordObj = {
                        codename: data.ttaxcodevs1[i].fields.CodeName || ' ',
                        coderate: taxRate || ' ',
                    };

                    // taxCodesList.push(taxcoderecordObj);

                    splashArrayTaxRateList.push(dataList);
                }
                var datatable = $('#tblTaxRate').DataTable();
                datatable.clear();
                datatable.rows.add(splashArrayTaxRateList);
                datatable.draw(false);

                $('.fullScreenSpin').css('display', 'none');
            }).catch(function (err) {
                $('.fullScreenSpin').css('display', 'none');
            });
        }
    },
    'keyup #tblTaxRate_filter input': function (event) {
        if (event.keyCode == 13) {
            $(".btnRefreshTax").trigger("click");
        }
    },
    'click .btnAddNewTax':function(){
        $("#newTaxRateModal").modal("show");
    }
});

Template.taxratelistpop.helpers({
    tableheaderrecords: () => {
        return Template.instance().tableheaderrecords.get();
    },
    apiFunction:function() {
        let sideBarService = new SideBarService();
        return sideBarService.getTaxRateVS1List;
    },

    searchAPI: function() {
        return sideBarService.getTaxRateVS1ByName;
    },

    service: ()=>{
        let sideBarService = new SideBarService();
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
            let dataReturn =  templateObject.getDataTableList(data)
            return dataReturn
        }
    },

    apiParams: function() {
        return [];
    },
    tablename: () => {
        let templateObject = Template.instance();
        return 'tblTaxRate'+templateObject.data.custid;
      },
});

Template.registerHelper('equals', function (a, b) {
    return a === b;
});
