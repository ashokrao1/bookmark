sap.ui.define([
	], function() {
	"use strict";

	return {
		/**
		 * Rounds the currency value to 2 digits
		 *
		 * @public
		 * @param {string} sValue value to be formatted
		 * @returns {string} formatted currency value with 2 digits
		 */
		currencyValue: function(sValue) {
			if (!sValue) {
				return "";
			}

			return parseFloat(sValue).toFixed(2);
		},
	
		concatStr: function(fStr, sStr){
		    return fStr +" "+ sStr;
		},
		
		getDueDate: function(sDate){
		    var monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
	        date  = new Date(parseInt(sDate)),
	        dueDateText = this.getModel("i18n").getResourceBundle().getText("DueDateLbl");
	        if(sDate && sDate !== null) {
	        	return  monthNames[date.getMonth()].substr(0, 3) + " " + date.getDate() + ", " + date.getFullYear();
	        }
	        else{
	                return sDate;
	            }
	        /*if(sDate && sDate !== null) { 
	              return   monthNames[parseInt(sDate.substr(4,2))+1]+ " " + sDate.substr(6,2) + ", "+ sDate.substr(0,4);
	            }
	            else{
	                return sDate;
	            }*/
		},
		
		generatedDocsDate : function(sDate){
		     var date  = new Date(parseInt(sDate)),
		      monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
		      if(sDate && sDate !== null) {
		    		return  monthNames[date.getMonth()].substr(0, 3) + " " + date.getDate() + " " + date.getHours() + ":" + date.getMinutes();
		      }
		      else{
		      		return sDate;
		      }
	   },
	    
	    docLinkVisible: function(sFileNumber){
	        return (sFileNumber && sFileNumber!="") ? true : false;
	    },
	    
	    docLabelVisible: function(sFileNumber){
	        return (sFileNumber && sFileNumber!="") ? false : true;
	    },
	    
	    docUploadBtnVisible: function(sStatus, detailObjStatus, fileNumber){
	    	if(detailObjStatus === "IADH4"){
	    		return (sStatus !== "01" && fileNumber === "") ? true : false;
	    	}
	    	else{
	    		return false;
	    	}
	        
	    },
	    
		documentEditVisible: function(sStatus, detailObjStatus, fileNumber){
	    	if(detailObjStatus === "IADH4"){
	    		return (sStatus !== "01" && fileNumber !== "") ? true : false;
	    	}
	    	else{
	    		return false;
	    	}
	        
	    },
	    
	    docSubmitBtnVisible: function(sStatus){
	    	return (sStatus && sStatus === "IADH4") ? true : false;
	    },
	    
	    docIcon: function(sFileNumber){
	         return (sFileNumber && sFileNumber!="") ? "sap-icon://edit" : "sap-icon://add";
	    },
	    
	    docIconOnly: function(sFileNumber){
	         return (sFileNumber && sFileNumber!="") ? true: false;
	    },
	    
	    docUploadBtnText: function(sFileNumber){
	         return (sFileNumber && sFileNumber!="") ? "": this.getModel("i18n").getResourceBundle().getText("uploadBtnLbl");
	    },
	    
	    showField:function(sVal){
	      return (sVal) ? true : false;
	    },
	    
	    getDocType: function(sDocName){
	    	 switch(sDocName.split('.').pop().toLowerCase()){
	    	 	 case "doc": return "sap-icon://doc-attachment";
	    	 	 case "docx": return "sap-icon://doc-attachment";
	    	 	 case "pdf": return "sap-icon://pdf-attachment";
	    	 	 case "jpeg": return "sap-icon://attachment-photo";
	    	 	 case  "png": return "sap-icon://attachment-photo";
	    	 	 case "jpg": return "sap-icon://attachment-photo";	
	    	 	 case "txt": return "sap-icon://attachment-text-file";	
	    	 	 case "zip": return "sap-icon://attachment-zip-file";
	    	 	 case "xls": return "sap-icon://excel-attachment";
	    	 	 case "xlsx": return "sap-icon://excel-attachment";
	    	 	 default: return "sap-icon://document";
	    	 }
	    },
	    
	    getStatus: function(sStatuscode){
	    	switch(sStatuscode){
				case "IADH1": return "None"; //save
				case "IADH2": return "None"; //SUBMIT
				case "IADH3": return "Success"; //VALID
				case "IADH4": return "Warning"; //RESUBMIT(Preliminary Excluded)
				case "IADH5": return "Error"; //REJECT
				case "IADH7": return "Success"; //OFFERED
				case "IADH8": return "Error"; //APPLICATION_REJECTED
				case "IADH9": return "Error"; //ELIMINATED
				case "IADHA": return "Success"; //ACCEPT
				case "IADHB": return "Warning"; //WITHDRAW
				case "IADHE": return "Warning"; //PARTIALLY_OFFERED
				default: return "None"; //defalult
	    	}
	    },
	    
	    handleWithdrawBtnVisible: function(sStatus){
	    	return (sStatus === "IADHB" || sStatus === "IADH8") ? false : true;
	    },
	    
	    handleDocSubmitBtnVisible: function(sStatus){
	    	return (sStatus === "IADH4") ? true : false;
	    },
	    
	    getDocumentStatus: function(sDate) {
			/*if (sVal) {
				var sMsg = this.getModel("i18n").getResourceBundle().getText("lastChangeDate"),
				a = sVal.split("||");
				if(a[5] && a[5] !== "undefined"){
				    return sMsg + ' : '+a[5];
				}
				else{
				    return "";
				}
			}*/
			var monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
	        date  = new Date(sDate);
	        if(sDate && sDate !== null) {
	        	sDate =  monthNames[date.getMonth()].substr(0, 3) + " " + date.getDate() + ", " + date.getFullYear();
	        }
			return this.getModel("i18n").getResourceBundle().getText("lastChangeDate") + " : " +sDate;
		},
		
		getDocumentDetails : function(sVal){
	    	/*if (sVal) {
				var a = sVal.split("||");
			    if(a[5] && a[5] !== "Upload"){
			        return true;
			    }else{
			        return false;
			    }
			}*/
			return (sVal && sVal !=="") ? true : false;
		},
		
		getDocumentReuploadReason:function(sVal){ 
	        if(sVal){
	            var a = sVal.split("||");
	            if(a[4] && a[4] === "02") {
				    return true;
				}
				else{
				    return false;
				}
	        } 
    	},
    	
    	getDocumentReuploadReasonText:function(sVal){
	       /*if(sVal){
				var sMsg = this.getModel("i18n").getResourceBundle().getText("reasonText"),
		        a = sVal.split("||");
	            if(a[4] && a[4] === "02") {
				    return sMsg + ' : '+ a[6];
				}
				else{
				    return ''; 
				}
	        }  */
	        return this.getModel("i18n").getResourceBundle().getText("reasonText") + " : " + sVal;
    	},
    	
    	docMandatory : function(sMandatoryInd){
    		return (sMandatoryInd === "X") ? true : false;
    	},
    	
    	docWarningIcon: function(sDocStatus){
    		return (sDocStatus === "02") ? true : false;
    	},
    	
    	handelReqDocNoDataText: function(sVal){
    		return (sVal) ? false : true;
    	},
    	handleAcceptBtnVisibility:function(sContextId,sStatus){
    		if(sContextId==="PIQ_COP_ADM" && sStatus==="IADH7"){
    			return true;	
    		}else{
    			return false;
    		}
    		
    	},
    	handleRegisterBtnVisibility:function(sContextId,sStatus){
    		if(sContextId==="PIQ_COP_ADM" && sStatus==="IADHA"){
    			return true;	
    		}else{
    			return false;
    		}
    		
    	}
	    
	};

});