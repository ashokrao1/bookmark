(function () {
	'use strict';

	/**
	 * Enums for App
	 */
	var enums = {
			fbSearch : "https://graph.facebook.com/search?type=page&fields=id,name,picture,website&access_token=886589828094422|Syt6oXVxAtpO5BcOnOh-GztNRY4&q=",
			fbRead: "https://graph.facebook.com/{{id}}?fields=about,website&access_token=886589828094422|Syt6oXVxAtpO5BcOnOh-GztNRY4",
			fav: "&#9733",
			unfav: "&#9734" //use css color gold
	};

	var App = {
			/**
			 * App Initialization
			 */
			init: function(){
				this.initModel();
				this.cacheElements();
				this.bindEvents();
				this._renderBookmarks();
			},
			initModel: function(){
				//Application Storage Model
				this.oModel = new window.app.Model();

			},
			cacheElements: function(){
				this.$app = qs("#app");
				this.$search = qs("#search", this.$app);
				this.$list = qs("#searchlist", this.$app);
				this.$bookmark = qs("#bookmark", this.$app);

				//placeholder for more details ID
				this.$elem = null;
				this.$star = null;
				this.$unfav = null;
			},
			/**
			 * Templates for List Items and other elements
			 */
			getListTemplate: function(){
				var template = '<li data-id="{{id}}" data-name="{{name}}" data-icon="{{url}}" data-website="{{website}}" data-class="search-item">'
					+		'<img src="{{url}}" alt="{{name}}">'
					+		'<a class="search-item-link" href="#">{{name}}</a>'
					+       '<span class="item-bookmark" title="click to bookmark">{{bookmark}}</span>'
					+       '<div class="more"></div>'  
					+		'</li>';

				return template;
			},
			getDetailsTemplate: function(){
				var template = '<p>{{about}}</p>'
					+ '<a class="list_link" href="{{website}}">{{website}}</a>';

				return template;
			},
			getBookmarkTemplate: function(){
				var template = '<li class="tiles" data-id="{{id}}">'
					+ '<img src="{{icon}}" alt="{{name}}"/>'
					+ '<span class="unbookmark" title="click to unfavourite">&#9733</span>'
					+ '<p><a class="bookmark_link" target="_blank" href="{{website}}">{{name}}</a></p>'
					+ '</li>';

				return template;
			},
			/**
			 * Rendering functions
			 */
			_renderList: function(){
				var data = this.oModel.getData(),
				iLength = data.length,
				list = [],
				sHtml = "";

				for(var i=0; i<iLength; i++){
					var id = data[i].id,
					name = data[i].name,
					website = data[i].website,
					icon = data[i].picture.data.url,
					template = this.getListTemplate(),
					fav = (!this.oModel.bookmark[id]) ? enums.unfav : enums.fav;

					template = template.replace(new RegExp('{{id}}', 'g'), id);
					template = template.replace(new RegExp('{{url}}', 'g'), icon);
					template = template.replace(new RegExp('{{name}}','g'), name);
					template = template.replace('{{website}}', website);
					template = template.replace('{{bookmark}}', fav);
					list.push(template);					
				}
				sHtml = list.join("");

				this.$list.innerHTML = sHtml;

			},
			_renderItem: function(data){
				var temp = this.getDetailsTemplate();

				temp = temp.replace('{{about}}',data.about);
				temp = temp.replace('{{website}}', data.website);
				temp = temp.replace('{{website}}', data.website);
				//get the elem and write to the more div
				var div = qs(".more", $parent(this.$elem, 'li'));
				div.innerHTML = temp;
			},
			_renderBookmarks: function(){
				var sHtml = "";
				for(var i in this.oModel.bookmark){

					var template = this.getBookmarkTemplate(),
					bookmark = this.oModel.bookmark[i];
					
					template = template.replace(new RegExp('{{id}}','g'), i);
					template = template.replace(new RegExp('{{name}}','g'), bookmark.name);
					template = template.replace(new RegExp('{{icon}}','g'), bookmark.icon);
					template = template.replace(new RegExp('{{website}}','g'), bookmark.website);

					sHtml += template;					
				}

				this.$bookmark.innerHTML = sHtml;
			},
			/**
			 * Binding Events
			 * Handler for Search and Click
			 */
			bindEvents: function(){
				$on(this.$search, "search", this.searchHandler.bind(this), true);
				$on(this.$list, "click", this.clickHandler.bind(this), false);
				$on(this.$bookmark, "click", this.clickHandler.bind(this), false);
			},
			searchHandler: function(e){
				var sInput = e.target.value;
				if(sInput && sInput !== this.oModel.query){
					this.oModel.clearData();
					this.oModel.setQuery(sInput);
					this.getFBPages(sInput)
				}else if(!sInput){
					//clear
					this.oModel.clearData();
					this.$list.innerHTML = "";

				}

			},
			clickHandler: function(e){
				var elem = e.target,
				elemClass = e.target.className;

				e.preventDefault();
				switch (elemClass) {
				case "search-item-link":
					this.$elem = elem;
					this.readFBData();
					break;
				case "item-bookmark":
					this.$star = elem
					this.doBookmarking();
					break;
				case "unbookmark":
					this.$unfav = elem;
					this.unbookmark();
					break;
				case "list_link":
				case "bookmark_link":
					window.open(elem.href, "_blank")
				}

			},
			/**
			 * unbookmark
			 */
			unbookmark : function(){
				var dataset = $parent(this.$unfav, "li").dataset,
				id = dataset.id;
				
				delete this.oModel.bookmark[id];
				this._renderBookmarks();
				this.oModel.syncToStorage();
			},
			/**
			 * Bookmark
			 */
			doBookmarking: function(){
				var dataset = $parent(this.$star, "li").dataset,
				id = dataset.id,
				name = dataset.name,
				website = dataset.website,
				icon = dataset.icon;

				if(!this.oModel.bookmark[id]){
					var o = {};
					o.name = name;
					o.icon = icon;
					o.website = website;

					this.oModel.bookmark[id] = o;

					this.$star.innerHTML = enums.fav;
				}else{
					delete this.oModel.bookmark[id];
					this.$star.innerHTML = enums.unfav;
				}

				this._renderBookmarks();
				this.oModel.syncToStorage();
			},
			/**
			 * Query/search for Facebook Pages using Graph API
			 */
			getFBPages: function(sInput){
				//JSONP call
				$ajax_get(enums.fbSearch+sInput, this.onSearchDataGet.bind(this));
			},
			onSearchDataGet: function(data){
				this.oModel.addRaw(data);
				this._renderList();
			},
			/**
			 * Read for a entity using node Id using Graph API
			 */
			readFBData: function(){
				var id = $parent(this.$elem, "li").dataset.id,
				url = enums.fbRead.replace("{{id}}", id);
				if(!this.oModel.read[id]){
					$ajax_get(url, this.onReadDataGet.bind(this));
				}else{
					this._renderItem(this.oModel.read[id]);
				}
			},
			onReadDataGet: function(data){
				var id = $parent(this.$elem, "li").dataset.id;
				this.oModel.read[id] = data;
				this._renderItem(this.oModel.read[id]);
			}
	};
	App.init();
})();