sap.ui.define([
    "publicservices/her/myrequests/view/formviews/util/Formatter"
], function(Formatter) {
    "use strict";
    /*
     * Copyright (C) 2009-2014 SAP SE or an SAP affiliate company. All rights reserved
     */
    return sap.ui.jsview("publicservices.her.myrequests.view.formviews.QuestionLayout", {
        getControllerName: function() {
            return "publicservices.her.myrequests.view.formviews.QuestionLayout";
        },
        createContent: function(oController) {
            sap.ui.getCore().loadLibrary('sap.ui.layout');

            var oLayout3 = new sap.ui.layout.form.ResponsiveGridLayout();
            var oThis = this;
            this.oFormCont = new sap.ui.layout.form.FormContainer({
                title: "{title}"
            });
            this.oFormCont.bindAggregation('formElements', 'question', function(sId, oContext) {
                var type = oContext.getProperty("type"),
                    control = null,
                    sValue = oContext.getProperty("value"),
                    f4help = oContext.getProperty("F4availabl"),
                    sDomain = oContext.getProperty("fieldName");

                switch (type) {
                    case "TB":
                        control = new sap.m.Input({
                            type: {
                                path: 'ValidationType',
                                formatter: Formatter.formatTextBoxTypeValidation
                            },
                            value: "{value}",
                            enabled: {
                                path: 'enable',
                                formatter: Formatter.formatEnableField
                            },
                            change: $.proxy(oController.textChange, oController, oContext), //[oController.textChange, oController, oContext],
                            showValueStateMessage: {
                                path: 'errorText',
                                formatter: Formatter.formatErrorText
                            },
                            valueState: {
                                path: 'errorState',
                                formatter: Formatter.formatErrorState
                            },
                            maxLength: {
                        		path: 'Length',
                        		formatter: Formatter.getMaxLength
                        	},
                            valueStateText: "{errorText}",
                            layoutData: new sap.ui.layout.GridData({
                                span: "L7 M7 S11"
                            })
                        });
                        break;
                    case "RB":
                        control = new sap.m.RadioButtonGroup({
                            valueState: {
                                path: 'errorState',
                                formatter: Formatter.formatErrorState
                            },
                            type: new sap.ui.model.type.Integer(),
                            /* selectedIndex: {
                            path: 'value',
                            formatter: jQuery.proxy(oThis.oController.formatRadioGroupBtnSelected, oController, oContext)
                        },*/

                            select: jQuery.proxy(oThis.oController.optionSelected, oController, oContext),
                            enabled: {
                                path: 'enable',
                                formatter: Formatter.formatEnableField
                            },
                            layoutData: new sap.ui.layout.GridData({
                                span: "L7 M7 S11"
                            })
                        });
                        control.bindProperty("selectedIndex", {
                            path: 'value',
                            formatter: jQuery.proxy(oThis.oController.formatRadioGroupBtnSelected, oController, oContext, control)
                        });
                        if (f4help === 'X') {
                            var template = new sap.m.RadioButton({
                                text: '{' + sDomain + '>Value}'

                            });
                            control.bindAggregation("buttons", sDomain + ">/domainValue", template);

                        } else {
                            var template = new sap.m.RadioButton({
                                text: '{value}'

                            });
                            control.bindAggregation("buttons", 'domain', template);
                        }

                        /* if (!sValue) {
                        control.addEventDelegate({
                            onAfterRendering: jQuery.proxy(oThis.oController.removeLeadSelectionRBG, oController, oContext, control)
                        }, control);
                        //control.attachEventOnce('onAfterRendering', jQuery.proxy(oThis.oController.removeLeadSelectionRBG, oController, oContext, control));
                    }*/
                        break;

                    case "DD":
                        control = new sap.m.ComboBox({
                            enabled: {
                                path: 'enable',
                                formatter: Formatter.formatEnableField
                            },
                            width: "100%",
                            selectedKey: "{value}",
                            //selectionChange: jQuery.proxy(oThis.oController.comboBoxSelected, oController, oContext),
                            valueState: {
                                path: 'errorState',
                                formatter: Formatter.formatErrorState
                            },
                            valueStateText: "{errorText}",
                            showValueStateMessage: {
                                path: 'errorText',
                                formatter: Formatter.formatErrorText
                            },
                            layoutData: new sap.ui.layout.GridData({
                                span: "L7 M7 S11"
                            })
                        }).addStyleClass('questionLayoutSelectBtn');
                        var oItemTemplate;
                        if (f4help) {
                            oItemTemplate = new sap.ui.core.ListItem({
                                key: "{" + oContext.getProperty('fieldName') + ">Key}",
                                text: "{" + oContext.getProperty('fieldName') + ">Value}"
                            });
                            //control.unbindAggregation("items");    
                            control.bindItems(oContext.getProperty('fieldName') + ">/domainValue", oItemTemplate);
                            /*control.addEventDelegate({
                               ontap: jQuery.proxy(oThis.oController.buildDomainModel, oController, oContext, control)
                        }, control);*/
                        } else {
                            oItemTemplate = new sap.ui.core.ListItem({
                                key: '{key}',
                                text: '{value}'
                            });
                            //control.unbindAggregation("items");    
                            control.bindItems("domain", oItemTemplate);
                        }
                        control.attachEvent('change', jQuery.proxy(oThis.oController.comboBoxValueChange, oController, oContext, control));
                        control.attachEvent('selectionChange', jQuery.proxy(oThis.oController.comboBoxSelected, oController, oContext, control));
                        break;
                    case "CB":
                        oItemTemplate = new sap.m.CheckBox({
                            //styleClass: "questionLayoutCheckBoxBtn",
                            text: "{value}",
                            enabled: {
                                path: 'enable',
                                formatter: Formatter.formatEnableField
                            },
                            key: "{key}",
                            data: "{optionId:'{id}'}",
                            selected: "{selected}",
                            select: [oController.checkSelected, oController]
                        });

                        control = new sap.m.VBox({
                            items: {
                                path: "domain",
                                template: oItemTemplate,
                                layoutData: new sap.ui.layout.GridData({
                                    span: "L7 M7 S11"
                                })
                            }
                        });
                        break;

                    case "TA":
                        control = new sap.m.TextArea({
                            width: "100%",
                            rows: 7,
                            value: "{value}",
                            change: [oController.textChange, oController],
                            showValueStateMessage: {
                                path: 'errorText',
                                formatter: Formatter.formatErrorText
                            },
                            enabled: {
                                path: 'enable',
                                formatter: Formatter.formatEnableField
                            },
                            valueState: {
                                path: 'errorState',
                                formatter: Formatter.formatErrorState
                            },
                             maxLength: {
                        		path: 'Length',
                        		formatter: Formatter.getMaxLength
                        	},
                            valueStateText: "{errorText}",
                            layoutData: new sap.ui.layout.GridData({
                                span: "L7 M7 S11"
                            })
                        });
                        break;

                    case "DF":
                        control = new sap.m.DatePicker({
                            type: "Date",
                            placeholder: "{i18n>enterDate}",
                            change: $.proxy(oController.onDateChange, oController, oContext),//[oController.onDateChange, oController],
                            valueFormat: "YMMdd",
                            enabled: {
                                path: 'enable',
                                formatter: Formatter.formatEnableField
                            },
                            value: "{value}",
                            showValueStateMessage: {
                                path: 'errorText',
                                formatter: Formatter.formatErrorText
                            },
                            valueState: {
                                path: 'errorState',
                                formatter: Formatter.formatErrorState
                            },
                            valueStateText: "{errorText}",
                            layoutData: new sap.ui.layout.GridData({
                                span: "L7 M7 S11"
                            })
                        });
                        break;

                    case "DU":
                        control = new sap.ui.layout.VerticalLayout({
                            content: [
                                new sap.ui.layout.HorizontalLayout({
                                    //styleClass: "sapUiNoContentPadding FileHBox",
                                    layoutData: new sap.ui.layout.GridData({
                                        span: "L7 M7 S11"
                                    }),
                                    content: [
                                        new sap.m.Link({
                                            src: {
                                                path: 'value',
                                                formatter: '.getDocumentLink'
                                            },
                                            press: [oController.openFile, oController],
                                            target: "_blank",
                                            text: {
                                                path: 'value',
                                                formatter: Formatter.getDocumentName
                                            },
                                            visible: {
                                                path: 'value',
                                                formatter: Formatter.documentEditVisible
                                            }
                                        }),

                                        new sap.ui.unified.FileUploader({
                                            name: "myFileUpload",
                                            buttonOnly: true,
                                            iconOnly: false,
                                            buttonText: "{i18n>uploadDoc}",
                                            sameFilenameAllowed: true,
                                            icon: "sap-icon://add",
                                            change: [oController.handleUploadPress, oController],
                                            visible: {
                                                path: 'value',
                                                formatter: Formatter.documentUploadVisible
                                            },
                                            enabled: {
                                                path: 'enable',
                                                formatter: Formatter.formatEnableField
                                            },
                                            tooltip: "{i18n>uploadFile}",
                                            uploadComplete: [oController.handleUploaded, oController]
                                        }),

                                        new sap.ui.unified.FileUploader({
                                            name: "myFileUpload",
                                            buttonOnly: true,
                                            buttonText: "",
                                            sameFilenameAllowed: true,
                                            change: [oController.handleUploadPress, oController],
                                            icon: "sap-icon://edit",
                                            iconOnly: true,
                                            visible: {
                                                path: 'value',
                                                formatter: Formatter.documentEditVisible
                                            },
                                            enabled: {
                                                path: 'enable',
                                                formatter: Formatter.formatEnableField
                                            },
                                            tooltip: "{i18n>uploadFile}",
                                            uploadComplete: [oController.handleUploaded, oController]
                                        }).addStyleClass("editDoc"),

                                        new sap.ui.core.Icon({
                                            src: "sap-icon://warning",
                                            visible: "{errorState}",
                                            color: "red"
                                        }).addStyleClass("WarningIcon")

                                    ]
                                }).addStyleClass('FileHBox'),
                                new sap.m.Text({
                                    text: {
                                        path: 'value',
                                        formatter: Formatter.getDocumentStatus
                                    },
                                    visible: {
                                        path: 'value',
                                        formatter: Formatter.getDocumentDetails
                                    },
                                    layoutData: new sap.ui.layout.GridData({
                                        span: "L7 M7 S11"
                                    })
                                }).addStyleClass("sapThemeLightText sapUiNoContentPadding docDetails"),
                                new sap.m.Text({
                                    visible: {
                                        path: 'value',
                                        formatter: Formatter.getDocumentReuploadReason
                                    },
                                    text: {
                                        path: 'value',
                                        formatter: Formatter.getDocumentReuploadReasonText
                                    },
                                    layoutData: new sap.ui.layout.GridData({
                                        span: "L7 M7 S11"
                                    })
                                }).addStyleClass("sapThemeLightText sapUiNoContentPadding docDetails")
                            ]
                        }).addStyleClass('sapUiNoContentPadding');

                        break;

                    case 'FT':
                        control = new sap.ui.core.HTML({
                            content: "{questionText}"
                                /*layoutData: new sap.ui.layout.GridData({
                            span: "L7 M7 S11"
                        })*/
                        });
                        break;

                }

                var fieldsArray = [control];

                if (oContext.getProperty("helpText")) {
                    var helpButton = new sap.m.Button({
                        //styleClass : "HelpTextIcon",
                        icon: "sap-icon://hint",
                        //press: [oController.helpText, oController],
                        press: jQuery.proxy(oThis.oController.helpText, oController, oContext, helpButton),
                        type: "Transparent",
                        width: "1rem",
                        layoutData: new sap.ui.layout.GridData({
                            span: "L1 M1 S1"
                        })
                    });
                    fieldsArray.push(helpButton);
                }

                return new sap.ui.layout.form.FormElement({
                    label: new sap.m.Label({
                        text: "{questionText}",
                        layoutData: new sap.ui.layout.GridData({
                            span: "L4 M4 S12"
                        }),
                        required: {
                            path: 'mandatory',
                            formatter: Formatter.formatMandatoryQuestion
                        },
                        visible: {
                            path: 'type',
                            formatter: Formatter.formatFreeTextForOtherQuestion
                        }
                    }).addStyleClass("questionLabel"),
                    fields: fieldsArray,
                    visible: "{visible}",
                    layoutData: new sap.ui.layout.ResponsiveFlowLayoutData({
                        linebreak: true,
                        margin: false
                    })
                });
            });

            this.oSimpleForm = new sap.ui.layout.form.Form({
                title: '{title}',
                editable: true,
                layout: oLayout3,
                formContainers: {
                    path: 'section/0/groups',
                    template: this.oFormCont

                }
            }).addStyleClass("questionLayoutContainer");
            
            return this.oSimpleForm;
            /*this.oVBox = new sap.m.VBox({
                items: {
                    path: 'section',
                    template: this.oSimpleForm
                }
            });

            return this.oVBox;*/
        }

    });

});