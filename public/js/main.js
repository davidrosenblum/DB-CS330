var client = (function(){
    // parse the query strings from the url
    var parseQueryStrings = function(){
        // extract the query string from the url
        var qsRaw = window.location.href.split("?")[1] || null;
        if(!qsRaw){
            // no query strings
            return {};
        }

        var querystrings = {};

        var qsSplit = qsRaw.split("&");
        for(var qsSet of qsSplit){
            var set = qsSet.split("=");
            querystrings[set[0]] = set[1];
        }

        return querystrings;
    };

    var getByName = function(){
        var name = document.querySelector("#name-input").value.replace(new RegExp(" ", "g"), "_");
        if(name){
            CCAPI.requestInfo(name, function(res, status){
                (status === 200) ? displayData(JSON.parse(res)) : displayMessage(res);
            });
        }
        else{
            displayMessage("Please enter an ingredient name.");
        }
    };

    var getAssociations = function(){
        var name = document.querySelector("#name-like-input").value.replace(new RegExp(" ", "g"), "_");
        if(name){
            CCAPI.requestAssociations(name, function(res, status){
                (status === 200) ? displayData(JSON.parse(res)) : displayMessage(res);
            });
        }
        else{
            displayMessage("Please enter an ingredient name.");
        }
    };

    var getByParams = function(){
        var flavor = document.querySelector("#input-flavor").value,
            weight = document.querySelector("#input-weight").value,
            season = document.querySelector("#input-season").value,
            protein = document.querySelector("#input-protein").value,
            calories = document.querySelector("#input-calories").value
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

    // array to html list (comma seperated text)
    var displayList = function(data){
        var html = "";
        for(var i = 0; i < data.length; i++){
            html += "<a href='#'>" + data[i] + "</a>, ";
        }

        displayMessage(html.substring(0, html.length - 2));
    };

    // display message in the DOM
    var displayMessage = function(message){
        var container = document.querySelector("#results-container");
        container.style.display = "block";
        container.innerHTML = message;
    };

    var showSearch = function(){
        hideSearchContainers();

        document.querySelector("#link-search").parentNode.classList.add("active");
    };

    var showSearchSimilar = function(){
        hideSearchContainers();

        document.querySelector("#link-search-similar").parentNode.classList.add("active");
    };

    var showIngredientInfo = function(){
        hideSearchContainers();

        document.querySelector("#link-ingredient-info").parentNode.classList.add("active");
    };

    var hideSearchContainers = function(){
        document.querySelector("#link-search").parentNode.classList.remove("active");
        document.querySelector("#link-search-similar").parentNode.classList.remove("active");
        document.querySelector("#link-ingredient-info").parentNode.classList.remove("active");
    };

    var init = function(){
        // attach nav btn listesners
        document.querySelector("#link-search").addEventListener("click", showSearch);
        document.querySelector("#link-search-similar").addEventListener("click", showSearchSimilar);
        document.querySelector("#link-ingredient-info").addEventListener("click", showIngredientInfo);
        // attach button click listeners
        document.querySelector("#search-like").addEventListener("click", getAssociations);
        document.querySelector("#search-name").addEventListener("click", getByName);
    };
    window.addEventListener("load", init);
})();
