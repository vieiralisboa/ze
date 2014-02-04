//if(Bar.app("Home")) throw "Barra 'Home' já existe!";

Bar.load('#header', function(bar, data){
	// callback
	Bar.alias("Frontgate", "Home");
});
