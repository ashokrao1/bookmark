/*global location */
sap.ui.define([
		"publicservices/her/myrequests/controller/BaseController",
		"publicservices/her/myrequests/model/formatter"
	], function(BaseController, formatter) {
	"use strict";

	return BaseController.extend("publicservices.her.myrequests.controller.GeneralTab", {

		formatter: formatter,

		/* =========================================================== */
		/* lifecycle methods                                           */
		/* =========================================================== */

		onInit: function() {
		}

		
	});

});