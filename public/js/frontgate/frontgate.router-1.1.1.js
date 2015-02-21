// Router

//TODO router constructor
//  Frontgate.router = new Frontgate.Router({
//      location: situs.location
//  });

(function(router){
    Frontgate.router = router;
    console.info(router.name, router.version.join("."));
})
({
    version: [0, 1, 1],
    name: "Frontgate Router",

    // Route Subscriber
    //-----------------------------------------------------------------
    on: function(route, f){
        var base = this.base(route);

        if(!base) throw 'failed to subscribe route';

        if(!this.routes[base]) this.routes[base] = {};

        if(!this.routes[base][route]){
            this.routes[base][route] = {
                stack: [],
                regExp: this.regExpRoute(route),
                hash: route
            };
        }

        this.routes[base][route].stack.push(f);

        return route;
    },

    // Route Base
    //-----------------------------------------------------------------
    base: function(hash){//'#<base>/:val1/:val2<...>'
        hash = hash || location.hash;
        var match = hash.match(/^#([\w\u00C0-\u00ff]*)\/?/);
        if(match) return match[1];
    },

    onNotFound: null,

    start: function(){
        if(this.started) return;
        this.started = true;

        $(window).on('hashchange', function(e){
            Frontgate.router.route();
        });
    },

    hash: function(hash){
        var hash = hash || location.hash;
        hash = hash.replace("#!", "#");
        return hash;
    },

    _notFound: function(hash, base, _hash, callback){
        // router.onNotFound is set
        if(typeof this.onNotFound == 'function')
            this.onNotFound(hash, base, _hash, callback);
        // router.onNotFound is NOT set
        else if(typeof callback == 'function')
            callback(hash, base, _hash, 0);//, callback);// circular reference!

        return false;
    },

    // Route Publisher
    //-------------------------------------------------------------------------
    route: function(hash, callback){
        hash = this.hash(hash);

        //DEBUG
        //alert(hash);

        // #<base>/:value
        var base = this.base(hash);

        //DEBUG
        //alert(base);

        // route not found in routes
        if(!this.routes[base])
            return this._notFound(hash, base, 0, callback);

        // find a match for the route in the routes
        for(var i in this.routes[base]){// /^#\w+\/\w+$/
            var _hash = this.routes[base][i];
            var hashMatch = hash.match(_hash.regExp);

            // match for the route found!
            if(hashMatch){
                var route = this.regExpHash(_hash.hash, hash);
                var stack = _hash.stack;
                for(var j in stack) stack[j](route);

                // callback after calling all from route stack
                if(typeof callback == 'function')
                    callback(hash, base, _hash, route);

                return route;
            }
        }

        //alert(hash+" NOT FOUND");

        //TODO fallback to #<base> if #<base>/:name is not found

        // route no found in routes
        return this._notFound(hash, base, _hash, callback);
    },

    // Hash Parser
    //-----------------------------------------------------------------
    regExpHash: function(route, hash){
        hash = hash || location.hash;

        var regExp = this.regExpRoute(route);

        var match = {
            req: route.match(regExp),
            res: hash.match(regExp),
            attr: {}
        };

        for(var i=1; i < match.req.length; i++){
            match.attr[match.req[i]] = match.res[i];
        }

        return match;
    },

    // Route Regular Expression
    //-----------------------------------------------------------------
    regExpRoute: function(route) {
        var base = this.base(route);
        var hashArray = route.replace(new RegExp('^#'+base+'/'),'')
            .split('/');

        var regexp = "^#"+base;

        // Calling the Base
        if(hashArray.length == 1 && hashArray[0] == "#"+base){
            //console.log('hash array',hashArray);

            return new RegExp(regexp + "$");
        }

        var defaultPart = '\\:?([\\w\\.\\-\\\\]*)';//\\_
        var lastPart = '\\:?(.*)';
        var last = hashArray.length - 1;

        for(var i in hashArray) {
            regexp += "\/";//'(?P<'+hashArray[i].substring(1)+'>[\w_-\.]*)'

            regexp += hashArray[i].substring(0, 1) == ':' ?
                ( i == last ? lastPart : defaultPart ) : hashArray[i];
        }

        regexp += "$";
        return new RegExp(regexp);
    },
    routes: {}
});
