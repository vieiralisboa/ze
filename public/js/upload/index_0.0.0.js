//JavaScript

if(typeof jQuery.fn.uploader != 'undefined') 
	console.log('jQuery.fn.uploader already exists!');
else 

/**
 * File Uploader
 * jQuery Plugin
 * version 0.0.0
 * Puts an input of the file type on the matched element
 * Ajax file upload uses FormDta if the browser suports it or 'HTTP_RAW_POST_DATA' if not.
 * @example $(el).uploader({ url:'/uploads', success: callback });
 */
jQuery.fn.uploader = function(data){
	var matchSet = this;
	
	// no match
	if(!matchSet.length){
		$('<div>').attr('id','upload-files').append($('<h1>').html('Upload Files')).prependTo('body');
		matchSet = $('#upload-files');
	}
	
	// append form with input field
	data.url = data.url || "upload.php";
	$('<form>').attr({ enctype:"multipart/form-data", action: data.url, method: "post"})
		.append('<input type="file" name="files" id="files" multiple />')
		.append('<button type="submit" id="btn">Upload File</button>').appendTo(this);

	var ajax = data.ajax || true;

	// hide submit button for ajax 
	$("#btn").hide();//window.FormData	

	// input change event
	$("input[type=file]").change(function(e){
		
		var len = this.files.length;
		var file = this.files[len-1];
		
		if(data.validate) if(!data.validate(file)) return;

		/*
		 * input File Upload
		 * non-Ajax file upload
		 * $(el).uploader({ ajax: false });
		 */
		if(!ajax){
			$('#files').parent().submit();
			return;
		}

		/*
		 * FormData Upload
		 * use formData to upload multiple files
		 */ 
		if(window.FormData){
			formdata = new FormData(); 
			//formdata.append("files[]", file);
			formdata.append("file", file);
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

	    /*
		 * Ajax File Upload
		 */
	    $.ajax({
	        url: data.url + "/" + $(this).val(),
	        type: "POST",  
	        data: file, 
	        processData: false,  
	        contentType: false,  
	        success: data.success || function(){}
	    });
	});

	return matchSet;
}