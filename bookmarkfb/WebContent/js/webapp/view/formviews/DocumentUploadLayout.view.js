sap.ui.define([
    "publicservices/her/myrequests/view/formviews/util/Formatter",
    "publicservices/her/myrequests/model/formatter"
], function(F1, Formatter) {
	"use strict";
	/*
	 * Copyright (C) 2009-2014 SAP SE or an SAP affiliate company. All rights reserved
	 */
	return sap.ui.jsview("publicservices.her.myrequests.view.formviews.DocumentUploadLayout", {
		getControllerName: function() {
			return "publicservices.her.myrequests.view.formviews.DocumentUploadLayout";
		},
		createContent: function(oController) {
			sap.ui.getCore().loadLibrary('sap.ui.layout');

			var oLayout3 = new sap.ui.layout.form.ResponsiveGridLayout();

			this.oVL = new sap.ui.layout.VerticalLayout({
				content: [
						new sap.ui.layout.HorizontalLayout({
							layoutData: new sap.ui.layout.GridData({
								span: "L8 M8 S12"
							}),
						content: [
                    		new sap.m.Link({
								src: {
									path: 'value',
									formatter: '.getDocumentLink'
								},
								press: [oController.openFile, oController],
								target: "_blank",
								text: '{FileName}',
								visible: {
									path: 'FileNumber',
									formatter: Formatter.docLinkVisible
								}
							}),

                    		new sap.ui.unified.FileUploader({
								name: "myFileUpload",
								buttonOnly: true,
								/*iconOnly: {
                            path: 'FileNumber',
                            formatter: Formatter.docIconOnly
                        },*/
								iconOnly: false,
								buttonText: "{i18n>uploadBtnLbl}",
								/*icon: {
                            path: 'FileNumber',
                            formatter: Formatter.docIcon
                        },*/
								icon: "sap-icon://add",
								change: [oController.handleUploadPress, oController],
								visible: {
									parts: [{
										path: 'Status'
									}, {
										path: 'detailView>/status'
									}, {
										path: 'FileName'
									}],
									formatter: Formatter.docUploadBtnVisible
								},
								tooltip: "{i18n>uploadFile}",
								uploadComplete: [oController.handleUploaded, oController]
							}),

                    		new sap.ui.unified.FileUploader({
								name: "myFileUpload",
								buttonOnly: true,
								buttonText: "",
								change: [oController.handleUploadPress, oController],
								icon: "sap-icon://edit",
								iconOnly: true,
								visible: {
									parts: [{
										path: 'Status'
									}, {
										path: 'detailView>/status'
									}, {
										path: 'FileName'
									}],
									formatter: Formatter.documentEditVisible
								},
								tooltip: "{i18n>uploadFile}",
								uploadComplete: [oController.handleUploaded, oController]
							}).addStyleClass("editDoc"),

							new sap.ui.core.Icon({
								src: "sap-icon://warning",
								visible: {
									path: 'Status',
									formatter: Formatter.docWarningIcon
								},//"{errorState}",
								color: "red"
							}).addStyleClass("WarningIcon")

                ]
			}).addStyleClass('FileHBox'),
            
            new sap.m.Text({
						text: {
							path: 'LastChangeDate',
							formatter: Formatter.getDocumentStatus
						},
						visible: {
							path: 'FileNumber',
							formatter: Formatter.getDocumentDetails
						},
						layoutData: new sap.ui.layout.GridData({
							span: "L7 M7 S11"
						})
					}).addStyleClass("sapThemeLightText sapUiNoContentPadding docDetails"),
					
					new sap.m.ObjectStatus({
						visible: {
									path: 'Status',
									formatter: Formatter.docWarningIcon
						},
						text: {
							path: 'StatusReason',
							formatter: Formatter.getDocumentReuploadReasonText
						},
						state : "Error",
						layoutData: new sap.ui.layout.GridData({
							span: "L7 M7 S11"
						})
					}).addStyleClass("sapThemeLightText sapUiNoContentPadding docDetails")
				]
			}).addStyleClass('sapUiNoContentPadding');

			this.oFormElement = new sap.ui.layout.form.FormElement({ 
				label: new sap.m.Label({
					text: "{QuestionText}",
					required:{ 
						path: 'MandatoryInd', 
						formatter:Formatter.docMandatory
					} ,
					layoutData: new sap.ui.layout.GridData({
						span: "L4 M4 S12",
						linebreak: true
					})
				}).addStyleClass("docQuestionLabel"),
				fields: [this.oVL],
				layoutData: new sap.ui.layout.ResponsiveFlowLayoutData({
					linebreak: true,
					margin: false
				})
			});
			
			this.oFormCont = new sap.ui.layout.form.FormContainer({
				formElements: {
					path: 'RequiredDocSet',
					template: this.oFormElement

				}
			});

			this.oSimpleForm = new sap.ui.layout.form.Form("docsUploadForm", {
				title: '{i18n>requiredDocumentsTitle}',
				editable: true,
				layout: oLayout3,
				formContainers: [this.oFormCont]
			}).addStyleClass("documentUploadForm");
			
		return this.oSimpleForm;
		},
		
		onAfterRendering: function(){
			if(sap.ui.getCore().byId("docsUploadForm").getFormContainers()[0].getFormElements().length === 0){
				this.getModel("detailView").setProperty("/enableReqDocNoDataText", true);
			}
			else{
				this.getModel("detailView").setProperty("/enableReqDocNoDataText", false);
			}
		}
		
	});

});