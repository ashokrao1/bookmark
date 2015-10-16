sap.ui.define([
    "publicservices/her/myrequests/controller/BaseController",
    "sap/ui/model/json/JSONModel",
    "publicservices/her/myrequests/model/formatter",
    "publicservices/her/myrequests/util/Utils"
], function(BaseController, JSONModel, Formatter, Utils) {
    "use strict";

    function CourseOffering(sName, aValues) {
        this.label = sName;
        this.courselist = $.isArray(aValues) ? aValues : [];
        this.value = "";
        this.text = "";
        this.restrictedAdmission = false;
        this.change = false;
    };

    function RedirectBadiData(sParam, sParamVal) {
        this.CONFIG_MAPPING = "";
        this.PARAM = sParam;
        this.PARAMVALUE = sParamVal;
        this.PARAMTYPE = "DD";
    };

    function GFDQuestionFromCourse(sMapping, sParam, sValue) {
        this.CONFIG_MAPPING = sMapping;
        this.PARAM = sParam;
        this.PARAMVALUE = sValue;
    };
    
    function GFDCourseData(){
    	this.ProcedureId = "";
    	this.CourseOffering = "";
    	this.ObjectIds = "";
    };

    sap.ui.controller("publicservices.her.myrequests.controller.CreateRequest", {
        /**
         * Called when a controller is instantiated and its View controls (if available) are already created.
         * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
         * @memberOf publicservices.her.myrequests.webapp.view.CreateRequest
         */
        onInit: function() {
            //init
            	Utils.showBusy();
            this._oComponent = this.getOwnerComponent();
            this._oRouter = this._oComponent.getRouter();
            this.oResBundle = this._oComponent.getModel("i18n").getResourceBundle();
            
            this._oRouter.getRoute("createRequest").attachPatternMatched(this._onObjectMatched, this);
            
            this._sReqTypeSelected = "";
            //miniQuestionnaire for COP : data declaration
            this._miniQuestionnaireId = "FormChange354";
            
            /**
             * All the context Id releated Hardcoding done below
             */
            this._admissionRestrictedCOPContextId = "PIQ_COP_ADM";
            this._admissionFreeCOPContextId = "PIQ_COP_REGI";
            this._admissionFreeFormId = "";
            this._sCourseListFragment = "publicservices.her.myrequests.view.fragment.CourseList";
            
            //prepare for change of program data
            this._prepareCOPData();

            var oModel = new sap.ui.model.json.JSONModel();
            this.getView().setModel(oModel, "changeofprogramquestions");
            //this.onRequestTypeSelection();
            //popluate the selectBox with Type of request
        },
        
        _onObjectMatched : function(){
        	Utils.hideBusy();
        },
        
        _prepareCOPData: function() {
            var oJSONModel = new sap.ui.model.json.JSONModel();
            oJSONModel.setData({
                "courseOffering": []
            });
            this.getView().setModel(oJSONModel, "courseOffering");
            this._fillProcedureIds();
        },
        _fillProcedureIds: function() {
            var oData = this._oComponent.getModel();
            oData.read("/ProcedureSet", {
                success: $.proxy(this._onReceivingProcedureSet, this)
            });
        },
        onCourseSelected: function(oEvent) {
            var oSelectedItem = oEvent.getParameter("selectedItem"),
                oSelectedModel = oSelectedItem.getModel("courseOffering"),
                oSelectedContext = oSelectedItem.getBindingContext("courseOffering"),
                oList = oEvent.getSource(),
                oListModel = oList.getModel("courseOffering"),
                oListContext = oList.getBindingContext("courseOffering");
            if (oSelectedItem) {
                Utils.showBusy();
            }
            this.handleCourseDialogClose(oEvent);
            //oSelectedModel.getProperty("COURSEVALUE",oSelectedContext)
            //oSelectedModel.getProperty("COURSENAME",oSelectedContext)
            oListModel.setProperty("value", oSelectedModel.getProperty("COURSEVALUE", oSelectedContext), oListContext, true);
            oListModel.setProperty("text", oSelectedModel.getProperty("COURSENAME", oSelectedContext), oListContext, true);
            //check if admission restricted
            var sAdmissionRestricted = oSelectedModel.getProperty("RESTRICTED", oSelectedContext);
            if (sAdmissionRestricted && sAdmissionRestricted === "X") {
                oListModel.setProperty("restrictedAdmission", true, oListContext, true);
            }
            oListModel.setProperty("change", true, oListContext, true);
            //callbackend with new values

            var bChangeIndex = 0,
                aFilters = [],
                sProcedureId = "",
                sParentIds = "",
                aList = oListModel.getData()["courseOffering"];
            if (aList.length > 0) {
                //findout where is the changeIndex
                for (var i = aList.length; i--;) {
                    if (!aList[i].change) {
                        aList.pop();
                    } else {
                        bChangeIndex = i;
                        //reset change flag
                        aList[i].change = false;
                        break;
                    }
                }
                //update model to remove any unwanted question if a selection is intermediate
                oListModel.checkUpdate();

                //loop and get all the data to call the backend API
                $.each(aList, function(i, o) {
                    if (i === 0) {
                        sProcedureId = o.value;
                        //aList.push(new sap.ui.model.Filter('ProcedureId', sap.ui.model.FilterOperator.EQ, o.value));
                    } else {
                        sParentIds += o.value + "||";
                        //aList.push(new sap.ui.model.Filter('ParentFieldIds', sap.ui.model.FilterOperator.EQ, sContextId));
                    }
                });

                //create filters 
                aFilters.push(new sap.ui.model.Filter('ProcedureId', sap.ui.model.FilterOperator.EQ, sProcedureId));
                aFilters.push(new sap.ui.model.Filter('ParentFieldIds', sap.ui.model.FilterOperator.EQ, sParentIds));

                //call backend
                var oData = this._oComponent.getModel();
                oData.read("/DepCourseOfferSet", {
                    filters: aFilters,
                    success: $.proxy(this._processDependentCourseList, this)
                });

            }

        },
        
        handleValueHelpSearch : function (oEvent) {
			var sValue = oEvent.getParameter("value");
			var oFilter = new sap.ui.model.Filter("COURSENAME", sap.ui.model.FilterOperator.Contains, sValue);
			var oBinding = oEvent.getSource().getBinding("items");
			oBinding.filter([oFilter]);
		},
		handleCourseDialogClose:function(oEvent){
			oEvent.getSource().getBinding("items").filter([]);	
		},
        _processDependentCourseList: function(oData) {
            Utils.hideBusy();
            var aListOfCourses = oData.results,
                oModel = this.getView().getModel("courseOffering"),
                oModelData = oModel.getData()["courseOffering"],
                aList = [];
            if (aListOfCourses.length > 0) {
                //processdata
                $.each(aListOfCourses, function(i, o) {
                    var oCourse = {};
                    oCourse.COURSENAME = o.Fieldtext;
                    oCourse.COURSEVALUE = o.Fieldvalue;
                    oCourse.RESTRICTED = o.AdmRestricted;
                    aList.push(oCourse);
                });
                oModelData.push(new CourseOffering(aListOfCourses[0].Fieldname, aList));
                oModel.checkUpdate();
            } else {
                /*var aMiniData = [];
                //call redirection badi
                $.each(oModelData, function(i, o) {
                    var skey;
                    if (i === 0) {
                        skey = "PROCEDURE_ID";
                    } else {
                        skey = o.label;
                    }
                    aMiniData.push(new RedirectBadiData(skey, o.value));
                });

                this._oComponent.getGFDModule().setDataModel(this._oComponent.getConnectorInstance("gfdService")).callredirectBadi({
                	"ContextId" : "PIQ_COP_MINI",//this._admissionFreeCOPContextId,
                	"FormId" : "PIQ_COP_MINI",//this._admissionFreeFormId,
                	"Content" : aMiniData
                }, $.proxy(this._onGettingRedirectBadi, this));*/

            	 //show Questionnaire
                //determine admission-free or admission restricted        		
                if (oModelData.length > 1) {
                	//prepare the course info
                	var oCourseModelData = new GFDCourseData();
                	 $.each(oModelData, function(i, o) {
                         if (i === 0) {
                        	 oCourseModelData.ProcedureId = o.value;
                         }else if(i === 1){
                        	 oCourseModelData.CourseOffering = o.value;
                         }else{
                        	 oCourseModelData.ObjectIds += o.value + "||";
                         }
                     });
                    this.getView().getModel("changeofprogramquestions").setData(oCourseModelData);
                	
                    var bIsAdmRestricted = false;
                    for (var j = 1, iLength = oModelData.length; j < iLength; j++) {

                        if (oModelData[j].restrictedAdmission) {
                            bIsAdmRestricted = true;
                            break;
                        }
                    }
                   
                    if (bIsAdmRestricted) {
                    	
                    	var oThis = this,
                    	sFormId = this._oComponent.getFormIdFromReqConfig(this._admissionRestrictedCOPContextId);
                        //use the Admission Form
                        this._getFormDataForSelectedItem(sFormId, this._admissionRestrictedCOPContextId);
                    } else {
                        if (this._admissionFreeCOPContextId && this._admissionFreeCOPContextId) {
                            //use the Initial Registration Form
                            this._getFormDataForSelectedItem(this._admissionFreeFormId, this._admissionFreeCOPContextId);
                        }
                    }
                }


            }

        },
        _onGettingRedirectBadi: function(oData, oResp) {
            //get Redirect Url: context Id/Form Id and CourseInfo

            var aData = oData.RedirectUrl.split("#")[1].split("/"), //process hash parameters
                that = this,
                aCourseData = aData[4].split("||"),
                aQuestionCourse = [],
                oModel = null;
            setTimeout(function() {
                $.each(aCourseData, function(i, str) {
                    var a = str.split(":");
                    aQuestionCourse.push(new GFDQuestionFromCourse(a[0], a[1], a[2]));
                });
                oModel = that.getView().getModel("changeofprogramquestions");
                oModel.setData(aQuestionCourse);
                //that.getView().setModel(oModel,"changeofprogramquestions");
            }, 0);

            this._getFormDataForSelectedItem(aData[6], aData[2]);

        },
        onChangeOfCourseOffering: function(oEvent) {
            var oInput = oEvent.getSource(),
                oModel = oInput.getModel("courseOffering"),
                oContext = oInput.getBindingContext("courseOffering");

            // create value help dialog
            if (!this.oCourseListDialog) {
                this.oCourseListDialog = sap.ui.xmlfragment(this._sCourseListFragment, this);
                this.getView().addDependent(this.oCourseListDialog);
                jQuery.sap.syncStyleClass("sapUiSizeCompact", this.getView(), this.oCourseListDialog);
            }

            this.oCourseListDialog.setBindingContext(oContext, "courseOffering");
            this.oCourseListDialog.open();
        },
        _onReceivingProcedureSet: function(oProcedureData) {
            var oModel = this.getView().getModel("courseOffering");
            var oData = oModel.getData();
            var aList = [];
            $.each(oProcedureData.results, function(i, o) {
                var oCourse = {};
                oCourse.COURSENAME = o.ProcedureText;
                oCourse.COURSEVALUE = o.ProcedureId;
                aList.push(oCourse);
            });
            oData.courseOffering.push(new CourseOffering("Procedure Id", aList));
            oModel.checkUpdate();
        },
        _showIconToolbar: function() {

        },
        onRequestTypeSelection: function(oEvent) {
            //hide all forms
        	//this.byId("FormIconTabBar").setVisible(false);
        	this.hideControls();
            //set first item selected
        	 //this.onRequestTypeSelection();
            this.byId(this._miniQuestionnaireId).setVisible(false);
            this.showFormTab();
           
            oEvent.getSource().setValueState(sap.ui.core.ValueState.None);

            //get Selected Item Info
            var oSelectedItem = oEvent.getParameter("selectedItem"),
                oBindingContext = oSelectedItem.getBindingContext("REQUEST_CONFIG"),
                oModel = this._oComponent.getModel("REQUEST_CONFIG"),
                //get ContextID and FormId
                sContextId = oModel.getProperty("ContextId", oBindingContext),
                sFormId = oModel.getProperty("FormId", oBindingContext);
            this._sReqTypeSelected = oSelectedItem.getText();

            if (oSelectedItem) {
                Utils.showBusy();
            }

            if (sContextId !== this._admissionFreeCOPContextId) {
                this._getFormDataForSelectedItem(sFormId, sContextId);
            } else {
                //store the form Id for general scenario
                this._admissionFreeFormId = sFormId;
                this.byId(this._miniQuestionnaireId).setVisible(true);
                Utils.hideBusy();
            }
        },
        _getFormDataForSelectedItem: function(sFormId, sContextId) {
            //call GFDModule getFormData
            this._oComponent.getGFDModule().getFormData({
                    oDataModel: this._oComponent.getConnectorInstance("gfdService"),
                    sFormId: sFormId,
                    sObjectId: sFormId,
                    sContextId: sContextId,
                    sNotificationId: 'NEW'
                }, $.proxy(this.callback, this),
                $.proxy(this.domainDataCallback, this));

        },
        callback: function(oConfigModel, oFormMetaDataModel, oFormInfoModel, oDocQuestion) {
            Utils.hideBusy();
            this.getView().setModel(oFormMetaDataModel).bindElement("/EN");
            this.getView().setModel(oConfigModel, "FormConfig");
            this.getView().setModel(oFormInfoModel, "FormDetails");
            this.getView().setModel(oDocQuestion, "DocumentQuestions");
            //set the model and load form 
            //show the form tabs
            //this.byId("FormIconTabBar").setVisible(true);
            this.showControls();
        },
        getDocumentQuestions: function() {
            this._oComponent.getGFDModule().getDocumentQuestions({
                config: this.getView().getModel("FormConfig") || {},
                info: this.getView().getModel("FormDetails") || {},
                metadata: this.getView().getModel() || {}
            }, $.proxy(this.onReceivingDocQuestions, this));
        },
        onReceivingDocQuestions: function(oData, oResponse) {
            //merge the client and server side model
            //algo with i and j has to be written (merge sort with delete)
        },

        formatMandaory: function(sVal) {
            if (sVal) {
                var sMandatory = '*';
                sMandatory.fontcolor('blue');
                return sMandatory + sVal;
            }
        },
        
       /* submitFormConfirm:function(){
        	var that =this;
	        var confirmResponse = $.Deferred();
				confirmResponse.done(function(bUserResponse) {
					if(!bUserResponse){
	        		return;  
	        	    }
	               that.submitForm(); 
				});
	        Utils.confirmMessage(this.oResBundle.getText("submitConfirmTitle"),this.oResBundle.getText("submitRequestConfirmMsg"),confirmResponse);	
        },*/

        submitForm: function() {
            var sReqType = this.getView().byId('reqTypeSelect').getValue();
            var that = this;
            var fComplete = true;
            if (!sReqType) {
                Utils.showMessage(sap.ui.core.ValueState.Error, sap.ui.core.ValueState.Error, this.oResBundle.getText("selectRequestType"));
                this.getView().byId('reqTypeSelect').setValueState(sap.ui.core.ValueState.Error);
            } else {
                if (this.byId(this._miniQuestionnaireId).getVisible() === true) {
                    var oFormElements = this.byId(this._miniQuestionnaireId).findElements()[2].getFormElements();
                    $.each(oFormElements, function(i, a) {
                        if (this.getFields()[0].getValue() === '') {
                            Utils.showMessage(sap.ui.core.ValueState.Error, sap.ui.core.ValueState.Error, that.oResBundle.getText("fillAllMandatoryFieldsMsg"));
                            that.byId(that._miniQuestionnaireId).findElements()[2].getFormElements()[i].getFields()[0].setValueState(sap.ui.core.ValueState.Error);
                            fComplete = false;
                        }
                    });
                }

                if (fComplete === true) {
                    Utils.showBusy();
                    this._oComponent.getGFDModule().submitForm({
                        config: this.getView().getModel("FormConfig"),
                        info: this.getView().getModel("FormDetails"),
                        metadata: this.getView().getModel(),
                        courses: this.getView().getModel("changeofprogramquestions"),
                        document: this.getView().getModel("DocumentQuestions")
                    }, $.proxy(this.onSuccessfulFormSubmission, this), $.proxy(this.onIncompleteFormSub, this));
                }

            }


            /*var sReqType = this.getView().byId('reqTypeSelect').getValue();
        	var that =this;
        	var fComplete = 0;
        	if(!sReqType){
        		Utils.showMessage(sap.ui.core.ValueState.Error,sap.ui.core.ValueState.Error,this.oResBundle.getText("selectRequestType"));
        		this.getView().byId('reqTypeSelect').setValueState(sap.ui.core.ValueState.Error);
        	}else{
        		if(this.byId(this._miniQuestionnaireId).getVisible() === true ){
        			var oFormElements = this.byId(this._miniQuestionnaireId).findElements()[2].getFormElements();
        			$.each(oFormElements, function(i,a){
        				if(this.getFields()[0].getValue() === ''){
        					Utils.showMessage(sap.ui.core.ValueState.Error,sap.ui.core.ValueState.Error,that.oResBundle.getText("fillAllMandatoryFieldsMsg"));
        					that.byId(that._miniQuestionnaireId).findElements()[2].getFormElements()[i].getFields()[0].setValueState(sap.ui.core.ValueState.Error);
        				}else{
        					fComplete = 1;		
        				}
        			});
        			if(fComplete === 0){
        			Utils.showBusy();
	            	this._oComponent.getGFDModule().submitForm({
	                config: this.getView().getModel("FormConfig"),
	                info: this.getView().getModel("FormDetails"),
	                metadata: this.getView().getModel(),
	                document: this.getView().getModel("DocumentQuestions"),
	                courses : this.getView().getModel("changeofprogramquestions")
	            	}, $.proxy(this.onSuccessfulFormSubmission, this), $.proxy(this.onIncompleteFormSub, this));
        			}
        			
        		}
	        	
        	}*/
        },
        onIncompleteFormSub: function(oFormMetaDataModel, oDocQuestion,bFromDataComplete,bDocumentDataComplete) {
        	if(!bFromDataComplete){
        	//if form data is complete and documents are not uploaded	
        		this.showFormTab();
        	}else if(bFromDataComplete && !bDocumentDataComplete){
        	//if form data is complete and documents are not uploaded	
        		this.showAttachmentTab();
        	}
            Utils.hideBusy();
            Utils.showMessage(sap.ui.core.ValueState.Error, sap.ui.core.ValueState.Error,this.oResBundle.getText("fillAllManFieldsMsg"));
            this.getView().getModel().setData(oFormMetaDataModel);
            this.getView().getModel("DocumentQuestions").setData(oDocQuestion);
        },
        onSuccessfulFormSubmission: function(oData, oResponse) {
            Utils.hideBusy();
            //read Response
            //Show a Toast message and goto the created decision
            var sMsg = this.oResBundle.getText("requestSubmitted", [this._sReqTypeSelected, oData.FormSubmId]);

            //show async: toast message
            setTimeout(function() {
                sap.m.MessageToast.show(sMsg);
            }, 0);
            this.resetReqTypeSelect();
        	this.hideControls();
            this.byId(this._miniQuestionnaireId).setVisible(false);
            //remove data
            this.getView().getModel("changeofprogramquestions").setData([]);
            //Naviagte to Splitapp
            this._oComponent.getModel().refresh();
            this._oComponent.navToMasterView = true;
            //this._oRouter.navTo('master', {}, true);
        },
        resetReqTypeSelect:function(){
        	this.byId("reqTypeSelect").setSelectedItem(null);
            this.byId("reqTypeSelect").setValue("");
        },
        hideControls:function(){
            this.byId("FormIconTabBar").setVisible(false);
        },
        showControls:function(){
        	this.byId("FormIconTabBar").setVisible(true);
        	this.byId("FormIconTabBar").setSelectedKey("form");
        },
         showFormTab:function(){
        	if(this.byId("FormIconTabBar").getSelectedKey()!=="form"){
        		this.byId("FormIconTabBar").setSelectedKey("form");	
        	}
        },
        showAttachmentTab:function(){
        	if(this.byId("FormIconTabBar").getSelectedKey()!=="attachments"){
        		this.byId("FormIconTabBar").setSelectedKey("attachments");	
        	}
        },
        onCancel: function() {
        	this.resetReqTypeSelect();
            this.hideControls();
            this._oRouter.navTo('master', {}, true);
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

        domainDataCallback: function(oDomainDataMap) {
           //for each field create a model and set it to view with fieldName
            //if already set, dont do anything
            Utils.hideBusy();
            var that = this;
            $.each(oDomainDataMap, function(i, aData) {
            	/**
            	 * Performance:
            	 * have removed the check for domain data for AT
            	 */
                //if (!that.getView().getModel(i)) {
                    var oJSONModel = new sap.ui.model.json.JSONModel();
                    oJSONModel.setSizeLimit(aData.length + 1);
                    oJSONModel.setData({
                        domainValue: aData
                    });
                    that.getView().setModel(oJSONModel, i);
                //}
            });
        },

        onTabSelect: function(oEvent) {
            var sSelectedKey = oEvent.getParameter("selectedKey"),
                oSelectedItem = oEvent.getParameter("selectedItem");

            if (sSelectedKey === "attachments") {
                //make a BE call and get new questions and update
                this.getDocumentQuestions();
            }

        }

    });
});