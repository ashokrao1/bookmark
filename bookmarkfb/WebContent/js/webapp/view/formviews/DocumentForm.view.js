sap.ui.define([
    "publicservices/her/myrequests/view/formviews/util/Formatter"
], function(Formatter) {
    "use strict";
    /*
     * Copyright (C) 2009-2014 SAP SE or an SAP affiliate company. All rights reserved
     */
    return sap.ui.jsview("publicservices.her.myrequests.view.formviews.DocumentForm", {
        getControllerName: function() {
            return "publicservices.her.myrequests.view.formviews.DocumentForm";
        },
        createContent: function(oController) {
            sap.ui.getCore().loadLibrary('sap.ui.layout');

            var oLayout3 = new sap.ui.layout.form.ResponsiveGridLayout();

            var oField = new sap.ui.layout.VerticalLayout({
                content: [
                    new sap.ui.layout.HorizontalLayout({
                        //styleClass: "sapUiNoContentPadding FileHBox",
                        layoutData: new sap.ui.layout.GridData({
                            span: "L7 M7 S11"
                        }),
                        content: [
                            new sap.m.Link({
                                src: {
                                    path: 'DocumentQuestions>value',
                                    formatter: Formatter.getDocumentName
                                },
                                press: [oController.onFileOpen, oController],
                                target: "_blank",
                                text: {
                                    path: 'DocumentQuestions>value',
                                    formatter: Formatter.getDocumentName
                                },
                                visible: {
                                    path: 'DocumentQuestions>value',
                                    formatter: Formatter.documentEditVisible
                                }
                            }),

                            new sap.ui.unified.FileUploader({
                                name: "myFileUpload",
                                sameFilenameAllowed: true,
                                buttonOnly: true,
                                //iconOnly: false,
                                //buttonText: "{i18n>uploadDoc}",
                                //icon: "sap-icon://add",
                                change: [oController.onUpload, oController],
                                visible: {
                                    path: 'DocumentQuestions>value',
                                    formatter: Formatter.documentUploadVisible
                                },
                                enabled: {
                                    path: 'DocumentQuestions>enable',
                                    formatter: Formatter.formatEnableField
                                },
                                //tooltip: "{i18n>uploadFile}",
                                uploadComplete: [oController.onUploadFinished, oController]
                            }),

                            new sap.ui.unified.FileUploader({
                                name: "myFileUpload",
                                buttonOnly: true,
                                sameFilenameAllowed: true,
                                buttonText: "",
                                change: [oController.onUpload, oController],
                                icon: "sap-icon://edit",
                                iconOnly: true,
                                visible: {
                                    path: 'DocumentQuestions>value',
                                    formatter: Formatter.documentEditVisible
                                },
                                enabled: "{DocumentQuestions>enable}",
                                tooltip: "{i18n>uploadFile}",
                                uploadComplete: [oController.onUploadFinished, oController]
                            }).addStyleClass("editDoc"),

                            new sap.ui.core.Icon({
                                src: "sap-icon://warning",
                                visible: "{DocumentQuestions>errorState}",
                                color: "red"
                            }).addStyleClass("WarningIcon")

                        ]
                    }).addStyleClass('FileHBox')
                    /*new sap.m.Text({
                        text: {
                            path: 'DocumentQuestions>value',
                            formatter: Formatter.getDocumentStatus
                        },
                        visible: {
                            path: 'DocumentQuestions>value',
                            formatter: Formatter.getDocumentDetails
                        },
                        layoutData: new sap.ui.layout.GridData({
                            span: "L7 M7 S11"
                        })
                    }).addStyleClass("sapThemeLightText sapUiNoContentPadding docDetails"),
                    new sap.m.Text({
                        visible: {
                            path: 'DocumentQuestions>value',
                            formatter: Formatter.getDocumentReuploadReason
                        },
                        text: {
                            path: 'DocumentQuestions>value',
                            formatter: Formatter.getDocumentReuploadReasonText
                        },
                        layoutData: new sap.ui.layout.GridData({
                            span: "L7 M7 S11"
                        })
                    }).addStyleClass("sapThemeLightText sapUiNoContentPadding docDetails")*/
                ]
            }).addStyleClass('sapUiNoContentPadding');

            this.oFormElement = new sap.ui.layout.form.FormElement({
                label: new sap.m.Label({
                    text: "{DocumentQuestions>questionText}",
                    required: true,
                    layoutData: new sap.ui.layout.GridData({
                            span: "L4 M4 S12",
                            linebreak: true
                        })
                        /*required: {
                        	path: 'mandatory',
                        	formatter: Formatter.formatMandatoryQuestion
                        },
                        visible: {
                        	path: 'type',
                        	formatter: Formatter.formatFreeTextForOtherQuestion
                        }*/
                }).addStyleClass("questionLabel docQuestionLabel"),
                fields: [oField],
                /*visible: "{visible}",*/
                layoutData: new sap.ui.layout.ResponsiveFlowLayoutData({
                    linebreak: true,
                    margin: false
                })
            });
            //
            this.oFormCont = new sap.ui.layout.form.FormContainer({
                //	title: "{title}",
                formElements: {
                    path: 'DocumentQuestions>/',
                    template: this.oFormElement

                }
            });

            this.oSimpleForm = new sap.ui.layout.form.Form({
                title: '{i18n>requiredDocumentsTitle}',
                editable: true,
                layout: oLayout3,
                formContainers: [this.oFormCont]
                    /*{
			path: 'RequiredDocSet',
			template: this.oFormCont

		}*/
            }).addStyleClass("questionLayoutContainer");

            return this.oSimpleForm;

        }

    });

});