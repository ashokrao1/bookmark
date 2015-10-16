/**
 * Utils function
 * @param window
 */
(function (window) {
	'use strict';
	
	/**
	 * Query Selector
	 */
	window.qs = function (selector, scope) {
		return (scope || document).querySelector(selector);
	};

	/**
	 * event listner
	 */
	window.$on = function (target, type, callback, useCapture) {
		target.addEventListener(type, callback, !!useCapture);
	};
	/**
	 * find parent
	 */
	window.$parent = function (element, tagName) {
		if (!element.parentNode) {
			return;
		}
		if (element.parentNode.tagName.toLowerCase() === tagName.toLowerCase()) {
			return element.parentNode;
		}
		return window.$parent(element.parentNode, tagName);
	};
	/**
	 * JSONP client
	 */
	window.$ajax_get = function(url, callback){
		 	var ref = window.document.getElementsByTagName( 'script' )[ 0 ];
		    var script = window.document.createElement( 'script' );
		    
		    //create a unique function
		    var date = new Date(),
		    sCallback = "callback_"+ date.getTime();
		    
		    window[sCallback] = function(data){
		    	callback.call(null, data);
		    }
		    
		    
		    script.src = url + (url.indexOf( '?' ) + 1 ? '&' : '?') + 'callback=' + sCallback;

		    // Insert script tag into the DOM (append to <head>)
		    ref.parentNode.insertBefore( script, ref );

		    // After the script is loaded (and executed), remove it
		    script.onload = function () {
		    	//remove script
		        this.remove();
		        //remove public function
		        window[sCallback] = undefined;
		        try{
		            delete window[x];
		        }catch(e){
		        	//if delete is not allowed
		        }
		    };
	}; 
})(window);