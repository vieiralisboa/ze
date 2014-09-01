$("body").css("background-color","rgb(245,245,245)")

$.ajaxSetup({
	cache: true
});

$.getScript("https://situs.pt/frontgate/and/router", function(){

	Situs = new Frontgate.Location({
	    hostname: "situs.pt",
	    protocol:  "https:"
	});

	Situs.sync("lib/jquery-ui","lib/topzindex","lib/panel",
		"lib/_", "lib/bar", function(script){

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
			//---------------------------------------------------------------------
			$("<div>").bar();

			// basic bar
			//---------------------------------------------------------------------
			$("#basic").bar({
				items:[{
					text: "Basic"
				}],
				toolbox: {
					name: "Bar",
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
						if(item.text == "Bar"){
							item.css = {
								color: "pink"
							};
						}
						if(item.text == "anything"){
							item.css = {
								color: "lime"
							};
						}
						if(item.text){
							item.text = "{ "+item.text+" }";
						}
					}
				},
				callback: function(bar){
					console.log("#bar.bar", bar);
					bar.toolbar.$bar.css("cursor","move");
				}
			})
			.css("opacity", .9)
			//.width("auto")
			.panel()
			.css("padding", 0)
			.find('ul.panel-header').hide();

			// add a toolbox
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
			//---------------------------------------------------------------------
			$("#empty").bar({
				callback: function(bar){
					console.log("Empty Bar", bar);
				}
			}).css("background", "pink").height(100);

			// minimal bar
			//---------------------------------------------------------------------
			$("#bar").bar({
				items:[{
					text: "Bar",
					css: {
						//"font-family": "'Open Sans', Helvetica, Arial, 'Liberation Sans', sans-serif",
						"font-weight":"800",
						"font-style": "normal",
						"font-size":"14px"
					},

					attr: {
						href: "#Bar"
					},
					click: function(){
						alert("Bar");
					}
				}],
				callback: function(bar){
					console.log("#minimal.bar", bar);
				}
			});

			//---------------------------------------------------------------------
			// adding bar items
			//---------------------------------------------------------------------

			// with the Bar callback
			// on a toolbar:
			$("#basic").bar({
				callback: function(bar){
					bar.item({
						text: "Bar"
					});
				}
			});
			// on a toolbox:
			$("#basic").bar({
				toolbox:{
					name: "Ze"
				},
				callback: function(bar){
					bar.toolbox.item({
						text: "dos Reis"
					});
				}
			});

			// with jQuery wrapper
			// on a toolbar:
			$("#basic").bar({
				items:[{
					text:"is"
				}]
			});

			// on a toolbox:
			$("#basic").bar({
				toolbox:{
					name: "Ze",
					items:[{
						text:"Vieira"
					}]
				}
			});

			// with the Bar helpers
			// toolbar:
			Bar.bar($("#basic")).item({
				text: "fullWonder"
			});

			// also on a toolbox:
			Bar.app("Ze").toolbar.item({
				text: "Wonderfull"
			});

			// an toolbox:
			Bar.app("Ze").toolbox.item({
				text: "Lisboa"
			});

			// or the navigator
			Bar.app("Ze").navigator.item({
				text: "Reload",
				click: function(){
					location.reload();
				},
				attr:{
					id: "reload"
				},
				css:{
					cursor: "pointer"
				}
			});

			$("#reload").parent().css("float", "right");

			// Finally, using the App
			Frontgate.Apps("Ze").bar.toolbar.item({ text: "!" });
			Frontgate.Apps("Ze").bar.toolbox.item({ text: ";-)" });
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
					{
						text: 'Daniel'
					},
					{
						text: 'dos Reis'
					},
					{
						text: 'Vieira'
					},
					{
						text: 'Lisboa'
					}]
				},

				callback: function(toolbar){
					console.log('HEADER', toolbar, toolbar.items());

					// update $li
					toolbar.items()[1].$li
					.css('float','left');

					// update $el
					toolbar.items()[1].$el
					.css({
						'font-family': 'Georgia, serif',
						'font-size': '24px',
						'font-weight': '800',
						'color': 'rgb(90, 90, 90)'
					})
					.hover(
						function(){
							$(this).css('color', '');
						},
						function(){
							$(this).css('color', 'rgb(104, 104, 104)');
					});

					// add item this toolbar
					toolbar.$toolbar.toolbar({
						items: [{
							text: 'situs.pt',
							attr: {
								href: 'http://situs.pt'
							}
						}]
					});
				}
			}
		});
	});
});
