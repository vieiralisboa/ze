// Bar

(function(Bar){

    //TEMP
    // to use situs controller
    var FILE = {
        name: "Bar",
        filename: "bar.js",
        script: "jquery.bar/js/bar.js",
        path: "/htdocs/libs/jquery.bar/js/bar.js",
        host: "https://xn--stio-vpa.pt/",
        url: "https://xn--stio-vpa.pt/jquery.bar/js/bar.js"
    };

    window.Bar = Bar;

    $.fn.bar = function(data){
        if(!data){
            console.error("Bar requires data");
            return this;
        }

        if(!this.length){
            //console.error("missing container for the toolbar");
            if(!this.selector.match(/^\#/)) return this;
            //console.log("Bar will create the container", this.selector);
        }

        // Existing bar
        if(this.hasClass('bar-container')){
            console.log("element is already a bar", this);

            // The toolbar index
            var index = this.find('.bar').first().attr('data-bar');

            // get the Bar instance
            var bar = Bar.bars[parseInt(index)];

            //var bar = Bar.bars[parseInt(barIndex)];

            // append toolbar items
            if(data.items) bar.items(data.items);
            //bar.toolbar.items(data.items);

            // no toolbox
            if(!data.toolbox){
                if(data.callback) data.callback(bar);
                return this;
            }

            if(!data.toolbox.name) throw "a toolbox name is required";

            //!BAR ONLY CREATES NEW TOOLBOXES!

            // existing toolbox
            var index = Bar.names(data.toolbox.name)['data-b64'];
            if(Bar.app[index]){
                console.log(data.toolbox.name, "toolbox is already set");
                //console.info("use the toolbox bar or callback to add items");

                if(data.toolbox.items) {
                    Bar.app[index].toolbox.items(data.toolbox.items);
                }

                if(data.callback) data.callback(Bar.app[index]);
                return this;
            }

            // new toolbox and callback
            if(Bar.toolbox(bar, data.toolbox) && data.callback) {
                data.callback(bar, data);
                //data.callback(bar);
            }

            // keep chainning
            return this;
        }

        // new toolbar
        var bar = Bar.toolbar(this, data);

        // new toolbox
        if(data.toolbox) var app = Bar.toolbox(bar, data.toolbox);

        // callback
        if(data.callback) data.callback(app || bar, data);

        // keep chainning jQuery
        return $(this.selector);
    };

    //Bar.styles.load(FILE.host);

    // start auto loading bars
    //Bar.autoLoad.start();

    console.info(Bar.name, Bar.version.join('.'));
})
({
    name: 'Bar',
    version: [0, 7, 0],
    bars: [],

    bar: function($bar){
        var index = $bar.find(".bar").first().attr("data-bar");
        if(this.bars[index]) return this.bars[index];
    },

    // toolbar creates toolbars
    //-------------------------------------------------------------------------
    toolbar: function($container, data){
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
        if(data.items) this.bars[index].items(data.items);

        // return the new toolbar
        return this.bars[index];
    },

    // navigator creates the toolbox (tabs) navigator
    //-------------------------------------------------------------------------
    navigator: function(toolbar){
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
        if(!data.name) throw 'toolbox name is required';

        // add navigator to toolbar
        if(!bar.$bar.find('.navigator').length){
            this.navigator(bar);
        }

        // get navigator's index
        var navIndex = bar.$bar.find('.navigator').attr('data-bar');
        //alert(navIndex);

        if(typeof navIndex == 'undefined') throw "failed to create navigator";

        // create toolbox
        var index = this.bars.length;
        this.bars[index] = new this.Bar;
        this.bars[index].$bar.attr('data-bar', index).addClass('toolbox');

        // bar set
        var app = this.names(data.name);
        _.extend(app, {
            toolbar: bar,
            toolbox: this.bars[index],
            navigator: this.bars[parseInt(navIndex)]
        });

        //console.log("app", app);

        // store the bar set
        this.app(app);

        // validate item data.validate
        if(data.validate) {
            this.bars[index].subscribeEvent("addItem", data.validate);
        }

        // add items to the toolbox
        if(data.items) app.toolbox.items(data.items);

        // Navigator tab
        this.navigatorTab(app);

        // store App
        if(data.App){
            data.App.bar = app;
            Frontgate.Apps(app['data-name'], data.App);
        }

        if(data.on){
            for(var i in data.on) {
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
            if(!items) return _items_;//$ul.find('.toolbar-item');

            // setter
            for(var i in items) this.item( items[i] );

            // chainning
            return this;
        };

        // Item
        this.Item = function(data){
            // defauts
            var attr = {};

            // item container
            this.$li = $('<li>').addClass('bar-item');

            if(data.el) this.$el = $('<'+data.el+'>');
            else this.$el = $('<a>');

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
        var lowerCase = name.toLowerCase();
        var parts = lowerCase.split(" ");
        var toolboxName = '';

        for(var i in parts){
            var part = parts[i];
            toolboxName += part.charAt(0).toUpperCase() + part.slice(1);
        }

        return {
            'data-text': name,
            'data-name': toolboxName,
            'data-file': "bar?" + toolboxName, //"bar." + toolboxName + ".js",
            href: "#" + toolboxName,
            'data-b64': Frontgate.b64(toolboxName)//Frontgate.b64(name)//
        };
    },

    // Bar Url parses bar (toolbox) URL
    //-------------------------------------------------------------------------
    urls: function(url){
        if(!url){
            console.error({
                method: "url",
                error: 'bad url',
                url: url
            });
            return false;
        }

        var match = url.match(/^\#(\!)?([\w\-\u00C0-\u00ff]*)$/);

        if(match) return  {
            name: match[2],
            //"jquery.bar/js/bar." + match[2] + ".js",
            script: "situs/js/bar?%bar%".replace("%bar%", match[2]),
            hash: match.input,
            match: match
        };

        //url.match(/^jquery.bar\/js\/bar\.([\w\-\_\é\á\í\ó]*)\.js$/i);
        var match = url.match(/^situs\/js\/bar\?([\w\-\u00C0-\u00ff]*)$/i);

        if(match) return {
            name: match[1],
            script: match.input,
            hash: "#!%bar%".replace("%bar%", match[1]),
            match: match
        };

        return false;
    },

    alias: function(aliasName, appName){
        //TODO set router alias

        if(typeof appName == "string"){
            var index = Frontgate.b64(appName);
            var aliasIndex = Frontgate.b64(aliasName);

            if(this.app[index]){
                this.app[aliasIndex] = this.app[index];
                Frontgate.Apps(aliasName, Frontgate.Apps(appName));
                return this.app[index];
            }
            else throw "no such app " + appName;
            return false;
        }
    },

    // Addon helper
    //-------------------------------------------------------------------------
    app: function(app){
        if(typeof app == "string"){
            var index = Frontgate.b64(app);
            if(this.app[index]) return this.app[index];
        }

        if(this.app[app['data-b64']]) {
            console.error('bar with the same name already exists');
        }

        this.app[app['data-b64']] = app;
    },

    // bar loader
    //-------------------------------------------------------------------------
    _requestHash: null,
    load: function(barSelector, callback, jsonFile, appName){
        jsonFile = jsonFile || BAR_JSON;// BAR_JSON from Situs controller
        //appName = appName || BAR_NAME;// BAR_NAME from Situs controller

        $.get(Remote.href(jsonFile), function(data){
            data = parseInt($.fn.jquery) > 1 ? data : JSON.parse(data);

            //TODO use BAR_NAME to reference Addon
            // file name (BAR_NAME) must match name in json file to auto load from hash
            // 'Video Player' => '#VideoPlayer' => 'VideoPlayer.json'
            // 'myVideo' => '#Myvideo' => 'Myvideo.json'

            var toolbar = {
                items:[],//TODO good way to pass the Toolbar items
                toolbox: data,
                callback: callback
            };

            //REQUIRED to store the toolbar (App.bar)
            data.App = toolbar;// Frontgate.Apps(app);

            $(barSelector).bar(toolbar);// => Frontgate.Apps(app, App);
        });

        delete window.BAR_JSON;
        delete window.BAR_NAME;
    },

    // loads Bar (toolbox) addon from script
    //-------------------------------------------------------------------------
    getBar: function(urls, callback){

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
        if( Bar.app[b64] ){
            // select the toolbox tab
            location.hash = Bar.app[b64].href;

            if(callback) callback(false, this.app[b64]);
        }
        else{
            // load required script 'bar/js/bar.<toolbox.name>.js'
            var script = this.autoLoad.location.href(urls.script);
            $.getScript(script, function(data, textStatus, jqxhr){
                if(textStatus != "success") throw "error loading " + script;
                if(callback) callback(data, textStatus, jqxhr);
            });
        }

        return true;
    },

    // bar auto loader
    //-------------------------------------------------------------------------
    autoLoad: {

        // location to auto load bars from
        location: null,

        // starts auto loading bars
        start: function(location){
            if(this.started) return false;

            // auto load requires Frontgate
            if(!Frontgate) return false;

            this.started = true;

            // location to auto load bars from
            this.location = location || Frontgate;

            // set onNotFound route event handler
            Frontgate.router.onNotFound = function(hash, base, route, callback){

                // load bar (toolbar addon) from script
                Bar.getBar(Bar.urls(hash), function(error, app){
                    // select addon tab
                    if(!error && app && app.href){
                        Frontgate.router.route(app.href);
                        //console.info("getBar", app);
                    }

                    //else console.error("error getBar", hash);

                    if(typeof callback == 'function'){
                        callback(hash, base, route, app||0);
                    }
                });
            };
        },
        stop: function(){
            //TODO
        }
    },

    styles: {
        href: "jquery.bar/css/bar.css",
        load: function(location){
            location.stylesheet(this.href);
        }
    },

    start: function(location){
        // start auto loading bars
        this.autoLoad.start(location);

        // load stylesheet
        //this.styles.load(location);

        return this;
    },

    route: function(hash, callback){
        if(this.autoLoad.started)
            Frontgate.router.route(hash, callback);
        else throw "AutoLoad is disabled";

        //Bar.getBar(Bar.urls(hash), callback);

        return this;
    }
});
