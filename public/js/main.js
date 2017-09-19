var client = (function(){
    // connection setup
    var SERVER_HOST =   "localhost",
        TEST_HOST =     "localhost",
        WS_PORT =       9000;

    // private websocket
    var socket = null;

    // sends a formatted json request through the socket
    var request = function(type, data){
        // create the json request
        var body = {
            type: type,
            data: data
        };

        try{
            // send the request through the socket as a json string
            socket.send(JSON.stringify(body));
        }
        catch(err){
            // parse error
            console.log("Error sending request (json parse error).");
        }
    };

    // seach by name request (request type = 'name')
    var searchByName = function(){
        // get the name text from the html
        var name = document.querySelector("#name-input").value;
        if(!name){
            // input missing
            displayMessage("Please enter a name.");
            return;
        }

        // send the request
        console.log("Name search requested.");
        request("name", name);
    };

    // search by association request (request type = 'like')
    var searchLikeName = function(){
        // get the name text from the html
        var name = document.querySelector("#name-like-input").value;
        if(!name){
            // input missing
            displayMessage("Please enter a name.");
            return;
        }

        // send the request
        console.log("Name like requested.");
        request("like", name);
    };

    // parse the query strings from the url
    var parseQueryStrings = function(){
        // extract the query string from the url
        var qsRaw = window.location.href.split("?")[1] || null;
        if(!qsRaw){
            // no query strings
            console.log("NO QS");
            return;
        }

        var querystrings = {};

        var qsSplit = qsRaw.split("&");
        for(var qsSet of qsSplit){
            var set = qsSet.split("=");
            querystrings[set[0]] = set[1];
        }

        return querystrings;
    };

    // socket message handler
    var handleSocketData = function(message){
        try{
            // attempt to parse
            var json = JSON.parse(message);

            // its json, display it
            displayData(json);
        }
        catch(err){
            // non-json, print the message
            displayMessage(message);
        }
    };

    // takes json data and determines if it should be table or list and injects into DOM
    var displayData = function(data){
        if(!(data instanceof Array)){
            // data is an object of a complex item
            displayTable(data);
        }
        else{
            // data is an array of simple items
            displayList(data);
        }
    };

    // json object to html table
    var displayTable = function(data){
        var html = "<table class='tbl' align='center'><tbody>";
        for(var attr in data){
            if(attr !== "id"){
                html += "<tr><td>" + attr + "</td><td>" + ((data[attr]) ? data[attr] : "N / A") + "</td></tr>";
            }
        }
        html += "</tbody></table>";

        displayMessage(html);
    };

    // array to html list
    var displayList = function(data){
        var html = "";
        for(var i = 0; i < data.length; i++){
            html += data[i].name + ", ";
        }

        displayMessage(html.substring(0, html.length - 2));
    };

    // display message in the DOM
    var displayMessage = function(message){
        var container = document.querySelector("#results-container");
        container.style.display = "block";
        container.innerHTML = message;
    };

    // creates the websocket
    var createSocket = function(){
        // extract quert strings (determines socket endpoint)
        var querystrings = parseQueryStrings();

        // test mode query string?
        if(querystrings["test_mode"] === "true"){
            // test mode
            socket = new WebSocket("ws://" + TEST_HOST + ":" + WS_PORT);
        }
        else{
            // NOT test mode
            socket = new WebSocket("ws://" + SERVER_HOST + ":" + WS_PORT);
        }

        // socket connected...
        socket.addEventListener("open", function(evt){
            console.log("Websocket connected!");
        });

        // socket response...
        socket.addEventListener("message", function(evt){
            handleSocketData(evt.data);
        });

        // socket closed...
        socket.addEventListener("close", function(evt){
            console.log("Websocket closed.");

        });
    };

    var init = function(){
        // create the Websocket
        createSocket();

        // attach button click listeners
        document.querySelector("#search-like").addEventListener("click", searchLikeName);
        document.querySelector("#search-name").addEventListener("click", searchByName);
    };
    window.addEventListener("load", init);
})();
