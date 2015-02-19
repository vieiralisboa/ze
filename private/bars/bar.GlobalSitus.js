if(Bar.app("Home")) throw "Barra 'Home' já existe!";
//------------------
// Auto loading bar
//------------------

//Bar.load(selector, callback, FILE);
Bar.load('#header', function(bar, data) {
	Bar.alias("GlobalSitus", "Home");
}, FILE);
