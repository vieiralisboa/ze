(function(Test){
	var toolbarItems = [];

	// Yahoo!
	toolbarItems.push({
		text: 'Yahoo!',
		attr:{
			href: 'http://yahoo.com'
		}
	});

	// Hello
	toolbarItems.push({
		text: 'Zé',
		click: function(){
			alert('Hello, you clicked me?');
		}
	});

	$('#header').toolbar({
		items: toolbarItems,
		toolbox: {
			App: Test,
			name: 'Test',
			items: [
			{ 
				text: 'José',
				attr: {
					href: '#!Zé'//"toolbar/js/Zé.js"
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
			console.log('HEADER', toolbar);
			console.log('HEADER-ITEMS', toolbar.items());
			
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
					attr: {	href: 'http://situs.pt'	}
				}]
			});
		}
	});

})
({

});