//
// Bar tests
//
// author: José Vieira Lisboa
// email: jose.vieira.lisboa@gmail.com
// url: http://sítio.pt/Bar
//

$("body").css("background-color", "rgb(245,245,245)");

$.ajaxSetup({ cache: true });

//$.getScript("https://situs.pt/frontgate/and/router", function() {
$.getScript("js/frontgate/frontgate-0.3.9.js", function() {
    //Situs = new Frontgate.Location({ hostname: "situs.pt", protocol:  "https:" });
    //Situs.sync("lib/jquery-ui","lib/topzindex","lib/panel", "lib/_", "lib/bar", function(script) {
    Frontgate.sync("js/required/jquery-ui-1.10.2.custom.min.js", "js/required/jquery.topzindex.min.js", "js/required/underscore-min.js",
        "js/frontgate/frontgate.router-1.1.1.js", "js/panel.js", "js/bar.js", function(script) {

        // Frontgate router starts to listen to hashchange events
        Frontgate.router.start();

        (function(Test){
            //TODO .z-index-selected class for panels
            // the .z-index-selected panel moves with the arrow buttons

            $("#image").bar({
                items: [{
                    el:"img",
                    attr:{
                        src: Frontgate.href("graphics/Bar.png")
                    }
                }]
            })
            .css("position", "absolute")
            .width("auto")
            .css({
                top: "50%"
            })
            .panel()
            .css("padding", 0)
            .css("cursor","move")
            .find('ul.panel-header').hide();

            // try create bar without arguments
            //----------------------------------
            $("<div>").bar();

            // basic bar
            //-----------
            $("#basic").bar({
                items:[{ text: "Basic" }],
                toolbox: {
                    name: "Bar",// to recall the bar: Frontgate.Apps("Bar");
                    items: [
                    { text: "Bar" },
                    { text: "is" },
                    { text: "anything" },
                    { text: "you" },
                    { text: "want" },
                    { text: "it" },
                    { text: "to" },
                    { text: "be" }],
                    validate: function(item){
                        console.log("#basic toolbox item ", item);
                        if(item.text == "Bar") item.css = { color: "pink" };
                        if(item.text == "anything") item.css = { color: "lime" };
                        if(item.text) item.text = "{ "+item.text+" }";
                    }
                },
                callback: function(bar){
                    console.log("#bar.bar", bar);
                    bar.toolbar.$bar.css("cursor","s-resize");
                }
            })
            .css("opacity", .9)
            //.width("auto")
            .panel()
            .css("padding", 0)
            .find('ul.panel-header').hide();

            // add a toolbox
            //---------------
            $("#basic").bar({
                toolbox: {
                    App: {},
                    name: "Ze",
                    items:[{
                        text: "José Daniel",
                    }]
                }
            });

            // add yet another toolbox
            //-------------------------
            $("#basic").bar({
                toolbox: {
                    name: "The Thee Stogees",
                    items: [{
                        text:"Larry",
                        attr:{
                            title: "Larry Fine",
                            href: "#LarryFine"
                        }
                    },
                    {
                        text:"Curly",
                        attr:{
                            title: "Curly Joe",
                            href: "#CurlyJoe"
                        }
                    },
                    {
                        text:"Moe",
                        attr:{
                            title: "Moe Howard",
                            href: "#MoeHoward"
                        },
                        click: function(){
                            // returning false prevents default
                            // will not set location.hash
                            alert("preventing default");
                            return false;
                        }
                    }]
                }
            });

            // create empty bar
            //------------------
            $("#empty").bar({
                callback: function(bar){
                    console.log("Empty Bar", bar);
                }
            }).css("background", "pink").height(100);

            // minimal bar
            //-------------
            $("#bar").bar({
                items:[{
                    text: "Bar",
                    css: {
                        //"font-family": "'Open Sans', Helvetica, Arial, 'Liberation Sans', sans-serif",
                        "font-weight":"800",
                        "font-style": "normal",
                        "font-size":"14px"
                    },

                    attr: { href: "#Bar" },
                    click: function(){ alert("Bar") }
                },
                {
                    text: "Fork Ze on GitHub",
                    css: {
                        "font-weight":"400",
                        "font-style": "normal"
                    },

                    attr: {
                        id: "ze-github",
                        href: "https://github.com/vieiralisboa/ze"
                    }
                }],
                callback: function(bar){
                    console.log("#minimal.bar", bar);
                    $("#ze-github").parent().css("float", "right");
                }
            });

            //==================
            // adding bar items
            //==================

            // using the Bar callback on a toolbar
            //-------------------------------------
            $("#basic").bar({
                callback: function(bar){
                    // toolbar
                    bar.item({ text: "Bar" });
                }
            });

            // using the Bar callback on a toolbox
            //-------------------------------------
            $("#basic").bar({
                toolbox:{ name: "Ze" },
                callback: function(bar){
                    // toolbox (toolbar inside toolbar)
                    bar.toolbox.item({ text: "dos Reis" });
                }
            });

            // using jQuery wrapper on a toolbar
            //-----------------------------------
            $("#basic").bar({ items:[{ text:"is" }] });

            // on a toolbox
            $("#basic").bar({
                toolbox:{
                    name: "Ze",
                    items:[{ text:"Vieira" }]
                }
            });

            // using the library ...
            //-----------------------
            // on a toolbar
            Bar.bar($("#basic")).item({ text: "fullWonder" });
            // also on a toolbox
            Bar.app("Ze").toolbar.item({ text: "Wonderfull" });
            // or on a toolbox //TODO resolve ambiguous toolbar/toolbox relation
            Bar.app("Ze").toolbox.item({ text: "Lisboa" });
            // or on the navigator
            Bar.app("Ze").navigator.item({
                text: "Reload",
                click: function(){ location.reload(); },
                attr:{ id: "reload" },
                css:{ cursor: "pointer" }
            });

            $("#reload").parent().css("float", "right");

            // Finally, using the App
            Frontgate.Apps("Ze").bar.toolbar.item({ text: "!" });
            Frontgate.Apps("Ze").bar.toolbox.item({ text: ";-)" });

            /* DEMO
            //=========================
            // using the jQuery plugin
            //=========================
            // add items to a toolbar
            //------------------------
            if(0) $("#basic").bar({
                items:[{
                    text: "Reload",
                    click: function(){ location.reload(); },
                    attr:{ id: "reload" },
                    css:{ cursor: "pointer" }
                }],
                callback: function(bar) {
                    // do something after adding toolbar item(s)
                    $("#reload").parent().css("float", "right");
                }
            });
            // add item to a toolbox
            //-----------------------
            if(0) $("#basic").bar({
                toolbox:{
                    name: "Compostos",
                    items:[{ text:"Adicionar Rendimento" }]
                }
            });
            // ... with callback
            //-------------------
            if(0) $("#basic").bar({
                toolbox:{
                    name: "Compostos",
                    items: [{ text:"Toolbox_A1" }],
                    callback: function(bar){
                        // do something after adding toolbox item(s)

                        // toolbox is a toolbar inside a toolbar
                        bar.toolbox.item({ text:"Toolbox_A2" });
                    }
                }
            });

            //=======================
            // using the Bar library
            //=======================
            // add item to a toolbar
            //-----------------------
            if(0) Bar.bar($("#basic")).item({ text: "Bar-1" });
            // add item to a toolbox
            //-----------------------
            if(0) Bar.app("Compostos").toolbar.item({ text: "Bar-2" });
            // add item to the toolbar navigator (toolbox tabs)
            //--------------------------------------------------
            if(0) {
                Bar.app("Compostos").navigator.item({
                    text: "Yo!",
                    click: function(){ alert("Yo!"); },
                    css:{ cursor: "pointer" },
                    attr: {id: "yo"}
                });
                $("#yo").parent().css("float","right");
            }

            //=========================
            // using the Frontgate App
            //=========================
            // add item to the toolbar
            //-------------------------
            if(0) Frontgate.Apps("Compostos").bar.toolbar.item({ text:"App-1" });
            // add item to the toolbox
            //-------------------------
            if(0) Frontgate.Apps("Compostos").bar.toolbox.item({ text:"App-2" });

            $("#hi").bar({
                items: [{ text: "hello" }],
                toolbox:{
                    items: [{ text: "hello2" }],
                    name: "Hell"
                }
            }).bar({
                items: [{ text: "hello2" }],
                toolbox:{
                    items: [{ text: "hello22" }],
                    name: "Hell2"
                }
            });
            */

            //TODO verify Bar chainning
        })
        ({
            toolbar: {
                items: [{
                    text: 'Yahoo!',
                    attr:{
                        href: 'http://yahoo.com'
                    }
                },
                {
                    text: 'Ze',
                    click: function(){
                        alert('Hello, you clicked me?');
                    }
                }],
                toolbox: {
                    //App: Test,
                    name: 'Start',
                    items: [
                    {
                        text: 'José',
                        attr: {
                            href: '#!Ze'//"toolbar/js/Zé.js"
                        }
                    },
                    { text: 'Daniel' },
                    { text: 'dos Reis' },
                    { text: 'Vieira' },
                    { text: 'Lisboa' }]
                },
                callback: function(toolbar){
                    console.log('HEADER', toolbar, toolbar.items());
                    // update $li
                    toolbar.items()[1].$li.css('float','left');
                    // update $el
                    toolbar.items()[1].$el
                    .css({
                        'font-family': 'Georgia, serif',
                        'font-size': '24px',
                        'font-weight': '800',
                        'color': 'rgb(90, 90, 90)'
                    })
                    .hover(function(){ $(this).css('color', ''); },
                        function(){ $(this).css('color', 'rgb(104,104,104)'); });
                    // add item this toolbar
                    toolbar.$toolbar.toolbar({
                        items: [{ text: 'situs.pt', attr: { href: 'http://situs.pt' } }]
                    });
                }
            }
        });
    });
});
