/**
 * Zé
 * Web Application Tools
 * @email vieira.lisboa@yahoo.com
 * @license MIT Public
 */
(function(ze){
    var Ze = function(selector){
        var z = selector? document.querySelectorAll(selector): [];
        for(var _ in ze) z[_] = ze[_];
        z.selector = selector;
        return z;
    };

    window[ze.name] = function(s){ return new Ze(s); };
    for(var name in ze) window[ze.name][name] = ze[name];

    if(console && console.info) console.info(ze.name, ze.version.join("."));
})({
    name: "Ze",
    version: [0,0,0],
    
    self: function(){
        return this;
    },

    // select/toggle element 
    select: function(el){
        this.toggle(el, 1);
        return this;
    },
    
    unselect: function(el){
        this.toggle(el, 0);
        return this;
    },
    
    toggle: function(el, condition){
        var $el = $(el);
        if(typeof condition != 'undefined') {
            if(typeof condition == 'function') condition = condition();
            if(condition) $el.addClass("selected");
            else $el.removeClass("selected");
        }
        else {
            if($el.hasClass("selected")) $el.removeClass("selected");
            else $el.addClass("selected");
        }
        return this;
    },
    
     _toggle: function($el){
        $el = $el || $("a[href='%hash%']".replace("%hash%", location.hash));
        var $menuItem = $el.parent();
        if($menuItem.hasClass('selected')) return;
        $menuItem.addClass('selected').siblings().removeClass('selected');
    },

    // Load script
    loadScript: function(url, callback){
        // create a script element
        var script = document.createElement('script');
        script.setAttribute('type','text/JavaScript');
        script.setAttribute('src',url);

        // ie
        script.onreadystatechange = function () {
            if (this.readyState == 'complete') if(callback) callback(script);
        };

        // other
        script.onload = function (){
            if(callback) callback( script );
        };

        // append (load) the script
        var head = document.getElementsByTagName("head");
        head[0].appendChild(script);
    },
    
    _code: function(text){
        var $ol =$("<ol>").addClass("code");
        var tab = new RegExp("\t", "g")
        text = text.replace(tab, "    ");
        var lines = text.split("\n");
        var comment = 0;
        var comment_block = 0;
        for(var i in lines){
            var line = lines[i];
            var classes = ["code"];
            
            if(!comment_block && line.match(/^(\s+)?\/[\*]+/)){
                classes.push("comment-block");
                if(!line.match(/\*\/(\s*)?$/)) comment_block = 1;
            } 
            else if(!comment_block && line.match(/^(\s+)?\/\//))
                classes.push("comment");
            else if(comment_block && line.match(/\*\/(\s*)?$/)){
                 classes.push("comment-block");
                 comment_block = 0;
            }
            else if(!comment_block && line.match(/^(\s+)?\<\!\-\-/)) 
                classes.push("comment");
            else if(comment_block) classes.push("comment-block");
            
            var $span = $("<span>").addClass(classes.join(" ")).text(line);
            $ol.append($("<li>").append($span));
        }
            
        return $ol;
    },

    // Ze.code(url, callback);// url code to callback
    // Ze(selector).code();// innerHTML to code
    // Ze(selector).code(url);// url code to innerHTML
    // Ze(selector).code(url, callback);// url code to innerHTML and callback
    code: function(url, callback){
        // 000, 001, 101, 010
        if(!this.selector && !callback || !url && callback) 
            throw "logical error";
        
        var els = this;

        // 100
        if(this.selector && !url && !callback)
            for(var i=0; i<this.length; i++){
                this[i].innerHTML = this._code(this[i].innerHTML)[0].outerHTML;
            }
        // 110
        else if(this.selector && url && !callback)
            this._loadXMLDoc(url, function(xhr, message){
                var code = els._code(xhr.responseText)[0].outerHTML;
                for(var i=0; i<els.length; i++) els[i].innerHTML = code;
            });
        // 011
        else if(!this.selector && url && callback)
            this._loadXMLDoc(url, function(xhr, message){
                callback(els._code(xhr.responseText)[0].outerHTML, xhr);
            });
        // 111
        else this._loadXMLDoc(url, function(xhr, message){
            var code = els._code(xhr.responseText)[0].outerHTML;
            for(var i=0; i<els.length; i++) els[i].innerHTML = code;
            callback(code, xhr);   
        });
        
        return this;
    },

    // Ze.eval(url);
    // Ze(script).eval();
    eval: function(url){},
    
    // Ze(sel).text();// innerHTML to text;
    // Ze(sel).text(url);// url text to innerHTML
    // Ze(sel).text(url, callback);// url text to innerHTML and callback
    text: function(url, callback){},

    append: function(url){
        var els = this;
        Ze.load(url, function(xhr, message){
            $(els).append(xhr.responseText);
        });
    },

    prepend: function(url){
        var els = this;
        Ze.load(url, function(xhr, message){
            $(els).prepend(xhr.responseText);
        });
    },

    appendCode:  function(url){
        var els = this;
        Ze.code(url, function(code, xhr){
            $(els).append(code);
        });
    },

    // Ze(selector).load(url);// url HTML to innerHTML
    // Ze.load(url, callback);// url HTML to callbacl
    load: function(url, callback){
        if(!url || typeof url != "string") return false;

        var els = this;

        this._loadXMLDoc(url, function(xmlhttp, message){
            // 110
            if(els.selector){
                for(var n=0; n < els.length; n++){
                    var el = els[n]; 
                    el.innerHTML = xmlhttp.responseText;

                    //TODO eval scripts to independent method                       
                    var arr = el.getElementsByTagName('script');
                    for (var n = 0; n < arr.length; n++) {
                        var script = arr[n].innerHTML;
//TOFIX delay to wait for loading HTML before evaluating javascript
                        setTimeout(function(){
                            eval(script);
                            //console.log(script);
                        }, 100);
                    }
                };
            }
            
            // 011, 111 
            if(typeof callback == 'function') callback(xmlhttp, message);
        });    
    },

    _loadXMLDoc: function(url, callback){
        var xmlhttp;
        // IE7+, Firefox, Chrome, Opera, Safari
        if(window.XMLHttpRequest) xmlhttp = new XMLHttpRequest();
        else xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");// IE6, IE5
        xmlhttp.onreadystatechange = function(){
            
            var message = "";
            if(xmlhttp.readyState == 4){
                switch(xmlhttp.status){
                    case 200:// ok               
                        message = "success";                    
                        break;
                    case 404:// not found
                    default:
                        message = "error";
                }
                if(typeof callback == "function") callback(xmlhttp, message);
                return xmlhttp;
            }
        }
        xmlhttp.open("GET", url, true);
        xmlhttp.send();
    }
});
