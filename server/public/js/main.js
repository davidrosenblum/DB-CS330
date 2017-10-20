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

    var formatIngredientName = function(ingredientName){
        return ingredientName.replace(new RegExp(" ", "g"), "_");
    };

    var getInfo = function(name){
        CCAPI.requestInfo(formatIngredientName(name), function(res, status){
            console.log(res);
            (status === 200) ? displayData(JSON.parse(res)) : displayMessage(res);
        });
    };

    var findNames = function(){
        var name = formatIngredientName(document.querySelector("#find-name-input").value);
        if(name){
            CCAPI.requestNames(name, function(res, status){
                (status === 200) ? displayData(JSON.parse(res)) : displayMessage(res);
            });
        }
        else{
            displayMessage("Please enter an ingredient name.");
        }
    };

    var getAssociations = function(){
        var name = formatIngredientName(document.querySelector("#associations-name-input").value);
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

    var createIngredientLink = function(ingredient){
        var tag = document.createElement("a");

        tag.onclick = function(){
            getInfo(ingredient);
        };

        //tag.setAttribute("href", "#results-container");
        tag.setAttribute("href", "#");
        tag.setAttribute("class", "ingredient-link");
        tag.innerHTML = ingredient;

        return tag;
    };

    // array to html list (comma seperated text)
    var displayList = function(data){
        displayMessage("");

        var container = document.querySelector("#results-container");

        // generate <a> tags for each ingredient
        for(var i = 0, tag; i < data.length; i++){
            tag = createIngredientLink(data[i]);
            container.appendChild(tag);
            //container.innerHTML += ", ";
        }
        //container.innerHTML = container.innerHTML.substring(0, container.innerHTML.length - 2);
    };

    // display message in the DOM
    var displayMessage = function(message){
        var container = document.querySelector("#results-container");
        container.style.display = "block";
        container.innerHTML = message;
    };

    var init = function(){
        // attach button click listeners
        document.querySelector("#search-associations-btn").addEventListener("click", getAssociations);
        document.querySelector("#find-name-btn").addEventListener("click", findNames);
    };
    window.addEventListener("load", init);
})();
