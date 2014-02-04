// Requires Frontgate Bbar
// Requires Situs Upload

(function(Minify) {

    // jQuery Plugin getCursorPosition
    $.fn.getCursorPosition = function() {
        var el = $(this).get(0);
        var pos = 0;
        
        if('selectionStart' in el) {
            pos = el.selectionStart;
        } 
        else if('selection' in document) {
            el.focus();
            var Sel = document.selection.createRange();
            var SelLength = document.selection.createRange().text.length;
            Sel.moveStart('character', -el.value.length);
            pos = Sel.text.length - SelLength;
        }
        return pos;
    };
	
	// Closer Compiler UI (JShrink on Linux)
	Remote.script('jquery.upload/min-index_0.0.2.js', function(){
		// Load template and add the Minify toolbox to the toolbar
		Remote.template('closure-compiler/app/template.html', function(template){
			
			// template
			$('body').append(template);	

			// Bar
			//Minify.toolbar.toolbox.App = Minify;
			//$('#header').bar(Minify.toolbar);
			$.get(Minify.json, function(data){
				// json parsing not required with jquery 2.0.0
				if(parseInt($.fn.jquery) > 1) Minify.toolbar.toolbox = data;
				else Minify.toolbar.toolbox = JSON.parse(data);

				Minify.toolbar.toolbox.App = Minify;
				$('#header').bar(Minify.toolbar);

				// File Uploader
				$('#file-upload').uploader(Minify.uploader);

				// uploader form
				$('#file-upload form').css('display','inline');
				
				// uploader input
				$('#file-upload form input')
					.css({
						color: 'rgba(55,55,55,0.9)',
		        		'text-shadow': '0 0 3px rgb(255,255,255)'
		        	})
		        	.attr('accept', 'application/x-javascript');//, text/javascript

				
				//TODO set css/attr in template
				$('#code-output').hide().attr('readonly','readonly');
				
				// initial state and events for textarea
				$('#code-input').show().focus().val('//JavaScript\n')
				.keydown(function(event){
					 if( event.which == 9 ) {
						event.preventDefault();
						var position = $(this).getCursorPosition();
						Minify.insertAtCursor("\t");
						Minify.setCaretToPos(this, position+1);
						//document.getElementById("code-input"), 8);
					}
				});
				
				// initial state for toolbox buttons 
				$('#download-file, #minify-view').hide();
				
				// select code input 
				$('#uglify-view').click();
			});
		});
	});
	
})({
	VERSION: [0, 2, 7],

	json: Remote.href("jquery.bar/js/bar.Minify.json"),
	
	setSelectionRange: function(input, selectionStart, selectionEnd) {
		if (input.setSelectionRange) {
			input.focus();
			input.setSelectionRange(selectionStart, selectionEnd);
		}
		else if (input.createTextRange) {
			var range = input.createTextRange();
			range.collapse(true);
			range.moveEnd('character', selectionEnd);
			range.moveStart('character', selectionStart);
			range.select();
		}
	},

	setCaretToPos: function(input, pos) {
		this.setSelectionRange(input, pos, pos);
	},

	insertAtCursor: function(text) {
		var field = document.getElementById("code-input");
		if (document.selection) {
			field.focus();
			sel = document.selection.createRange();
			sel.text = text;
		}
		else if (field.selectionStart || field.selectionStart == '0') {
			var startPos = field.selectionStart;
			var endPos = field.selectionEnd;
			field.value = field.value.substring(0, startPos)
			+ text
			+ field.value.substring(endPos, field.value.length);
		} 
		else {
			field.value += text;
		}
	},

	panelToggle: function(toggle){
		//TODO events
		if(toggle){
    		$('#closer-compiler').fadeIn();
    		$('#minify-icon').css('opacity','.9');
    	}
    	else {
    		$('#closer-compiler').fadeOut();
    		$('#minify-icon').css('opacity','.4');
    	}
	},

	toolbar: {
		items: [{
		    el: "img",
		    css:{
				"vertical-align": "middle",
				cursor: "pointer",
                margin: "0 5px"
		    },
		    attr:{
		        src: Remote.href('/graphics/icons/Icons/Icons/Document2.png'),
		        title: 'JShrink UI',
		        id: 'minify-icon'
		    },
		    click: function(){
		        if(!$('#closer-compiler').is(':visible')) 
		        	location.hash = "#Minify";
		        else location.hash = "#Home";

		        //prevent hash change
		        return false;
		    }
		}],
		callback: function(bar){			
			// Hash Routes
		    //-------------------------------------------------------------------------  
		    bar.$bar.find('a[href="#Minify/upload"]').click(function(hash){
				$('#file-upload').find('input').first().click();
				return false;
		    });

		    // upload js script
		    Frontgate.router.on('#Minify/upload', function(hash){
				$('#file-upload').find('input').first().click();
				location.hash = "Minify";
		    });
		    
		    // download javascript file
			Frontgate.router.on('#Minify/download', function(hash){
				if($('#download-file').attr('href')){
					window.location.href = $('#download-file').attr('href');
				}
				location.hash = "Minify";
		    });
		    
		    // switch to JavaScript code
			Frontgate.router.on('#Minify/javascript', function(hash){
				$('#uglify-view').parent().siblings().find("a[data-toggle='code']").removeClass("selected");
				$('#uglify-view').addClass("selected");
				if($('#code-input').is(':visible')) return false;
				else{
					$('#code-output').hide();
					$('#code-input').show();			
				}	
				location.hash = "Minify";
		    });
		    
		    // switch to minified code
			Frontgate.router.on('#Minify/minified', function(hash){
				$('#minify-view').parent().siblings().find("a[data-toggle='code']").removeClass("selected");
				$('#minify-view').addClass("selected");
				if($('#code-input').is(':visible')){					
					$('#code-input').hide();
					$('#code-output').show();
				}
				else return false;
				location.hash = "Minify";
		    });

		    // compile code
			Frontgate.router.on('#Minify/compile', function(hash){
				$.ajax({
				    url: Situs.href('/closure_compiler/compile'), 
				    type: "POST",
				    data: $("#code-input").val(),  
				    success: function (res){   
				        //var res = JSON.parse(res);			
						$("#code-input").val(res.input).hide();
						$("#code-output").val(res.output).show();
						$('#minify-view').show().click();
						$('#download-file').show();
				        
				        var file = Situs.hrefAuth('/download/min-' +  res.file);

				        document.getElementById("download-file")
				        	.setAttribute('href', file); 
				    }
				});
				location.hash = "Minify";
		    });
			
			// clear code
			Frontgate.router.on('#Minify/clear', function(hash){
				$('#code-input, #code-output').val('');
				$('#download-file, #minify-view').hide();
				$('#uglify-view').click();
				$('#code-input').focus().val('//JavaScript\n');
				location.hash = "Minify";
		    });

			
			// closer-compiler Toggle
			//Frontgate.Apps("Home")
			Bar.app("Minify").navigator.subscribeEvent('click', function(route){
				Frontgate.Apps("Minify").panelToggle(route.res.input == '#Minify');
			});

			$('#closer-compiler')
			.css({
				top: $('#header').outerHeight(),
				"background": "rgba(0,0,0,.5)"
			});
			
			$('#closer-compiler textarea')
			.css({
				width: $('#header .toolbar').outerWidth(),
				//"background": "white"
				opacity: 1,
				//border: "solid rgb(222,222,222) 1px",
				//"border-top": "none",
				"box-shadow":"0 0 7px rgba(0,0,0,.5)"
			});

			$('#minify-icon')//.hide()
            .parent()
            .css({
                "float":"right",
                "line-height": "32px",
                opacity: .9,
                margin: "0 5px"
            });
		}
	},

	uploader: {
		validate: function(file){
			//console.log(file.type);
			//console.log(file.name);
			//console.log(file.lastModifiedDate);	
			var info = function(text, cssClass, t) {
			    text = text || '';
			    if(!text){
			        $('#closer-compiler-myUI')
			            .attr({
			                title: 'Closer Compiler UI '+VERSION,
			                'class': 'toolbar-item'
			            });
			        return;
			    } 

			    switch(cssClass){
			        case 'alert'://blue
			        case 'error'://red
			        case 'warnning'://orange
			        case 'info'://green
			            break;        
			        default:
			            if(typeof cssClass == 'number'){
			                t = cssClass;
			                cssClass = 'info';
			            }
			            else if(typeof cssClass == 'undefined'){
			                t = 0;
			                cssClass = 'info';
			            }
			    }

			    if(t || 0) setTimeout(function(){ info(); }, t);
			    
			    $('#closer-compiler-myUI').attr('title', text).addClass(cssClass);
			    
			    return;
			};

			// verify that the file is a JavaScript file
			if(!file.name.match(/.js$/) && file.type != 'application/x-javascript'){
				return info('wrong file type ( '+(file.type || '?')+' )', 'error', 10000);
			}
				
			// reject large files (> 1MB)
			if(file.size/1024 > 1000){
				return info('file is too big ('+Math.round(file.size/1024, 1)+' KB)', 'error', 10000);
			}

			return true; 
		},
		
		url: Situs.href('/closure_compiler'), 
		
		success: function (res){   
	        //var res = JSON.parse(res);

			$("#code-input").val(res.input).hide();
			$("#code-output").val(res.output).show();
			$('#minify-view').show().click();
			$('#download-file').show();

	        $("#file-upload form input").val("");
	        
	        var file = Situs.hrefAuth('/download/min-' + res.file);

	        document.getElementById("download-file")
	        	.setAttribute('href', file); 
	    }
	}
});
