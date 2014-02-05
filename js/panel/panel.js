//JavaScript
// Panel
// jQuery Plugin
//REQUIRES frontgate.js,  topzindex.js, jquery-ui.js
// José Vieira Lisboa
// jose.vieira.lisboa@gmail.com
// ze.sítio.pt/panel

(function(Panel){
	if(typeof jQuery.fn.panel != 'undefined')
		throw '$.panel|jQuery.fn.panel already exists';

	//TODO wrap local var FILE
	//Frontgate.loadStylesheet("{dir}panel.css".replace("{dir}", FILE.dirname));

	//if(window.Frontgate) Frontgate.stylesheet('jquery.panel/panel.css');

	// Panel Plugin
	jQuery.fn.panel = function(data){
		data = data || {};
		var $panels = this;

		// Appends a div to the DOM (if the element doesn't exist)
		if(!this.length) $panels = Panel.newEl(this);

		// Create the panel
		Panel.make($panels, data);

		// Show the panel
		data.hide || this.show();

		// keep chaining
		return $panels;
	};

	jQuery.fn.panel.self = Panel;

	if(window.console && console.info)
		console.info(Panel.name, Panel.version.join("."));
})
({
	name: 'Panel',
	version: [0, 2, 0],
	panels:{},

	make: function($panel, data){
		// a DOM elemet is required
		if(!$panel || !$panel.length || !$panel.selector){
			throw 'a jQuery element is required';
		}

		//
		if(!this.panels[$panel.selector]){
			this.panels[$panel.selector] = new this.Panel($panel, data);
		}
		return this.panels[$panel.selector];
	},

	// Panel getter
	get: function(selector){
		// a DOM elemet is required
		if(!selector){
			throw 'a selector is required';
		}

		if(this.panels[selector]) return this.panels[selector];
		return false;
	},

	// Config
	//-------------------------------------------------------------------------
	config: {
		log: true
	},

	// log Override
	//-------------------------------------------------------------------------
	log: function(){
		if(this.config.log)
			for(var i in arguments) console.log('Panel', arguments[i]);
	},

	// creates and appends a div to the DOM for the panel
	//-------------------------------------------------------------------------
	newEl: function($panel){
		var selector = $panel.selector;

		this.log('newEl: ' + selector);

		if(selector[0] != '#') throw 'Panel needs an id';

		$panel = $('<div>').css({
			display:'none'
		}).attr('id', selector.substring(1)).appendTo('body');

		$panel.selector = selector;

		return $panel;
	},

	Panel: function($panel, data){
		// jQuery Elements
		//---------------------------------------------------------------------
		this.$panel = $panel.css({
			padding: '26px 0 0 0',
			margin: 0
		});

		// header
		this.$header = $('<ul>').addClass("panel-header").appendTo(this.$panel);

		//
		this.$name = $('<li>').appendTo(this.$header);

		// panel control (default close)
		this.$close = $('<li>').addClass('control').appendTo(this.$header);

		// Methods
		//---------------------------------------------------------------------
		// header setter/getter
		this.header = function(data){
			if(data) Frontgate.Location.set(this.$header, data);
			return this.$header;
		};

		// name setter/getter
		//---------------------------------------------------------------------
		this.name = function(data){
			if(data) Frontgate.Location.set(this.$name, data);
			return this.$name;
		};

		// control setter/getter
		//---------------------------------------------------------------------
		this.close = function(data){
			if(data) Frontgate.Location.set(this.$close, data);
			return this.$close;
		};

		// Add controls
		//---------------------------------------------------------------------
		this.controls = function(controls){
			var $header = this.$header;
			// custom panel controls
			for(var k in controls) (function(control){
				Frontgate.Location.set($('<li>').addClass('panel-control')
					.appendTo($header), control);
			})(controls[k]);
		};

		// Set Behavior
		//---------------------------------------------------------------------
		this.behavior = function(data){
			// Requires jquery UI
			var draggable = { containment: "parent" };
			if(data.cancel != 'undefined')	draggable.cancel = data.cancel;

			// REquires topZIndex
			if(data.topZIndex) this.$panel.addClass('panel').topZIndex()
				.mousedown(function(){
					if( $.topZIndex() == $(this).css('z-index')) return;
					$(this).topZIndex();
					return;
				});

			if(data.draggable) this.$panel.draggable(draggable);
		};

		// Panel toggler
		//---------------------------------------------------------------------
		this.toggle = function(e, callback){
			var $panel = this.$panel;

			this.publishEvent('toggle', this);

			if($panel.is(':visible')) this.publishEvent('hide', this);
			else this.publishEvent('show', this);

			$panel.fadeToggle('slow', function(){
				if(callback) callback($panel);
			});

			if($panel.is(':visible')) $panel.topZIndex();
		}

		// Event handler
		//---------------------------------------------------------------------
		Frontgate.Location._on(this);

		// custom settings
		//---------------------------------------------------------------------
		Frontgate.Location._set(this, data,
			['name', 'close', 'controls']);

		// default settings (stylesheet proof)
		//---------------------------------------------------------------------
		// header
		this.header({
			css:{
				height: 26
			}
		});

		// name
		this.name({
			//text: this.$name.text() || 'jQuery Panel',
			css:{
				display: 'inline-block',
				padding: '4px 6px',
				margin: 0
			}
		});

		// control
		this.close({
			css: {
				display: 'inline-block',
				padding: 0,
				margin: 7,
				height: 10,
				width: 10,
				position: 'relative',
				cssFloat: 'right'
			 },
			attr: {
				title: this.$close.attr('title') || 'close'
			}
		});

		// e) behavior
		this.behavior({
			topZIndex: true,// topZIndex
			draggable:  true,// jQuery UI
			cancel: data.cancel || null
		});

		// d) set default action to close button
		var self = this;

		this.$close.click(function(e){
			self.toggle(e);
		});
	}
});
