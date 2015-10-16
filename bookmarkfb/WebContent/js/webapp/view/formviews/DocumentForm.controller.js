sap.ui.define([
		"publicservices/her/myrequests/controller/BaseController",
		"publicservices/her/myrequests/model/formatter",
		"sap/ui/model/json/JSONModel"
	], function(BaseController, Formatter,JSONModel) {
	"use strict";

	return BaseController.extend("publicservices.her.myrequests.view.formviews.DocumentForm", {
		
		onInit : function(){
			this._oComponent = this.getOwnerComponent();
            this._oRouter = this._oComponent.getRouter();
            this.oResBundle = this._oComponent.getModel("i18n").getResourceBundle();
		},
		onUpload: function(oEvent){
			var oFile = oEvent.getSource(),
			oModel = oFile.getModel("DocumentQuestions"),
			oBindingContext = oFile.getBindingContext("DocumentQuestions"),
			sVal = oModel.getProperty("value",oBindingContext),
			id = oModel.getProperty("id",oBindingContext),
			oData = {
				"FileNumber": sVal.split("||")[0], //DMS Id
				"FileName" : oFile.getValue(),//send the name of the new file uplaoded not the previous one
				"DocVer":  sVal.split("||")[3],//Current DMS version
				"QuestionId": id, //find out what is this, this would be same as document type
				"DocType": sVal.split("||")[2],
				"Scenario": 'Upload'
				//document type if exists
				//other parameters, enable if requied
				//"FormSubmId": "",
				//"ContextId": "",
				//"Scenario" : "" //R for RESUBMIT
			};
			oFile.getParent().setBusy(true);
			//get Upload URL from GFDModule
			oFile.setUploadUrl(this._oComponent.getGFDModule().getFileUploadUrl());
			//create Headers
			var oCSRFTOkenHeader = new sap.ui.unified.FileUploaderParameter({
                name: "X-CSRF-Token",
                value: this._oComponent.getGFDModule().getCsrfForFileUpload()
            });

            var oApplicantInfoHeader = new sap.ui.unified.FileUploaderParameter({
                name: "slug",
                value: this._oComponent.getGFDModule().getFileUploadData(oData)
            });
			
			//this._oComponent.getGFDModule().uploadFile(oFile,oData,$.proxy(this.onUploadFinished, this));
			oFile.removeAllHeaderParameters();
            oFile.addHeaderParameter(oApplicantInfoHeader);
            oFile.addHeaderParameter(oCSRFTOkenHeader);
            oFile.setSendXHR(true);
            oFile.setUseMultipart(false);
            oFile.upload();
		},
		onUploadFinished: function(oEvent){
			 var oFile = oEvent.getSource(),
			 oModel = oFile.getModel("DocumentQuestions"),
			oBindingContext = oFile.getBindingContext("DocumentQuestions"),
			 oXMLFile = new sap.ui.model.xml.XMLModel();
			 //to hide error icon
			 oModel.setProperty("errorState",false,oBindingContext);
			 oXMLFile.setData(jQuery.parseXML(oEvent.getParameters().responseRaw));
			var sDms = oXMLFile.getProperty('/m:properties/d:FileNumber'),
            sName = oXMLFile.getProperty('/m:properties/d:FileName'),
            sType = oXMLFile.getProperty('/m:properties/d:DocType'),
            sVersion = oXMLFile.getProperty('/m:properties/d:DocVer'),
            sStatus = oXMLFile.getProperty('/m:properties/d:Status'),
            sScenario = 'Upload',
            sValue = sDms + "||" + sName + "||" + sType + "||" + sVersion + "||" + sStatus + "||" + sScenario;
            
            //update model
            oModel.setProperty("value", sValue, oBindingContext);
            oFile.getParent().setBusy(false);
		},
		onFileOpen: function(oEvent){
			var oLink = oEvent.getSource(),
			oModel = oLink.getModel("DocumentQuestions"),
			oBindingContext = oLink.getBindingContext("DocumentQuestions"),
            sVal = oModel.getProperty("value", oBindingContext),
            oData = {
				"FileNumber": sVal.split("||")[0], //DMS Id
				"DocVer":  sVal.split("||")[3],//Current DMS version
				"DocType": sVal.split("||")[2] //document type if exists
				//other parameters, enable if requied
				//"ContextId": "" //context Id
			},
            sUrl;
           /* var sUrl = this.oView.getController().getOwnerComponent().getMetadata().getConfig().serviceConfig.serviceUrl;
            sUrl += "/GFD_FileSet(ContextId='" + this.sContextId + "',FileNumber='" + a[0] + "',DocType='" + a[2] + "',DocVer='" + a[3] +
                "')/$value";*/
            sUrl = this._oComponent.getGFDModule().getFileDownloadUrl(oData);
            window.open(sUrl);
		}
		
	});

});