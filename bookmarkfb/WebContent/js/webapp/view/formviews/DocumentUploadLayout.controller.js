sap.ui.define([
		"publicservices/her/myrequests/controller/BaseController",
		"publicservices/her/myrequests/model/formatter",
		"sap/ui/model/json/JSONModel"
	], function(BaseController, Formatter,JSONModel) {
	"use strict";

	return BaseController.extend("publicservices.her.myrequests.view.formviews.DocumentUploadLayout", {
		

		/* =========================================================== */
		/* lifecycle methods                                           */
		/* =========================================================== */

		onInit: function() {
			
		},
		
		openFile: function(oEvent) {
    		var oLink = oEvent.getSource(),
    		DecisionId = oLink.getModel().getProperty("DecisionId", oLink.getBindingContext()),
    		AppId = oLink.getModel().getProperty("AppId", oLink.getBindingContext()),
    		FileNumber = oLink.getModel().getProperty("FileNumber", oLink.getBindingContext()),
    		ContextId = oLink.getModel().getProperty("ContextId", oLink.getBindingContext()),
    		DocType = oLink.getModel().getProperty("DocType", oLink.getBindingContext()),
    		DocVer = oLink.getModel().getProperty("DocVer", oLink.getBindingContext());
    		window.open("/sap/opu/odata/sap/PIQ_REQUEST_SRV/RequiredDocSet(DecisionId='"+DecisionId+"',AppId='"+AppId+"',FileNumber='"+FileNumber+"',ContextId='"+ContextId+"',DocType='"+DocType+"',DocVer='"+DocVer+"')/$value");
    		//window.open(oLink.media_src);
	    },
	    
	    handleUploadPress: function(oEvent) {
    		var oFile = oEvent.getSource();
    		//set Busy Indicator
    		oFile.getParent().setBusy(true);
    		
    		var id = oFile.getModel().getProperty('FileType', oFile.getBindingContext()),
    		ftype = oFile.getModel().getProperty('DocVer', oFile.getBindingContext()),
    		dmsnumber = oFile.getModel().getProperty('FileNumber', oFile.getBindingContext()),
    		dmsversion = oFile.getModel().getProperty('DocVer', oFile.getBindingContext()),
            sScenario = (id && id !== "") ? "R" : "Upload",
            sNotificationId = oFile.getModel().getProperty('FormSubmId', oFile.getBindingContext()),
            sContextId = oFile.getModel().getProperty('ContextId', oFile.getBindingContext()),
            sUrl = this.prepareURL({
    			context: sContextId,
    			notification: sNotificationId,
    			qid: id
    		});
    		oFile.setUploadUrl(this.prepareURL());
    		if (!this.sCsrfToken) {
    			this._getCsrfToken();
    		}
    
    		var oCSRFTOkenHeader = new sap.ui.unified.FileUploaderParameter({
    			name: "X-CSRF-Token",
    			value: this.sCsrfToken
    		}),
    		oApplicantInfoHeader = new sap.ui.unified.FileUploaderParameter({
    			name: "slug",
    			value: "FileName:" + oFile.getValue() + "||FormSubmId:" + sNotificationId + "||ContextId:" + sContextId + "||QuestionId:" + id +
    				"||DocType:" + id + "||FileNumber:" + dmsnumber + "||DocVer:" + dmsversion + "||Scenario:" + sScenario
    		});
    		oFile.removeAllHeaderParameters();
    		//	oFile.addHeaderParameter(oFileParam);
    		oFile.addHeaderParameter(oApplicantInfoHeader);
    		oFile.addHeaderParameter(oCSRFTOkenHeader);
    		oFile.setSendXHR(true);
    		oFile.setUseMultipart(false);
    		oFile.upload();
	},
	
	handleUploaded: function(oEvent) {
		var oFile = oEvent.getSource();
		var oXMLFile = new sap.ui.model.xml.XMLModel();
		oXMLFile.setData(jQuery.parseXML(oEvent.getParameters().responseRaw));
		
		var sDms = oXMLFile.getProperty('/m:properties/d:FileNumber'),
		sName = oXMLFile.getProperty('/m:properties/d:FileName'),
		sType = oXMLFile.getProperty('/m:properties/d:DocType'),
		sVersion = oXMLFile.getProperty('/m:properties/d:DocVer'),
		sStatus = oXMLFile.getProperty('/m:properties/d:Status'),
		sScenario = (sDms && sDms !== "") ? "R" : "Upload",
		oModel = oFile.getModel(),
		oB = oFile.getBindingContext();
		
		oModel.setProperty("FileName", sName, oB);
		oModel.setProperty("FileNumber", sDms, oB);
		oModel.setProperty("DocVer", sVersion, oB);
		sStatus = (sStatus === "01") ? "03" : "02";
		oModel.setProperty("Status", sStatus, oB);
		oModel.setProperty("Scenario", sScenario, oB);
		oModel.checkUpdate();
		oFile.getParent().setBusy(false);
		var iconTabFilter = this.oView.getParent().getParent(),
		oIconTab = iconTabFilter.getParent();
		oIconTab.getModel().getProperty(oIconTab.getBindingContext().sPath).DocumentCount = parseInt(iconTabFilter.getCount()-1);
		oIconTab.getModel().checkUpdate();
		if( iconTabFilter.getCount()-1 !== 0){
			iconTabFilter.setCount(iconTabFilter.getCount()-1);
		}
		else{
			iconTabFilter.setCount("");
			iconTabFilter.setIconColor("Default");
			
		}
	},
	
	_getCsrfToken: function() {
		var that = this;
		//var sUrl = this.getOwnerComponent().getMetadata().getConfig().serviceConfig.serviceUrl;
		var sUrl = "/sap/opu/odata/sap/PIQ_REQUEST_SRV";
		$.ajax({
			url: sUrl,
			async: false,
			headers: {
				'X-CSRF-Token': 'Fetch'
			},
			success: function(oResponse, status, xhr) {
				that.sCsrfToken = xhr.getResponseHeader('X-CSRF-Token');
			}
		});
	},
	
	prepareURL: function(oParam) {
		//var sUrl = this.getOwnerComponent().getMetadata().getConfig().serviceConfig.serviceUrl;
		var sUrl = "/sap/opu/odata/sap/PIQ_REQUEST_SRV";
		sUrl += "/RequiredDocSet"; //(ContextId='"+ oParam.context +"',FormSubmId='"+ oParam.notification +"',QuestionId='"+ oParam.qid +"')";
		return sUrl;
	},
	
	submitDocuments: function(oEvent){
		
	}
		
	
    });

});