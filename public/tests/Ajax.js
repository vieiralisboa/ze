//javascript

/*
Example 18-12. Implementing timeouts
*/
// Issue an HTTP GET request for the contents of the specified URL.
// If the response arrives successfully, pass responseText to the callback.
// If the response does not arrive in less than timeout ms, abort the request.
// Browsers may fire "readystatechange" after abort(), and if a partial
// request has been received, the status property may even be set, so
// we need to set a flag so that we don't invoke the callback for a partial,
// timed-out response. This problem does not arise if we use the load event.
function timedGetText(url, timeout, callback) {
    // Create new request.
    var request = new XMLHttpRequest(); 
    
    // Whether we timed out or not.
    var timedout = false; 
    
    // Start a timer that will abort the request after timeout ms.
    var timer = setTimeout(// Start a timer. If triggered,
        function() { 
            timedout = true; // set a flag and then
            request.abort(); // abort the request.
        },
        timeout); // How long before we do this
    
    // Specify URL to fetch
    request.open("GET", url); 
    
    // Define event listener.
    request.onreadystatechange = function() { 
        if (request.readyState !== 4) return; // Ignore incomplete requests.
        if (timedout) return; // Ignore aborted requests.
        clearTimeout(timer); // Cancel pending timeout.
        if (request.status === 200) // If request was successful
            callback(request.responseText); // pass response to callback.
    };
    
    // Send the request now
    request.send(null); 
}

/*
Example 18-7. Making an HTTP POST request with a JSON-encoded body
*/
function postJSON(url, data, callback) {
    var request = new XMLHttpRequest();
    request.open("POST", url); // POST to the specified url
    request.onreadystatechange = function() { // Simple event handler
        if (request.readyState === 4 && callback) // When response is complete
        	callback(request); // call the callback.
    };
    // Set Content-Type
    request.setRequestHeader("Content-Type", "application/json");
    
    //ENCRYPT simulation
    data = [$.base64Encode(JSON.stringify(data))];
  
    request.send(JSON.stringify(data));
}

/*
Example 18-6. Making a GET request with form-encoded data
*/
function getData(url, data, callback) {
    var request = new XMLHttpRequest();
    request.open("GET", url + // GET the specified url
        "?" + encodeFormData(data)); // with encoded data added
    request.onreadystatechange = function() { // Simple event handler
        if (request.readyState === 4 && callback) callback(request);
    };
    request.send(null); // Send the request
}

/*
Example 18-5. Making an HTTP POST request with form-encoded data
*/
function postData(url, data, callback) {
    var request = new XMLHttpRequest();
    request.open("POST", url); // POST to the specified url
    request.onreadystatechange = function() { // Simple event handler
        if (request.readyState === 4 && callback) // When response is complete
        callback(request); // call the callback.
    };
    // Set Content-Type
    request.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
    request.send(encodeFormData(data)); // Send form-encoded data
}

/**
* Encode the properties of an object as if they were name/value pairs from
* an HTML form, using application/x-www-form-urlencoded format
*/
function encodeFormData(data) {
    if (!data) return ""; // Always return a string
    var pairs = []; // To hold name=value pairs
    for(var name in data) { // For each name
        if (!data.hasOwnProperty(name)) continue; // Skip inherited
        if (typeof data[name] === "function") continue; // Skip methods
        var value = data[name].toString(); // Value as string
        name = encodeURIComponent(name.replace(" ", "+")); // Encode name
        value = encodeURIComponent(value.replace(" ", "+")); // Encode value
        pairs.push(name + "=" + value); // Remember name=value pair
    }
    return pairs.join('&'); // Return joined pairs separated with &
}

/*
Example 18-3. Parsing the HTTP response
*/
// Issue an HTTP GET request for the contents of the specified URL.
// When the response arrives, pass it to the callback function as a
// parsed XML Document object, a JSON-parsed object, or a string.
function get(url, callback) {
	var request = new XMLHttpRequest(); // Create new request
	request.open("GET", url); // Specify URL to fetch
	request.onreadystatechange = function() { // Define event listener
		// If the request is compete and was successful
		if (request.readyState === 4 && request.status === 200) {
			// Get the type of the response
			var type = request.getResponseHeader("Content-Type");
			// Check type so we don't get HTML documents in the future
			if (type.indexOf("xml") !== -1 && request.responseXML)
				callback(request.responseXML); // Document response
			else if (type === "application/json")
				callback(JSON.parse(request.responseText)); // JSON response

			else
				callback(request.responseText); // String response
		}
	};
	request.send(null); // Send the request now
}

/* 
Example 18-2. Getting an HTTP response onreadystatechange 
*/
// Issue an HTTP GET request for the contents of the specified URL.
// When the response arrives successfully, verify that it is plain text
// and if so, pass it to the specified callback function
function getText(url, callback) {
	var request = new XMLHttpRequest(); // Create new request
	request.open("GET", url); // Specify URL to fetch
	request.onreadystatechange = function() { // Define event listener
		// If the request is compete and was successful
		if (request.readyState === 4 && request.status === 200) {
			var type = request.getResponseHeader("Content-Type");
			if (type.match(/^text/)) // Make sure response is text
				callback(request.responseText); // Pass it to callback
		}
	};
	request.send(null); // Send the request now
}

// Issue a synchronous HTTP GET request for the contents of the specified URL.
// Return the response text or throw an error if the request was not successful
// or if the response was not text.
function getTextSync(url) {
	var request = new XMLHttpRequest(); // Create new request
	request.open("GET", url, false); // Pass false for synchronous
	request.send(null); // Send the request now
	// Throw an error if the request was not 200 OK
	if (request.status !== 200) throw new Error(request.statusText);
	// Throw an error if the type was wrong
	var type = request.getResponseHeader("Content-Type");
	if (!type.match(/^text/)) throw new Error("Expected textual response; got: " + type);
	return request.responseText;
}

//the function that sends the message to the server via Http
//the message can be accessed in a PHP script with $GLOBALS['HTTP_RAW_POST_DATA']
function postMessage(msg,url,method) {
    url = url || "log.php";
    var request = new XMLHttpRequest(); // New request   
    request.open("POST", url); // POST to a server-side script
    
    // Send the message, in plain-text, as the request body
    request.setRequestHeader("Content-Type", // Request body will be plain text
        "text/plain;charset=UTF-8");
    
    request.send(msg); // Send msg as the request body
    // The request is done. We ignore any response or any error.
};

