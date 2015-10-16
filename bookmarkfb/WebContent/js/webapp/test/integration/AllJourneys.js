jQuery.sap.require("sap.ui.qunit.qunit-css");
jQuery.sap.require("sap.ui.thirdparty.qunit");
jQuery.sap.require("sap.ui.qunit.qunit-junit");
jQuery.sap.require("sap.ui.test.opaQunit");
jQuery.sap.require("sap.ui.test.Opa5");

jQuery.sap.require("publicservices.her.myrequests.test.integration.pages.Common");
jQuery.sap.require("publicservices.her.myrequests.test.integration.pages.App");
jQuery.sap.require("publicservices.her.myrequests.test.integration.pages.Browser");
jQuery.sap.require("publicservices.her.myrequests.test.integration.pages.Master");
jQuery.sap.require("publicservices.her.myrequests.test.integration.pages.Detail");
jQuery.sap.require("publicservices.her.myrequests.test.integration.pages.NotFound");

sap.ui.test.Opa5.extendConfig({
	arrangements: new publicservices.her.myrequests.test.integration.pages.Common(),
	viewNamespace: "publicservices.her.myrequests.view."
});

jQuery.sap.require("publicservices.her.myrequests.test.integration.MasterJourney");
jQuery.sap.require("publicservices.her.myrequests.test.integration.NavigationJourney");
jQuery.sap.require("publicservices.her.myrequests.test.integration.NotFoundJourney");
jQuery.sap.require("publicservices.her.myrequests.test.integration.BusyJourney");
jQuery.sap.require("publicservices.her.myrequests.test.integration.FLPIntegrationJourney");