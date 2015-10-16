/*global location */
sap.ui.define([
	"publicservices/her/myrequests/controller/BaseController",
	"sap/ui/model/json/JSONModel",
	"publicservices/her/myrequests/model/formatter",
	"publicservices/her/myrequests/util/Utils"
], function(BaseController, JSONModel, formatter, Utils) {
	"use strict";

	function GFDQuestionFromCourse(sParam, sValue) {
		this.CONFIG_MAPPING = "";
		this.PARAM = sParam;
		this.PARAMVALUE = sValue;
	}

	return BaseController.extend("publicservices.her.myrequests.controller.Detail", {

		formatter: formatter,

		/* =========================================================== */
		/* lifecycle methods                                           */
		/* =========================================================== */
		onInit: function() {
			// Model used to manipulate control states. The chosen values make sure,
			// detail page is busy indication immediately so there is no break in
			// between the busy indication for loading the view's meta data
			this._oComponent = this.getOwnerComponent();
			this._oRouter = this._oComponent.getRouter();
			var oViewModel = new JSONModel({
				busy: false,
				delay: 0,
				lineItemListTitle: this.getResourceBundle().getText("detailLineItemTableHeading")
			});

			this.getRouter().getRoute("object").attachPatternMatched(this._onObjectMatched, this);

			this.setModel(oViewModel, "detailView");

			this.getOwnerComponent().getModel().metadataLoaded().then(this._onMetadataLoaded.bind(this));
		},

		/* =========================================================== */
		/* event handlers                                              */
		/* =========================================================== */

		/**
		 * Event handler when the share by E-Mail button has been clicked
		 * @public
		 */
		onShareEmailPress: function() {
			var oViewModel = this.getModel("detailView");

			sap.m.URLHelper.triggerEmail(
				null,
				oViewModel.getProperty("/shareSendEmailSubject"),
				oViewModel.getProperty("/shareSendEmailMessage")
			);
		},

		/**
		 * Event handler when the share in JAM button has been clicked
		 * @public
		 */
		onShareInJamPress: function() {
			var oViewModel = this.getModel("detailView"),
				oShareDialog = sap.ui.getCore().createComponent({
					name: "sap.collaboration.components.fiori.sharing.dialog",
					settings: {
						object: {
							id: location.href,
							share: oViewModel.getProperty("/shareOnJamTitle")
						}
					}
				});

			oShareDialog.open();
		},

		/**
		 * Updates the item count within the line item table's header
		 * @param {object} oEvent an event containing the total number of items in the list
		 * @private
		 */
		onListUpdateFinished: function(oEvent) {
			var sTitle,
				iTotalItems = oEvent.getParameter("total"),
				oViewModel = this.getModel("detailView");

			// only update the counter if the length is final
			if (this.byId("lineItemsList").getBinding("items").isLengthFinal()) {
				if (iTotalItems) {
					sTitle = this.getResourceBundle().getText("detailLineItemTableHeadingCount", [iTotalItems]);
				} else {
					//Display 'Line Items' instead of 'Line items (0)'
					sTitle = this.getResourceBundle().getText("detailLineItemTableHeading");
				}
				oViewModel.setProperty("/lineItemListTitle", sTitle);
			}
		},

		/* =========================================================== */
		/* begin: internal methods                                     */
		/* =========================================================== */

		/**
		 * Binds the view to the object path and expands the aggregated line items.
		 * @function
		 * @param {sap.ui.base.Event} oEvent pattern match event in route 'object'
		 * @private
		 */
		_onObjectMatched: function(oEvent) {
			//var sObjectPath = "/RequestSet('" + oEvent.getParameter("arguments").objectId + "')";
			var sContextId = oEvent.getParameter("arguments").ContextId,
				sAppId = oEvent.getParameter("arguments").AppId,
				FormSubmId = oEvent.getParameter("arguments").FormSubmId,
				sObjectPath = "/RequestSet(AppId='" + sAppId + "',ContextId='" + sContextId + "',DecisionId='" + oEvent.getParameter("arguments").DecisionId +
				"',FormSubmId='" + FormSubmId + "')";
			this._bindView(sObjectPath);
			this.bindIconTabBar(sContextId, sAppId);
		},

		bindIconTabBar: function(sContextId, sAppId) {
			var oIconTabBar = this.byId("idIconTabBar");
			oIconTabBar.unbindAggregation('items');
			oIconTabBar.bindAggregation('items', {
				path: sContextId + "_" + sAppId + ">/results",
				factory: $.proxy(this.iconsFactory, this)
			});
		},

		/**
		 * Binds the view to the object path. Makes sure that detail view displays
		 * a busy indicator while data for the corresponding element binding is loaded.
		 * @function
		 * @param {string} sObjectPath path to the object to be bound to the view.
		 * @private
		 */
		_bindView: function(sObjectPath) {
			// Set busy indicator during view binding
			var oViewModel = this.getModel("detailView");

			// If the view was not bound yet its not busy, only if the binding requests data it is set to busy again
			oViewModel.setProperty("/busy", false);

			this.getView().bindElement({
				path: sObjectPath,
				events: {
					change: this._onBindingChange.bind(this),
					dataRequested: function() {
						oViewModel.setProperty("/busy", true);
					},
					dataReceived: function() {
						oViewModel.setProperty("/busy", false);
					}
				}
			});

		},

		_onBindingChange: function() {
			var oView = this.getView(),
				oElementBinding = oView.getElementBinding();

			// No data for the binding
			if (!oElementBinding.getBoundContext()) {
				this.getRouter().getTargets().display("detailObjectNotFound");
				// if object could not be found, the selection in the master list
				// does not make sense anymore.
				this.getOwnerComponent().oListSelector.clearMasterListSelection();
				return;
			}

			var sPath = oElementBinding.getPath(),
				oResourceBundle = this.getResourceBundle(),
				oObject = oView.getModel().getObject(sPath),
				sObjectId = oObject.AppId,
				sObjectName = oObject.Field01,
				oViewModel = this.getModel("detailView"),
				sContextId = oObject.ContextId,
				sFormId = "";

			sFormId=this._oComponent.getFormIdFromReqConfig(sContextId);

			//data required by other methods: context Id, form Id, form submission Id
			this.sFormId = sFormId;
			this.sContextId = oObject.ContextId;
			this.sFormSubmissionId = oObject.FormSubmId;
			this.sDecisionId = oObject.DecisionId;

			//General Tab is available in All tab, call GFD Module
			this._GFDFData.update = false;
			this._GFDFData.domainUpdate = false;
			this._oGeneralTab = null;
			this._getFormData(this.sFormId, this.sContextId, this.sFormSubmissionId);

			this.getOwnerComponent().oListSelector.selectAListItem(sPath);

			oViewModel.setProperty("/detailTitle", oObject.Field07);
			oViewModel.setProperty("/status", oObject.Status);
			oViewModel.setProperty("/enableSubmitBtn", false);

			oViewModel.setProperty("/saveAsTileTitle", oResourceBundle.getText("shareSaveTileAppTitle", [sObjectName]));
			oViewModel.setProperty("/shareOnJamTitle", sObjectName);
			oViewModel.setProperty("/shareSendEmailSubject",
				oResourceBundle.getText("shareSendEmailObjectSubject", [sObjectId]));
			oViewModel.setProperty("/shareSendEmailMessage",
				oResourceBundle.getText("shareSendEmailObjectMessage", [sObjectName, sObjectId, location.href]));
		},
		_getFormData: function(sFormId, sContextId, sNotification) {
			//call GFDModule getFormData
			this._oComponent.getGFDModule().getFormData({
					oDataModel: this._oComponent.getConnectorInstance("gfdService"),
					sFormId: sFormId,
					sObjectId: sFormId,
					sContextId: sContextId,
					sNotificationId: sNotification
				}, $.proxy(this._formDataCallback, this),
				$.proxy(this._domainDataCallback, this));
		},
		_oGeneralTab: null,
		_GFDFData: {
			//for form data
			"update": false,
			"config": null,
			"metadata": null,
			"info": null,
			"document": null,
			//for domain data
			"domainUpdate": false,
			"domainMap": null
		},
		_formDataCallback: function(oConfigModel, oFormMetaDataModel, oFormInfoModel, oDocQuestion) {
			//success 
			this._GFDFData.update = true;
			this._GFDFData.config = oConfigModel;
			this._GFDFData.metadata = oFormMetaDataModel;
			this._GFDFData.info = oFormInfoModel;
			this._GFDFData.document = oDocQuestion;

			if (this.deferred) {
				this.deferred.resolve();
			}

		},
		_bindGFDView: function(oView) {

			if (oView) {
				this._oGeneralTab = oView;

				oView.setModel(this._GFDFData.metadata).bindElement("/EN");
				oView.setModel(this._GFDFData.config, "FormConfig");
				oView.setModel(this._GFDFData.info, "FormDetails");
				oView.setModel(this._GFDFData.document, "DocumentQuestions");
			}
		},
		_domainDataCallback: function(oDomainDataMap) {
			this._GFDFData.domainUpdate = true;
			this._GFDFData.domainMap = oDomainDataMap;
			this._bindGFDViewDomainValues();
		},
		_bindGFDViewDomainValues: function() {
			if (this._oGeneralTab && this._GFDFData.domainUpdate) {
				//for each field create a model and set it to view with fieldName
				//if already set, dont do anything
				var that = this,
					oDomainDataMap = this._GFDFData.domainMap;

				$.each(oDomainDataMap, function(i, aData) {
					if (!that._oGeneralTab.getModel(i)) {
						var oJSONModel = new sap.ui.model.json.JSONModel();
						oJSONModel.setSizeLimit(aData.length + 1);
						oJSONModel.setData({
							domainValue: aData
						});
						that._oGeneralTab.setModel(oJSONModel, i);
					}
				});

			}
		},
		_onMetadataLoaded: function() {
			// Store original busy indicator delay for the detail view
			var iOriginalViewBusyDelay = this.getView().getBusyIndicatorDelay(),
				oViewModel = this.getModel("detailView");
			/*oLineItemTable = this.getView().byId("lineItemsList"),
            iOriginalLineItemTableBusyDelay = oLineItemTable.getBusyIndicatorDelay();*/

			// Make sure busy indicator is displayed immediately when
			// detail view is displayed for the first time
			oViewModel.setProperty("/delay", 0);
			oViewModel.setProperty("/lineItemTableDelay", 0);

			/*oLineItemTable.attachEventOnce("updateFinished", function() {
            	// Restore original busy indicator delay for line item table
            	oViewModel.setProperty("/lineItemTableDelay", iOriginalLineItemTableBusyDelay);
            });*/

			// Binding the view will set it to not busy - so the view is always busy if it is not bound
			oViewModel.setProperty("/busy", true);
			// Restore original busy indicator delay for the detail view
			oViewModel.setProperty("/delay", iOriginalViewBusyDelay);
		},

		iconsFactory: function(sId, oCtxt) {
			var that = this;
			var iconTabFilter = new sap.m.IconTabFilter({
				key: oCtxt.getProperty("TabId"),
				text: oCtxt.getProperty("TabDescription")
			});

			switch (oCtxt.getProperty("TabAssociationName")) {

				case "GeneralSet":
					var generalView = null;
					var displayView = null;
					iconTabFilter.setIcon("sap-icon://hint");
					//General tab with extra details
					sap.ui.view({
						type: sap.ui.core.mvc.ViewType.XML,
						viewName: "publicservices.her.myrequests.view.subviews.GeneralTab",
						async: true
					}).loaded().then(function(oView) {
						iconTabFilter.addContent(oView);
					});
					/**
					 * create a view and keep
					 * on load try to set the GFD model
					 * if not create a promise object
					 * resolve set model and place to icon tabbar
					 **/
					/*sap.ui.view({
						type: sap.ui.core.mvc.ViewType.JS,
						viewName: "publicservices.her.myrequests.view.formviews.DisplayLayout",
						async: true
					}).loaded().then(function(oView) {
						if (that._GFDFData.update) {
							//call bind view
							that._bindGFDView(oView);
						} else {
							that.deferred = $.Deferred();
							that.deferred.done(function() {
								//GFD model is set 
								//call bindview
								that._bindGFDView(oView);
								//place it in icontabbar
								iconTabFilter.addContent(oView);
							});
						}
					});*/
					if (that._GFDFData.update) {
						//create and bind view
					} else {
						that.deferred = $.Deferred();
						that.deferred.done(function() {

							sap.ui.view({
								type: sap.ui.core.mvc.ViewType.JS,
								viewName: "publicservices.her.myrequests.view.formviews.DisplayLayout",
								async: true
							}).loaded().then(function(oView) {
								that._bindGFDView(oView);
								that._bindGFDViewDomainValues();
								iconTabFilter.addContent(oView);
							});

							//GFD model is set 
							//call bindview

							//place it in icontabbar

						});
					}

					break;

				case "HoldSet":
					iconTabFilter.setIcon("sap-icon://warning");
					sap.ui.view({
						type: sap.ui.core.mvc.ViewType.XML,
						viewName: "publicservices.her.myrequests.view.subviews.Holds",
						async: true
					}).loaded().then(function(oView) {
						iconTabFilter.addContent(oView);
					});
					break;

				case "FeeSet":
					iconTabFilter.setIcon("sap-icon://money-bills");
					sap.ui.view({
						type: sap.ui.core.mvc.ViewType.XML,
						viewName: "publicservices.her.myrequests.view.subviews.Fees",
						async: true
					}).loaded().then(function(oView) {
						iconTabFilter.addContent(oView);
					});
					break;

				case "RequiredDocSet":
					iconTabFilter.setIcon("sap-icon://documents");
					//iconTabFilter.setCount();
					sap.ui.view({
						type: sap.ui.core.mvc.ViewType.XML,
						viewName: "publicservices.her.myrequests.view.subviews.RequiredDocuments",
						async: true
					}).loaded().then(function(oView) {
						iconTabFilter.addContent(oView);
						that.getDocumentErrorCount(iconTabFilter);
					});

					sap.ui.view({
						type: sap.ui.core.mvc.ViewType.XML,
						viewName: "publicservices.her.myrequests.view.subviews.GeneratedDocuments",
						async: true
					}).loaded().then(function(oView) {
						iconTabFilter.addContent(oView);
					});
					break;
				case "GenDocSet":
					iconTabFilter.setIcon("sap-icon://documents");
					sap.ui.view({
						type: sap.ui.core.mvc.ViewType.XML,
						viewName: "publicservices.her.myrequests.view.subviews.RequiredDocuments",
						async: true
					}).loaded().then(function(oView) {
						iconTabFilter.addContent(oView);
						that.getDocumentErrorCount(iconTabFilter);
					});

					sap.ui.view({
						type: sap.ui.core.mvc.ViewType.XML,
						viewName: "publicservices.her.myrequests.view.subviews.GeneratedDocuments",
						async: true
					}).loaded().then(function(oView) {
						iconTabFilter.addContent(oView);
					});
					break;
			}
			return iconTabFilter;
		},
		
		getDocumentErrorCount: function(iconTabFilter){
			var oIconTab = this.byId("idIconTabBar");
			oIconTab.addDelegate( {
				onAfterRendering: function() {
					var docCount = (oIconTab.getBindingContext()) ? oIconTab.getModel().getProperty(oIconTab.getBindingContext().sPath).DocumentCount : 0;
					if(docCount){
						iconTabFilter.setCount(docCount);
						iconTabFilter.setIconColor("Critical");
					}
				}
			});
		},

		//withdrawForm: function(sServiceUrl, sContextId, sFormId, Objectid, notification, oView) {

		/*	withdrawRequest: function(){
        	Utils.onConfirmationDialog();       
        },*/

		withdrawRequest: function(oEvent) {
			Utils.showBusy();
			var oDataModel = new sap.ui.model.odata.ODataModel("/sap/opu/odata/SAP/GFD_CONFIG_SRV", true),
				detailObjModel = oEvent.getSource().getModel(),
				oModel = oEvent.getSource().getModel().getProperty(oEvent.getSource().getBindingContext().getPath()),
				sFormId = "",
				that = this,
				sPath = "GFD_FormSubmissionCollection(ContextId='" + oModel.ContextId + "',FormSubmId='" + oModel.FormSubmId + "')";

			/*$.each(this.oView.getModel("REQUEST_CONFIG").getData(), function(index, obj) {
				if (obj.ContextId === oModel.ContextId) {
					sFormId = obj.FormId;
					return false;
				}
			});*/
			sFormId=this._oComponent.getFormIdFromReqConfig(oModel.ContextId);
			var errorFn = jQuery.proxy(function(type, msg) {
				Utils.hideBusy();
				//	Utils.showMessage(sap.ui.core.ValueState.Error,sap.ui.core.ValueState.Error,msg);
			}, this);
			oDataModel.update(sPath, {
				'ContextId': oModel.ContextId,
				'FormSubmId': oModel.FormSubmId,
				'FormId': sFormId,
				'Action': "IADHB"
			}, null, function(oData, oRes) {
				Utils.hideBusy();
				sap.m.MessageToast.show("Your application " + oModel.FormSubmId + " has been withdrawn.");
				that.getModel("detailView").setProperty("/status", "IADHB");
				that.getView().getModel().refresh();
			}, errorFn, this);
		},

		submitDocuments: function(oEvent) {
			Utils.showBusy();
			var oForm = sap.ui.getCore().byId("docsUploadForm"),
				oQuestionArray = oForm.getFormContainers()[0].getFormElements(),
				oModel = oForm.getModel(),
				that = this,
				oReqDocObj = oModel.getProperty(oForm.getBindingContext().getPath()),
				documentContent = [],
				that = this,
				sFormId = "";

			$.each(oQuestionArray, function(i, o) {
				var obj = oModel.getProperty(o.getBindingContext().getPath());
				if (obj.FileNumber && obj.Status !== "02") {
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
				}
			});

			if (oQuestionArray.length !== documentContent.length) {
				Utils.hideBusy();
				Utils.showMessage(sap.ui.core.ValueState.Error, sap.ui.core.ValueState.Error, this.getResourceBundle().getText("documentsErrorMsg"));
				return;
			}

			/*$.each(this.oView.getModel("REQUEST_CONFIG").getData(), function(index, obj) {
				if (obj.ContextId === oReqDocObj.ContextId) {
					sFormId = obj.FormId;
					return false;
				}
			});*/
			sFormId=this._oComponent.getFormIdFromReqConfig(oReqDocObj.ContextId);

			//var oDataModel = this._oComponent.getConnectorInstance("gfdService");
			var oDataModel = new sap.ui.model.odata.ODataModel("/sap/opu/odata/SAP/GFD_CONFIG_SRV", true);
			oDataModel.create("GFD_FormSubmissionCollection", {
				'ContextId': oReqDocObj.ContextId,
				'FormId': sFormId,
				'FormSubmId': oReqDocObj.FormSubmId,
				'Action': oReqDocObj.Status,
				'CustomContent': "",
				'Content': "",
				'DocContent': JSON.stringify(documentContent)
			}, null, jQuery.proxy(function(oData, oRes) {
				Utils.hideBusy();
				sap.m.MessageToast.show("Documents have been submitted " + oData.FormId + ".");
				that.getView().getModel().refresh();
				that.getModel("detailView").setProperty("/status", "IADH2");
			}, this), jQuery.proxy(function(type, errorMsg) {
				Utils.hideBusy();
				Utils.showMessage(sap.ui.core.ValueState.Error, sap.ui.core.ValueState.Error, this.getResourceBundle().getText(
					"fillAllManFieldsMsg"));

			}, this));
		},
		onAcceptChangeProgram: function(oEvent){
			//call BE, Accept the offer
			this._oComponent.getGFDModule().acceptDecision({
				'ContextId': this.sContextId,
				'FormSubmId': this.sFormSubmissionId,
				'FormId': this.sFormId
			}, $.proxy(this._onSuccessfulAccept, this));
		},
		_onSuccessfulAccept: function(oData, oResp){
			//refresh odata to refresh status and list
			
			//TODO: change the message
			//var sMsg = this.getResourceBundle().getText("requestSubmitted", [this._sReqTypeSelected, oData.FormSubmId]);
			var sMsg = this.getResourceBundle().getText("formAccepted",[this.sFormSubmissionId]);
			//show async: toast message
			setTimeout(function() {
				//show success message
				sap.m.MessageToast.show(sMsg);
			}, 0);
			this._oComponent.getModel().refresh();
		},
		onRegisterChangeProgram: function(oEvent){
			//DECISION_ID
			//FormSubmId
			var aContent = [];
			aContent.push(new GFDQuestionFromCourse("DECISION_ID", this.sDecisionId));
			aContent.push(new GFDQuestionFromCourse("FormSubmId", this.sFormSubmissionId));
			if(this.sDecisionId && this.sFormSubmissionId){
				this._oComponent.getGFDModule().registerDecision({
					'ContextId': this.sContextId,
					'FormId': this.sFormId,
					"DECISION_ID": this.sDecisionId, 
					"Content": aContent
				}, $.proxy(this._startRegistration, this));
			}
		},
		_startRegistration: function(oData, oResp){
			var aData = (oData.RedirectUrl.split("#")[1]).split("/");
			//navigate to registration Page
			//register/{ContextId}/{FormId}/{FormSubmId}/{DecisionId}/{ProcedureId}/{CourseOffering}/{ObjectId}"
			this._oRouter.navTo("register",{
				ContextId: aData[2], //ContextId of COP registration
				FormId: aData[6],  //Form Id for COP registration, from Request Config
				FormSubmId: this.sFormSubmissionId || "", //FormSubmission ID/ Notification ID of previous ISR, Form Submission ID of Admission
				DecisionId: oData.PrevDecisionid || this.sDecisionId || "", //Decision ID for previous request, for COP Admission scenario
				ProcedureId: oData.ProcedureId || "", //Procedure Id from Redirect Badi
				CourseOffering: oData.CourseOffering || "", //Course Offering from redirect Badi
				ObjectId: oData.ObjectIds || "" // Object Ids from redirect Badi
			});
		},
		withdrawRequestConfirmMsg:function(oEvent){
        	var that =this;
        	that.tempEvent=$.extend(true,{},oEvent);
	        var confirmResponse = $.Deferred();
				confirmResponse.done(function(bUserResponse) {
					if(!bUserResponse){
	        		return;  
	        	    }
	               that.withdrawRequest(that.tempEvent); 
				});
	        Utils.confirmMessage(this.getResourceBundle().getText("withdrawConfirmTitle"),this.getResourceBundle().getText("withdrawRequestConfirmMsg"),confirmResponse);	
        },

		submitDocumentsConfirmMsg:function(oEvent){
        	var that =this;
        	that.tempEvent=$.extend(true,{},oEvent);
	        var confirmResponse = $.Deferred();
				confirmResponse.done(function(bUserResponse) {
					if(!bUserResponse){
	        		return;  
	        	    }
	               that.submitDocuments(that.tempEvent); 
				});
	        Utils.confirmMessage(this.getResourceBundle().getText("submitConfirmTitle"),this.getResourceBundle().getText("resubmitConfirmMsg"),confirmResponse);	
        },
		onAcceptChangeProgramConfirmMsg:function(oEvent){
        	var that =this;
        	that.tempEvent=$.extend(true,{},oEvent);
	        var confirmResponse = $.Deferred();
				confirmResponse.done(function(bUserResponse) {
					if(!bUserResponse){
	        		return;  
	        	    }
	               that.onAcceptChangeProgram(that.tempEvent); 
				});
	        Utils.confirmMessage(this.getResourceBundle().getText("acceptCOPConfirmTitle"),this.getResourceBundle().getText("acceptCOPConfirmMsg"),confirmResponse);	
        },


		onRegisterChangeProgramMsg:function(oEvent){
        	var that =this;
        	that.tempEvent=$.extend(true,{},oEvent);
	        var confirmResponse = $.Deferred();
				confirmResponse.done(function(bUserResponse) {
					if(!bUserResponse){
	        		return;  
	        	    }
	               that.onRegisterChangeProgram(that.tempEvent); 
				});
	        Utils.confirmMessage(this.getResourceBundle().getText("registerCOPConfirmTitle"),this.getResourceBundle().getText("registerCOPConfirmMsg"),confirmResponse);	
        }


	});

});