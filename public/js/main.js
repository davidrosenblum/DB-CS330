var client = (function(){
    var SERVER_HOST =   "localhost",
        TEST_HOST =     "localhost",
        WS_PORT =       9000;

    var socket = null;

    var request = function(type, data){
        var body = {
            type: type,
            data: data
        };

        socket.send(JSON.stringify(body));
    };

    var searchByName = function(){
        var name = document.querySelector("#name-input").value;
        if(!name){
            displayMessage("Please enter a name.");
            return;
        }

        console.log("Name search requested.");
        request("name", name);
    };

    var searchLikeName = function(){
        var name = document.querySelector("#name-like-input").value;
        if(!name){
            displayMessage("Please enter a name.");
            return;
        }

        console.log("Name like requested.");
        request("like", name);
    };

    var parseQueryStrings = function(){

    };

    var handleSocketData = function(message){
        try{
            var json = JSON.parse(message);

            displayData(json);
        }
        catch(err){
            // non-json = message
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

    var displayMessage = function(message){
        var container = document.querySelector("#results-container");
        container.style.display = "block";
        container.innerHTML = message;
    };

    var init = function(){
        socket = new WebSocket("ws://" + SERVER_HOST + ":" + WS_PORT);

        socket.addEventListener("open", function(evt){
            // socket connected
            console.log("Websocket connected!");
        });

        socket.addEventListener("message", function(evt){
            handleSocketData(evt.data);
        });

        document.querySelector("#search-like").addEventListener("click", searchLikeName);
        document.querySelector("#search-name").addEventListener("click", searchByName);
    };
    window.addEventListener("load", init);
})();
