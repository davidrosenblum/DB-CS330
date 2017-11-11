var client = (function(){
    // bakset object ("my list")
    var basket = {
        cuisines:   {},
        add: function(name){
            var element = this.getElement();
            if(element.innerHTML.trim() === "(Empty)"){
                element.innerHTML = "";
            }

            this.cuisines[name] = 1;
            element.appendChild(createItemBlock(name));

        },
        remove: function(name){
            var element = this.getElement();

            delete this.cuisines[name];
            console.log("#items-container figure[data-name='" + name + "']");
            element.removeChild(document.querySelector("#items-container figure[data-name='" + name + "']"));

            if(element.innerHTML.length === 0){
                element.innerHTML = "(Empty)";
            }
        },
        getElement: function(){
            return document.querySelector("#items-container");
        }
    };

    var search = function(){
        // extract search data from DOM
        var searchInput = document.querySelector("#search-input").value,
            searchType = document.querySelector("#search-type").value;

        // format
        searchInput = formatSearch(searchInput);
        searchType = searchType.toLowerCase();

        // bail if no search is given
        if(!searchInput){
            displayMessage("Please enter a search.");
            return;
        };

        // send the search request
        // 200 status = display the list of results
        // 400 status = display no results message
        // 500 status = display error message
        if(searchType === "cuisines"){
            CCAPI.requestCuisines(searchInput, function(data, status){
                setOutput((status === 200) ? createItemList(data) : data);
            });
        }
        else if(searchType === "tastes"){
            CCAPI.requestTasteAssociations(searchInput, function(data, status){
                /*if(status !== 400){
                    // cusines found for taste
                    setOutput(createItemList(data));
                }
                else{
                    // NO cuisines found
                    CCAPI.requestTastes(searchInput, function(data, status){
                        if(status === 200){
                            // list possible tastes
                            setOutput("<h3>Did you mean?</h3>");
                            appendOutput(createItemList(data));
                        }
                        else{
                            // error or not found message
                            setOutput(data);
                        }
                    });
                }*/
                setOutput((status === 200) ? createItemList(data) : data);
            });
        }
        else if(searchType === "techniques"){
            CCAPI.requestTechniqueAssociations(searchInput, function(data, status){
                /*if(status !== 400){
                    // cusines found for technique
                    setOutput(createItemList(data));
                }
                else{
                    // NO cuisines found
                    CCAPI.requestTechniques(searchInput, function(data, status){
                        if(status === 200){
                            // list possible techniques
                            setOutput("<h3>Did you mean?</h3>");
                            appendOutput(createItemList(data));
                        }
                        else{
                            // error or not found message
                            setOutput(data);
                        }
                    });
                }*/
                setOutput((status === 200) ? createItemList(data) : data);
            });
        }
        else displayMessage("Unsupported search type.");
    }

    // formats the search input (replace all ' ' with '_')
    var formatSearch = function(search){
        var formatSearch = search.toLowerCase();
        return formatSearch.replace(new RegExp(" ", "g"), "_");
    };

    // creates the HTMLUListElement that contains all the list items
    var createItemList = function(data){
        try{
            data = JSON.parse(data);
        }
        catch(err){
            return null;
        }

        var list = document.createElement("ul");
        list.classList.add("results-list");

        for(var i = 0; i < data.length; i++){
            var li = document.createElement("li");
            li.appendChild(createItemBlock(data[i]));
            list.appendChild(li);
        }

        return list;
    };

    // creates the HTMLTableElement for a cuisine item
    var createInfoTable = function(data){
        try{
            data = JSON.parse(data);
        }
        catch(err){
            return null;
        }

        var tbl = document.createElement("table");
        tbl.setAttribute("class", "table");

        var tbody = document.createElement("tbody");
        tbl.appendChild(tbody);

        for(var attr in data){
            if(data[attr] !== null && attr !== "id"){
                var tr = document.createElement("tr");
                tbody.appendChild(tr);

                var th = document.createElement("th");
                th.innerHTML = attr;
                tr.appendChild(th);

                var td = document.createElement("td");
                td.innerHTML = data[attr];
                tr.appendChild(td);
            }
        }

        return tbl;
    };

    // shows the results container and displays the optional text inside
    var displayMessage = function(message){
        var container = document.querySelector("#results-container");
        container.style.display = "block";

        if(typeof message === "string"){
             container.innerHTML = message;
        }
    };

    // creates an HTMLFigure (contains the buttons) for a list item
    var createItemBlock = function(name){
        var figure = document.createElement("figure");
        figure.classList.add("item-block");
        figure.setAttribute("data-name", name);
        figure.innerHTML = name;


        figure.appendChild(document.createElement("br"));
        figure.appendChild(createInfoButton(name));

        if(name in basket.cuisines === false){
            figure.appendChild(createAddButton(name));
        }
        else{
            figure.appendChild(createRemoveButton(name));
        }

        return figure;
    };

    // creates an HTMLButtonElement for cuisine item details
    var createInfoButton = function(name){
        var infoBtn = document.createElement("button");
        infoBtn.classList.add("btn-info");
        infoBtn.innerHTML = "Details";
        infoBtn.addEventListener("click", function(evt){
            // button clicked...
            CCAPI.requestCuisineInfo(name, function(info, status){
                if(status !== 400){
                    // create and display the info table
                    setOutput(createInfoTable(info));

                    // request associations (there might be none!) and append the list
                    CCAPI.requestCuisineAssociations(name, function(associations, status){
                        appendOutput(createItemList(associations));
                    });
                }
            });
        });
        return infoBtn;
    };

    // creates an HTMLButtonElement for adding a bakset item
    var createAddButton = function(name){
        var addBtn = document.createElement("button");
        addBtn.innerHTML = "Add";
        addBtn.classList.add("btn-warning");
        addBtn.addEventListener("click", function(evt){
            // button clicked...
            this.parentNode.appendChild(createRemoveButton(name));
            this.parentNode.removeChild(this);
            basket.add(name);
        });
        return addBtn;
    };

    // creates an HTMLButtonElement for removing a basket item
    var createRemoveButton = function(name){
        var removeBtn = document.createElement("button");
        removeBtn.classList.add("btn-danger");
        removeBtn.innerHTML = "Remove";
        removeBtn.addEventListener("click", function(evt){
            // button clicked...
            this.parentNode.appendChild(createAddButton(name));
            this.parentNode.removeChild(this);
            basket.remove(name);
        });
        return removeBtn;
    };

    // wipes the results container and contains an html string OR html element
    var setOutput = function(html){
        var container = document.querySelector("#results-container");
        container.style.display = "block";

        if(typeof html === "string"){
            container.innerHTML = html;
        }
        else if(html instanceof HTMLElement){
            container.innerHTML = "";
            container.appendChild(html);
        }
    };

    // appends an html string OR html element into the results container
    var appendOutput = function(html){
        var container = document.querySelector("#results-container");
        container.style.display = "block";

        if(typeof html === "string"){
            container.innerHTML += html;
        }
        else if(html instanceof HTMLElement){
            container.appendChild(html);
        }
    };

    // parses url quest strings
    var parseQueryStrings = function(){
        var queryStrings = {};

        var qs = window.location.href.split("?")[1] || null;
        if(!qs) return queryStrings;

        var qsSplit = qs.split("&");
        for(var i = 0; i < qsSplit.length; i++){
            var innerSplit = qsSplit[i].split("=");
            queryStrings[innerSplit[0]] = innerSplit[1] || null;
        }

        return queryStrings;
    };

    var init = function(){
        var qs = parseQueryStrings();
        if("search" in qs){
            document.querySelector("#search-input").value = qs["search"];
        }

        document.querySelector("#search-btn").addEventListener("click", search);
    };
    window.addEventListener("load", init);

    return {
        basket: () => basket
    };
})();
