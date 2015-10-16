/*global location */
sap.ui.define([
		"publicservices/her/myrequests/controller/BaseController",
		"sap/ui/model/json/JSONModel",
		"publicservices/her/myrequests/model/formatter"
	], function(BaseController, JSONModel, formatter) {
	"use strict";

	return BaseController.extend("publicservices.her.myrequests.controller.Holds", {

		formatter: formatter,

		/* =========================================================== */
		/* lifecycle methods                                           */
		/* =========================================================== */

		onInit: function() {
			
		},
		
				/**
		 * Updates the item count within the holds item table's header
		 * @param {object} oEvent an event containing the total number of items in the list
		 * @private
		 */
		onListUpdateFinished: function(oEvent) {
			var iTotalItems = oEvent.getParameter("total");
			if (iTotalItems) {
				this.oView.getParent().setCount(iTotalItems);
				this.oView.getParent().setIconColor("Critical");
			}
			// only update the counter if the length is final
			/*
			var sTitle,
			oViewModel = this.getModel("detailView");
			if (this.byId("lineItemsList").getBinding("items").isLengthFinal()) {
				if (iTotalItems) {
					//sTitle = this.getResourceBundle().getText("detailLineItemTableHeadingCount", [iTotalItems]);
					
				} else {
					//Display 'Line Items' instead of 'Line items (0)'
					//sTitle = this.getResourceBundle().getText("detailLineItemTableHeading");
				}
				oViewModel.setProperty("/holdsItemListTitle", sTitle);
			}*/
		}
	});

});