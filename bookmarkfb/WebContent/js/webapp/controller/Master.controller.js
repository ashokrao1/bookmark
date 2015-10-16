/*global history */
sap.ui.define([
		"publicservices/her/myrequests/controller/BaseController",
		"sap/ui/model/json/JSONModel",
		"sap/ui/model/Filter",
		"sap/ui/model/FilterOperator",
		"sap/ui/model/Sorter",
		"sap/m/GroupHeaderListItem",
		"sap/ui/Device",
		"publicservices/her/myrequests/model/formatter",
		"publicservices/her/myrequests/model/grouper",
		"publicservices/her/myrequests/util/Utils"
	], function(BaseController, JSONModel, Filter, FilterOperator, Sorter, GroupHeaderListItem, Device, formatter, grouper, Utils) {
	"use strict";

	return BaseController.extend("publicservices.her.myrequests.controller.Master", {

		formatter: formatter,

		/* =========================================================== */
		/* lifecycle methods                                           */
		/* =========================================================== */

		/**
		 * Called when the master list controller is instantiated. It sets up the event handling for the master/detail communication and other lifecycle tasks.
		 * @public
		 */
		onInit: function() {
			//initialize
			this._oComponent = this.getOwnerComponent();
			this._oRouter = this._oComponent.getRouter();
			var sAppId = jQuery.sap.getUriParameters().get("appId") || "01",
			that = this,
			oItemTemplate = new sap.m.ObjectListItem({
					type: "{= ${device>/system/phone} ? 'Active' : 'Inactive'}",
					press: [this.onSelect, this],
					title: "{Field06}",
					firstStatus: new sap.m.ObjectStatus({
						text: "{Field04}",
						state: {
									path: 'Status',
									formatter: formatter.getStatus
            					}
					}).addStyleClass("objectStatusContainer"),
					attributes: [
                                    new sap.m.ObjectAttribute({
							            text: "{Field05}"
					            	}),
                                    new sap.m.ObjectAttribute({
							            text: "{Field01}"
						            }),
                                    new sap.m.ObjectAttribute({
                                    	text: "{i18n>createdOnLbl}:  {Field03}"
							            /*text: {
            								path: 'Field03',
            								formatter: formatter.getDueDate
            							}*/
            						})
                                ]

				}),
				oFilter1 = new sap.ui.model.Filter('AppId', sap.ui.model.FilterOperator.EQ, sAppId),
			
				oList = new sap.m.List('list', {
					busyIndicatorDelay: "{masterView>/delay}",
					noDataText: "{masterView>/noDataText}",
					mode: "{= ${device>/system/phone} ? 'None' : 'SingleSelectMaster'}",
					growing: true,
					growingThreshold: 1000,
					/*growingScrollToLoad: true,*/
					updateFinished: [this.onUpdateFinished, this],
					select: [this.onSelect, this],
					items: {
						path: "/RequestSet",
						template: oItemTemplate,
						sorter: {
				                path: 'Field06',
				                descending: false,
				                group: true
			                },
						groupHeaderFactory: //$.proxy(this.createGroupHeader, this),
													function(oGroup){
														if(oGroup){
															var title = (oGroup.text) ? oGroup.text : oGroup.key;
															title = (that.getModel("groupHeaderModel").getProperty("/"+title)) ? that.getModel("groupHeaderModel").getProperty("/"+title) : title;
															return new GroupHeaderListItem({
													    				title:title,
													    				upperCase: false
													    			});	
														}
													},
						filters: [oFilter1]
					},
					infoToolbar: new sap.m.Toolbar("filterBar", {
						active: true,
						visible: "{masterView>/isFilterBarVisible}",
						press: [this.onOpenViewSettings, this],
						title: new sap.m.Title("filterBarLabel", {
							text: "{masterView>/filterBarLabel}"
						})
					})

				});
			this.getView().byId("page").addContent(oList);

			// Control state model
			//	var oList = this.byId("list"),
			var oViewModel = new JSONModel({
					isFilterBarVisible: false,
					filterBarLabel: "",
					delay: 0,
					title: this.getResourceBundle().getText("masterTitle"),
					noDataText: this.getResourceBundle().getText("masterListNoDataText")
				}),
				// Put down master list's original value for busy indicator delay,
				// so it can be restored later on. Busy handling on the master list is
				// taken care of by the master list itself.
				iOriginalBusyDelay = oList.getBusyIndicatorDelay();

			this._oList = oList;
			// keeps the filter and search state

			this._oListFilterState = {
				aFilter: [],
				aSearch: []
			};
			// keeps the group and sort state
			this._oListSorterState = {
				aGroup: [],
				aSort: []
			};
			this.setModel(oViewModel, "masterView");
			// Make sure, busy indication is showing immediately so there is no
			// break after the busy indication for loading the view's meta data is
			// ended (see promise 'oWhenMetadataIsLoaded' in AppController)
			oList.attachEventOnce("updateFinished", function() {
				// Restore original busy indicator delay for the list
				oViewModel.setProperty("/delay", iOriginalBusyDelay);
			});

			this.getView().addEventDelegate({
					onBeforeFirstShow: function () {
						this.getOwnerComponent().oListSelector.setBoundMasterList(oList);
					}.bind(this)
				});

			this.getRouter().getRoute("master").attachPatternMatched(this._onMasterMatched, this);
			this.getRouter().attachBypassed(this.onBypassed, this);
			
			this.byId("groupSelect").addDelegate({
            	onAfterRendering: function(obj) {
               	var oGroupSelect = obj.srcControl;
                	$("#"+oGroupSelect.getId()).find(".sapUiIcon").attr("title", oGroupSelect.getTooltip());
            	}
        	});
        	
		},

		/* =========================================================== */
		/* event handlers                                              */
		/* =========================================================== */

		/**
		 * After list data is available, this handler method updates the
		 * master list counter and hides the pull to refresh control, if
		 * necessary.
		 * @param {sap.ui.base.Event} oEvent the update finished event
		 * @public
		 */
		onUpdateFinished: function(oEvent) {
			// update the master list object counter after new data is loaded
			this._updateListItemCount(oEvent.getParameter("total"));
			//this._oList.setGrowingThreshold(oEvent.getParameter("total"));
			// hide pull to refresh if necessary
			this.byId("pullToRefresh").hide();
			this.setModel(new JSONModel(), "groupHeaderModel");
			var oGrpHeaderModel = this.getModel("groupHeaderModel");
			
			$.each(oEvent.getSource().getModel().oData, function(i, obj){
				if(!oGrpHeaderModel.getProperty("/"+obj.ContextId)){
					oGrpHeaderModel.setProperty("/"+obj.ContextId, obj.ContextDesc);
				}
				if(!oGrpHeaderModel.getProperty("/"+obj.Status)){
					oGrpHeaderModel.setProperty("/"+obj.Status, obj.StatusDesc);
				}
			});
			if(this._oComponent.navToMasterView){
				//this._oRouter.navTo('master', {}, true);
				var oFirstList = oEvent.getSource().getItems()[0],
				listObjData = oFirstList.getModel().getProperty(oFirstList.getBindingContext().sPath);
				this.getRouter().navTo("object", {
						//objectId: sObjectId
						AppId: listObjData.AppId,
						ContextId: listObjData.ContextId,
						DecisionId: listObjData.DecisionId,
						FormSubmId: listObjData.FormSubmId
					}, true);
				this._oComponent.navToMasterView = false;
			}
		},

		/**
		 * Event handler for the master search field. Applies current
		 * filter value and triggers a new search. If the search field's
		 * 'refresh' button has been pressed, no new search is triggered
		 * and the list binding is refresh instead.
		 * @param {sap.ui.base.Event} oEvent the search event
		 * @public
		 */
		onSearch: function(oEvent) {
			this._oComponent.navToMasterView = true;
			if (oEvent.getParameters().refreshButtonPressed) {
				// Search field's 'refresh' button has been pressed.
				// This is visible if you select any master list item.
				// In this case no new search is triggered, we only
				// refresh the list binding.
				this.onRefresh();
				return;
			}

			var sQuery = oEvent.getParameter("query"),
			sAppId = jQuery.sap.getUriParameters().get("appId") || "01";
			if (sQuery && sQuery.length > 0) {
				this._oListFilterState.aSearch = [ 
					new sap.ui.model.Filter('AppId', sap.ui.model.FilterOperator.EQ, sAppId),
					new Filter("SearchTerm", FilterOperator.Contains, sQuery)];
			} else {
				this._oListFilterState.aSearch = [ new sap.ui.model.Filter('AppId', sap.ui.model.FilterOperator.EQ, sAppId) ];
			}
			this._applyFilterSearch();
		},

		/**
		 * Event handler for refresh event. Keeps filter, sort
		 * and group settings and refreshes the list binding.
		 * @public
		 */
		onRefresh: function() {
			this._oList.getBinding("items").refresh();
		},

		/**
		 * Event handler for the sorter selection.
		 * @param {sap.ui.base.Event} oEvent the select event
		 * @public
		 */
		onSort: function(oEvent) {
			var sPath = oEvent.getSource().getSelectedItem().getKey();
			this._oListSorterState.aSort = new Sorter(sPath, false);
			this._applyGroupSort();
		},

		/**
		 * Event handler for the grouper selection.
		 * @param {sap.ui.base.Event} oEvent the search field event
		 * @public
		 */
		onGroup: function(oEvent) {
			var sKey = oEvent.getSource().getSelectedItem().getKey(),
				// In order to add additional Grouping functions you can add them here and
				// additional grouping functions in the grouper.js File
				oGroups = {
					Group1: ""
				};

			if (sKey !== "None") {
				this._oListSorterState.aGroup = [new Sorter(oGroups[sKey], false,
					grouper[sKey].bind(oEvent.getSource()))];
			} else {
				this._oListSorterState.aGroup = [];
			}
			this._applyGroupSort();
		},

		/**
		 * Event handler for the filter button to open the ViewSettingsDialog.
		 * which is used to add or remove filters to the master list. This
		 * handler method is also called when the filter bar is pressed,
		 * which is added to the beginning of the master list when a filter is applied.
		 * @public
		 */
		onOpenViewSettings: function() {
			if (!this.oViewSettingsDialog) {
				this.oViewSettingsDialog = sap.ui.xmlfragment("publicservices.her.myrequests.view.ViewSettingsDialog", this);
				this.getView().addDependent(this.oViewSettingsDialog);
				// forward compact/cozy style into Dialog
				this.oViewSettingsDialog.addStyleClass(this.getOwnerComponent().getContentDensityClass());
			}
			this.oViewSettingsDialog.open();
		},

		/**
		 * Event handler for the list selection event
		 * @param {sap.ui.base.Event} oEvent the list selectionChange event
		 * @public
		 */
		onSelect: function(oEvent) {
			// get the list item, either from the listItem parameter or from the event's source itself (will depend on the device-dependent mode).
			this._showDetail(oEvent.getParameter("listItem") || oEvent.getSource());
		},

		/**
		 * Event handler for the bypassed event, which is fired when no routing pattern matched.
		 * If there was an object selected in the master list, that selection is removed.
		 * @public
		 */
		onBypassed: function() {
			this._oList.removeSelections(true);
		},

		/**
		 * Used to create GroupHeaders with non-capitalized caption.
		 * These headers are inserted into the master list to
		 * group the master list's items.
		 * @param {Object} oGroup group whose text is to be displayed
		 * @public
		 * @returns {sap.m.GroupHeaderListItem} group header with non-capitalized caption.
		 */
		createGroupHeader: function(oGroup) {
    			return new sap.m.GroupHeaderListItem({
    				title: oGroup.title,
    				upperCase: false
    			});
		},

		/**
		 * Navigates back in the browser history, if the entry was created by this app.
		 * If not, it navigates to the Fiori Launchpad home page
		 * @override
		 * @public
		 */
		onNavBack: function() {
			var oHistory = sap.ui.core.routing.History.getInstance(),
				sPreviousHash = oHistory.getPreviousHash(),
				oCrossAppNavigator = sap.ushell.Container.getService("CrossApplicationNavigation");

			if (sPreviousHash !== undefined) {
				// The history contains a previous entry
				history.go(-1);
			} else {
				// Navigate back to FLP home
				oCrossAppNavigator.toExternal({
					target: {
						shellHash: "#"
					}
				});
			}
		},

		/* =========================================================== */
		/* begin: internal methods                                     */
		/* =========================================================== */

		/**
		 * If the master route was hit (empty hash) we have to set
		 * the hash to to the first item in the list as soon as the
		 * listLoading is done and the first item in the list is known
		 * @private
		 */
		_onMasterMatched: function() {
			this.getOwnerComponent().oListSelector.oWhenListLoadingIsDone.then(
				function(mParams) {
					if (mParams.list.getMode() === "None") {
						return;
					}
					var AppId = mParams.firstListitem.getBindingContext().getProperty("AppId"),
						ContextId = mParams.firstListitem.getBindingContext().getProperty("ContextId"),
						DecisionId = mParams.firstListitem.getBindingContext().getProperty("DecisionId"),
						FormSubmId = mParams.firstListitem.getBindingContext().getProperty("FormSubmId");
						
					//sObjectId = "AppId='1',ContextId='PIQ_DEREG',DecisionId='2000008475'";

					this.getRouter().navTo("object", {
						//objectId: sObjectId
						AppId: AppId,
						ContextId: ContextId,
						DecisionId: DecisionId,
						FormSubmId: FormSubmId
					}, true);
				}.bind(this),
				function(mParams) {
					if (mParams.error) {
						return;
					}
					this.getRouter().getTargets().display("detailNoObjectsAvailable");
				}.bind(this)
			);
		},

		/**
		 * Shows the selected item on the detail page
		 * On phones a additional history entry is created
		 * @param {sap.m.ObjectListItem} oItem selected Item
		 * @private
		 */
		_showDetail: function(oItem) {
			var bReplace = !Device.system.phone;
			this.getRouter().navTo("object", {
				//objectId: oItem.getBindingContext().getProperty("AppId")
				AppId: oItem.getBindingContext().getProperty("AppId"),
				ContextId: oItem.getBindingContext().getProperty("ContextId"),
				DecisionId: oItem.getBindingContext().getProperty("DecisionId"),
				FormSubmId: oItem.getBindingContext().getProperty("FormSubmId")
			}, bReplace);
		},

		/**
		 * Sets the item count on the master list header
		 * @param {integer} iTotalItems the total number of items in the list
		 * @private
		 */
		_updateListItemCount: function(iTotalItems) {
			var sTitle;
			// only update the counter if the length is final
			if (this._oList.getBinding("items").isLengthFinal() && iTotalItems) {
				sTitle =  this.getModel("REQUEST_CONFIG").getData()[0].AppDesc + " (" + iTotalItems +")";                          
			} else {
				//Display 'Objects' instead of 'Objects (0)'
				sTitle = this.getModel("REQUEST_CONFIG").getData()[0].AppDesc;
			}
			this.getModel("masterView").setProperty("/title", sTitle);
		},

		/**
		 * Internal helper method to apply both filter and search state together on the list binding
		 * @private
		 */
		_applyFilterSearch: function() {
			var aFilters = this._oListFilterState.aSearch.concat(this._oListFilterState.aFilter),
				oViewModel = this.getModel("masterView");
			this._oList.getBinding("items").filter(aFilters, "Application");
			// changes the noDataText of the list in case there are no filter results
			if (aFilters.length !== 0) {
				oViewModel.setProperty("/noDataText", this.getResourceBundle().getText("masterListNoDataWithFilterOrSearchText"));
			} else if (this._oListFilterState.aSearch.length > 0) {
				// only reset the no data text to default when no new search was triggered
				oViewModel.setProperty("/noDataText", this.getResourceBundle().getText("masterListNoDataText"));
			}
		},

		/**
		 * Internal helper method to apply both group and sort state together on the list binding
		 * @private
		 */
		_applyGroupSort: function() {
			var aSorters = this._oListSorterState.aGroup.concat(this._oListSorterState.aSort);
			this._oList.getBinding("items").sort(aSorters);
		},

		/**
		 * Internal helper method that sets the filter bar visibility property and the label's caption to be shown
		 * @param {string} sFilterBarText the selected filter value
		 * @private
		 */
		_updateFilterBar: function(sFilterBarText) {
			var oViewModel = this.getModel("masterView");
			oViewModel.setProperty("/isFilterBarVisible", (this._oListFilterState.aFilter.length > 0));
			oViewModel.setProperty("/filterBarLabel", this.getResourceBundle().getText("masterFilterBarText", [sFilterBarText]));
		},
		/**
		 * Handler for create New Request Button
		 * Call central method to navigate the details page to Form Page
		 **/
		onCreatePress: function(oEvent) {
		
			//nave to the Form View
			this._oRouter.navTo('createRequest', {}, true);
		},
		
		handleGroup : function (evt) {
			// compute sorters
			var aSorters = [],
			item = evt.getParameter("selectedItem"),
			key  = (item ) ? item.getKey() : null,
			oSorter = new sap.ui.model.Sorter(key, true,true),
			list = sap.ui.getCore().byId("list"),
			oBinding = list.getBinding("items");
			if(key !== null && key !== "None"){
				aSorters.push(oSorter);
			}
			// update binding
			oBinding.sort(aSorters);
		}

	});

});