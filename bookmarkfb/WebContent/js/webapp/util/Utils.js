/*!
 * @copyright@
 */
//Provides a simple search feature
sap.ui.define(['jquery.sap.global'],
    function(jQuery) {
        "use strict";

        var Utils = {
            _busyDialog: null,
            showBusy: function() {
                if (!this._busyDialog) {
                    this._busyDialog = new sap.m.BusyDialog();
                }
                this._busyDialog.open();
            },
            hideBusy: function() {
            	if(this._busyDialog){
            		 this._busyDialog.close();
            	}
            },
            showToast: function(sMsg) {
                sap.m.MessageToast.show(sMsg);
            },
            
            showMessage:function(title,state,msg){
            	var dialog = new sap.m.Dialog({
					title: title,
					type: 'Message',
					state: state,
					content: new sap.m.Text({
						text: msg
					}),
					beginButton: new sap.m.Button({
						text: 'OK',
						press: function () {
							dialog.close();
						}
					}),
					afterClose: function() {
						dialog.destroy();
					}
	                });
                dialog.open();
            },
            confirmMessage:function(sTitle,sMsg,confirmResponse){
            	var that =this;
            	that.confirmResponse=confirmResponse;
            	jQuery.sap.require("sap.m.MessageBox");
		        sap.m.MessageBox.show(sMsg, {
			    icon: sap.m.MessageBox.Icon.INFORMATION,
				title: sTitle,
				actions: [sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.NO],
				onClose: function(oAction) {
					if (oAction === sap.m.MessageBox.Action.YES) {
						that.confirmResponse.resolve(true);
					}else {
						that.confirmResponse.resolve(false);
					}
				}
				});
            },
            
            onConfirmationDialog: function (obj) {
				var dialog = new sap.m.Dialog({
					title: 'Confirm',
					type: 'Message',
					content: new Text({ text: obj.msgText }),
					beginButton: new sap.m.Button({
						text: 'Ok',
						press: function () {
							
							dialog.close();
						}
					}),
					endButton: new sap.m.Button({
						text: 'Cancel',
						press: function () {
							dialog.close();
						}
					}),
					afterClose: function() {
						dialog.destroy();
					}
				});
				dialog.open();
			}

        };

        return Utils;

    }, /* bExport= */ true);