//REQUIRE "jquery-ui/jquery-ui-1.10.2.custom/js/jquery-ui-1.10.2.custom.js"
//REQUIRE "topzindex/1.2/jquery.topzindex.js"
//REQUIRE "jquery.panel/jquery.panel.js"
//REQUIRE "jquery.bar/js/bar.js"

(function(situs){

    Frontgate.situs = function(data){
        if (!arguments.length) {
            return situs;
        }

        return new this.Situs(data);
    };

    Frontgate.Situs = function(data){
        var SITUS = this;
        data = data || {};

        //console.log('Welcome to', data.name || data.title || location.hostname.toUpperCase());

        // set webpage title
        document.title = data.title || data.name || document.title;

        var request = {
            requestHash: location.hash,//!important
            requestMethod: $('html').attr("data-requet_method"),
            requestTime: parseInt($('html').attr("data-request_time")),
            remoteAddr: $('html').attr("data-remote_addr")            
        };

        // Docs/Libs location        
        var docs = data.docs || {
            hostname: $('html').attr("data-docs_hostname"),
            pathname: $('html').attr("data-docs_pathname"),
            port: parseInt($('html').attr("data-docs_port")),
            protocol:  $('html').attr("data-docs_protocol")
        };
        _.extend(docs, request);
        this.remote = new Frontgate.Location(docs);

        // defaults for Situs Framework location Bar controller
        var API = data.situs || {
            hostname: $('html').attr("data-situs_hostname"),
            pathname: "/",
            port: parseInt($('html').attr("data-situs_port")),
            protocol: $('html').attr("data-situs_protocol")
        };
        _.extend(API, request);
        this.location = new Frontgate.Location(API);

        // start listening to hashchange events
        Frontgate.router.start(this);

        // auto load bars
        Bar.autoLoad.start(this.location);

        //TODO fix this bad implementation
        this.remote
            .stylesheet('jquery.panel/panel.css');
            //.stylesheet('jquery.bar/css/bar.css');

        if(data.stylesheets) {
            console.warn("data.stylesheets", data.stylesheets);
            if(typeof data.stylesheets == "string"){
                this.remote.stylesheet(data.stylesheets);
            }
            else for(var i in data.stylesheets)
                this.remote.stylesheet(data.stylesheets[i]);
        }

        if(false) window.onbeforeunload = function(){
            //return 'It looks like you have been editing something -- if you leave before submitting your changes will be lost.'
            return 'Ao sair deste sítio, os dados que estiverem por guardar poderão ser perdidos.';
        };

        // save Situs data on window unload
        $(window).bind('unload', function() {
            //TODO change item name to "situs-remote"
            localStorage.setItem("situs", JSON.stringify(Frontgate.attr()));
        });

         //$.ajaxSetup({ cache: true });

        //console.log('BASIC AUTH '+this.attr('auth') + JSON.stringify(credentials));
        $.ajaxSetup({
            beforeSend: Frontgate.xhrAuth()// returns a function
        });

        // Ajax indicators handlers
        //---------------------------------------------------------------------
        $(document).ajaxStart(situs.onAjaxStart);
        $(document).ajaxComplete(situs.onAjaxComplete);

        //if(Situs.loadStart) Situs.loadStart(situs.onAjaxStart);
        //if(Situs.loadComplete) Situs.loadComplete(situs.onAjaxComplete);

        // routes
        //---------------------------------------------------------------------
        //TODO make #user a Bar app
        // 'Sign In' route
        Frontgate.router.on('#user/:user/:pw', function(route){
            //console.log("Start.signIn", route);
            SITUS.ui.signIn(route.attr.user, route.attr.pw);
        });
        Frontgate.router.on('#user/:user', function(route){
            //console.log("Start.signIn", route);
            SITUS.ui.signIn(route.attr.user);
        });
        //this.location
        Frontgate.subscribeEvent('userchange', function(attr){
            //TODO locale language?
            var welcome = "Bem-vindo",
                title = attr.user + '@' + Frontgate.attr("hostname");//attr.hostname;

            if(attr.user != "anónimo") {
                welcome += ", " + attr.user;
            }

            $('#user').text(attr.user).attr('title',  title);

            SITUS.ui.post(welcome);
        });

        // Ajax loading bar
        var loadgif = "graphics/loaders/loadinfo.net_2_2faadd_222222_24.gif";
        situs.ajaxLoading.items[0].attr.src = this.remote.href(loadgif);
        $('#ajax-loading').bar(situs.ajaxLoading).css({
            border: "none",
            display: "none",
            background: "none",
            position: "absolute",
            top: 0,
            height: 0
        });

        // Bar tag
        $('#Bar').bar({
            items:[{
                text: "Bar",
                //css:{ color: "#fac864" },
                attr:{
                    href: this.remote.href("graphics/Bar/Bar.png"),
                    //src: Situs.href("graphics/Bar/Bar.png"),
                    title: "built with Bar",
                    alt: "built with Bar"
                }
            }],
            callback: function(bar){
                bar.$bar.css({
                    background: "rgb(34,34,34)",
                    width: "auto",
                    "float": "right"
                });
            }
        }).css({
            background: "none",
            width: "auto"
        }).css("margin-top", "5px");

        // Notice bar
        $('#notice').bar(situs.notice).css({
            display: "none",
            border: "none",
            //display: "block",
            background: "none",
            position: "absolute",
            top: 0,
            //left:0,
            "z-index": 1,
            height: 0
        });

        // Footer bar
        $('#footer').bar(data.footer||{});//for undefined param the bar will be empty

        // Body bar
        $('#body').bar(data.body||{});//.css('background','purple');

        // Headline bar
        $('#headline').bar(data.headline||{});
        if(!data.headline) $('#headline').css("display", "none");

        // Header bar
        //data.header.toolbox.App = Start;
        $('#header').bar(data.header||{})
        .css("padding", "4px 0px 2px")
        //TODO make user a Bar app
        .find('#user').parent().css("float", "right");

        this.ajaxLoading = function(data){
            return situs.getBar("#ajax-loading");
        };

        this.tag = function(data){
            return situs.getBar("#Bar");
        };

        this.notice = function(data){
            if(!data) return situs.getBar("#notice");

            if(typeof data == "function") data(situs);

            //situs.logApp("Notice");
            //return Frontgate.Apps("Notice");

            //TODO setup notice
            //if(typeof data == "object")

            return this;
        };

        this.footer = function(){
            return situs.getBar("#footer");
        };

        this.body = function(){
            return situs.getBar("#body");
        };

        this.headline = function(){
            return situs.getBar("#headline");
        };

        this.header = function(data){
            return situs.getBar("#header");
        };

        this.ui = {
            signIn: function(user, pw){
                if(!user) return false;
                pw = pw || user;

                // Basic Auth fo ajax calls
                Frontgate.auth({
                    user: user,
                    pw: pw
                });

                return this;
            },
            post: situs.post,
            clearNotice: situs.clearNotice,
            logApp: situs.logApp,
            getBar: situs.getBar
        };

        this._ui = function(){
            return situs;
        };

        if(data.script){
            //console.warn("data.script", data.script);
            this.location.script(data.script);
        }

        // get user data from storage
        situs.location = JSON.parse(localStorage.getItem("situs")) || {};

        // user auth
        Frontgate.auth(Frontgate.basicAuth(situs.location.auth));

        // callback
        if(data.callback){
            data.callback(this, data, situs);
        }

        // load start bar
        if(data.start){
            Frontgate.router.route(data.start);
        }
        else Frontgate.router.route('#Home');

        // load requested bar
        var requestHash = this.location.attr("requestHash");
        if(requestHash && requestHash != "#Home" && requestHash != "#Início"){
            Frontgate.router.route(requestHash);
        }

        //TODO locale language PT
        if(Frontgate.attr("user") == "anonymous") this.ui.signIn("anónimo");

        //situs.ui().post("Hello World!");

        // Route to #Home Bar addon
        //Frontgate.router.route('#Home');//Frontgate.router.route('#EI');

        // When a Bar addon (toolbox bar) is added to a bar,
        // its toolbox bar is activated, its navigator tab is selected
        // and its location hash is set.
        // So at this point the location hash is '#Home'
        // because the router just loaded the addon 'Home'.

    };

    console.info(situs.name, situs.version.join('.'));
})
({
    version: [0, 2, 0],
    name: "Frontgate Situs",
    getBar: function(selector){
        var index = $(selector).find(".bar").first().attr("data-bar");
        return Bar.bars[index];
    },

    logApp: function(name){
        console.log(name, Frontgate.Apps(name));
    },

    notice: {
        items: [{
            text: 'Notice'
        }],

        callback: function(bar){
            bar.$bar
            .css({
               "width": "auto",//!important
                display: "inline-block",
                margin: 0
            })
            .find('.bar-items')
            .css({
                //"background": "purple",
                "background": "rgb(50, 150, 200)",// blue-ish
                //"background": "rgb(213, 78, 33)",// red-ish
                "border-radius": "0 0 5px 5px"
            })
            .find('.bar-item')
            .css({
                "float": "none",
                "text-align": "center",
                height: "23px"
            })
            .find('a')
            .css({
                "line-height": "32px"
                //color: "rgb(250, 200, 100)"
            });
        }
    },

    ajaxLoading: {
        items: [{
            el: 'img',
            attr: {},
            css:{
                "margin-top": "10px"
            }
        }],
        callback: function(bar) {
            bar.$bar
            .css({
               "width": "auto",//!important
                display: "inline-block",
                margin: 0
            })
            .find('.toolbar-items')
            .css({
                "background": "none"
            })
            .find('.toolbar-item')
            .css({
                "float": "none",
                "text-align": "center"
            });
        }
    },

    // clear posted notice
    clearNotice: function(){
        $('#notice').fadeOut('slow', function(){
            $(this).find('a').text('');
        });
    },

    // Post notice
    post: function(text, t){
        var clearNotice = this.clearNotice, $notice = $('#notice');

        text || this.clearNotice();
        t = t || 10000;

        if(this.post.t) clearTimeout(this.post.t);
        $notice.find('a').text(text);
        this.post.t = $notice.fadeIn('slow', function(){
            setTimeout(clearNotice, t);
        });
    },

    onAjaxStart: function(){
        if(!$("#ajax-loading" ).is(":visible")) $("#ajax-loading" ).fadeIn();
    },

    onAjaxComplete: function(){
        if($("#ajax-loading" ).is(":visible")) $("#ajax-loading" ).fadeOut();
    }
});
