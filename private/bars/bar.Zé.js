Bar.load('#header', function(bar, addon){
	$("#situs").click(function(){
		alert("Hello");
	});

	Frontgate.router.on("#ZéSitus", function(){
		alert("Hello2");
	});
});
