/*global location */
sap.ui.define([
		"publicservices/her/myrequests/controller/BaseController",
		"sap/ui/model/json/JSONModel",
		"publicservices/her/myrequests/model/formatter",
		"publicservices/her/myrequests/util/Utils"
	], function(BaseController, JSONModel, formatter,Utils) {
	"use strict";

	return BaseController.extend("publicservices.her.myrequests.controller.Fees", {

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
		onListUpdateStarted:function(oEvent){
			Utils.showBusy();
		} ,
		onListUpdateFinished: function(oEvent) { 
			var s = oEvent.getSource();
			var i = s.getItems();
			var sumAmt = null,note = null,sumPen  = null,currency  = null, dueDate = null,oFeeModel;
			if(i.length){
				var m=i[0].getModel();
				var b = i[0].getBindingContext();
				sumAmt = m.getProperty(" ",b);
				note = m.getProperty("Note",b);
				sumPen  = m.getProperty("SumPending",b);
				currency  = m.getProperty("Currency",b);
				dueDate  = m.getProperty("DueDate",b);
			}
			oFeeModel = new sap.ui.model.json.JSONModel({
					"sumAmt":sumAmt,
					"sumPen":sumPen,
					"currency":currency,
					"note":note,
					"DueDate":dueDate
				});
			this.getView().setModel(oFeeModel,"sumFeeModel");
			Utils.hideBusy();
		}

		
	});

});