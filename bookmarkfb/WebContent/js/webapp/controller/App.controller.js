sap.ui.define([
		"publicservices/her/myrequests/controller/BaseController",
		"sap/ui/model/json/JSONModel"
	], function(BaseController, JSONModel) {
	"use strict";

	return BaseController.extend("publicservices.her.myrequests.controller.App", {

		onInit: function() {
			var oViewModel,
				fnSetAppNotBusy,
				oListSelector = this.getOwnerComponent().oListSelector,
				iOriginalBusyDelay = this.getView().getBusyIndicatorDelay();

			oViewModel = new JSONModel({
				busy: true,
				delay: 0
			});
			this.setModel(oViewModel, "appView");

			fnSetAppNotBusy = function() {
				oViewModel.setProperty("/busy", false);
				oViewModel.setProperty("/delay", iOriginalBusyDelay);
			};

			this.getOwnerComponent().getModel().metadataLoaded()
				.then(fnSetAppNotBusy, fnSetAppNotBusy);

			// Makes sure that master view is hidden in split app
			// after a new list entry has been selected.
			oListSelector.attachListSelectionChange(function() {
				this.byId("idAppControl").hideMaster();
			}, this);

			// apply content density mode to root view
			this.getView().addStyleClass(this.getOwnerComponent().getContentDensityClass());
		},
		
		 handleLogoffPress : function(){
	        var sLogOffUrl = this.getView().getModel('configuration').getProperty('/LOGOFFURL');
	        var sRedirectUrl = this.getView().getModel('configuration').getProperty('/REDIRECTURL_APPL');
	        if(sRedirectUrl)
	        {
	            location.replace(sLogOffUrl.toLowerCase() + '?redirectURL=' + sRedirectUrl.toLowerCase());
	        }
	        else
	        {
			    location.replace(sLogOffUrl.toLowerCase());
	        }
    	},
    	
    	
    	handleOpen : function (oEvent) {
			var oButton = oEvent.getSource();
	
			// create action sheet only once
			if (!this._actionSheet) {
				this._actionSheet = sap.ui.xmlfragment(
						"publicservices.her.myrequests.view.ActionSheet",
						this
				);
				this.getView().addDependent(this._actionSheet);
			}
			
			// setting the selected language
			var oConfigData =  this.getOwnerComponent().getModel('config').getData();
			var sLanguage = oConfigData.selectedLanguage;
			var aButtons =  this._actionSheet.getButtons();
			for (var i = 0; i < aButtons.length; i++){
			    if (aButtons[i].data('langKey') === sLanguage){
			        aButtons[i].setIcon("sap-icon://accept");
			    }else{
			        aButtons[i].setIcon("");
			    }
			}
	
			this._actionSheet.openBy(oButton);
		},
		
		selectLanguage : function(e){
		    var oSource = e.getSource();
		    if(location.hash.indexOf("form/FORM")>-1){
		    this.oResBundle =  this.getOwnerComponent().getModel("i18n").getResourceBundle();
		    var message = this.oResBundle.getText("languageChange");
		    
		   	this.getOwnerComponent().showMessageDialog(message,
	    	jQuery.proxy(this.onSelectLanguageYes,this),e,'C'); 
		        
		    } else{
		        this.onSelectLanguageYes(oSource,e);
		    }
		},
		
		onSelectLanguageYes : function(oSource,e){ 
			var oButton = oSource;
			var sSelectedLang = oButton.getModel('language').getProperty('Lang', oButton.getBindingContext("language"));
	
			var oNewParams = {
				"sap-language": sSelectedLang
			};
			var oQryParams = {};
			var sQryStr = location.search.substring(1);
			var oRegEx = /([^&=]+)=([^&]*)/g;
			var oMap;
			while (oMap === oRegEx.exec(sQryStr)) {
				oQryParams[decodeURIComponent(oMap[1])] = decodeURIComponent(oMap[2]);
			}
			$.map(oNewParams, function(sVal, sKey) {
				oQryParams[decodeURIComponent(sKey)] = decodeURIComponent(sVal);
			});
			location.search = $.param(oQryParams);
		},

	});

});