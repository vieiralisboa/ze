// Bar

(function(Bar){

    /*/TEMP
    //TODO use situs controller local FILE var
    var FILE = {
        name: "Bar",
        filename: "bar.js",
        script: "jquery.bar/js/bar.js",
        path: "/htdocs/libs/jquery.bar/js/bar.js",
        host: "http://situs.xn--stio-vpa.pt/",
        url: "http://situs.xn--stio-vpa.pt/jquery.bar/js/bar.js"
    };//*/

    //REQUIRED Frontgate
    // http://situs.pt/bar/Frontgate
    // http://situs.pt/situs/bar?Frontgate

    Bar.API = new Frontgate.Location({
        hostname: $('html').attr("data-situs_hostname"),// example.com
        pathname: "/bar",// href(Frontgate) => /bar/Frontgate
        port: parseInt($('html').attr("data-situs_port")),
        protocol: $('html').attr("data-situs_protocol")
    });

    window.Bar = Bar;

    if (window.Ze && typeof Ze.bar == "undefined") {
        Ze.bar = Bar;
    }

    // jQuery plugin
    $.fn.bar = function(data) {
        if (!data) {
            console.error("Bar requires data");
            return this;
        }

        if (!this.length) {
            //console.warn("missing container for the bar");
            if(!this.selector.match(/^\#/)) {
                return this;
            }
            //console.log("Bar will create the container", this.selector);
        }

        var index, bar, bars, app;

        // Existing bar
        if(this.hasClass('bar-container')){
            //console.warn("element is a bar-container", this);

            bars = this.find('.bar');

            if(!bars.length){
                //console.error("invalid bar-container", this);
                throw "invalid bar-container";
            }

            // The toolbar index
            index = bars.first().attr('data-bar');
            if(typeof index == 'undefined'){
                this.html("");
            }
            else{
                // get the Bar instance
                bar = Bar.bars[parseInt(index)];

                // append toolbar items
                if (data.items) {
                    bar.items(data.items);
                }

                // no toolbox
                if (!data.toolbox) {
                    if(data.callback) {
                        data.callback(bar);
                    }
                    return this;
                }

                if (!data.toolbox.name) {
                    throw "a toolbox name is required";
                }

                // BAR ONLY CREATES NEW TOOLBOXES!
                // use the bar object or callback to add items to the toolbox

                // toolbox bar index
                index = Bar.names(data.toolbox.name)['data-b64'];

                // the toolbox exists
                if (Bar.app[index]) {
                    //console.log(data.toolbox.name, "toolbox is already set");

                    if (data.toolbox.items) {
                        Bar.app[index].toolbox.items(data.toolbox.items);
                    }

                    if (data.callback) {
                        data.callback(Bar.app[index]);
                    }

                    return this;
                }

                // new toolbox and callback
                if (Bar.toolbox(bar, data.toolbox) && data.callback) {
                    data.callback(bar, data);
                }

                // keep chainning
                return this;
            }
        }

        // new toolbar
        bar = Bar.toolbar(this, data);

        // new toolbox
        if(data.toolbox) {
            app = Bar.toolbox(bar, data.toolbox);
        }

        // callback
        if (data.callback) {
            data.callback(app || bar, data);
        }

        // keep chainning jQuery
        return $(this.selector);
    };

    // load stylesheet
    //Bar.styles.load(FILE.host);

    // start auto loading bars
    //Bar.autoLoad.start();

    if (window.console && console.info) {
        console.info(Bar.name, Bar.version.join('.'));
    }
})
({
    name: 'Bar',
    version: [0, 8, 1],
    bars: [],

    bar: function($bar) {
        var index = $bar.find(".bar").first().attr("data-bar");
        if (this.bars[index]) {
            return this.bars[index];
        }
    },

    // toolbar creates toolbars
    //-------------------------------------------------------------------------
    toolbar: function($container, data) {
        // create a container for unmatched bar selector (id is required)
        if(!$container.length){
            $container = $('<div>').attr('id',
                $container.selector.substring(1)).prependTo('body');
        }

        // the toolbar index
        var index = this.bars.length;

        // new toolbar
        this.bars[index] = new this.Bar;

        // append the toolbar to the bar
        this.bars[index].$bar.attr('data-bar', index)
        .appendTo($container.addClass('bar-container'));

        // validate item data.validate
        if(data.validate) {
            this.bars[index].subscribeEvent("addItem", data.validate);
        }

        // add toolbar items
        if(data.items) {
            this.bars[index].items(data.items);
        }

        // return the new toolbar
        return this.bars[index];
    },

    // navigator creates the toolbox (tabs) navigator
    //-------------------------------------------------------------------------
    navigator: function(toolbar) {
        // the navigator index
        var index = this.bars.length;

        // create navigator
        this.bars[index] = new this.Bar;
        this.bars[index].$bar.attr('data-bar', index)
        //.find('.bar-items')
        .addClass('navigator');

        // append navigator to the toolbar
        toolbar.$bar.append(this.bars[index].$bar);
    },

    // navigatorTab adds toolbox tabs to navigator
    //-------------------------------------------------------------------------
    navigatorTab: function(app){
        // append toolbox to navigator
        app.navigator.$bar.append(app.toolbox.$bar);

        // add navigator tab item for the toolbox
        app.navigator.item({
            text: app['data-text'],
            attr:{
                href: app.href,
                title: app['data-name']
            },
            click: function(){
                console.log("Route < Click! Route! It Works!", app);
                //TODO fix navigator ui bugs here
            }
        });

        // add tab route
        Frontgate.router.on(app.href, function(route){
            // publish Navigator
            app.navigator.publishEvent('click', route);

            // publish tab click event
            app.toolbox.publishEvent('click');

            // remove .selected class from selected tab
            app.navigator.$bar.children('ul').find('li.selected')
                .removeClass('selected');

            // add .selected class to tab
            var hash = route.res.input;
            app.navigator.$bar.children('ul').find('a[href="' + hash + '"]')
                .parent().addClass('selected');

            // remove .selected class from selected toolbox
            app.toolbox.$bar.siblings('.selected').removeClass('selected');

            // add .selected class to toolbox
            app.toolbox.$bar.addClass('selected');
        });

        // activate the tab route (selects this toolbox)
        Frontgate.router.route(app.href);
    },

    // creates toolboxes
    //-------------------------------------------------------------------------
    toolbox: function(bar, data){
        if (!data.name) {
            throw 'toolbox name is required';
        }

        // add navigator to toolbar
        if (!bar.$bar.find('.navigator').length) {
            this.navigator(bar);
        }

        // get navigator's index
        var navIndex = bar.$bar.find('.navigator').attr('data-bar');
        //alert(navIndex);

        if(typeof navIndex == 'undefined') {
            throw "failed to create navigator";
        }

        var i, index, app;

        // create toolbox
        index = this.bars.length;
        this.bars[index] = new this.Bar;
        this.bars[index].$bar.attr('data-bar', index).addClass('toolbox');

        // bar set
        app = this.names(data.name);
        _.extend(app, {
            toolbar: bar,
            toolbox: this.bars[index],
            navigator: this.bars[parseInt(navIndex)]
        });

        //console.log("app", app);

        // store the bar set
        this.app(app);

        // validate item data.validate
        if (data.validate) {
            this.bars[index].subscribeEvent("addItem", data.validate);
        }

        // add items to the toolbox
        if (data.items) {
            app.toolbox.items(data.items);
        }

        // Navigator tab
        this.navigatorTab(app);

        // store App
        if (data.App) {
            data.App.bar = app;
            Frontgate.Apps(app['data-name'], data.App);
        }

        if (data.on) {
            for (i in data.on) {
                app.toolbox.subscribeEvent(i, data.on[i]);
            }
        }

        return app;
    },

    // Bar Constructor
    //-------------------------------------------------------------------------
    Bar: function(items){
        // toolbar items list
        var $ul = $('<ul>').addClass('bar-items');
        var _items_ = [];

        this.$bar = $('<div>').addClass('bar').append($ul);

        // append item
        this.item = function(item){
            this.publishEvent("addItem", item);

            var index = _items_.length;

            _items_.push((new this.Item(item)));

            // append item
            $ul.append(_items_[index].$li.attr('data-item', index));

            return this;
        };

        // append items
        this.items = function(items){
            // getter (no argumnts)
            if(!items) {
                return _items_;//$ul.find('.toolbar-item');
            }

            var i;

            // setter
            for(i in items) {
                this.item( items[i] );
            }

            // chainning
            return this;
        };

        // Item
        this.Item = function(data){
            // defauts
            var attr = {};

            // item container
            this.$li = $('<li>').addClass('bar-item');

            if (data.el) {
                this.$el = $('<'+data.el+'>');
            }
            else {
                this.$el = $('<a>');
            }

            _.extend(attr, data);
            Frontgate.set(this.$el, attr);

            this.$li.append(this.$el);

            return this;
        };

        Frontgate._on(this);

        this.items(items);

        return this;
    },

    // Name parses toolbox name
    //-------------------------------------------------------------------------
    names: function(name){
        var lowerCase = name.toLowerCase(),
            parts = lowerCase.split(" "),
            toolboxName = '',
            i, part;

        for(i in parts){
            toolboxName += parts[i].charAt(0).toUpperCase() + parts[i].slice(1);
        }

        return {
            'data-text': name,
            'data-name': toolboxName,
            'data-file': "bar/" + toolboxName, //"bar." + toolboxName + ".js",
            href: "#" + toolboxName,
            'data-b64': Frontgate.b64(toolboxName)//Frontgate.b64(name)//
        };
    },

    // Bar Url parses bar (toolbox) URL
    //-------------------------------------------------------------------------
    urls: function(url){
        if (!url) {
            console.error({
                method: "url",
                error: 'bad url',
                url: url
            });
            return false;
        }

        var match = url.match(/^\#(\!)?([\w\-\u00C0-\u00ff]*)$/);

        if (match) return  {
            name: match[2],
            //"jquery.bar/js/bar." + match[2] + ".js",
            //script: "situs/js/bar?%bar%".replace("%bar%", match[2]),
            script: "bar/%bar%".replace("%bar%", match[2]),
            hash: match.input,
            match: match
        };

        //url.match(/^jquery.bar\/js\/bar\.([\w\-\_\é\á\í\ó]*)\.js$/i);
        match = url.match(/^bar\/([\w\-\u00C0-\u00ff]*)$/i);

        if (match) {
            return {
                name: match[1],
                script: match.input,
                hash: "#!%bar%".replace("%bar%", match[1]),
                match: match
            };
        }

        return false;
    },

    alias: function(aliasName, appName){
        //TODO set router alias

        if (typeof appName == "string") {
            var index = Frontgate.b64(appName),
                aliasIndex = Frontgate.b64(aliasName);

            if (this.app[index]) {
                this.app[aliasIndex] = this.app[index];
                Frontgate.Apps(aliasName, Frontgate.Apps(appName));
                return this.app[index];
            }
            else {
                throw "no such app " + appName;
            }

            return false;
        }

        return false;
    },

    // Addon app helper
    //-------------------------------------------------------------------------
    app: function(app){
        if (typeof app == "string") {
            var index = Frontgate.b64(app);
            if (this.app[index]) {
                return this.app[index];
            }
        }

        if(this.app[app['data-b64']]) {
            console.error('bar with the same name already exists');
        }

        this.app[app['data-b64']] = app;
    },

    // bar loader
    //-------------------------------------------------------------------------
    _requestHash: null,
    //----------------------------------------------------
    // use only in bar scripts served by situs controller
    //----------------------------------------------------
    load: function(barSelector, callback, FILE){
        if(!FILE) throw "FILE is undefined";
        //console.warn("FILE", FILE);
        data = JSON.parse(FILE.json);

        //TODO load stylesheet
        if(data.css){
            this.autoLoad.css(FILE.bar);
        }

        var toolbar = {
            items: [],//TODO a good way to pass the Toolbar items
            toolbox: data,// json data
            callback: callback
        };

        //REQUIRED to store the toolbar (App.bar)
        // circular reference
        data.App = toolbar;// Frontgate.Apps(app);

        //BAR
        $(barSelector).bar(toolbar);// => Frontgate.Apps(app, App);
    },

    // loads Bar (toolbox) addon from script
    //-------------------------------------------------------------------------
    getBar: function(urls, callback){
        //console.info(urls);

        if(!urls.name) {
            callback({
                error: "bad url",
                url: urls.script
            });

            return false;
        }

        // app name b64 encoded (to allow any app name)
        var b64 = Frontgate.b64(urls.name);

        // bar[<urls.b64>] the app is set (the script already loaded)
        if ( Bar.app[b64] ) {
            // select the toolbox tab
            location.hash = Bar.app[b64].href;

            if (callback) {
                callback(false, this.app[b64]);
            }
        }
        else {
            // load required script 'bar/js/bar.<toolbox.name>.js'
            var script = this.autoLoad.location.href(urls.script);
            $.ajaxSetup({ cache: true });
            $.getScript(script, function(data, textStatus, jqxhr){
                if (textStatus != "success") {
                    throw "error loading " + script;
                }
                if (callback) {
                    callback(data, textStatus, jqxhr);
                }
            });
        }

        return true;
    },
    /*/
    styles: {
        href: "css/bar.css",
        load: function(location){
            if(typeof location == 'undefined'){
                Bar.API.stylesheet("css");
            }
            else location.stylesheet(this.href);
        }
    }//*/
    // bar auto loader
    //-------------------------------------------------------------------------
    autoLoad: {
        // API Location
        location: null,
        _start: false,
        // start auto loading bars
        start: function(location){
            if(this._start) return false;
            // start auto loading bars
            this.init(location);
            // chain with Bar
            return this;
        },
        // starts auto loading bars
        init: function(location){
            // auto load already started
            if(this._start) return false;
            // auto load requires Frontgate
            if(!Frontgate) return false;
            // auto load the bars from custom location or Frontgate
            this.location = location || Bar.API;
            // enable auto loading
            this._start = true;
            // load bar stylesheet
            this.css();
            // onNotFound event handler to load a bar when route is not found
            Frontgate.router.onNotFound = function(hash,base,route,callback){
                // load bar (toolbar addon) from script
                Bar.getBar(Bar.urls(hash), function(error, app){
                    // select the bar tab (toolbar addon)
                    if (!error && app && app.href) {
                        //Bar.autoLoad.css(app.name);

                        Frontgate.router.route(app.href);
                    }
                    // callback
                    if (typeof callback == 'function') {
                        callback(hash, base, route, app||0);
                    }
                });
            };
        },
        stop: function(){
            //TODO
        },
        _css: false,
        css: function(barname){
            // auto loading is disabled
            if(!this._start) return false;

            // argument is a bar name
            if(typeof barname == 'string') {
                // load its stylesheet
                this.location.stylesheet("bar/" + barname + "/css");
            }
            // the Bar's stylesheet
            else if(!this._css) {
                //TODO check the DOM for "bar/css"
                // load the Bar's stylesheet
                this.location.stylesheet("bar/css");
                this._css = true;
            }

            return this;
        },
        // Requires Frontgate
        route: function(hash, callback){
            if (!this._start) return false;
            //throw "AutoLoad is disabled";

            Frontgate.router.route(hash, callback);

            //Bar.getBar(Bar.urls(hash), callback);

            return this;
        }
    }
});
