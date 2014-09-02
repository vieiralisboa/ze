(function(b){window.Bar=b;$.fn.bar=function(a){if(!a)return console.error("Bar requires data"),this;if(!this.length&&!this.selector.match(/^\#/))return this;if(this.hasClass("bar-container")){console.log("element is already a bar",this);var c=this.find(".bar").first().attr("data-bar"),d=b.bars[parseInt(c)];a.items&&d.items(a.items);if(!a.toolbox)return a.callback&&a.callback(d),this;if(!a.toolbox.name)throw"a toolbox name is required";c=b.names(a.toolbox.name)["data-b64"];if(b.app[c])return console.log(a.toolbox.name,
"toolbox is already set"),a.toolbox.items&&b.app[c].toolbox.items(a.toolbox.items),a.callback&&a.callback(b.app[c]),this;b.toolbox(d,a.toolbox)&&a.callback&&a.callback(d,a);return this}d=b.toolbar(this,a);a.toolbox&&(c=b.toolbox(d,a.toolbox));a.callback&&a.callback(c||d,a);return $(this.selector)};console.info(b.name,b.version.join("."))})({name:"Bar",version:[0,7,0],bars:[],bar:function(b){b=b.find(".bar").first().attr("data-bar");if(this.bars[b])return this.bars[b]},toolbar:function(b,a){b.length||
(b=$("<div>").attr("id",b.selector.substring(1)).prependTo("body"));var c=this.bars.length;this.bars[c]=new this.Bar;this.bars[c].$bar.attr("data-bar",c).appendTo(b.addClass("bar-container"));a.validate&&this.bars[c].subscribeEvent("addItem",a.validate);a.items&&this.bars[c].items(a.items);return this.bars[c]},navigator:function(b){var a=this.bars.length;this.bars[a]=new this.Bar;this.bars[a].$bar.attr("data-bar",a).addClass("navigator");b.$bar.append(this.bars[a].$bar)},navigatorTab:function(b){b.navigator.$bar.append(b.toolbox.$bar);
b.navigator.item({text:b["data-text"],attr:{href:b.href,title:b["data-name"]},click:function(){console.log("Route < Click! Route! It Works!",b)}});Frontgate.router.on(b.href,function(a){b.navigator.publishEvent("click",a);b.toolbox.publishEvent("click");b.navigator.$bar.children("ul").find("li.selected").removeClass("selected");a=a.res.input;b.navigator.$bar.children("ul").find('a[href="'+a+'"]').parent().addClass("selected");b.toolbox.$bar.siblings(".selected").removeClass("selected");b.toolbox.$bar.addClass("selected")});
Frontgate.router.route(b.href)},toolbox:function(b,a){if(!a.name)throw"toolbox name is required";b.$bar.find(".navigator").length||this.navigator(b);var c=b.$bar.find(".navigator").attr("data-bar");if("undefined"==typeof c)throw"failed to create navigator";var d=this.bars.length;this.bars[d]=new this.Bar;this.bars[d].$bar.attr("data-bar",d).addClass("toolbox");var e=this.names(a.name);_.extend(e,{toolbar:b,toolbox:this.bars[d],navigator:this.bars[parseInt(c)]});this.app(e);a.validate&&this.bars[d].subscribeEvent("addItem",
a.validate);a.items&&e.toolbox.items(a.items);this.navigatorTab(e);a.App&&(a.App.bar=e,Frontgate.Apps(e["data-name"],a.App));if(a.on)for(var g in a.on)e.toolbox.subscribeEvent(g,a.on[g]);return e},Bar:function(b){var a=$("<ul>").addClass("bar-items"),c=[];this.$bar=$("<div>").addClass("bar").append(a);this.item=function(b){this.publishEvent("addItem",b);var e=c.length;c.push(new this.Item(b));a.append(c[e].$li.attr("data-item",e));return this};this.items=function(a){if(!a)return c;for(var b in a)this.item(a[b]);
return this};this.Item=function(a){var b={};this.$li=$("<li>").addClass("bar-item");this.$el=a.el?$("<"+a.el+">"):$("<a>");_.extend(b,a);Frontgate.set(this.$el,b);this.$li.append(this.$el);return this};Frontgate._on(this);this.items(b);return this},names:function(b){var a=b.toLowerCase().split(" "),c="",d;for(d in a)var e=a[d],c=c+(e.charAt(0).toUpperCase()+e.slice(1));return{"data-text":b,"data-name":c,"data-file":"bar?"+c,href:"#"+c,"data-b64":Frontgate.b64(c)}},urls:function(b){if(!b)return console.error({method:"url",
error:"bad url",url:b}),!1;var a=b.match(/^\#(\!)?([\w\-\u00C0-\u00ff]*)$/);return a?{name:a[2],script:"situs/js/bar?%bar%".replace("%bar%",a[2]),hash:a.input,match:a}:(a=b.match(/^situs\/js\/bar\?([\w\-\u00C0-\u00ff]*)$/i))?{name:a[1],script:a.input,hash:"#!%bar%".replace("%bar%",a[1]),match:a}:!1},alias:function(b,a){if("string"==typeof a){var c=Frontgate.b64(a),d=Frontgate.b64(b);if(this.app[c])return this.app[d]=this.app[c],Frontgate.Apps(b,Frontgate.Apps(a)),this.app[c];throw"no such app "+a;
}},app:function(b){if("string"==typeof b){var a=Frontgate.b64(b);if(this.app[a])return this.app[a]}this.app[b["data-b64"]]&&console.error("bar with the same name already exists");this.app[b["data-b64"]]=b},_requestHash:null,load:function(b,a,c,d){c=c||BAR_JSON;$.get(Remote.href(c),function(c){c=1<parseInt($.fn.jquery)?c:JSON.parse(c);var d={items:[],toolbox:c,callback:a};c.App=d;$(b).bar(d)});delete window.BAR_JSON;delete window.BAR_NAME},getBar:function(b,a){if(!b.name)return a({error:"bad url",
url:b.script}),!1;var c=Frontgate.b64(b.name);if(Bar.app[c])location.hash=Bar.app[c].href,a&&a(!1,this.app[c]);else{var d=this.autoLoad.location.href(b.script);$.getScript(d,function(b,c,f){if("success"!=c)throw"error loading "+d;a&&a(b,c,f)})}return!0},autoLoad:{location:null,start:function(b){if(this.started||!Frontgate)return!1;this.started=!0;this.location=b||Frontgate;Frontgate.router.onNotFound=function(a,b,d,e){Bar.getBar(Bar.urls(a),function(g,f){!g&&f&&f.href&&Frontgate.router.route(f.href);
"function"==typeof e&&e(a,b,d,f||0)})}},stop:function(){}},styles:{href:"jquery.bar/css/bar.css",load:function(b){b.stylesheet(this.href)}},start:function(b){this.autoLoad.start(b);return this},route:function(b,a){if(this.autoLoad.started)Frontgate.router.route(b,a);else throw"AutoLoad is disabled";return this}});