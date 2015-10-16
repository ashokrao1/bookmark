/*global location */
sap.ui.define([
		"publicservices/her/myrequests/controller/BaseController",
		"sap/ui/model/json/JSONModel",
		"publicservices/her/myrequests/model/formatter"
	], function(BaseController, JSONModel, formatter) {
	"use strict";

	return BaseController.extend("publicservices.her.myrequests.controller.GeneratedDocuments", {

		formatter: formatter,

		/* =========================================================== */
		/* lifecycle methods                                           */
		/* =========================================================== */

		onInit: function() {
		  
		},
		
		openFile: function(oEvent) {
    		var oLink = oEvent.getSource().getModel().getProperty("__metadata", oEvent.getSource().getBindingContext());
    		window.open(oLink.media_src);
	    }
		
	});

});