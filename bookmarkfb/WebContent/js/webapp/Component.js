sap.ui.define([
               "sap/ui/core/UIComponent",
               "sap/ui/model/resource/ResourceModel",
               "publicservices/her/myrequests/model/models",
               "publicservices/her/myrequests/controller/ListSelector",
               "publicservices/her/myrequests/controller/ErrorHandler",
               	"publicservices/her/myrequests/util/Utils",
               "publicservices/her/myrequests/model/formatter",
               "publicservices/her/myrequests/model/grouper"
               
               ], function(UIComponent, ResourceModel, models, ListSelector, ErrorHandler,Utils) {
	"use strict";

	function Connector(sUrl) {

		//oData Model instance with sUrl
		this.oData = new sap.ui.model.odata.ODataModel(sUrl, true);
		this.processRequest = function(oRequest, callback) {
			var oDataModel = this.oData,
			aFilter = $.isArray(oRequest.aFilter) ? oRequest.aFilter : [],
					aBatch = [],
					aBatchChange = [],
					oQueryParam = {};

			if (oRequest.query) {
				oQueryParam = oRequest.query;
			}
			switch (oRequest.method) {
			case 'GET':
				oDataModel.read(oRequest.url, {
					context: oRequest.context,
					success: function(oData, response) {
						callback.call(this, oData, response);
					},
					filters: aFilter,
					urlParameters: oQueryParam
				});
				//batch changes
				break;
			case 'POST':
				oDataModel.create(oRequest.url,oRequest.data,{
					success: function(oData, oResponse){
						callback.call(this, oData, oResponse);
					}
				});
				break;
			case 'PUT':
				oDataModel.update(oRequest.url,oRequest.data,{
					success: function(oData, oResponse){
						callback.call(this, oData, oResponse);
					}
				});
				break;
			case 'DELETE':
				break;
			case 'BATCH':
				$.each(oRequest.batch, function(i, o) {
					switch(o.method){
					case "POST":
						aBatchChange.push(oDataModel.createBatchOperation(o.url, o.method, o.data));
						break;
					default:
						aBatch.push(oDataModel.createBatchOperation(o.url, o.method));
					break;

					}

				});
				oDataModel.addBatchReadOperations(aBatch);
				oDataModel.addBatchChangeOperations(aBatchChange);
				oDataModel.submitBatch(function(oData,oResponse,aErrResp){
					callback.call(this, oData, oResponse, aErrResp);
				},
				function(e) {
					alert.log(e);
				});
				// createBatchOperation(sPath, sMethod, oData?, oParameters?)
			}
		};
	}

	var GFDModule = (function() {
		

		//private 
		var _oDataModel = null,
		_sContextId = "",
		_sFormId = "",
		_sObjectId = "",
		_sNotificationId = "",
		_oFormConfig = new sap.ui.model.json.JSONModel(),
		_oFormInfo = new sap.ui.model.json.JSONModel(),
		_oFormMetadata = new sap.ui.model.json.JSONModel(),
		_oDocQuestions = new sap.ui.model.json.JSONModel(),
		_callback = null,
		_domainDataCallback = null,
		_selectedLang = 'EN',
		_oDomainReqMap = {},
		_oDomainMap = {}; //contains key and JSONMoel;
		var _initData = function(oData, callback, domainDataCallback) {
			_oDataModel = oData.oDataModel; window.testodata = _oDataModel;
			_sFormId = oData.sFormId;
			_sObjectId = oData.sObjectId;
			_sContextId = oData.sContextId;
			_sNotificationId = oData.sNotificationId;
			_callback = callback;
			_domainDataCallback = domainDataCallback;
		};
		var _getFormData = function() {
			//batch call for form Configuration, form metadata, userdata, formFillData
			var sFormMetaDataUrl = "GFD_ApplicantFormSet(FormId='" + _sFormId + "',ContextId='" + _sContextId + "',Objectid='" + _sObjectId +
			"',UserRole='AP')";
			//Form Config
			var sFormConfigUrl = "GFD_ConfigSet('" + _sContextId + "')";
			//Form Data
			var sFormDataUrl = "GFD_FormSubmissionCollection(ContextId='" + _sContextId + "',FormSubmId='" + _sNotificationId + "')";
			//For Initial document content
			var sDocumentsUrl = "GFD_FormSubmissionCollection";
			var oRequest = {};
			oRequest.method = 'BATCH';
			oRequest.batch = [];
			oRequest.batch.push({
				url: sFormConfigUrl,
				method: 'GET'
			});
			oRequest.batch.push({
				url: sFormMetaDataUrl,
				method: 'GET'
			});
			oRequest.batch.push({
				url: sFormDataUrl,
				method: 'GET'
			});
			oRequest.batch.push({
				url: sDocumentsUrl,
				method: 'POST',
				data: {
					"ContextId": _sContextId,
					"FormId": _sFormId,
					"FormSubmId":"NEW", //hardcoded
					"Action":"07" //hardcoded
				}
			});

			_oDataModel.processRequest(oRequest, $.proxy(_onReceivingFormData, this));
		};
		var _onReceivingFormData = function(oData, oResponse) {
			_processFormConfigData(oData.__batchResponses[0].data);
			_processFormMetadata(oData.__batchResponses[1].data,oData.__batchResponses[2].data);
			_processDocumentdata(oData.__batchResponses[3].__changeResponses[0]);
			//_processFormData(oData.__batchResponses[2].data);
			_callback.call(this, _oFormConfig, _oFormMetadata, _oFormInfo, _oDocQuestions);
		};
		var _processFormConfigData = function(oConfig) {
			_oFormConfig.setData(oConfig);
		};
		var _processDocumentdata = function(oDocumentData){
			//_oDocQuestions.setData(JSON.parse(oDocumentData.data.DocQuestion));
			var aFormattedQuestions = [],
			aDocs = JSON.parse(oDocumentData.data.DocQuestion);
			$.each(aDocs, function(i, o){
				var oQuestion = {
						"id": o.DOC_TYPE,
						"errorState": false,
						"brandNewQuestion": "X",
						"fieldType": "field",
						"questionText": o.TEXT,
						"value": (o.DOC_ID || "") + "||" + (o.FILE_NAME || "") + "||" + o.DOC_TYPE + "||" + (o.DOC_VERSION || "") + "||" + (o.DOC_STAT || ""),
						"type": "DU", //type is DU
						"mandatory": true, //required always
						"enable": true, //Depends on Application Status (Preliminary excluded etc.,)
						"runtimeQues": true
				};
				aFormattedQuestions.push(oQuestion);
			});
			_oDocQuestions.setData(aFormattedQuestions);
		};
		var _processFormMetadata = function(oFormMetaData, oFormData) {
			_oFormInfo.setData(oFormMetaData);
			_oFormMetadata.setData(JSON.parse(oFormMetaData.FormContent) || {});
			_fillFormAndCreateDomainModels((oFormData.Content && JSON.parse(oFormData.Content)) || {},(oFormData.CustomContent && JSON.parse(oFormData.CustomContent)) || {});
		};
		
		var visibilityHandling = function(obj){
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
        		return;
			};

		var _fillFormAndCreateDomainModels = function(oFormData,oCustomData) {
			var that=this;
			_oDomainReqMap = {};
			if (_oFormMetadata.getData()[_selectedLang].section) {
				$.each(_oFormMetadata.getData()[_selectedLang].section, function(i, sections) {
					//all sections are processed here
					if (sections.groups) {
						$.each(sections.groups, function(j, groups) {
							//all groups are processed here
							if (groups.question) {
								$.each(groups.question, function(k, question) {

									//each question is processed

									//push data to _oDomainReqMap if question has BE mapping and type has domain values (RB/checkbox/SelectBox/Combobox type of question)
									var bF4HelpAvailable = question.F4availabl && (question.F4availabl === 'X'),
									bMultipleOptionsType = question.type && (question.type === "DD" || question.type === "RB"),
									sTabName = question.TabName,
									sFieldName = question.FieldName;

									if (bF4HelpAvailable && bMultipleOptionsType && !question.DependentField) {
										_createBatchDomainReq(sTabName, sFieldName);
									}

									if (!jQuery.isEmptyObject(oFormData)) {
										$.each(oFormData, function(i, oVal) {

											if (question.ConfigMapping == oVal.CONFIG_MAPPING && question.fieldName == oVal.PARAM) {
												question.value = oVal.PARAMVALUE;
												//	question.enabled = false;
												if (question.Childfield && question.Childfield !== "") {
													var oContextObj = {
															TabName: question.TabName,
															Childfield: question.Childfield,
															FieldName: question.FieldName,
															sValue: question.value
													};
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
													that.getLazyLoadingData(oRequest,oContextObj);   
												}
											}
										});
									}
									if (!jQuery.isEmptyObject(oCustomData)) {
										$.each(oCustomData, function(m, custOVal) {
											if (question.id == custOVal.PARAM) {
												question.value = custOVal.PARAMVALUE;
												if (this.PARAMTYPE == "RB" || this.PARAMTYPE == "DD" || this.PARAMTYPE == "RB2") {
													$.each(question.domain, function(n, a) {
										
														if (a.id == custOVal.PARAMVALUE) {
															a.selected = true;
															if (question.type === "DD") {
																question.value = a.key;
															}
														}
														if (a.selected === true && a.hasChildQuestion === true) {
														    //	that.visibilityHandling(a.childObj, oFormObj, oView);
														    var obj = {
														        curQid: question.id,
														        lang: _selectedLang, 
														        makeVisible: true,
														        oModel: _oFormMetadata,
														        oSelectedkey: a,
														        resetVisible: true
														        };
														        
														         visibilityHandling(obj);
														}
													});
												} else if (question.type == "CB") {
													question.value = custOVal.PARAM_TAB;
													$.each(question.domain, function(index, domainObj) {
													
														if (custOVal.PARAM_TAB) {
															$.each(custOVal.PARAM_TAB, function(val, pValObj) {
																if (domainObj.id === pValObj.PARAMVALUE) {
																	domainObj.selected = true;
																}

																if (domainObj.selected === true && domainObj.hasChildQuestion === true) {
																	//that.visibilityHandling(domainObj.childObj, oFormObj, oView);
																	var obj = {
        														        curQid: question.id,
        														        lang: _selectedLang, 
        														        makeVisible: true,
        														        oModel: _oFormMetadata,
        														        oSelectedkey: domainObj,
        														        resetVisible: false
        														        };
        														        visibilityHandling(obj);
																}
															});
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
					_batchDomainCall();
					_oFormMetadata.checkUpdate();
				});
			}
		};
		var _batchDomainCall = function() {
			//do a batch call on all the request URL stored in the _oDomainReqMap and write request to _oDomainMap
			var oRequest = {};
			oRequest.method = 'BATCH';
			oRequest.batch = [];
			_oDomainMap = {};

			//push all the requests to the batch which are not there in the _oDomainMap
			$.each(_oDomainReqMap, function(i, sUrl) {
				/***
				 * Temporary fix: enable below condition for performacnce
				 * if enabled repeated call for domain calls won't happen for domain values
				 */
				//if (!_oDomainMap[i]) {
					oRequest.batch.push({
						url: sUrl,
						method: 'GET'
					});
				//}
			});
			if(oRequest.batch.length > 0){
			//call backend and processdata in callback
				_oDataModel.processRequest(oRequest, $.proxy(_onReceivingDomainData, this));
			}else{
				_domainDataCallback.call(this, _oDomainMap);
			}
		};
		var _onReceivingDomainData = function(oData, oResponse, aErrResp) {
			var aReqKeys = [];
			$.each(_oDomainReqMap, function(i, s){
				aReqKeys.push(i);
			});
			
			//check data and process and call the domain callback
			$.each(oData.__batchResponses, function(i, oResp) {
				if (oResp.statusCode === "200" && oResp.data && oResp.data.results /*&& (oResp.data.results.length > 0)*/) {
					var sFieldName = aReqKeys[i] || oResp.data.results[0].FieldName; //new change
					_oDomainMap[sFieldName] = oResp.data.results;
				}
			});
			_domainDataCallback.call(this, _oDomainMap);
		};
		var _createBatchDomainReq = function(sTabName, sFieldName) {
			//fills _oDomainReqMap by taking data
			var sFilter1 = encodeURIComponent("TabName eq '" + sTabName + "'"),
			sFilter2 = encodeURIComponent("FieldName eq '" + sFieldName + "'"),
			sFilter3 = encodeURIComponent("ContextId eq '" + _sContextId + "'"),
			sUrl = "/GFD_DomainCollection?$filter=" + sFilter1 + encodeURIComponent(" and ") + sFilter2 + encodeURIComponent(" and ") + sFilter3;

			_oDomainReqMap[sFieldName] = sUrl;

		};
		
		 
		var _processData = function(oFormData, bNoValidation) {
			//process JSON to send it to backend
			var content = [],
			customContent = [],
			documentContent = [],
			sLanguage = 'EN',
			aLanguages = ['EN', 'DE'],
			fComplete = 1,
			aTableGroup = [],
			bCompleted = true,
			oDataToPost = null;

			//Class to create the return data: use at the end to create a instance and return
			function processedData(oFormData, oProcessedData, bCompleted){
				this.RAWDATA = oFormData; //return whatever received
				this.FORMDATA = oProcessedData; //dont fill form is incomplete
				this.COMPLETE = bCompleted; //true or false
			}     


			/**
			 * perform Validation: loop 3 levels to check if all questions are complete and unset bCompleted
			 * do not perform validation if bNoValidation is set
			 */
			if(!bNoValidation){
				if (oFormData[sLanguage].section) {
					$.each(oFormData[sLanguage].section, function(i, sections) {
						//all sections are processed here
						if (sections.groups) {
							$.each(sections.groups, function(j, groups) {
								//all groups are processed here
								if (groups.question) {
									$.each(groups.question, function(k, question) {

										/**
										 * if question is mandatory and value is not filled unset bComplete and set errordata for question
										 */
										if(question.mandatory && !question.value){
											bCompleted = false;
											question.errorState = true;
										}
									});
								}
							});
						}
					});
				}
			}
			/**
			 * if form is completely filled, process the form
			 */
			if(bNoValidation || bCompleted){
				//YOYO:Below loop is getting all questions and pushing it to content, custom Content and document content
				$.each(aLanguages, function() {
					if (this === sLanguage) {
						$.each(oFormData[this].section, function(i, a) {

							if (a.groups) {
								$.each(this.groups, function(i, a) {
									if (a.question) {
										$.each(this.question, function(i, a) {
											var oThis = this;
											if (fComplete == 1) {

												if (this.fieldType == 'table') {
													aTableGroup.push(this);
												} else {
													if (!this.brandNewQuestion) {
														content.push({
															"CONFIG_MAPPING": this.ConfigMapping,
															"PARAM": this.fieldName,
															"PARAMVALUE": this.value,
															"PARAMTYPE": this.type
														});
													} else {
														if (this.type === "TB" || this.type === "TA" || this.type === "DF" || this.type === "DD") {
															customContent.push({
																'PARAM': this.id,
																'PARAMVALUE': this.value,
																"PARAMTYPE": this.type
															});
														} else if (this.type === "RB" || this.type === "RB2") {
															$.each(this.domain, function(i, a) {
																if (this.selected) {
																	customContent.push({
																		"PARAM": oThis.id,
																		"PARAMVALUE": this.id,
																		"PARAMTYPE": oThis.type
																	});
																}
															});
														} else if (this.type === "CB") {
															var sComboId = [];
															$.each(this.domain, function(i, a) {
																if (this.selected) {
																	sComboId.push({
																		"PARAMVALUE": this.id
																	});
																}
															});
															customContent.push({
																"PARAM": oThis.id,
																"PARAM_TAB": sComboId,
																"PARAMTYPE": oThis.type
															});

														} else if (this.type === "DU") {
															var sDMSId = this.value.split("||")[0] || "";
															var sFileName = this.value.split("||")[1] || "";
															var sDocType = this.value.split("||")[2] || "";
															var sDocVersion = this.value.split("||")[3] || "";

															documentContent.push({
																"QUESTION": this.id,
																"DOC_TYPE": sDocType,
																"DOC_ID": sDMSId,
																"DOC_ID2": "",
																"DOC_VERSION": sDocVersion,
																"DOC_PART": "",
																"TEXT": this.questionText,
																"FILE_NAME": sFileName
															});
														}

													}
												}
											}
										});

									}
								});
							}
						});
					}
				});
				//YOYO:Below block of code pushes all the table content to the content key of JSON
				if (aTableGroup.length > 0) {
					var sTabName;
					var aTabNames = [];
					var aTabNamesDuplicate = [];
					sTabName = aTableGroup[0].tabName;
					aTabNamesDuplicate.push(sTabName);
					$.each(aTableGroup, function(i, a) {
						if (this.tabName !== sTabName) {
							aTabNamesDuplicate.push(this.tabName);
						}
					});

					$.each(aTabNamesDuplicate, function(i, el) {
						if ($.inArray(el, aTabNames) === -1) {
							aTabNames.push(el);
						}
					});
				}

				var oTableQuestions = {};
				$.each(aTableGroup, function() {
					if (!oTableQuestions[this.tabName]) {
						oTableQuestions[this.tabName] = [];
					}
					oTableQuestions[this.tabName].push(this);
				});

				var oTableContents = [];
				$.each(oTableQuestions, function(i, a) {
					var oTableContent = {};
					oTableContent.PARAM = i;
					oTableContent.CONFIG_MAPPING = a[0].ConfigMapping;
					oTableContent.PARAM_TAB = [];
					$.each(a, function(j, b) {

						var oParamData = {};
						var aParamArray = [];
						var oParamtab = {};
						var iParamTabIndex;
						//  var oParamKeyVal = {};

						if (j === 0) {
							oParamtab.VAL = this.tabKey;
							oParamtab.KEY = this.tabFieldName;
						}

						if (j > 0) {
							$.each(oTableContent.PARAM_TAB, function(k, c) {
								if (this.VAL && b.tabKey === this.VAL) {
									iParamTabIndex = k;
									oParamData.PARAM = b.fieldName;
									oParamData.PARAMVALUE = b.value;
									//this.PARAM_DATA.push(oParamData);
								}
							});
							if (iParamTabIndex != undefined) {
								oTableContent.PARAM_TAB[iParamTabIndex].PARAM_DATA.push(oParamData);
							} else {
								if (!this.VAL) {
									oParamtab.VAL = this.tabKey;
									oParamtab.KEY = this.tabFieldName;
								}
								oParamtab.PARAM_INDEX = ++j;
								oParamData.PARAM = b.fieldName;
								oParamData.PARAMVALUE = b.value;
								aParamArray.push(oParamData);
								oParamtab.PARAM_DATA = aParamArray;
								oTableContent.PARAM_TAB.push(oParamtab);
							}
						} else {
							oParamtab.PARAM_INDEX = ++j;
							oParamData.PARAM = this.fieldName;
							oParamData.PARAMVALUE = this.value;
							aParamArray.push(oParamData);
							oParamtab.PARAM_DATA = aParamArray;
							oTableContent.PARAM_TAB.push(oParamtab);
						}

					});

					$.each(oTableContent.PARAM_TAB, function(k, c) {
						this["PARAM_DATA"].push({
							"PARAM": this.KEY,
							"PARAMVALUE": this.VAL
						});
						delete this.KEY;
						delete this.VAL;
					});
					oTableContents.push(oTableContent);
				});

				$.each(oTableContents, function(i, a) {
					content.push(a);
				});
				//fill SO and procedure ID
				/**
				 * Below block of code needs to be relooked, how to send procedure/Study offer information
				 **/
				/*if (sContextId != 'MINI' && notification === "NEW") {
            		var sObjectIds = Objectid;
            		var aObjData = sObjectIds.split("||");

            		//process the procedure ID from URL
            		var aProData = aObjData[0].split(":");
            		content.push({
            			"CONFIG_MAPPING": aProData[0],
            			"PARAM": aProData[1],
            			"PARAMVALUE": aProData[2]
            		});

            		//Get First SO ID , parent SO Id
            		Objectid = Objectid.split('||')[1].split(':')[2];

            		//process SO IDs from URL
            		var oTab = {};
            		oTab.CONFIG_MAPPING = '';
            		oTab.PARAM_TAB = [];
            		$.each(aObjData, function(i, str) {
            			//i = 0 for procedureID deatils
            			if (i > 0) {
            				var oParamTabData = {};
            				var oParamData = {};
            				var aSOData = [];

            				aSOData = str.split(":");
            				oParamTabData.PARAM_INDEX = i;
            				oParamTabData.PARAM_DATA = [];

            				oParamData.PARAM = aSOData[1];
            				oParamData.PARAMVALUE = aSOData[2];

            				(oParamTabData.PARAM_DATA).push(oParamData);

            				oTab.CONFIG_MAPPING = aSOData[0];
            				(oTab.PARAM_TAB).push(oParamTabData);
            			}
            		});

            		content.push(oTab);

            	}*/
				oDataToPost = {
						"content": content,
						"customContent": customContent,
						"documentContent": documentContent                    
				};
			}

			return new processedData(oFormData, oDataToPost ,bCompleted);

		};
		var _processDocumentDataToSubmit = function(aDocuments){
			var aPreparedDocData = [],
			bCompleted = true;
			function returnDocData(aDocuments, aPreparedDocData, bCompleted){
				this.RAWDATA = aDocuments;
				this.FORMDATA = aPreparedDocData;
				this.COMPLETE = bCompleted;
			};
			function DocQuestionClass(question, doctype, docid, version, text, fname){
				this.QUESTION = question;
				this.DOC_TYPE = doctype;
				this.DOC_ID = docid;
				this.DOC_VERSION = version;
				this.TEXT = text;
				this.FILE_NAME = fname;        		
			};

			$.each(aDocuments, function(i, o){
				var sVal = o.value;
				if(o.mandatory && !(sVal.split("||")[0])){
					//DMS ID not present
					o.errorState = true;
					bCompleted = false;
				}
				aPreparedDocData.push(new DocQuestionClass(o.id, sVal.split("||")[2], sVal.split("||")[0], sVal.split("||")[3], o.questionText, sVal.split("||")[1] ));
			});      	

			return new returnDocData(aDocuments, aPreparedDocData, bCompleted);
		};
		var _submitForm = function(oData, sActionCode, callback, errorCallback,sConfirmTitle,sConfirmMsg) {
			//sServiceUrl, sContextId, sFormId, oView, sActionCode, notification, Objectid
			var _oConfig = oData.config.getData(),
			_oInfo = oData.info.getData(),
			_oMetadata = oData.metadata.getData(),
			_bDocumentDetermination = (sActionCode === "07") ? true : false,
					_oCourses = _bDocumentDetermination ? [] : oData.courses.getData(),
							_oDocuments = _bDocumentDetermination ? "" : oData.document.getData();

					var sContextId = _oInfo.ContextId || _oConfig.ContextId,
					sFormId = _oInfo.FormId,
					//TODO: Hardcoded, take from enums in the Module
					notification = 'NEW', //TODO: Hardcoded
					Objectid = _oConfig.Objectid || _oInfo.FormId,
					oReq = {},
					oPreparedData = null,
					oRawDataFormIfIncomplete = null,
					bFromDataComplete = null, 
					aPreparedDocumentData = null,
					oRawDataDocumentIfIncomplete = null,
					bDocumentDataComplete = null;


					//prepare form data
					setTimeout(function(){
						//call recieve data
						var oData = _processData(_oMetadata, _bDocumentDetermination);
						oPreparedData = oData.FORMDATA; //FORMDATA is processed data
						oRawDataFormIfIncomplete = oData.RAWDATA;
						bFromDataComplete = oData.COMPLETE;
						__submitFormConfirmMsg();
					},0);

					if(!_bDocumentDetermination){
						//prepare Document data
						setTimeout(function(){
							var oData = _processDocumentDataToSubmit(_oDocuments);
							aPreparedDocumentData = oData.FORMDATA,
							oRawDataDocumentIfIncomplete = oData.RAWDATA,
							bDocumentDataComplete = oData.COMPLETE;
							__submitFormConfirmMsg();
						},0);
					}
                    function __submitFormConfirmMsg(){
                    	if(!_bDocumentDetermination && (bFromDataComplete && bDocumentDataComplete) ){
                    		var oLocale = sap.ui.getCore().getConfiguration().getFormatLocale();
				              var oBundle = jQuery.sap.resources({
				                     url: jQuery.sap.getModulePath("publicservices.her.myrequests.i18n.i18n", ".properties"),
				                     locale: oLocale
				              });
	                    	jQuery.sap.require("sap.m.MessageBox");
					        sap.m.MessageBox.show(oBundle.getText("submitRequestConfirmMsg"), {
						    icon: sap.m.MessageBox.Icon.INFORMATION,
							title: oBundle.getText("submitConfirmTitle"),
							actions: [sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.NO],
							onClose: function(oAction) {
								if (oAction === sap.m.MessageBox.Action.YES) {
									__submitForm();
								}else{
									Utils.hideBusy();
								}
							}
							});
                    	}else{
                    		__submitForm();
                    	}
		                    }
					//start: submit form: call as callback            
					function __submitForm(){
						
						if(_bDocumentDetermination || (bFromDataComplete && bDocumentDataComplete) ){
							var sProcedureId = "",
							sCourseOffering = "",
							sObjectIds = "",
							sPrevDecisionId = "";
							//push courses Info to content
							if(_oCourses && !jQuery.isEmptyObject(_oCourses)){
								//if(jQuery.isPlainObject(_oCourses)){
								sProcedureId = _oCourses.ProcedureId ? _oCourses.ProcedureId : ""; 
								sCourseOffering = _oCourses.CourseOffering ? _oCourses.CourseOffering : ""; 
								sObjectIds = _oCourses.ObjectIds ? _oCourses.ObjectIds : ""; 
								sPrevDecisionId = _oCourses.PrevDecisionid ? _oCourses.PrevDecisionid : "";
								/*$.each(_oCourses,function(i, o){
									oPreparedData.content.push(o);
								});*/
							}
							//Action Code
							sActionCode = sActionCode || 'IADH2';
							//prepare Request to POST
							oReq.url = "GFD_FormSubmissionCollection";
							oReq.method = "POST";
							oReq.data = {
									"ProcedureId": sProcedureId,
									"CourseOffering": sCourseOffering,
									"ObjectIds": sObjectIds,
									"PrevDecisionid": sPrevDecisionId,
									'ContextId': sContextId,
									'FormId': sFormId,
									'FormSubmId': notification,
									'Action': sActionCode,
									'CustomContent': JSON.stringify(oPreparedData.customContent),
									'Content': JSON.stringify(oPreparedData.content),
									//'DocContent': JSON.stringify(oPreparedData.documentContent)
									'DocContent': _bDocumentDetermination ? "" : JSON.stringify(aPreparedDocumentData)
							};

							//call BE via connector
							_oDataModel.processRequest(oReq, callback);    
						}else if(oRawDataFormIfIncomplete && oRawDataDocumentIfIncomplete){
							//call error callback with rawdata
							errorCallback.call(this,oRawDataFormIfIncomplete,oRawDataDocumentIfIncomplete,bFromDataComplete,bDocumentDataComplete);
						}
					
					}
					//end: submit form: call as callback

		};
		var _updateISRFormData = function(oData, sActionCode, callback){
			//using for accepting form
			//Action Code
			sActionCode = sActionCode || "IADHA";
			var oReq = {},
			sContextId = oData.ContextId || "",
			sNotification = oData.FormSubmId || "",
			sFormId = oData.FormId;
			oReq.method = "PUT";
			oReq.url = "GFD_FormSubmissionCollection(ContextId='" + sContextId + "',FormSubmId='" + sNotification + "')";
			oReq.data = {
					'ContextId': sContextId,
					'FormSubmId': sNotification,
					'FormId': sFormId,
					'Action': sActionCode
			};         

			//call BE via connector
			_oDataModel.processRequest(oReq, callback);
		};
		var _callredirectBadi = function(oData, sActionCode, callback){      		

			//Action Code
			sActionCode = sActionCode || "IADH2";

			var sContextId = oData.ContextId || "",
			sFormId = oData.FormId || "",
			oContent = oData.Content || {} ,
			sDecisionId = oData.DECISION_ID || "",
			oReq = {};

			//prepare Request to POST
			oReq.url = "GFD_FormSubmissionCollection";
			oReq.method = "POST";
			oReq.data = {
					'ContextId': sContextId,
					'FormId': sFormId,
					'FormSubmId': "NEW", 
					'Action': sActionCode,
					'Content': JSON.stringify(oContent)
			};

			//call BE via connector
			_oDataModel.processRequest(oReq, callback);
		};
		var _getFileUploadData = function(oData){
			//prepare slug to be sent while uploading 
			return "FileName:" + oData.FileName + "||FormSubmId:" + (oData.FormSubmId || "") + "||ContextId:" + (oData.ContextId || _sContextId) + "||QuestionId:" + oData.QuestionId +
			"||DocType:" + oData.DocType + "||FileNumber:" + oData.FileNumber + "||DocVer:" + oData.DocVer  + "||Scenario:" + (oData.Scenario || "");
		};
		var _getCsrfForFileUpload = function(){
			//get CSRF token and return
			return _oDataModel.oData.getSecurityToken();
		};
		var _getFileUploadUrl = function(){
			return "/sap/opu/odata/sap/GFD_CONFIG_SRV" + "/GFD_FileSet"; //service url + entity name
		};
		var _getFileDownloadUrl = function(oData){
			var sUrl = "/sap/opu/odata/sap/GFD_CONFIG_SRV";
			sUrl += "/GFD_FileSet(ContextId='" + (oData.ContextId || _sContextId) + "',FileNumber='" + oData.FileNumber + "',DocType='" + oData.DocType + "',DocVer='" + oData.DocVer +"')/$value";

			return sUrl;
		};
		return {
			getFormData: function(oData, callback, domainDataCallback) {
				_initData(oData, callback, domainDataCallback);
				_getFormData();
			},
			submitForm: function(oData, callback, errorCallback) {
				_submitForm(oData, "IADH2", callback, errorCallback);
			},
			getDocumentQuestions: function(oData, callback) {
				_submitForm(oData, "07", callback);
			},
			getFileUploadData: function(oData){
				return _getFileUploadData(oData);
			},
			getCsrfForFileUpload: _getCsrfForFileUpload,
			getFileUploadUrl : _getFileUploadUrl,
			getFileDownloadUrl: function(oData){
				return _getFileDownloadUrl(oData);
			},
			callredirectBadi : function(oData, callback){
				_callredirectBadi(oData, "IADH2", callback);
			},
			setDataModel: function(oModel){
				_oDataModel = _oDataModel || oModel;
				return this;
			},
			acceptDecision: function(oData, callback){
				_updateISRFormData(oData, '', callback);
			},
			registerDecision: function(oData, callback){
				_callredirectBadi(oData, 'REGIS', callback);
			}
		};

	
	})();

	return UIComponent.extend("publicservices.her.myrequests.Component", {

		metadata: {
			manifest: "json"
		},
		/*Holds all the oDataInstance of Connector model*/
		oConnectorMap: {},
		/**
		 * The component is initialized by UI5 automatically during the startup of the app and calls the init method once.
		 * In this method, the resource and application models are set and the router is initialized.
		 * @public
		 * @override
		 */
		init: function() {
			this.oListSelector = new ListSelector();
			this._oErrorHandler = new ErrorHandler(this);
			this.navToMasterView = false;
			// set the device model
			this.setModel(models.createDeviceModel(), "device");
			// set the FLP model
			this.setModel(models.createFLPModel(), "FLP");

			// call the base component's init function and create the App view
			UIComponent.prototype.init.apply(this, arguments);

			// create the views based on the url/hash
			this.getRouter().initialize();
			//SET APP CONFIG: language and App Id
			this._setApplicationConfig();

			//create request config Set Models
			this._createReqConfigModel();

			//set the header data
			this._setHeaderData();

			this._setLanguageData();

			var oConfigModel = new sap.ui.model.json.JSONModel({
				selectedLanguage: jQuery.sap.getUriParameters().get("sap-language") || "EN"
			});
			this.setModel(oConfigModel, "config");
			

		},

		_setLanguageData: function(){
			var oReq = {};
			oReq.method = "GET";
			oReq.url = "GFD_Allowed_LanguagesSet";
			//StudyOfferSet
			this.getConnectorInstance("gfdService").processRequest(oReq, $.proxy(this._onReceivingLanguageData, this));	
		},

		_onReceivingLanguageData: function(oData,oResponse){
			var oSupportedLangModel = new sap.ui.model.json.JSONModel();
			oSupportedLangModel.setData({
				"languages": oData.results
			});
			this.setModel(oSupportedLangModel, "language");
		},

		_setApplicationConfig: function(){
			var oModel = new sap.ui.model.json.JSONModel();
			oModel.setData({
				applicationId: jQuery.sap.getUriParameters().get("appId") || "01",
				language: jQuery.sap.getUriParameters().get("sap-language") || "EN"
			});
			this.setModel(oModel,"appconfig");
		},
		_createReqConfigModel: function() {
			var oReq = {};
			var sAppID = jQuery.sap.getUriParameters().get("appId") || "01";
			var sFilter = "?$filter=" + encodeURIComponent("AppId eq '" + sAppID + "'");
			var sExpand = "&$expand=TabsConfigSet";
			oReq.method = "GET";
			oReq.url = "ReqConfigSet" + sFilter + sExpand; //StudyOfferSet
			this.getConnectorInstance("mainService").processRequest(oReq, $.proxy(this._onReceivingAppConfig, this));
		},

		_setHeaderData: function(){
			//logo data
			//model for Admin Config Set
			var oReq = {};
			oReq.method = "GET";
			oReq.url = "ReqAppPropertySet"; //StudyOfferSet
			this.getConnectorInstance("mainService").processRequest(oReq, $.proxy(this._onReceivingHeaderData, this));

		},

		_onReceivingHeaderData: function(oData,oResponse){
			var that = this;
			var oHeaderModelInfo = new sap.ui.model.json.JSONModel();
			oHeaderModelInfo.setData(oData.results);
			this.setModel(oHeaderModelInfo,"configuration");
			var oConfig = {};
			$.each(oData.results, function(index, obj) {
				oConfig[this.KeyName] = this.Value;
			});
			oHeaderModelInfo.setData(oConfig);
			that._setFavIcon();
			//	that._setDocumentTitle();
			this.setModel(oHeaderModelInfo, "configuration");
			this.oModels["configuration"] = oHeaderModelInfo;
		},

		/*_setDocumentTitle: function(sPage) {
			var sName = this.getModel('configuration').getProperty('/UNIVERSITYNAME');
			//var sUserName = this.getModel('configuration').getProperty('/USERNAME');
			var sTitle = this.oResBundle.getText('ADM_FORM_DES');
			sPage = (sPage || null !== null) ? sPage : sTitle;
			document.title = sName + " | " + sPage;
		},*/

		_setFavIcon: function() {
			var sUrl = this.getModel('configuration').getProperty('/FAVICON');
			var link = document.createElement('link');
			link.type = 'image/x-icon';
			link.rel = 'shortcut icon';
			link.href = sUrl;
			document.getElementsByTagName('head')[0].appendChild(link);
		},
		_onReceivingAppConfig: function(oData, oResponse) {
			var that = this;
			var oAppConfigModel = new sap.ui.model.json.JSONModel();
			oAppConfigModel.setData(oData.results);
			this.setModel(oAppConfigModel,"REQUEST_CONFIG");
			$.each(oData.results, function(index, obj) {

				// create JSON model  
				var oODataJSONModel = new sap.ui.model.json.JSONModel();
				// set the odata JSON as data of JSON model  
				oODataJSONModel.setData(obj.TabsConfigSet);
				// set the ReqConFigModel model  
				that.setModel(oODataJSONModel, obj.ContextId + "_" + obj.AppId);
			});
		},
		/**
		 * The component is destroyed by UI5 automatically.
		 * In this method, the ListSelector and ErrorHandler are destroyed.
		 * @public
		 * @override
		 */
		destroy: function() {
			this.oListSelector.destroy();
			this._oErrorHandler.destroy();
			// call the base component's destroy function
			UIComponent.prototype.destroy.apply(this, arguments);
		},

		/**
		 * This method can be called to determine whether the sapUiSizeCompact or sapUiSizeCozy
		 * design mode class should be set, which influences the size appearance of some controls.
		 * @public
		 * @return {string} css class, either 'sapUiSizeCompact' or 'sapUiSizeCozy'
		 */
		getContentDensityClass: function() {
			if (!this._sContentDensityClass) {
				if (!sap.ui.Device.support.touch) { // apply compact mode if touch is not supported; this could me made configurable for the user on "combi" devices with touch AND mouse
					this._sContentDensityClass = "sapUiSizeCompact";
				} else {
					this._sContentDensityClass = "sapUiSizeCozy"; // needed for desktop-first controls like sap.ui.table.Table
				}
			}
			return this._sContentDensityClass;
		},
		getConnectorInstance: function(sKey) {
			var oDataSource = this.getDataSources();
			if (oDataSource[sKey]) {
				//if sKey is maintained in manifest.json then only return the oData Model
				if (!this.oConnectorMap[sKey]) {
					var connector = new Connector(oDataSource[sKey].uri);
					this.oConnectorMap[sKey] = connector;
				}
				return this.oConnectorMap[sKey];
			}
		},
		getDataSources: function() {
			return this.getMetadata().getManifestEntry('sap.app').dataSources;
		},
		getGFDModule: function(){
			return GFDModule.setDataModel(this.getConnectorInstance("gfdService"));
		},

		getLazyLoadingData: function(oRequest, oContext){
			var that = this;
			this.getConnectorInstance("gfdService").processRequest(oRequest, jQuery.proxy(function(oResp) {
				var oJSONModel = new sap.ui.model.json.JSONModel();
				oJSONModel.setSizeLimit(oResp.results.length + 1);
				oJSONModel.setData({
					domainValue: oResp.results
				});
				that .setModel(oJSONModel, oContext.Childfield);
			}, this));
		},
		getFormIdFromReqConfig:function(sContextId){
			var sFormId = $.grep(this.getModel("REQUEST_CONFIG").getData(), function(o, i){
                    		  return o.ContextId === sContextId;
                    	})[0].FormId;
            return sFormId;        	
		},
		getContextText:function(sContextId){
			var sContextText = $.grep(this.getModel("REQUEST_CONFIG").getData(), function(o, i){
                    		  return o.ContextId === sContextId;
                    	})[0].ContextDesc;
            return sContextText;        	
		}
	});

});