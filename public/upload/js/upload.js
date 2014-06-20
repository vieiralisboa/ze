//!JavaScript upload.js

if(typeof jQuery.fn.uploader != 'undefined') throw "jQuery.uploader already exists!";

/**
 * File Uploader
 * jQuery Plugin
 * Puts an input of the file type on the matched element
 * Ajax file upload uses FormDta if the browser suports it or 'HTTP_RAW_POST_DATA' if not.
 * @usage $(el).uploader({ url:'/uploads', success: callback });
 */
(function(uploader){
jQuery.fn.uploader = function(data){
	var matchSet = this;
	
	// no match
	if(!matchSet.length) {
		// create requested id (or #upload-files)
		var id = this.selector.match(/^#/) ? this.selector.replace('#', '') : 'upload-files';
		matchSet = $('<div>').attr('id', id).prependTo('body');
	}
	
	// append form with input field
	data.url = data.url || "upload.php";
	
	var fileInput = $('<input multiple>').attr({ 
		type: "file", 
		name: "files"
	});

	var fileSubmit = $('<button>').attr('type', 'submit');

	$('<form>')
		.attr({ 
			enctype: "multipart/form-data", 
			action: data.url, 
			method: "post"
		})
		.append(fileInput)//.append('<input type="file" name="files" id="files" multiple />')
		.append(fileSubmit)//.append('<button type="submit" id="btn">Upload File</button>')
		.appendTo(this);

	var ajax = data.ajax || true;

	// hide submit button for ajax //$("#btn")
	fileSubmit.hide();//window.FormData	

	// input change event
	//$("input[type=file]")
	fileInput.change(function(e){		
		var len = this.files.length;
		var file = this.files[len-1];
		if(data.validate){
			if(!data.validate(file)){
				return;
			} 
		}

		// input File Upload
		// non-Ajax file upload
		//---------------------------------------------------------------------
		//$(el).uploader({ ajax: false });
		if(!ajax){//$('#files')
			$(this).parent().submit();
			return;
		}

		// FormData Upload
		// use formData to upload multiple files
		//--------------------------------------------------------------------- 
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

		// Ajax File Upload
		//---------------------------------------------------------------------
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
};
})({
	VERSION: [0, 0, 3]
});
