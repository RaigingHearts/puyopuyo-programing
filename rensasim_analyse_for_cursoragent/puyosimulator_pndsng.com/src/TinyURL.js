/*
 * http://james.padolsey.com/javascript/create-a-tinyurl-with-jsonp/
 */



function getTinyURL(longURL, success) {
 
    // Create unique name for callback function:
    var ud = 'json'+(Math.random()*100).toString().replace(/\./g,''),
    	// Define API URL:
        API = 'http://tinyurl.com/api-create.php?url=';
 
    // Define a new global function:
    // (which will run the passed 'success' function:
    window[ud]= function(o){ success&&success(o.tinyurl); };
 
    // Append new SCRIPT element to BODY with SRC of API:
    document.getElementsByTagName('body')[0].appendChild((function(){
 
        var s = document.createElement('script');
        s.type = 'text/javascript';
        s.src = API + encodeURIComponent(longURL) + '&callback=' + ud;
        return s;
 
    })());
 
}
