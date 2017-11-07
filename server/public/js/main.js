var client = (function(){
    var basket = {
        cuisines:   [],
        tastes:     [],
        techniques: []
    };

    var search = function(){
        // extract search data from DOM
        var searchInput = document.querySelector("#search-input").value,
            searchType = document.querySelector("#search-type").value;

        // bail if no search is given
        if(!searchInput){
            displayMessage("Please enter a search.");
            return;
        }

        // format search data
        searchInput = formatSearch(searchInput);
        searchType = searchType.toLowerCase();

        // send the search request using the CCAPI
        if(searchType === "cuisines"){
            // request cuisine associations
            CCAPI.requestCuisineAssociations(searchInput, function(data, status){
                if(status === 400){
                    // no result, attempt a name search
                    CCAPI.requestCuisines(searchInput, function(data, status){
                        (status !== 400) ? displayDidYouMean(data) : displayMessage(data);
                    });
                }
                else{
                    // success, display result
                    console.log('data');
                    console.log(data);
                    displayResults(data);
                }
            });
        }
        else if(searchType === "tastes"){
            // request taste associations
            CCAPI.requestTasteAssociations(searchInput, function(data, status){
                if(status === 400){
                    CCAPI.requestTastes(searchInput, function(data, status){
                        (status !== 400) ? displayDidYouMean(data) : displayMessage(data);
                    });
                }
                else{
                    displayResults(data);
                }
            });
        }
        else if(searchType === "techniques"){
            // request technique associations
            CCAPI.requestTechniqueAssociations(searchInput, function(data, status){
                if(status === 400){
                    CCAPI.requestTechniques(searchInput, function(data, status){
                        (status !== 400) ? displayDidYouMean(data) : displayMessage(data);
                    });
                }
                else{
                    displayResults(data);
                }
            });
        }
    };

    var formatSearch = function(search){
        var formatSearch = search.toLowerCase();
        return formatSearch.replace(new RegExp(" ", "g"), "_");
    };

    var displayDidYouMean = function(response){
        displayResults(response);

        var container = document.querySelector("#results-container");
        container.innerHTML = "<h3>Did you mean?</h3>" + container.innerHTML;
    };

    var displayResults = function(response){
        try{
            // json?
            var json = JSON.parse(response);
            (json instanceof Array) ? displayResultsArray(json) : displayResultsObject(json);
        }
        catch(err){
            // text, probably no results message
            displayMessage(response);
        }
    };

    var displayResultsArray = function(data){
        var html = "<ul class='results-list'>";
        for(var i = 0; i < data.length; i++){
            html += "<li>" + createItemBlockHtml(data[i]) + "</li>";
        }
        displayMessage(html + "</ul>");
    };

    var displayResultsObject = function(data){
        var html = "<table><thead>";
        for(var attr in data){
            html += "<tr><th>" + attr + "</th></tr>";
        }
        html + "</thead><tbody>";
        for(var attr in data){
            html += "<tr><td>" + data[attr] + "</td></tr>";
        }
        html += "</tbody></table>";
        displayMessage(html);
    };

    var displayMessage = function(message){
        var container = document.querySelector("#results-container");
        container.style.display = "block";
        container.innerHTML = message;
    };

    var createItemBlockHtml = function(name){
        var html = "<figure class='item-block'>"
        html += name;
        return html + "</figure>";
    };

    var init = function(){
        document.querySelector("#search-btn").addEventListener("click", search);
    };
    window.addEventListener("load", init);

    return {

    };
})();
