var client = (function(){
    Set.prototype.intersection = function(set){
        var intersection = new Set();

        for(var k of set){
            if(this.has(k)){
                intersection.add(k);
            }
        }
        return intersection;
    };

    var resultsContainer, modal, modalBody, modalDarkness;

    // bakset object ("my list")
    var basket = {
        cuisines:   {},
        add: function(name){
            if(name in this.cuisines === false){
                var element = this.getElement();
                if(element.innerHTML.trim() === "(Empty)"){
                    element.innerHTML = "";
                }

                var itemFigure = new DisplayFigure(name);
                itemFigure.showRemove();

                this.cuisines[name] = itemFigure;
                element.appendChild(itemFigure.figure);

                saveLocalBasket();

                commonAssociationManager.store(name);
            }
        },
        remove: function(name){
            if(name in this.cuisines){
                var element = this.getElement(),
                    figure = this.cuisines[name];

                figure.remove();
                delete this.cuisines[name];

                if(name in displayFigures){
                    displayFigures[name].showAdd();
                }

                if(element.innerHTML.length === 0){
                    element.innerHTML = "(Empty)";
                }

                saveLocalBasket();

                commonAssociationManager.remove(name);
            }
        },
        getElement: function(){
            return document.querySelector("#items-container");
        }
    };

    var commonAssociationManager = {
        sets: {},
        associations: null,
        store: function(name){
            if(typeof this.sets[name] !== "undefined") return;

            var that = this;
            CCAPI.requestCuisineAssociations(name, function(res, status){
                if(status !== 400){
                    try{
                        that.sets[name] = JSON.parse(res); // its an array!
                    }
                    catch(err){
                        return;
                    }

                    // will auto populate the associations array if its null
                    that.sort();
                    that.updateDOM();
                }
            });
        },
        remove: function(name){
            if(name in this.sets){
                delete this.sets[name];

                // reset associations - will be re-populated in sort
                this.associations = null;

                this.sort();
                this.updateDOM();
            }
        },
        sort: function(){
            for(var name in this.sets){
                var set = this.sets[name]; // set is an array
                this.extractIntersection(set);
            }
        },
        extractIntersection(array){
            // special case for when the associations array is null
            if(!this.associations){
                this.associations = array;
                return;
            }

            // find what elements match, and make that the new associations
            var intersection = [];
            for(var i = 0; i < this.associations.length; i++){
                for(var j = 0; j < array.length; j++){
                    if(this.associations[i] === array[j]){
                        intersection.push(array[j]);
                    }
                }
            }
            this.associations = intersection;
        },
        updateDOM: function(){
            // extract the container
            var element = document.querySelector("#common-associations-container");
            if(!element) throw new Error("Missing element!");

            // wipe the html elements
            element.innerHTML = "";

            // for each association... create a display figure
            for(var i = 0; i < this.associations.length; i++){
                var df = new DisplayFigure(this.associations[i]);
                element.appendChild(df.figure);
            }

            // no association
            if(element.innerHTML.length === 0){
                //element.innerHTML = "(None)"; depricated?
            }
        }
    };

    // display figure class - a container for the cuisine name & buttons
    var DisplayFigure = function(name){
        this.figure = createItemBlock(name);
        this.addBtn = createAddButton();
        this.removeBtn = createRemoveButton();
        this.infoBtn = createInfoButton(name);
        this.name = name;

        var that = this; // preserve scope

        this.addBtn.addEventListener("click", function(evt){
            that.showRemove();
            basket.add(name);
        });

        this.removeBtn.addEventListener("click", function(evt){
            that.showAdd();
            basket.remove(name);
        });

        this.figure.appendChild(document.createElement("br"));
        this.figure.appendChild(this.infoBtn);

        (name in basket.cuisines) ? this.showRemove() : this.showAdd();
    };
    DisplayFigure.prototype.showRemove = function(){
        if(this.addBtn.parentNode === this.figure) this.figure.removeChild(this.addBtn);
        this.figure.appendChild(this.removeBtn);
    };
    DisplayFigure.prototype.showAdd = function(){
        this.figure.appendChild(this.addBtn);
        if(this.removeBtn.parentNode === this.figure) this.figure.removeChild(this.removeBtn);
    };
    DisplayFigure.prototype.remove = function(){
        this.figure.parentNode.removeChild(this.figure);
    };

    // dictionary of all display figures, prevents querying for them later
    var displayFigures = {};

    // submits the search to the server (triggered by enter on search or search button click)
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
                setOutput((status === 200) ? createItemList(data) : data);
            });
        }
        else if(searchType === "techniques"){
            CCAPI.requestTechniqueAssociations(searchInput, function(data, status){
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
        // extract the data (data is a json string)
        try{
            data = JSON.parse(data);
        }
        catch(err){
            return null;
        }

        displayFigures = {};

        // create the html unordered list element
        var list = document.createElement("ul");
        list.classList.add("results-list");

        // populate the list with list items containing the display figures
        for(var i = 0; i < data.length; i++){
            var li = document.createElement("li"),
                figureObject = new DisplayFigure(data[i]);

            li.appendChild(figureObject.figure);
            list.appendChild(li);

            displayFigures[data[i]] = figureObject;
        }

        return list;
    };

    // creates the HTMLTableElement for a cuisine item
    var createInfoTable = function(data){
        // parse the data (data is a json string)
        try{
            data = JSON.parse(data);
        }
        catch(err){
            return null;
        }

        // create the table
        var tbl = document.createElement("table");
        tbl.setAttribute("class", "table");

        var tbody = document.createElement("tbody");
        tbl.appendChild(tbody);

        // create a row for each attribute
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
        return figure;
    };

    // creates an HTMLButtonElement for cuisine item details
    var createInfoButton = function(name){
        var infoBtn = document.createElement("button");
        infoBtn.classList.add("cc-btn-info");
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
        addBtn.classList.add("cc-btn-add");
        return addBtn;
    };

    // creates an HTMLButtonElement for removing a basket item
    var createRemoveButton = function(name){
        var removeBtn = document.createElement("button");
        removeBtn.innerHTML = "Remove";
        removeBtn.classList.add("cc-btn-remove");
        return removeBtn;
    };

    // wipes the results container and contains an html string OR html element
    var setOutput = function(html){
        displayModal(html);
        return;

        // depreicated
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
        appendModal(html);
        return;

        // depreicated
        var container = document.querySelector("#results-container");
        container.style.display = "block";

        if(typeof html === "string"){
            container.innerHTML += html;
        }
        else if(html instanceof HTMLElement){
            container.appendChild(html);
        }
    };

    // shows the modal and sets its initial information display
    var displayModal = function(html, title){
        resultsContainer.style.display = "none";
        modal.style.visibility = "visible";
        modalDarkness.style.visibility = "visible";

        if(typeof html === "string"){
            modalBody.innerHTML = html;
        }
        else if(html instanceof HTMLElement){
            modalBody.innerHTML = "";
            modalBody.appendChild(html);
        }

        if(typeof title === "string"){
            modalHeader.innerHTML = "<h2>" + title + "</h2>";
        }
    };

    // appends new information to the already opened modal
    var appendModal = function(html){
        if(typeof html === "string"){
            modalBody.innerHTML += html;
        }
        else if(html instanceof HTMLElement){
            modalBody.appendChild(html);
        }
    };

    // closes (hides) the popup modal and clears its contents
    var closeModal = function(){
        modalBody.innerHTML = "";
        modal.style.visibility = "hidden";
        modalDarkness.style.visibility = "hidden";
    };

    // saves current basket items to local storage
    var saveLocalBasket = function(){
        var data = [];
        for(var name in basket.cuisines){
            data.push(name);
        }

        window.localStorage.setItem("cuisine-crusader", JSON.stringify(data));
    };

    // loads basket items from local storage
    var loadLocalBasket = function(){
        var save = window.localStorage.getItem("cuisine-crusader");

        var data = JSON.parse(save);
        for(let i = 0; i < data.length; i++){
            basket.add(data[i]);
        }
    };

    // wipes the local storage for this app
    var deleteLocalBasket = function(){
        window.localStorage.removeItem("cuisine-crusader");
    };

    // shows the user profile
    var showProfile = function(){
        displayModal(
            "<p>This feature is not yet supported.</p.",
            "Profile"
        )
    };

    // shows the instructions modal
    var showHelp = function(){
        displayModal(
            "<p><b>Cuisine</b> searches will find a cuisine by names matching the search.</p>" +
            "<p><b>Taste</b> searches will find cuisines that are associationed with the taste.</p>" +
            "<p><b>Technique</b> searches will find a cuisine that are associated with the technique.</p>",
            "Instructions"
        );
    };

    // injects the minigame
    var createMinigame = function(){
        // inject the minigame script if it does not already exist
        if(!document.querySelector("script[src='js/minigame.js']")){
            var script = document.createElement("script");
            script.setAttribute("src", "js/minigame.js");
            document.body.appendChild(script);
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
        // search button should search when clicked...
        document.querySelector("#search-btn").addEventListener("click", search);

        // enter key in search input also triggers search function
        document.querySelector("#search-input").addEventListener("keyup", function(evt){
            if(evt.keyCode === 13){ // 13 = enter key
                search();
            }
        });

        // query and store html elements that are commonly used...
        resultsContainer = document.querySelector("#results-container");
        modal = document.querySelector(".cc-modal");
        modalBody = document.querySelector(".cc-modal-body");
        modalHeader = document.querySelector(".cc-modal-header");
        modalDarkness = document.querySelector(".cc-modal-dark-bg");

        // modal close buttons should close modal when clicked...
        document.querySelector("#modal-btn").addEventListener("click", closeModal);
        document.querySelector("#close-modal").addEventListener("click", closeModal);

        // nav buttons
        document.querySelector("#profile-btn").addEventListener("click", showProfile);
        document.querySelector("#help-btn").addEventListener("click", showHelp);

        // load last basket
        loadLocalBasket();

        // parse the query strings...
        var qs = parseQueryStrings();
        if("search" in qs){
            // auto search query string
            document.querySelector("#search-input").value = qs["search"];
            document.querySelector("#search-btn").click();
        }

        // minigame easter egg!
        //document.querySelector("footer").onclick = createMinigame;
    };
    window.addEventListener("load", init);

    // obligatory cool console 'art'
    console.log(
        "  _____________________________________\n" +
        " /\t\t\t\t\t\t\t\t\t   \\\n" +
        "|\t\t\tCUISINE CRUSADER\t\t\t|\n" +
        "|\t\t  ----[  RJ/DR  ]----\t\t\t|\n" +
        " \\_____________________________________/"
    );

    // return public methods
    return {
        basket: () => basket,
        associations: () => commonAssociationManager.associations
    };
})();
