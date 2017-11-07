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
    var SERVER_HOST = window.location.protocol + "//" + window.location.host + "/"; // same because its talking to the http server!

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
    var formatData = function(search){
        if(search instanceof Array){
            var formattedSearch = "";
            for(var i = 0; i < search.length; i++){
                formattedSearch += formatData(search[i]) + "&"
            }
            return formattedSearch.substring(0, formattedSearch.length - 1);
        }
        else if(typeof search === "string"){
            var formattedSearch = search.toLowerCase();
            return formattedSearch.replace(new RegExp(" ", "g"), "_");
        }
        return null;
    };

    var requestCuisineInfo = function(search, callback){
        ajax({
            url:    SERVER_HOST + "cuisines/info/" + formatData(search),
            method: "GET",
            callback: callback
        });
    };

    var requestCuisines = function(search, callback){
        ajax({
            url:    SERVER_HOST + "cuisines/search/" + formatData(search),
            method: "GET",
            callback: callback
        });
    };

    var requestCuisineAssociations = function(search, callback){
        ajax({
            url:    SERVER_HOST + "cuisines/associations/" + formatData(search),
            method: "GET",
            callback: callback
        });
    };

    var requestTastes = function(search, callback){
        ajax({
            url:    SERVER_HOST + "tastes/search/" + formatData(search),
            method: "GET",
            callback: callback
        });
    };

    var requestTasteAssociations = function(search, callback){
        ajax({
            url:    SERVER_HOST + "tastes/associations/" + formatData(search),
            method: "GET",
            callback: callback
        });
    };

    var requestTechniques = function(search, callback){
        ajax({
            url:    SERVER_HOST + "techniques/search/" + formatData(search),
            method: "GET",
            callback: callback
        });
    };

    var requestTechniqueAssociations = function(search, callback){
        ajax({
            url:    SERVER_HOST + "techniques/associations/" + formatData(search),
            method: "GET",
            callback: callback
        });
    };

    // change the host
    var setHost = function(host){
        SERVER_HOST = host;
    };

    // public methods
    return {
        requestCuisines:                requestCuisines,
        requestCuisineInfo:             requestCuisineInfo,
        requestCuisineAssociations:     requestCuisineAssociations,
        requestTastes:                  requestTastes,
        requestTasteAssociations:       requestTasteAssociations,
        requestTechniques:              requestTechniques,
        requestTechniqueAssociations:   requestTechniqueAssociations,
        formatData:                     formatData,
        setHost:                        setHost
    };
})();
