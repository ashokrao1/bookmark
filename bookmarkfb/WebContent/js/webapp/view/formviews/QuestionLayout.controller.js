sap.ui.define([
    "publicservices/her/myrequests/controller/BaseController",
    "sap/ui/model/json/JSONModel"
], function(BaseController, JSONModel) {
    "use strict";

    return BaseController.extend("publicservices.her.myrequests.view.formviews.QuestionLayout", {
        onInit: function() {
            this._oComponent = this.getOwnerComponent();
            //this.oResBundle = this.getOwnerComponent().getModel("i18n").getResourceBundle();
            //this._oModel = this._oComponent.getModel();
            jQuery.sap.require('sap.ui.unified.Calendar');

            sap.m.RadioButtonGroup.extend("SLCMRadioButtonGroup", {
                destroyButtons: function() {

                    this.myChange = true;
                    this.destroyAggregation("buttons");
                    this.myChange = undefined;

                    if (this.aRBs) {
                        while (this.aRBs.length > 0) {
                            this.aRBs[0].destroy();
                            this.aRBs.splice(0, 1);
                        }
                    }

                    return this;
                },
                renderer: {}
            });

        },

        formatRadioGroupBtnSelected: function(oContext, oControl) {
            // 		var m = oEvent.getSource().getModel(),
            // 			b = oEvent.getSource().getBindingContext(),
            var sDomain = oContext.getProperty('DomainName'),
                sF4 = oContext.getProperty('F4availabl'),
                sField = oContext.getProperty('fieldName'),
                j = 0;
            var sVal = oContext.getProperty('value');
            var sBrandNewQn = oContext.getProperty('brandNewQuestion');
            var oDomModel = null;

            if (sVal && sF4) {
                oDomModel = oControl.getModel(sField);
                if (oDomModel && oDomModel.getData()) {
                    $.each((oDomModel.getData()).domainValue, function(i, a) {
                        if (a.Key === sVal) {
                            j = i;
                            return false;
                        }
                    });
                    return j;
                } else {
                    this._oComponent.oDomainDefferred[sField] = jQuery.Deferred();
                    //oContext, oControl, j
                    jQuery.when(this._oComponent.oDomainDefferred[sField]).then(jQuery.proxy(function() {
                        oDomModel = oControl.getModel(sField);
                        if (oDomModel && oDomModel.getData()) {
                            $.each((oDomModel.getData()).domainValue, function(i, a) {
                                if (a.Key === sVal) {
                                    j = i;
                                    return false;
                                }
                            });
                        }
                        oControl.setSelectedIndex(j);
                        return j;
                    }, this));
                }

            } else if (sVal && sBrandNewQn === 'X') {

                $.each(oContext.getProperty('domain'), function(i, a) {
                    if (a.key === sVal) {
                        j = i;
                        return false;
                    }
                });
                return j;
            }
        },

        buildDomainModel: function(oContext, oControl) {
            if (!this._oComponent.getModel(oContext.getProperty('fieldName'))) {
                var sUrl = "", //this.prepareURLforDomainData(oContext), //without base url
                    aFilter = [];

                aFilter.push(new sap.ui.model.Filter("TabName", sap.ui.model.FilterOperator.EQ, oContext.getProperty("TabName")));
                aFilter.push(new sap.ui.model.Filter("FieldName", sap.ui.model.FilterOperator.EQ, oContext.getProperty("FieldName")));
                aFilter.push(new sap.ui.model.Filter("ContextId", sap.ui.model.FilterOperator.EQ, "FORM"));

                var oRequest = {
                    url: "/GFD_DomainCollection",
                    method: "GET",
                    aFilter: aFilter
                };
                this._oComponent.processRequest(oRequest, jQuery.proxy(function(oResp) {
                    this.createDomainModel(oResp, oContext);
                }, this));
            }
        },
        removeLeadSelectionRBG: function(oContext, oControl, oEvent) {
            /*  setTimeout(function(){  
	        var oFirstBtn = oControl.getButtons()[0];
	    if(oFirstBtn){
	        oFirstBtn.setSelected(false);
	    }
	    oControl.setSelectedIndex(10000);
	    }, 0);*/
            //var sVal =  this._oComponent.getModel().getProperty('value',oContext);
            /*var oModel = this._oComponent.getModel(),
			sPath = oContext.getPath();
		sPath += '/value';
		var sVal = oModel.getProperty(sPath);
		if (!sVal) {
			oControl.setSelectedIndex(10000);
	    }*/
            // To rest radio button 
            /*	    if(oContext.getProperty("value") === ""){
    		var name = oControl.getId();
    		$("input:radio[name="+name+"]").each( function(){
    		    $(this).removeAttr("checked").closest(".sapMRb").attr("tabindex", -1).removeAttr("aria-checked").removeClass("sapMRbSel");
    		});
	    }*/
        },
        prepareURLforDomainData: function(oContext) {
            //GFD_FieldCollection(Langu='',TabName='PIQAPP_DE_UEQ_TRANSCRIPT',FieldName='UEQ')/GFD_DomainCollection
            var sUrl = "GFD_FieldCollection(Langu='',TabName='PIQAPP_DE_UEQ_TRANSCRIPT',FieldName='UEQ')/GFD_DomainCollection",
                oDomainData = oContext.getProperty("GFD_DomainCollection");
            //TODO: prepare from the TabName FieldName and DomainName

            //get from association (How association is part of FormMetadata)
            //sUrl = oDomainData.__deferred.uri;
            return sUrl;
        },
        createDomainModel: function(oResp, oContext) {
            //Response from oData
            var oJSONModel = new sap.ui.model.json.JSONModel();
            oJSONModel.setData({
                domainValue: oResp.results
            });
            this._oComponent.setModel(oJSONModel, oContext.getProperty('fieldName'));
        },

        textChange: function(oContext, oEvent) {

            var oSource = oEvent.getSource(),
                oModel = oSource.getModel(),
                question = oModel.getProperty(oContext.getPath());
            //Refactoring required
            var iFlag1, iFlag2;
            if (question.errorState === true) {
                iFlag1 = 1;
            }
            question.errorState = false;
            oModel.checkUpdate();
            if (question.checkRequired === true) {
                (function doServerSideValidation() {
                    //send data
                    //on call back
                })();
            } else {
                iFlag2 = 1;
            }

            if (question.ValidationType) {
                (function doClientSideValidation() {

                    switch (question.ValidationType) {
                        case "T":
                            var numberRegex = /^\d+$/;
                            if (!oSource.getValue().match(numberRegex) && oSource.getValue() !== "") {
                                question.errorState = true;
                                question.errorText = this.oResBundle.getText("invalidphno");
                                iFlag2 = 0;
                            } else {
                                question.errorState = false;
                                question.errorText = '';
                                iFlag2 = 1;
                            }
                            break;

                        case "E":
                            var mailRegex = /^\w+[\w-\.]*\@\w+((-\w+)|(\w*))\.[a-z]{2,3}$/;
                            if (oSource.getValue() !== "" && !oSource.getValue().match(mailRegex)) {
                                question.errorState = true;
                                question.errorText = this.oResBundle.getText("invalidmail");
                                iFlag2 = 0;
                            } else {
                                question.errorState = false;
                                question.errorText = '';
                                iFlag2 = 1;
                            }
                            break;

                    }
                    oModel.checkUpdate();
                })();
            }

            if (iFlag1 === 1 && iFlag2 === 1) {
                var sPath,
                    arr,
                    section;
                sPath = oContext.getPath();
                arr = sPath.split("/groups");
                section = oModel.getProperty(arr[0]);
                if (section.errorCount > 0) {
                    section.errorCount = section.errorCount - 1;
                }
                oModel.checkUpdate();
            }
        },

        optionSelected: function(oContext, oEvent) {
            var oRBGroup = oEvent.getSource(),
                //	oRB = oRBGroup.getSelectedButton(),
                oRB = oRBGroup.getButtons()[oEvent.getParameter("selectedIndex")],
                // 			m = oRB.getModel(),
                // 			b = oRB.getBindingContext(),
                // 			sValue = m.getProperty('key', b),
                iFlag = oContext.getProperty('errorState'),
                oModel = this.getView().getModel(),
                m, b, sValue,
                sDomain = oContext.getProperty('fieldName'),
                oSelectedkey = null;

            if (oContext.getProperty('F4availabl')) {
                m = oRB.getModel(sDomain);
                b = oRB.getBindingContext(sDomain);
                var domain = oContext.getProperty('domain');
                $.each(domain, function(index, domainObj) {
                    if (domainObj.key === b.getObject().Key) {
                        //domainObj.id = domainObj.key;
                        oSelectedkey = domainObj;
                        return false;
                    }
                });
                sValue = m.getProperty('Key', b);
            } else {
                m = oRB.getModel();
                b = oRB.getBindingContext();
                sValue = m.getProperty('id', b);
                oSelectedkey = b.getObject();
            }

            oModel.setProperty('value', sValue, oContext, true);
            oModel.setProperty('errorState', false, oContext, true);
            m.getProperty(b.sPath).selected = true;

            if (iFlag) {
                var oPath = oContext.getPath();
                var arr = oPath.split('/groups');
                var section = oModel.getProperty(arr[0]);
                if (section.errorCount > 0) {
                    section.errorCount = section.errorCount - 1;
                }
                //oModel.checkUpdate();
            }
            this.handleChidQuestionVisibility({
                oModel: oModel,
                oSelectedkey: oSelectedkey,
                lang: oRBGroup.getBindingContext().getPath().split('/')[1],
                makeVisible: true,
                resetVisible: true,
                curQid: oContext.getProperty("id")
            });
        },

        checkSelected: function(oEvent) {
            var oSource = oEvent.getSource();
            var oModel = oSource.getModel();
            var aPath = oSource.getBindingContext().getPath().split('/');
            var oModelData = this.oView.getController().getOwnerComponent().getModel('config').getData();
            var sLanguage = oModelData.selectedLanguage;
            var oSelectedkey = oEvent.getSource().getModel().getProperty(oEvent.getSource().getBindingContext().sPath);
            var lang = aPath[1];
            if (oEvent.getParameters().selected) {
                oSelectedkey.selected = true;
                oModel.checkUpdate();
                oSource.getParent().getBindingContext().getObject().value += (oSource.getParent().getBindingContext().getObject().value != "") ?
                    "||" +
                    oSelectedkey.key : oSelectedkey.key;
                this.handleChidQuestionVisibility({
                    oModel: oModel,
                    oSelectedkey: oSelectedkey,
                    lang: lang,
                    makeVisible: true,
                    resetVisible: false,
                    curQid: oSource.getParent().getBindingContext().getObject().id
                });
            } else {
                oSelectedkey.selected = false;
                var valArray = (oSource.getParent().getBindingContext().getObject().value != "") ? oSource.getParent().getBindingContext().getObject()
                    .value
                    .split("||") : [];
                if (valArray.length > 0) {
                    var valArrayStr = "";
                    $.each(valArray, function(index, obj) {
                        if (obj === oSelectedkey.key) {
                            valArray.splice(index, 1);
                        } else {
                            valArrayStr += (valArrayStr !== "") ? "||" + obj : obj;
                        }
                    });
                    oSource.getParent().getBindingContext().getObject().value = (valArray.length > 0) ? valArrayStr : "";
                }
                oModel.checkUpdate();
                this.handleChidQuestionVisibility({
                    oModel: oModel,
                    oSelectedkey: oSelectedkey,
                    lang: lang,
                    makeVisible: false,
                    resetVisible: false,
                    curQid: oSource.getParent().getBindingContext().getObject().id
                });
            }
        },

        onDateChange: function(oContext, oEvent) {
            var oSource = oEvent.getSource(),
            oModel = oSource.getModel(),
            question = oModel.getProperty(oContext.getPath()),
            bValidState = oEvent.getParameter('valid');
            //client side validation
            question.errorState = (!bValidState) ? true : false;
            //do serverside validation
            if(question.ValidationType){
            	//do Implementation
            }
        },

        handleUploadPress: function(oEvent) {
            var oFile = oEvent.getSource(),
                sNotificationId = (this._oComponent.getModel('FormDetails')).getProperty('/notificationID'),
                sObjectId = (this._oComponent.getModel('FormDetails')).getProperty('/objectID'),
                sContextId = (this._oComponent.getModel('FormDetails')).getProperty('/contextID');
            //set Busy Indicator
            oFile.getParent().setBusy(true);
            //var oFile = oButton.getParent().getItems()[0];
            var id = oFile.getModel().getProperty('id', oFile.getBindingContext());
            var sValue = oFile.getModel().getProperty('value', oFile.getBindingContext());
            var a = sValue.split("||");
            var ftype = a[2] || "";
            var dmsnumber = a[0] || "";
            var dmsversion, sScenario = "";

            var oUploader1 = oEvent.getSource().getParent().getContent()[1];
            var oUploader2 = oEvent.getSource().getParent().getContent()[2];

            if ((oUploader1.data('prevVersion') || null) === null) {
                dmsversion = a[3] || "";
                oUploader1.data('prevVersion', dmsversion);
                oUploader2.data('prevVersion', dmsversion);
            } else {
                dmsversion = oUploader1.data('prevVersion');
            }

            var oStatus = null;
            if (sNotificationId != "NEW") {
                oStatus = this.getView().getModel('Status').getProperty("/UserApplicationsSet('" + sNotificationId + "')/Status");
            }

            if (oStatus == "RESUBMIT" /*ps.slcm.enums.constants.RESUBMIT*/ ) {
                sScenario = "R";
            }

            var sUrl = this.prepareURL({
                context: sContextId,
                notification: sNotificationId,
                qid: id
            });

            //oFile.setUploadUrl(this.oView.getController().getOwnerComponent().getMetadata().getConfig().serviceConfig.slcmFileUpload);
            oFile.setUploadUrl(this.prepareURL());
            if (!this.sCsrfToken) {
                this._getCsrfToken();
            }
            // 		var oHeaderParam = this.oView.getController().getOwnerComponent().oHeaderParam;
            // 		var oFileParam;
            // 		oFile.removeAllHeaderParameters();
            // 		$.each(oHeaderParam, function(i, o) {
            // 			oFileParam = new sap.ui.unified.FileUploaderParameter({
            // 				name: i,
            // 				value: o
            // 			});
            // 			oFile.addHeaderParameter(oFileParam);
            // 		});

            var oCSRFTOkenHeader = new sap.ui.unified.FileUploaderParameter({
                name: "X-CSRF-Token",
                value: this.sCsrfToken
            });

            var oApplicantInfoHeader = new sap.ui.unified.FileUploaderParameter({
                name: "slug",
                value: "FileName:" + oFile.getValue() + "||FormSubmId:" + sNotificationId + "||ContextId:" + sContextId + "||QuestionId:" + id +
                    "||DocType:" + ftype + "||FileNumber:" + dmsnumber + "||DocVer:" + dmsversion + "||Scenario:" + sScenario
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
            oFile.getParent().setBusy(false);
            /*var str = oEvent.getParameters().responseRaw;
		str = $('<div/>').html(str).text();
		var oXMLFile = new sap.ui.model.json.JSONModel();
		oXMLFile.setData(JSON.parse(str));

		var sDms = oXMLFile.oData.FILENUMBER;
		var sName = oXMLFile.oData.FILENAME;
		var sType = oXMLFile.oData.DOCTYPE;
		var sVersion = oXMLFile.oData.DOCVER;
		var sStatus = oXMLFile.oData.STATUS;*/
            var oXMLFile = new sap.ui.model.xml.XMLModel();
            oXMLFile.setData(jQuery.parseXML(oEvent.getParameters().responseRaw));
            var sDms = oXMLFile.getProperty('/m:properties/d:FileNumber');
            var sName = oXMLFile.getProperty('/m:properties/d:FileName');
            var sType = oXMLFile.getProperty('/m:properties/d:DocType');
            var sVersion = oXMLFile.getProperty('/m:properties/d:DocVer');
            var sStatus = oXMLFile.getProperty('/m:properties/d:Status');
            var sScenario = 'Upload';
            var sValue = sDms + "||" + sName + "||" + sType + "||" + sVersion + "||" + sStatus + "||" + sScenario;

            var oUploader1 = oEvent.getSource().getParent().getContent()[1];
            var oUploader2 = oEvent.getSource().getParent().getContent()[2];
            oUploader1.data('prevVersion', sVersion);
            oUploader2.data('prevVersion', sVersion);
            var oModel = oFile.getModel();
            var oB = oFile.getBindingContext();
            oModel.setProperty("value", sValue, oB);
            oModel.setProperty('errorState', false, oB);
        },

        openFile: function(oEvent) {
            var oLink = oEvent.getSource();
            var sVal = oLink.getModel().getProperty("value", oLink.getBindingContext());
            var a = sVal.split("||");
            var sUrl = this.oView.getController().getOwnerComponent().getMetadata().getConfig().serviceConfig.serviceUrl;
            sUrl += "/GFD_FileSet(ContextId='" + this.sContextId + "',FileNumber='" + a[0] + "',DocType='" + a[2] + "',DocVer='" + a[3] +
                "')/$value";
            window.open(sUrl);
        },

        _getCsrfToken: function() {
            var that = this;
            var sUrl = this.getOwnerComponent().getMetadata().getConfig().serviceConfig.serviceUrl;
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
            var sUrl = this.getOwnerComponent().getMetadata().getConfig().serviceConfig.serviceUrl;
            sUrl += "/GFD_FileSet"; //(ContextId='"+ oParam.context +"',FormSubmId='"+ oParam.notification +"',QuestionId='"+ oParam.qid +"')";
            return sUrl;
        },

        onClose: function(oEvent) {
            oEvent.getSource().getParent().getParent().close();
        },

        getDocumentLink: function(sVal) {
            var a = sVal.split("||");
            var sUrl = this.getOwnerComponent().getMetadata().getConfig().serviceConfig.serviceUrl;
            sUrl += "/GFD_FileSet(ContextId='" + this.sContextId + "',FileNumber='" + a[0] + "',DocType='" + a[2] + "')/$value";
            return sVal;
        },

        helpText: function(oContext, oControl, oEvent) {
            /*	var aPath = oEvent.getSource().getBindingContext().sPath.split("/");
		var oData = oEvent.getSource().getModel().getData();
		var oModelData = this.oView.getController().getOwnerComponent().getModel("config").getData();
		var sLanguage = oModelData.selectedLanguage;
		var aLanguages = this.getLanguages();
		var oQuestion;
		$.each(aLanguages, function(index, val) {
			if (val === sLanguage) {
				oQuestion = oData[val].section[aPath[3]].groups[aPath[5]].question[aPath[7]];
			}
		});
		var helpText = oQuestion.helpText;*/

            var helpText = oContext.getProperty('helpText');
            this._oHelpText = new sap.m.ResponsivePopover({
                content: new sap.ui.layout.VerticalLayout({
                    content: [
                        /*new sap.m.Text({
					width: "100%",
					text: helpText
				})*/
                        new sap.ui.core.HTML({
                            content: helpText,
                            sanitizeContent: true
                        })
                    ]
                }).addStyleClass("helpTextClass"),
                showHeader: false,
                placement: sap.m.PlacementType.Auto
            });
            var oButton = oEvent.getSource();
            jQuery.sap.delayedCall(0, this, function() {
                this._oHelpText.openBy(oButton);
            });
        },

        comboBoxSelected: function(oContext, oControl, oEvent) {
        	var oModel = oControl.getModel(),
	        	question = oModel.getProperty(oContext.getPath()),
	        	oSelectedItem = oEvent.getParameter('selectedItem'),
	            sValue = '',
	            iFlag = oContext.getProperty('errorState'),
	            sDomain = oContext.getProperty('fieldName');

            if (oSelectedItem && oSelectedItem.getKey()) {
            	if(iFlag === true){
            		 oEvent.getSource().setValueState(sap.ui.core.ValueState.None);
            		 oEvent.getSource().setValueStateText('');
            	}
                sValue = oSelectedItem.getKey();
                //Since the value cannot be invalid, change the error state
                oModel.setProperty('errorState', false, oContext, true);
                
                var oSelectedkey = null;
                if (oContext.getProperty('F4availabl')) {
                    var b = oSelectedItem.getBindingContext(sDomain),
                        domain = oContext.getProperty('domain');
                    $.each(domain, function(index, domainObj) {
                        if (domainObj.key === b.getObject().Key) {
                            //domainObj.id = domainObj.key;
                            oSelectedkey = domainObj;
                            return false;
                        }
                    });
                    if (oContext.getProperty('Childfield') && oContext.getProperty('Childfield') !== "") {
                        //var sUrl = "", //this.prepareURLforDomainData(oContext), //without base url
                        var oContextObj = {
                            TabName: oContext.getProperty("TabName"),
                            Childfield: oContext.getProperty("Childfield"),
                            FieldName: oContext.getProperty("FieldName"),
                            sValue: sValue
                        };
                        
                        //Implement lazy loading
        
                        var aFilter = [];
						aFilter.push(new sap.ui.model.Filter("TabName", sap.ui.model.FilterOperator.EQ, oContextObj.TabName));
						aFilter.push(new sap.ui.model.Filter("FieldName", sap.ui.model.FilterOperator.EQ, oContextObj.Childfield));
						aFilter.push(new sap.ui.model.Filter("ContextId", sap.ui.model.FilterOperator.EQ, "FORM"));
						aFilter.push(new sap.ui.model.Filter("DependentField", sap.ui.model.FilterOperator.EQ, oContextObj.FieldName));
						aFilter.push(new sap.ui.model.Filter("DependFieldValue", sap.ui.model.FilterOperator.EQ, oContextObj.sValue));
						var oRequest = {
							url: "/GFD_DomainCollection",
							method: "GET",
							aFilter: aFilter
						};
						this._oComponent.getLazyLoadingData(oRequest,oContextObj);
                    }
                } else {
                    oSelectedkey = oSelectedItem.getBindingContext().getObject();
                }
            }
            
            //Dependent question
            this.handleChidQuestionVisibility({
				oModel: oModel,
				oSelectedkey: oSelectedkey,
				lang:   oEvent.getSource().getBindingContext().getPath().split('/')[1],
				makeVisible: true,
				resetVisible: true,
				curQid: oContext.getProperty("id")
			});
        },
        comboBoxValueChange: function(oContext, oControl, oEvent) {
            var oSelectedKey = oEvent.getSource().getSelectedItem();
            var sValue = oEvent.getSource().getValue();
            if (!oSelectedKey && sValue !== "") {
                oEvent.getSource().setValue();
                oEvent.getSource().setValueState(sap.ui.core.ValueState.Error);
                oEvent.getSource().setValueStateText('Text option not found');
            } else if (oEvent.getSource().getSelectedItem()) {
                var sText = oEvent.getSource().getSelectedItem().getText();
                if (sValue !== sText) {
                    oEvent.getSource().setValue(sText);
                }
                oEvent.getSource().setValueState(sap.ui.core.ValueState.None);

            }
        },

        handleChidQuestionVisibility: function(obj) {
            this.getView().setBusy(true);
            var oModel = obj.oModel,
                oSelectedkey = obj.oSelectedkey,
                lang = obj.lang,
                makeVisible = obj.makeVisible,
                resetVisible = obj.resetVisible,
                curQid = obj.curQid;
            if (oModel.getData()[lang]) {
                if (oModel.getData()[lang].section) {
                    $.each(oModel.getData()[lang].section, function(j, grp) {
                        if (grp.groups) {
                            $.each(grp.groups, function(index, object) {
                                if (object.question) {
                                    $.each(object.question, function(i, o) {
                                        if (o.parentQid && o.parentQid === curQid) {
                                            if (resetVisible) {
                                                o.visible = (o.parentQid) ? false : true;
                                            }
                                            if (oSelectedkey && oSelectedkey.childObj) {
                                                $.each(oSelectedkey.childObj, function(indx, childObj) {
                                                    if (o.id === childObj.childQid) {
                                                        o.visible = makeVisible;
                                                    }
                                                });
                                            }
                                        }
                                    });
                                }
                            });
                        }
                    });
                }
            }
            oModel.checkUpdate();
            this.getView().setBusy(false);
            return;
        },

        getLanguages: function() {
            return ['EN', 'DE'];
        }

    });

});