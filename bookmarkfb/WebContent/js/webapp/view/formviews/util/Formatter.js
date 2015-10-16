sap.ui.define([], function() {
    "use strict";

    return {

        formatTextBoxTypeValidation: function(validationType) {
            switch (validationType) {
                case "T":
                    validationType = "Tel";

                    break;
                case "E":
                    validationType = "Email";

                    break;
                default:
                    validationType = "Text";

                    break;
            }
            return validationType;
        },


        formatErrorText: function(sval) {
            if (sval === '') {
                return false;
            } else {
                return true;
            }
        },

        formatErrorState: function(sval) {
            if (sval === false) {
                return "None";
            } else if (sval === true) {
                return "Error";
            }
        },
        getDocumentName: function(sVal) {
            //send the file name
            return (sVal && sVal.split("||")[1]) ? sVal.split("||")[1] : "";
        },

        documentEditVisible: function(sVal) {
            //return true if it had DMS Id
            return ((sVal && sVal.split("||")[0]) ? true : false);

        },
        documentUploadVisible: function(sVal) {
            //show if dms ID is not there
            return ((sVal && sVal.split("||")[0]) ? false : true);
        },

        getDocumentStatus: function(sVal) {
            if (sVal) {
                var oLocale = sap.ui.getCore().getConfiguration().getFormatLocale();
                var oBundle = jQuery.sap.resources({
                    url: jQuery.sap.getModulePath("ps.slcm.i18n.i18n", ".properties"),
                    locale: oLocale
                });
                var sMsg;
                sMsg = oBundle.getText("lastChangeDate");
                var a = sVal.split("||");
                if (a[5] && a[5] !== "undefined") {
                    return sMsg + ' : ' + a[5];
                } else {
                    return "";
                }
            }
        },
        getDocumentDetails: function(sVal) {
            return ((sVal && sVal.split("||")[5]) ? true : false);
        },

        getDocumentReuploadReason: function(sVal) {
            return ((sVal && sVal.split("||")[4] && sVal.split("||")[4] === "02") ? true : false);
        },
        getDocumentReuploadReasonText: function(sVal) {
            if (sVal) {
                var oLocale = sap.ui.getCore().getConfiguration().getFormatLocale();
                var oBundle = jQuery.sap.resources({
                    url: jQuery.sap.getModulePath("ps.slcm.i18n.i18n", ".properties"),
                    locale: oLocale
                });
                var sMsg;
                sMsg = oBundle.getText("reasonText");
                var a = sVal.split("||");
                if (a[4] && a[4] === "02") {
                    return sMsg + ' : ' + a[6];
                } else {
                    return '';
                }
            }
        },

        formatMandatoryQuestion: function(sVal) {
            return !!sVal;
        },

        formatFreeTextForOtherQuestion: function(sval) {
            return (sval !== "FT") ? true : false;
        },
        
        getMaxLength: function(sLength){         
	    	return (sLength) ? parseInt(sLength) : 0;
	    }

    };

});