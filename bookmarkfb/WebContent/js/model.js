(function (window) {
	'use strict';
	
	function Model(){
		this.query = null;
		this.data = [];//data set can be sorted
		this.raw = [];
		this.read = {};
		this.bookmark = {};
		
		this._syncFromStorage();
	};
	Model.prototype.setQuery = function(q){
		this.query = q;
		return this;
	};
	Model.prototype.addRaw = function(data){
		this.raw.push(data);
		this._setData();
		return this;
	};
	Model.prototype._setData = function(){
		var iLength = this.raw.length;
		this.data = [];
		for(var i=0; i < iLength; i++){
			this.data = this.data.concat(this.raw[i].data);
		}
	};
	Model.prototype.getData = function(){
		return this.data;
	};
	Model.prototype.clearData = function(){
		this.query = null;
		this.data = [];//data set can be sorted
		this.raw = [];
	};
	Model.prototype.syncToStorage = function(){
		if(window.Storage){
			 localStorage.setItem("bookmark", JSON.stringify(this.bookmark));
		}
	};
	Model.prototype._syncFromStorage = function(){
		if(window.Storage){
			var sBookmark = localStorage.getItem("bookmark");
			if(sBookmark){
				this.bookmark = JSON.parse(sBookmark);
			}
		}
	};
	// Export to window
	window.app = window.app || {};
	window.app.Model = Model;
	
})(window);