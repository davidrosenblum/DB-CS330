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
                    callback(xhr.response, xhr.status, parseResponseHeaders(xhr));
                    window.jax = xhr;
                }
            }
        };

        xhr.open(method, url, true);
        for(var h in headers){
            xhr.setRequestHeader(h, headers[h]);
        }

        if(data){
            xhr.send(JSON.stringify(data));
        }
        else xhr.send();
    };

    // xhr response headers from string to an object {header: value}
    var parseResponseHeaders = function(xhr){
        var headers = {};

        var sets = xhr.getAllResponseHeaders().split("\n");
        for(var i = 0; i < sets.length; i++){
            var split = sets[i].replace(": ", ":").split(":");
            headers[split[0]] = split[1];
        }

        return headers;
    };

    // forces lower case and replaces spaces with underscores
    // multiple searches uses a query string
    var formatData = function(search){
        if(typeof search === "string"){
            // search is 1 string value
            var formattedSearch = search.toLowerCase();
            return formattedSearch.replace(new RegExp(" ", "g"), "_");
        }
        else if(search instanceof Array){
            // search is an array
            if(search.length === 1){
                // don't actually need a query string if theres only 1 value in the array
                return formatData(search[0]);
            }

            // ? c[]=name1 & c[]=name2 & c[]=namen
            var formattedSearch = formatData(search[0]) + "?"
            for(var i = 1; i < search.length; i++){
                formattedSearch += "c[]=" + formatData(search[i]) + "&";
            }
            return formattedSearch.substring(0, formattedSearch.length - 1);
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

    var createAccount = function(email, password, firstName, lastName, proChef, callback){
        ajax({
            url: SERVER_HOST + "accounts/create",
            method: "POST",
            headers: {"cuisine-crusader": "rjdr"},
            data: {
                "email": email,
                "password": password,
                "first_name": firstName,
                "last_name": lastName,
                "pro_chef": (typeof proChef === "boolean") ? proChef : false
            },
            callback: callback
        });
    };

    var loginAccount = function(email, password, callback){
        ajax({
            url: SERVER_HOST + "accounts/login",
            method: "POST",
            headers: {"cuisine-crusader": "rjdr"},
            data: {
                "email": email,
                "password": password
            },
            callback: callback
        });
    };

    var requestProfile = function(sessionGUID, callback){
        ajax({
            url: SERVER_HOST + "accounts/profile",
            method: "GET",
            headers: {
                "cuisine-crusader": "rjdr",
                "session-guid": sessionGUID
            },
            callback: callback
        });
    };

    var saveGroup = function(username, password, associations, callback){

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
        createAccount:                  createAccount,
        loginAccount:                   loginAccount,
        requestProfile:                 requestProfile,
        formatData:                     formatData,
        setHost:                        setHost
    };
})();
