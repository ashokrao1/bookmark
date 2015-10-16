/*global location */
sap.ui.define([
		"publicservices/her/myrequests/controller/BaseController",
		"sap/ui/model/json/JSONModel",
		"publicservices/her/myrequests/model/formatter"
	], function(BaseController, JSONModel, formatter) {
	"use strict";

	return BaseController.extend("publicservices.her.myrequests.controller.RequiredDocuments", {

		formatter: formatter,

		/* =========================================================== */
		/* lifecycle methods                                           */
		/* =========================================================== */

		onInit: function() {
			//this._oComponent = this.getOwnerComponent();
			//this._oRouter = this._oComponent.getRouter();
			//this.oResBundle = this._oComponent.getModel("i18n").getResourceBundle();
		},
	
		submitDocuments: function(oEvent){
			var oForm = sap.ui.getCore().byId("docsUploadForm"),
			oQuestionArray =  oForm.getFormContainers()[0].getFormElements(),
			oModel = oForm.getModel(),
			that = this, 
			oReqDocObj = oModel.getProperty(oForm.getBindingContext().getPath()),
			documentContent = [],
			sFormId = "";
		
			
			$.each(oQuestionArray, function(i,o){
				var obj = oModel.getProperty(o.getBindingContext().getPath());
				
				documentContent.push({
					"QUESTION": obj.QuestionId,
					"DOC_TYPE": obj.FileType,
					"DOC_ID": obj.FileNumber,
					//"DOC_ID2": "",
					"DOC_ID2": oReqDocObj.DecisionId,
					"DOC_VERSION": obj.DocVer,
					"DOC_PART": "",
					"TEXT": obj.QuestionText,
					"FILE_NAME": obj.FileName
				});
			});
			
			$.each(this.oView.getModel("REQUEST_CONFIG").getData(), function(index, obj){
				if(obj.ContextId === oReqDocObj.ContextId){
					sFormId = obj.FormId;
					return false;
				}
			});
		//	sFormId=this._oComponent.getFormIdFromReqConfig(oReqDocObj.ContextId);
			//var oDataModel = this._oComponent.getConnectorInstance("gfdService");
			var oDataModel = new sap.ui.model.odata.ODataModel("/sap/opu/odata/SAP/GFD_CONFIG_SRV", true);
			oDataModel.create("GFD_FormSubmissionCollection", {
						'ContextId': oReqDocObj.ContextId,
						'FormId': sFormId,
						'FormSubmId': oReqDocObj.FormSubmId,
						//'DecisionId': oReqDocObj.DecisionId,
						'Action': oReqDocObj.Status,
						'CustomContent': "",
						'Content': "",
						'DocContent': JSON.stringify(documentContent)
					}, null, jQuery.proxy(function( oData, oRes) {
							/*debugger;
							this.getRouter().navTo("object", {
								//objectId: sObjectId
								AppId: AppId,
								ContextId: ContextId,
								DecisionId: DecisionId,
								FormSubmId: FormSubmId
							}, true);*/
							//oModel.setProperty("FormSubmId", oData.FormSubmId,oForm.getBindingContext().getPath());
							//debugger;
							//var sComponentId = sap.ui.core.Component.getOwnerIdFor(that.getView());
							//that._oComponent = sap.ui.component(sComponentId);
							sap.m.MessageToast.show("Documents have been submitted "+ oData.FormId +".");
							oModel.refresh();
					}, this));
		}
		
	});

});