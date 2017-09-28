/*
    Cuisine Crusader API
    Sends AJAX requests to the CC REST API

    ** callback signature... **
    function(response:String, httpStatus:int)

    ** http status codes **
    200 = request returned a value (success)
    400 = request was received but no value was found (fail)
*/

var CCAPI = (function(){
    // extract the protocol + host from the URL
    var SERVER_HOST = window.location.protocol + "//" + window.location.host; // same because its talking to the http server!
    // localhost will be missing a slash
    if(SERVER_HOST.startsWith("http://localhost") || SERVER_HOST.startsWith("https://localhost")){
        SERVER_HOST += "/";
    }

    // sends AJAX requests
    var ajax = function(opts){
        opts = (!opts) ? {} : opts;

        var url = (typeof opts.url === "string") ? opts.url : window.location.href,
            method = (typeof opts.method === "string") ? opts.method : "GET",
            headers = (typeof opts.headers === "object" && opts.headers) ? opts.headers : {},
            data = (typeof opts.data !== "undefined") ? opts.data : null,
            callback = (typeof opts.callback === "function") ? opts.callback : null;

        var xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function(){
            if(xhr.readyState === 4){
                if(typeof callback === "function"){
                    callback(xhr.response, xhr.status);
                }
            }
        };

        xhr.open(method, url, true);
        for(var h in headers){
            xhr.setRequestHeader(h, headers[h]);
        }
        xhr.send(data);
    };

    // forces lower case and replaces spaces with underscores
    var formatIngredientName = function(ingredientName){
        var name = ingredientName.toLowerCase();
        return name.replace(new RegExp(" ", "g"), "_");
    };

    // requests the JSON representation of an ingredient
    var requestInfo = function(ingredientName, callback){
        ajax({
            url:        SERVER_HOST + "ingredients/name/" + formatIngredientName(ingredientName),
            method:     "GET",
            callback:   callback
        });
    };

    // requests the associations list (array of strings) for an ingredient
    var requestAssociations = function(ingredientName, callback){
        ajax({
            url:        SERVER_HOST + "associations/name/" + formatIngredientName(ingredientName),
            method:     "GET",
            callback:   callback
        });
    };

    // requests an an ingredient search based on the params
    var requestSearch = function(searchParams, callback){
        ajax({
            url:        SERVER_HOST + "ingredients/search",
            method:     "GET",
            data:       searchParams,
            callback:   callback
        });
    };

    // requests the entire ingredients table (json representation)
    var requestIngredientsData = function(callback){
        ajax({
            url:        SERVER_HOST + "ingredients/get",
            method:     "GET",
            callback:   callback
        });
    };

    // requests the entire associations table (json representation)
    var requestAssociationsData = function(callback){
        ajax({
            url:        SERVER_HOST + "associations/get",
            method:     "GET",
            callback:    callback
        });
    };

    // change the host
    var setHost = function(host){
        SERVER_HOST = host;
    };

    // public methods
    return {
        requestInfo:                requestInfo,
        requestAssociations:        requestAssociations,
        requestSearch:              requestSearch,
        requestIngredientsData:     requestIngredientsData,
        requestAssociationsData:    requestAssociationsData,
        setHost:                    setHost
    };
})();
