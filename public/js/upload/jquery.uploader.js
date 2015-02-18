//JavaScript
if(typeof jQuery.fn.uploader != 'undefined') {
	if(jQuery.fn.uploader == "jQuery Uploader"){
		throw "Uploader already loaded";
	}
	throw "Uploader already exists!";
}

/**
 * File Uploader
 * jQuery Plugin
 * Puts an input of the file type on the matched element
 * Ajax file upload uses FormDta if the browser suports it or 'HTTP_RAW_POST_DATA' if not.
 * @example $(el).uploader({ url:'/uploads', success: callback });
 */
jQuery.fn.uploader = function(data){
	// match set
	var $this = this;

	// no match
	if(!$this.length) {
		// create requested id (or #upload-files)
		var id = this.selector.match(/^#/) ? this.selector.replace('#', '') : 'upload-files';
		$this = $('<div>').attr('id', id).prependTo('body');
	}

	// append form with input field
	data.url = data.url || "upload.php";

	var $input = $('<input multiple>').attr({type:"file", name:"files"});

	var $submit = $('<button>').attr('type', 'submit');

	$('<form>')
		.attr({
			enctype: "multipart/form-data",
			action: data.url,
			method: "post"
		})
		.append($input)
		.append($submit)
		.appendTo($this);

	data.ajax = (typeof data.ajax != 'undefined') ? data.ajax : true;

	// hide submit button for ajax
	$submit.hide();//window.FormData

	// input change event
	$input.change(function(e){
		var len = this.files.length;
		var file = this.files[len-1];

		if(data.validate && !data.validate(file)) return;

		//-----------------------------------------------------------------
		// non-Ajax input file upload
		//-----------------------------------------------------------------
		// data = { ajax: false, ... };
		if(!data.ajax){
			$(this).parent().submit();
			return;
		}

		//-----------------------------------------------------------------
		// Ajax input file upload
		//-----------------------------------------------------------------
		// (multiple) file upload
		if(window.FormData){
			formdata = new FormData();
			formdata.append("file", file);//.append("files[]", file);
			$.ajax({
		        url: data.url,
		        type: "POST",
		        data: formdata,
		        processData: false,
		        contentType: false,
		        success: data.success || function(){}
		    });
			return;
		}
	    // file upload
	    $.ajax({
	        url: data.url + "/" + $(this).val(),
	        type: "POST",
	        data: file,
	        processData: false,
	        contentType: false,
	        success: data.success || function(){}
	    });
	});

	return $this;
};

jQuery.fn.uploader.name = "jQuery Uploader";
jQuery.fn.uploader.version = [0, 1, 0];
