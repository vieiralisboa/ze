if(typeof Math.guid == 'undefined') Math.guid = function(){
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
    return v.toString(16);
  }).toUpperCase();      
};

jQuery.fn.log = function(options){
	
	// default values
	var defaults = {
		text: "There's nothing to log.",
		n: 15,
		cssClass: 'log'
	};
	
	// the parameter is a log string
	if(typeof options == 'string'){
		options = { text: options };
	}	
	
	var matchSet  = this;
	
	// merge the defaults and options
	var options = $.extend(defaults, options);
	
	// create log container if match set is empty	
	if(!matchSet.length){
		$('<div>')
			.attr('id','log')
			.css({
				display:'block',
				position: 'absolute',
				cssFloat: 'right',
				width:'300px',
				right:'0px',
				bottom: '0px',
				//marginTop: '30px',
				//top: '0px',
				overflow: 'auto',
				//border: 'solid 1px white',
			})
			.appendTo('body');	
	
		if($('#log')) {
			$('#log').log('created log div');
			matchSet = $('#log');
		}
	}
	
	// iterate through the matched and return it
	return matchSet.each(function(){
		
		var id = Math.guid();
		
		//if(typeof console != 'undefined') console.log(options.text);
		
		// append log to matched set
		$('<div>')
			.attr({'id':id, title:id})
			.addClass( options.cssClass )
			.text( options.text )//(new Date()).toUTCString() +' '+
			.appendTo(this)
			.slideDown();			
				
		setTimeout(function(){
			//if(console) console.log('removing log '+id);
			var log = $('.'+options.cssClass+'#'+id);
			log.hide('slow',function(){
				log.remove();
			});
		},60000);
		
		// remove older log
		if( $('.'+options.cssClass).length > options.n ) $('.'+options.cssClass+':eq(0)').remove();
		
		// apply higher tranparency to older logs
		$('.'+options.cssClass).each(function(index) {
			$( this ).css('opacity', 1-(($('.'+options.cssClass).length-index-1)/options.n));
		});
	});	
};
