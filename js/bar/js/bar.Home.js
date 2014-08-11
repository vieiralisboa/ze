if(Bar.app("Início")) throw "Barra já existe!";

/*/LOADING BAR
$.get("http://hosts.medorc.org/xn--stio-vpa/json/bar.Home.json"),
        function(data){

    //if(Bar.app(data.name)) throw "Barra já existe!";

    $('#header').bar({
		toolbox: data,
        callback: function(bar){
            
            //(auto) load requested addon
            (function(startHash){
                if(startHash && startHash != '#!Home' && startHash != '#!Início'){
                    // gets bar addon (or loads addon script) before callback
                    Bar.getBar(Bar.urls(startHash), function(error, addon){
                        // error getting addon
                        if(error) throw error + " error getting addon " + startHash + " @bar.Home";
                        // route to addon (select addon tab)
                        Frontgate.router.route(addon.href);
                        //console.log('Bar.route', bar, route);
                    });
                }
            })(Remote.attr("requestHash"));

            // mostrar item IE apenas se o utilizador for "daniel"
            if(Situs.attr().user == "daniel") $("#isec-ei").show();
            Situs.subscribeEvent('userChange', function(attr){
                if(attr.user == "daniel") $("#isec-ei").show();
                else $("#isec-ei").hide();
            });
        }
	});
});
/*/
//AUTO LOADING BAR
Bar.load('#header', function(bar, data){

    Frontgate.router.on("#Home", function(hash){
        location.hash = "Início";
    });

    // mostrar item IE apenas se o utilizador for "daniel"
    if(Frontgate.attr().user == "daniel") $("#isec-ei").show();
    Frontgate.subscribeEvent('userChange', function(attr){
        if(attr.user == "daniel") $("#isec-ei").show();
        else $("#isec-ei").hide();
    });

}, FILE);//*/

//------------------------------------------------------------------
// BUG:
// when addon items are not hash banged (#!ToolboxItem)
// the tab is added to the navigator but the toolbox is not selected
//------------------------------------------------------------------
