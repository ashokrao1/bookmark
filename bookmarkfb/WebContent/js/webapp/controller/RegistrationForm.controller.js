sap.ui.define([
               "publicservices/her/myrequests/controller/BaseController",
               "sap/ui/model/json/JSONModel",
               "publicservices/her/myrequests/model/formatter",
               "publicservices/her/myrequests/util/Utils"
               ], function(BaseController, JSONModel, Formatter, Utils) {
	"use strict";

	function GFDCourseData(){
		this.ProcedureId = "";
		this.CourseOffering = "";
		this.ObjectIds = "";
		this.PrevDecisionid = "";
	}

	sap.ui.controller("publicservices.her.myrequests.controller.RegistrationForm", {
		/**
		 * Called when a controller is instantiated and its View controls (if available) are already created.
		 * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
		 * @memberOf publicservices.her.myrequests.webapp.view.CreateRequest
		 */
		_sFormId : null,
		_sContextId: null,
		_sFormSubmId: null,
		_sDecisionId: null,
		_sProcedureId: null,
		_sCourseOffering: null,
		_sObjectIds: null,
		onInit: function() {
			//init
			this._oComponent = this.getOwnerComponent();
			this._oRouter = this._oComponent.getRouter();
			this.oResBundle = this._oComponent.getModel("i18n").getResourceBundle();
			//attach the navigation handler
			this._oRouter.getRoute("register").attachPatternMatched(this._onRegisterFormLoaded, this);
			//this.getRouter().attachBypassed(this.onBypassed, this);
			var oModel = new sap.ui.model.json.JSONModel();
			this.getView().setModel(oModel, "changeofprogramquestions");


		},
		_onRegisterFormLoaded: function(oEvent){
			//register/{ContextId}/{FormId}/{FormSubmId}/{DecisionId}/{ProcedureId}/{CourseOffering}/{ObjectId}"
			var oArguments = oEvent.getParameter("arguments"),
			oModel = null,
			that = this;

			//store the arguments in controller 
			this._sFormId = oArguments.FormId ;
			this._sContextId = oArguments.ContextId ;
			this._sFormSubmId = oArguments.FormSubmId ;
			this._sDecisionId = oArguments.DecisionId ;
			this._sProcedureId = oArguments.ProcedureId;
			this._sCourseOffering = oArguments.CourseOffering;
			this._sObjectIds = oArguments.ObjectId;			
			
			//Program Information in a model 
			var oCourseModelData = new GFDCourseData();
			oCourseModelData.ProcedureId = this._sProcedureId;
			oCourseModelData.CourseOffering = this._sCourseOffering;
			oCourseModelData.ObjectIds = this._sObjectIds;
			oCourseModelData.PrevDecisionid = this._sDecisionId;
			
			this.getView().getModel("changeofprogramquestions").setData(oCourseModelData);

			//call GFD form using formdata      
			this._getFormData(this._sFormId, this._sContextId);
		},
		_getFormData: function(sFormId, sContextId) {
			//call GFDModule getFormData
			this._oComponent.getGFDModule().getFormData({
				oDataModel: this._oComponent.getConnectorInstance("gfdService"),
				sFormId: sFormId,
				sObjectId: sFormId,
				sContextId: sContextId,
				sNotificationId: "NEW",
			}, $.proxy(this._onGettingFormData, this),
			$.proxy(this._onGettingDomainData, this));
		},
		_onGettingFormData: function(oConfigModel, oFormMetaDataModel, oFormInfoModel, oDocQuestion){
			this.getView().setModel(oFormMetaDataModel).bindElement("/EN");
			this.getView().setModel(oConfigModel, "FormConfig");
			this.getView().setModel(oFormInfoModel, "FormDetails");
			this.getView().setModel(oDocQuestion, "DocumentQuestions");
		},
		_onGettingDomainData: function(oDomainDataMap){
			var that = this;
			$.each(oDomainDataMap, function(i, aData) {
				if (!that.getView().getModel(i)) {
					var oJSONModel = new sap.ui.model.json.JSONModel();
					oJSONModel.setSizeLimit(aData.length + 1);
					oJSONModel.setData({
						domainValue: aData
					});
					that.getView().setModel(oJSONModel, i);
				}
			});
		},
		onTabSelect: function(oEvent) {
			var sSelectedKey = oEvent.getParameter("selectedKey"),
			oSelectedItem = oEvent.getParameter("selectedItem");

			if (sSelectedKey === "attachments") {
				//make a BE call and get new questions and update
				this.getDocumentQuestions();
			}

		},

		onSubmitForm: function(oEvent){
			this._oComponent.getGFDModule().submitForm({
				config: this.getView().getModel("FormConfig"),
				info: this.getView().getModel("FormDetails"),
				metadata: this.getView().getModel(),
				courses: this.getView().getModel("changeofprogramquestions"),
				document: this.getView().getModel("DocumentQuestions")
			}, $.proxy(this.onSuccessfulFormSubmission, this), $.proxy(this.onIncompleteFormSub, this));
		},
		onSuccessfulFormSubmission: function(oData, oResp){
			var sContextText = this._oComponent.getContextText(this._sContextId);
			var sMsg = this.oResBundle.getText("requestSubmitted", [sContextText , oData.FormSubmId]);
            
			//show async: toast message
			setTimeout(function() {
				sap.m.MessageToast.show(sMsg);
			}, 0);
			//remove data
			this.getView().getModel("changeofprogramquestions").setData([]);
			//Naviagte to Splitapp
			this._oRouter.navTo('master', {}, true);
			this._oComponent.getModel().refresh();
		},
		onIncompleteFormSub: function(oFormMetaDataModel, oDocQuestion){
			Utils.showMessage(sap.ui.core.ValueState.Error, sap.ui.core.ValueState.Error,this.oResBundle.getText("fillAllManFieldsMsg"));
			this.getView().getModel().setData(oFormMetaDataModel);
			this.getView().getModel("DocumentQuestions").setData(oDocQuestion);
		},
		onCancelConfirm:function(){
        	var that =this;
	        var confirmResponse = $.Deferred();
				confirmResponse.done(function(bUserResponse) {
					if(!bUserResponse){
	        		return;  
	        	    }
	               that.onCancel(); 
				});
	        Utils.confirmMessage(this.oResBundle.getText("cancelConfirmTitle"),this.oResBundle.getText("createRequestCancelMsg"),confirmResponse);	
        },
		onCancel: function(oEvent){
			this._oRouter.navTo('master', {}, true);
		},
		getDocumentQuestions : function(oEvent){

		}

	});
});