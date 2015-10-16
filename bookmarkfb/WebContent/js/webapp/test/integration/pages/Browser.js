sap.ui.define([
		"sap/ui/test/Opa5",
		"publicservices/her/myrequests/test/integration/pages/Common"
	], function(Opa5, Common) {
	"use strict";

	Opa5.createPageObjects({
		onTheBrowserPage: {
			baseClass: Common,

			actions: {

				iChangeTheHashToObjectN: function(iObjIndex) {
					return this.waitFor(this.createAWaitForAnEntitySet({
						entitySet: "Objects",
						success: function(aEntitySet) {
							Opa5.getHashChanger().setHash("/RequestSet/" + aEntitySet[iObjIndex].AppId);
						}
					}));
				},

				iChangeTheHashToTheRememberedItem: function() {
					return this.waitFor({
						success: function() {
							var sObjectId = this.getContext().currentListItem.getBindingContext().getProperty("AppId");
							Opa5.getHashChanger().setHash("/RequestSet/" + sObjectId);
						}
					});
				},

				iChangeTheHashToTheRememberedId: function() {
					return this.waitFor({
						success: function() {
							var sObjectId = this.getContext().currentId;
							Opa5.getHashChanger().setHash("/RequestSet/" + sObjectId);
						}
					});
				},

				iChangeTheHashToSomethingInvalid: function() {
					return this.waitFor({
						success: function() {
							Opa5.getHashChanger().setHash("/somethingInvalid");
						}
					});
				}

			},

			assertions: {

				iShouldSeeTheHashForObjectN: function(iObjIndex) {
					return this.waitFor(this.createAWaitForAnEntitySet({
						entitySet: "Objects",
						success: function(aEntitySet) {
							var oHashChanger = Opa5.getHashChanger(),
								sHash = oHashChanger.getHash();
							QUnit.strictEqual(sHash, "RequestSet/" + aEntitySet[iObjIndex].AppId, "The Hash is not correct");
						}
					}));
				},

				iShouldSeeTheHashForTheRememberedObject: function() {
					return this.waitFor({
						success: function() {
							var sObjectId = this.getContext().currentListItem.getBindingContext().getProperty("AppId"),
								oHashChanger = Opa5.getHashChanger(),
								sHash = oHashChanger.getHash();
							QUnit.strictEqual(sHash, "RequestSet/" + sObjectId, "The Hash is not correct");
						}
					});
				},

				iShouldSeeAnEmptyHash: function() {
					return this.waitFor({
						success: function() {
							var oHashChanger = Opa5.getHashChanger(),
								sHash = oHashChanger.getHash();
							QUnit.strictEqual(sHash, "", "The Hash should be empty");
						},
						errorMessage: "The Hash is not Correct!"
					});
				}

			}

		}

	});

});