sap.ui.define([
    "publicservices/her/myrequests/model/formatter"
], function(formatter) {
    "use strict";
    /*
     * Copyright (C) 2009-2014 SAP SE or an SAP affiliate company. All rights reserved
     */
    return sap.ui.jsview("publicservices.her.myrequests.view.subviews.GeneralTabJs", {
        getControllerName: function() {
            return "publicservices.her.myrequests.controller.GeneralTabJs";
        },
        createContent: function(oController) {
            this.questionsView = new sap.ui.core.mvc.JSView({viewName:"publicservices.her.myrequests.view.formviews.QuestionLayout"});
         //   var oDetailController = this.getViewData();
         //   this.getController(this.getControllerName()).getGeneralTabQues(oDetailController);
            sap.ui.getCore().loadLibrary('sap.ui.layout');

			var oLayout3 = new sap.ui.layout.form.ResponsiveGridLayout({
				labelSpanL:4,
	            labelSpanM:4,
	            emptySpanL:5,
	            emptySpanM:5,
	            columnsL:1,
	            columnsM:1
			});
			this.oFormCont = new sap.ui.layout.form.FormContainer({
				formElements: [new sap.ui.layout.form.FormElement({
				visible:{path:'Reason',formatter:formatter.showField},	
				label: new sap.m.Label({
					text: "{i18n>Reason}"}),
				fields: [new sap.m.Text({text: '{Reason}'})]
			}),
			new sap.ui.layout.form.FormElement({
				label: new sap.m.Label({
					text: "{i18n>Note}"
				}),
				visible:{path:'Note',formatter:formatter.showField},
				fields: [new sap.m.Text({text: '{Note}'})]
			}),new sap.ui.layout.form.FormElement({
				label: new sap.m.Label({
					text: "{i18n>AppNumber}"
				}),
				visible:{path:'FormSubmId',formatter:formatter.showField},
				fields: [new sap.m.Text({text: '{FormSubmId}'})]
			})]
			});

			this.oSimpleForm = new sap.ui.layout.form.Form({
				title: '{i18n>generalTitle}',
				editable: false,
				layout: oLayout3,
				formContainers: {
					path: 'GeneralSet',
					template: this.oFormCont
				}
			});
			this.oVBox = new sap.m.VBox({
                items: [this.oSimpleForm,this.questionsView]
            });	
            return this.oVBox;
        }

    });

});