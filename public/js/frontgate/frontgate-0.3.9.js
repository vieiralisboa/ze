// Frontgate JavaScript Library

(function(frontgate){
    var version = [0, 3, 9];

    window.btoa = window.btoa || frontgate.btoa

    var Frontgate = function(attributes){
        attributes = attributes || {};

        // Location Private Object
        var _attr_ = {
            auth: null,
            protocol: "http",
            host: window.location.host,
            hostname: window.location.hostname,
            port: 80,
            pathname: null
        };

        // Apps Private Object
        var _apps_ = {}, user = "anonymous", pw;

        this.Apps = function(name, app){
            if(!arguments.length) return _apps_;
            if(typeof app == "undefined") {
                if(_apps_[name]) return _apps_[name];
                return;
            }

            if(_apps_[name]) throw "app with same name already exists";
            _apps_[name] = app;

            return app;
        };

        // creates new location or returns current location attributes
        this.location = function(attr){
            if (!arguments.length) {
                return this.attr();
            }

            return new this.Location(attr);
        };

        // Location attributes
        //attr({ hostname: "situs.pt", port: 8080 });// Frontgate
        //attr('port');// 8080
        //attr();// { hostname: "situs.pt", port: 8080 }
        //attr().port;// 8080
        //---------------------------------------------------------------------
        this.attr = function(attr){
            if (!arguments.length) {
                return this.clone(_attr_);
            }

            // getter (argument is a key name)
            if (typeof attr == "string") {
                return _attr_[attr];
            }

            // one time setter
            if(!this.attr.set) {
                //TODO validate values
                attr.hostname = attr.hostname || _attr_.hostname;
                attr.pathname = attr.pathname || _attr_.pathname;
                attr.protocol = attr.protocol || _attr_.protocol;
                attr.port = attr.port || (attr.protocol.match(/^https(\:)?$/)? 443 : _attr_.port);
                attr.host = attr.hostname + (attr.port == 80 || attr.port == 443? "" : ":" + attr.port);

                //frontgate.ro(_attr_, attr);
                for(var key in attr){
                    if(_attr_[key] != attr[key]) {
                        _attr_[key] = attr[key]
                    }
                }

                // readonly Frontgate attribute urlRoot
                frontgate.ro(this, { urlRoot: this.url() });

                this.attr.set = 1;
            }

            return this;
        };

        // URL to resourse
        // @param string path to resourse from root url
        // @return string root url or absolute url to resourse
        // @example Frontgate.uri();
        // => http://www.example.com/root
        // @example Frontgate.uri('js/main.js');
        // => http://www.example.com/root/js/main.js
        //---------------------------------------------------------------------
        this.uri = function(resource) {
            var port = this.attr('port'),
                protocol = this.attr('protocol'),
                host = this.attr('host'),
                root = this.attr('pathname'),
                uri = "{protocol}{host}/{root}{resource}";

            //TODO template
            uri = uri.replace("{host}", host);//"http://example.com{port}/{pathname}/{resource}"
            //uri = uri.replace("{port}", port? ":" + port : "");//"http://example.com:8080/{pathname}/{resource}"
            uri = uri.replace("{root}", root? root.replace(/\/$/, "") : "");//"http://example.com:8080//pathname/{resource}"
            uri = uri.replace("{resource}", resource? "/" + resource : "");//"http://example.com:8080//pathname//resource.html"
            uri = uri.replace(/\/+/g, "/");// replace multiple slashes with only one slash
            uri = uri.replace("{protocol}", protocol.replace(/(\:)?$/, "://"));//"http://{host}{port}//pathname/resource.html"

            return uri;
        };

        // alias for uri
        //---------------------------------------------------------------------
        this.href = function(resource){
            return this.uri(resource);
        };
        this.url = function(resourse){
            return this.uri(resourse);
        }

        // URL with basic Authentication
        //---------------------------------------------------------------------
        this.hrefAuth = function(resource){
            if(!user || !pw) {
                return this.uri(resource);
            }

            var auth = "//{user}:{pw}@".replace("{user}",
                user).replace("{pw}", encodeURIComponent(pw));

            return this.uri(resource).replace("//", auth);
        };

        // alias for hrefAuth
        //---------------------------------------------------------------------
        this.urlAuth = function(resourse){
            return this.hrefAuth(resourse);
        }

        // Script
        //---------------------------------------------------------------------
        this.script = function(src, callback){
            var script = this.href(src);
            Frontgate.loadScript(script, callback);
            //console.log("Frontgate.script", script);
            return this;
        };

        // Stylesheet
        //---------------------------------------------------------------------
        this.stylesheet = function(href){
            Frontgate.loadStylesheet(this.href(href));
            return this;
        };

        // Template
        //---------------------------------------------------------------------
        this.template = function(src, callback){
            Frontgate.loadTemplate(this.href(src), callback);
            return this;
        };

        // sync
        // Frontgate.sync('/jQuery/jquery.js', // load jQuery
        //      '/underscore/underscore.js', //load Underscore after jQuery
        //      '/backbone/backbone.js', // load Backbone after Underscore
        //       function(){
        //          console.log('now I can use $, _ and Backbone');
        //          $('body').css('background-color','black');
        //          _.forEach([1,2,3], function(n){ console.log(n); });
        //      }, '/dev/frontgate/js/hello.js');
        // });
        //---------------------------------------------------------------------
        this.sync = function(){
            var scripts = [];
            // href the js script arguments
            for(var i in arguments){
                // argument is a script
                if(typeof arguments[i] == 'string') {
                        //&& arguments[i].match(/\.js$/)) {
                    scripts.push(this.href(arguments[i]));
                }
                else if(typeof arguments[i] == 'function'){
                    scripts.push(arguments[i]);
                }
            }

            //DEV logs the arguments
            //console.log('Frontgate.loadSync(', scripts, ')');

            // loads the scripts synchronously
            this.Location.loadSync.scripts(scripts);

            // keeps chainning
            return this;
        };

        // alias for sync
        //---------------------------------------------------------------------
        this.scripts = this.sync;

        // Authorization
        // Sets or gets basic auth base64 string 'user:pw'
        // @param object|undefined {user:user, pw:pw}
        // @return object|string
        // @example auth({user:'guest', pw:'guest'});
        // @example .auth();// 'Z3Vlc3Q6Z3Vlc3Q='
        //---------------------------------------------------------------------
        this.auth = function(credentials){
            if(typeof credentials == 'undefined') {
                return this.attr('auth');
            }

            credentials.user = credentials.user || user;
            credentials.pw = credentials.pw || credentials.user;

            user = credentials.user;
            pw = credentials.pw;

            _attr_.auth = this._basicAuth(credentials.user, credentials.pw);

            // publish 'userchange' event
            if(this.publishEvent) {
                this.publishEvent('userchange', {
                    user: user,
                    pw: pw,
                    auth: _attr_.auth
                });
            }

            return this;
        };

        // XHR Auth
        // Gets a function that sets Basic Authorization Header on a xhr object
        // @param string user the username
        // @param string pw the password
        // @return function the basic Authorization Header for the xhr object
        // @example xhrAuth('guest', 'guest');
        // => f(xhr){
        //    xhr.setRequestHeader("Authorization", "Basic Z3Vlc3Q6Z3Vlc3Q=");
        // }
        //---------------------------------------------------------------------
        this.xhrAuth = function(user, pw){
            var self = this,
                basicAuth = (!user || !pw)?
                    self.attr('auth'): this._basicAuth(user, pw);

            return function(xhr) {
                xhr.setRequestHeader("Authorization", "Basic " + basicAuth);
                xhr.withCredentials = true;
            };
        };

        // Basic Authorization
        // basicAuth({ user:"daniel", pw:"leinad" });// "ZGFuaWVsOmxlaW5hZA=="
        // basicAuth("ZGFuaWVsOmxlaW5hZA==");// {user:"daniel", pw:"dem0nio"}
        // basicAuth("daniel", "leinad");// "ZGFuaWVsOmxlaW5hZA=="
        // basicAuth();// { auth:"ZGFuaWVsOmx...", user:"daniel", pw:"leinad" }
        //---------------------------------------------------------------------
        this.basicAuth = function(credentials, pw) {
            var auth;

            if(typeof pw != "undefined") {
                return this._basicAuth(credentials, pw);
            }

            if(typeof credentials == "undefined") {
                auth = frontgate.utf8(this.attr("auth")).split(":");
                return {
                    auth: this._basicAuth(auth[0], auth[1]),
                    user: auth[0],
                    pw: auth[1]
                }
            }

            if(typeof credentials == "string") {
                auth = frontgate.utf8(credentials).split(":");
                return {
                    user: auth[0],
                    pw: auth[1]
                }
            }

            if(typeof credentials == "object"){
                if(credentials.user && credentials.pw ) {
                    return this._basicAuth(credentials.user, credentials.pw);
                }
            }

            return false;
        };

        //---------------------------------------------------------------------
        this._basicAuth = function(user, pw){
            return btoa(user + ":" + pw);
        };

        this.attr(attributes);

        this.auth({
            user: user,
            pw: pw
        });

        // add Location constructor
        this.Location = _frontgate(Frontgate);

        // add frontgate methods
        _frontgate(this);

        // add event handler
        this._on(this);

        // add readonly properties
        this.ro(this, {
            VERSION: version.join("."),
            NAME: "Frontgate",
            version: version
        });
    };

    // adds frontgate methods to object
    //-------------------------------------------------------------------------
    function _frontgate(o){
        for (var i in frontgate) {
            if(!o[i]) {
                o[i] = frontgate[i];
            }
        }
        return o;
    }

    window.Frontgate = new Frontgate({
        protocol: window.location.protocol,
        //host: window.location.host,
        hostname: window.location.hostname,
        port: window.location.port,
        pathname: frontgate.pathname()[1]
    });

    console.info(window.Frontgate.NAME, window.Frontgate.VERSION);
})
({
    // Load Script
    //-------------------------------------------------------------------------
    loadScript: function(src, callback){
        //TODO check if the DOM already has a script element with this src
        // skip if the script is already appended to the DOM

        var script = document.createElement('script');
        script.setAttribute('type','text/JavaScript');
        script.setAttribute('src', src);
        script.onload = function(){
            if(typeof callback == 'function') callback(script);
        };
        (document.getElementsByTagName("head")[0]).appendChild(script);
        return this;
    },

    // Load Synchronized scripts
    // loadSync.scripts(script1, script2, f1, script3, f2 );
    //-------------------------------------------------------------------------
    loadSync: {

        script: function(url, callback){
            // create a script element
            var script = document.createElement('script');
            script.setAttribute('type','text/JavaScript');
            script.setAttribute('src',url);

            // subscribe the script to the statechange event
            script.onreadystatechange = function () {
                if (this.readyState == 'complete'){

                    //console.log('onreadystatechange', url);

                    callback(script);
                }
                //else console.log('loading', url, this.readyState);
            };

            // subscribe the script to the load event
            script.onload = function (){
                //console.log('loaded', url);
                callback(script);
            };

            // append (load) the script
            var head = document.getElementsByTagName("head");
            head[0].appendChild(script);

            // return the script element
            return {
                src: url,
                el: script
            };
        },

        scripts: function(scripts){
            var sync = Frontgate.Location.loadSync;

            if( scripts.length ){
                // next argument is a function
                while(typeof scripts[0] == 'function'){
                    var res = (scripts.shift())();

                    // if res is a script uri, put it back in the arguments
                    if(res && res.match(/^(http:)?\/\/[\w\/]*.js$/i)){
                        scripts.unshift(res);
                        break;
                    }
                }

                if( scripts.length ){
                    sync.script( scripts.shift(), function(script){
                        sync.scripts(scripts);
                    });
                }
            }
            //else console.log('loadSync done');
        }
    },

    // Template 1
    // gets Remote Template
    // requires jQuery
    // uses $.get(url, callback)
    //-------------------------------------------------------------------------
    loadTemplate: function(url, callback){
        // validate argumets here

        $.get(url, function(){
            var template = arguments[0];

            // validate template here

            callback(template);
        });

        return;//TODO return validation
    },

    // load Template 2
    // gets local or Remote Template
    // uses $(el).load(url, callback) to get remote tmpl
    // src example: 'templates/name_template.html';
    //-------------------------------------------------------------------------
    loadTemplate2: function(src, callback){
        // make id from template name
        var id = id || src.match(/\/([a-zA-Z0-9_-]+)\.html$/)[1];

        // template (or template with same id) already loaded
        if($('#'+id).length){
            if(typeof callback != 'undefined') callback($('#'+id).html());
            else return $('#'+id).html();
            return;
        }

        // add template contents to a <script> and append it to the body
        $('<script>').attr({id: id, type: 'text/Template'}).load(src,
            function(response, status, xhr){
                if (status == "error") {
                    var msg = "Sorry but there was an error: ";
                    //console.log(msg, xhr.status, xhr.statusText);
                }
                else {
                    if(typeof callback != 'undefined'){
                        callback(response);
                    }
                    //console.log(response);
                }
            }).appendTo('body');
    },

    // get/set attribute without jquery
    //-------------------------------------------------------------------------
    attribute: function(el, attr, val){
        if(typeof val == 'undefined') {
            return (document.getElementsByTagName(el)[0]).getAttribute(attr);
        }

        (document.getElementsByTagName(el)[0]).setAttribute(attr, val);
    },

    //-------------------------------------------------------------------------
    appendLink: function(link){
        var el = document.createElement('link');
        for(var attr in link) {
            el.setAttribute(attr, link[attr]);
            (document.getElementsByTagName("head")[0]).appendChild(el);
        }
    },

    //-------------------------------------------------------------------------
    forEach: function(list, f){
        while(list.length){
            f(list.shift());
        }
    },

    //-------------------------------------------------------------------------
    loadStylesheet: function(href){
        var stylesheet = {media:"screen", type:"text/css", rel:"stylesheet",
            href: href};
        this.appendLink(stylesheet);
        return this;
    },

    //-------------------------------------------------------------------------
    basename: function(path) {
        return path.replace(/\\/g, '/').replace( /.*\//, '');
    },

    //-------------------------------------------------------------------------
    dirname: function(path) {
        return path.replace(/\\/g,'/').replace(/\/[^\/]*$/, '');
    },

    //-------------------------------------------------------------------------
    pathname: function(pathname){
        pathname = pathname || window.location.pathname;
        return pathname.match(/^((\/[\w\.\-]+)*)\/([\w\.\-]+)?$/);
    },

    //-------------------------------------------------------------------------
    remote: function(attr){
        // remote location exists
        if(this.remote._remote) {
            return this.remote._remote;
        }

        var hostname;

        // remote location from argument
        if (attr) {
            //throw "use Location to create new locations";
            hostname = attr.hostname;
            if(!hostname) {
                throw "not a valid hostname";
            }
            this.remote._remote = new Frontgate.Location({
                hostname: hostname,
                pathname: attr.pathname || "/",
                protocol: attr.protocol || "http:",
                port: attr.port || null
            });
            return this.remote._remote;
        }

        // remote location from html data
        var _html = document.getElementsByTagName("html")[0];
        hostname = _html.getAttribute("data-remote_hostname");

        if(!hostname) {
            throw "not a valid hostname";
        }
        this.remote._remote = new Frontgate.Location({
            hostname: hostname,
            protocol: _html.getAttribute("data-remote_protocol"),
            pathname: _html.getAttribute("data-remote_pathname") || "/",
            //request_time: _html.getAttribute("data-request_time"),
            //user_addr: _html.getAttribute("data-user_addr"),
            port: _html.getAttribute("data-remote_port")
        });
        this.remote._remote.auth(Frontgate.attr());
        return this.remote._remote;
    },

    LOG: false,

    //TODO move into dependent Frontgate
    //-------------------------------------------------------------------------
    _on: function(o){

        o.publishEvent = function(event, data){
            //console.log('<<<'+event+'>>>', this);
            if(this.events[event]) {
                this.events[event](data);
            }
        }

        o.events = {};

        o.subscribeEvent = function(name, f){
            // event doesn't exist
            if(!this.events[name]){
                // event
                this.events[name] = function(e){
                    for(var i in this[name].stack){
                        this[name].stack[i](e);
                    }
                };
                // event stack
                this.events[name].stack = [];
            }
            // add to event stack
            this.events[name].stack.push(f);
        };
    },

    //-------------------------------------------------------------------------
    set: function($el, data){
        this._set($el, data, ['text', 'html', 'css', 'attr', 'click']);
        return $el;
    },

    //-------------------------------------------------------------------------
    _set: function(o, data, properties){
        for(var i in properties) {
            if(data[properties[i]]){
                o[properties[i]](data[properties[i]]);
            }
        }
        return o;
    },

    // Frontgate.b64(utf8) utf8_to_b64
    //-------------------------------------------------------------------------
    b64: function(str){
        return window.btoa(decodeURIComponent( str ));
    },

    // Frontgate.utf8(b64)b64_to_utf8
    //-------------------------------------------------------------------------
    utf8: function(str){
        return decodeURIComponent(escape(window.atob( str )));
    },

    // base64 encode (not for international characters!)
    //-------------------------------------------------------------------------
    btoa: function(input) {
        var keyStr, output = "", i = 0,
            chr1, chr2, chr3 = "",
            enc1, enc2, enc3, enc4 = "";

        input = escape(input);

        keyStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        keyStr += keyStr.toLowerCase();
        keyStr += "0123456789+/=";

        do {
            chr1 = input.charCodeAt(i++);
            chr2 = input.charCodeAt(i++);
            chr3 = input.charCodeAt(i++);

            enc1 = chr1 >> 2;
            enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
            enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
            enc4 = chr3 & 63;

            if (isNaN(chr2)) enc3 = enc4 = 64;
            else if (isNaN(chr3)) enc4 = 64;

            output = output + keyStr.charAt(enc1) + keyStr.charAt(enc2) +
                keyStr.charAt(enc3) + keyStr.charAt(enc4);
            chr1 = chr2 = chr3 = "";
            enc1 = enc2 = enc3 = enc4 = "";
        }
        while (i < input.length);

        return output;
    },

    // adds readonly properties to an object
    //-------------------------------------------------------------------------
    ro: function(o, ro){
        var ro = this.clone(ro);

        for(var n in ro) {
            ro[n] = {
                value: ro[n],
                writeable: false
            }
        }

        return Object.defineProperties(o, ro);
    },

    clone: function(o){
        return JSON.parse(JSON.stringify(o));
    }
});
