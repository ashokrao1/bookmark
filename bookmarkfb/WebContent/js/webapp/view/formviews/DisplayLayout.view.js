sap.ui.define([
    "publicservices/her/myrequests/view/formviews/util/Formatter"
], function(Formatter) {
    "use strict";
    /*
     * Copyright (C) 2009-2014 SAP SE or an SAP affiliate company. All rights reserved
     */
    return sap.ui.jsview("publicservices.her.myrequests.view.formviews.DisplayLayout", {

        createContent: function() {
            sap.ui.getCore().loadLibrary('sap.ui.layout');

            var oLayout3 = new sap.ui.layout.form.ResponsiveGridLayout();
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
                    case "DF":
			                    control = 	new sap.m.DatePicker({
			                        type: "Date",
			                        valueFormat: "YMMdd",
			                        value: "{value}"
			                        
			                    }).addStyleClass("readOnlyDate");
                        		break;
                    case "TB":
                    case "TA":
                        control = new sap.m.Text({
                            text: "{value}"
                        });
                        break;
                    case "RB":
                    case "DD":
                        if (f4help === "X") {
                            control = new sap.m.Text({
                                text: {
                                    path: oContext.getProperty('fieldName') + ">/domainValue",
                                    formatter: function(aList) {
                                        var m = this.getModel(),
                                            b = this.getBindingContext(),
                                            value = m.getProperty("value", b),
                                            text = "";
                                        $.each(aList, function(i, o) {
                                            if (value === o.Key) {
                                                text = o.Value;
                                                return false;
                                            }
                                        });
                                        return text;
                                    }
                                }
                            });
                        } else {
                            control = new sap.m.Text({
                                text: {
                                    path: "domain",
                                    formatter: function(aList) {
                                        var m = this.getModel(),
                                            b = this.getBindingContext(),
                                            value = m.getProperty("value", b),
                                            text = "";
                                        $.each(aList, function(i, o) {
                                            if (value === o.key) {
                                                text = o.value;
                                                return false;
                                            }
                                        });
                                        return text;
                                    }
                                }
                            });
                        }
                        break;

                   /* case "CB":
                        oItemTemplate = new sap.m.CheckBox({
                            //styleClass: "questionLayoutCheckBoxBtn",
                            text: "{value}",
                            enabled: false,
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
                        break;*/

                    case 'FT':
                        control = new sap.ui.core.HTML({
                            content: "{questionText}"
                        });
                        break;

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
                    fields: control,
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