var client = (function(){
    // frequently accessed elements
    var resultsContainer, modal, modalBody, modalDarkness;

    // sesssion ID from server
    var sessionGUID = -1,
        emailCookie = null;

    var VERSION = "1.0.0";

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

                document.querySelector("#basket-clear-btn").style.display = "inline";
                if(sessionGUID !== -1) document.querySelector("#basket-export-btn").style.display = "inline";

                saveLocalBasket();

                if(name in displayFigures){
                    //displayFigures[name].showRemove();
                }
                if(name in groupFigures){
                    for(var i = 0; i < groupFigures[name].length; i++){
                        groupFigures[name][i].showRemove();
                    }
                }
                if(name in commonFigures){
                    commonFigures[name].showRemove();
                }

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
                    //displayFigures[name].showAdd();
                }
                if(name in groupFigures){
                    for(var i = 0; i < groupFigures[name].length; i++){
                        groupFigures[name][i].showAdd();
                    }
                }
                if(name in commonFigures){
                    commonFigures[name].showAdd();
                }

                if(element.innerHTML.length === 0){
                    element.innerHTML = "(Empty)";
                    document.querySelector("#basket-clear-btn").style.display = "none";
                    document.querySelector("#basket-export-btn").style.display = "none";
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
            if(this.associations){
                commonFigures = {};

                for(var i = 0; i < this.associations.length; i++){
                    var df = new DisplayFigure(this.associations[i]);
                    element.appendChild(df.figure);

                    commonFigures[df.name] = df;
                }

                // no association
                if(element.innerHTML.length === 0){
                    //element.innerHTML = "(None)"; depricated?
                }
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
            console.log("REMOVE");
            that.showAdd();
            basket.remove(name);
        });

        //this.figure.appendChild(document.createElement("br"));
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

    var commonFigures = {};

    // dict of all group figures, button fixes
    var groupFigures = {};

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
        tbl.classList.add("table");
        tbl.classList.add("cc-info-tbl");
        tbl.setAttribute("align", "center");


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
        figure.innerHTML = "<span class='item-block-name'>" + name + "</span>";
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
                    appendOutput(createSearchButton(name));

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

    // creates a search button
    var createSearchButton = function(name){
        /*var searchBtn = document.createElement("button");
        searchBtn.innerHTML = "Search";
        searchBtn.classList.add("cc-btn-search");
        searchBtn.addEventListener("click", function(evt){
            window.open("http://allrecipes.com/search/results/?wt=" + name);
        });
        return searchBtn;*/
        var p = document.createElement("p");

        var link = document.createElement("a");
        link.classList.add("cc-recipe-link");
        link.innerHTML = "Search for \"" + name + "\" recipes";
        link.setAttribute("href", "http://allrecipes.com/search/results/?wt=" + name);
        link.setAttribute("target", "_blank");

        p.appendChild(link);
        return p;
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
        modalHeader.innerHTML = "";

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
        if(modal.style.visibility !== "visible") return;

        if(typeof html === "string"){
            modalBody.innerHTML += html;
        }
        else if(html instanceof HTMLElement){
            modalBody.appendChild(html);
        }
    };

    // overrides the modal body
    var setModal = function(html){
        if(modal.style.visibility !== "visible") return;

        modalBody.innerHTML = "";
        appendModal(html);
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

        var data = save ? JSON.parse(save) : [];
        for(let i = 0; i < data.length; i++){
            basket.add(data[i]);
        }
    };

    // wipes the local storage for this app
    var deleteLocalBasket = function(){
        window.localStorage.removeItem("cuisine-crusader");
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

    // creates an account by querying the html fields
    var createAccount = function(){
        // retrieve the html field data
        var email = document.querySelector("#account-email-input").value,
            password = document.querySelector("#account-password-input").value,
            confPassword = document.querySelector("#account-confirm-password-input").value,
            firstName = document.querySelector("#account-firstname-input").value,
            lastName = document.querySelector("#account-lastname-input").value,
            proChef = document.querySelector("#account-prochef-input").value;

        if(password !== confPassword){
            appendModal("<p>Passwords don't match!</p>");
            return;
        }

        // send the request, display results
        CCAPI.createAccount(email, password, firstName, lastName, proChef, function(res, status){
            appendModal("<p data='account-response'>" + res + "</p>");
        });
    };

    // attempts account login by submitting the form fields
    var loginAccount = function(){
        email = document.querySelector("#login-email-input").value,
        password = document.querySelector("#login-password-input").value;

        if(!email || !password){
            appendModal("<p>Please enter all fields.<p>");
            return;
        }

        CCAPI.loginAccount(email, password, function(res, status, headers){
            if(status === 200){
                // email cookie
                if(headers["x-session-email"]){
                    document.cookie = "email=" + headers["x-session-email"]; // email=....
                    document.querySelector("#nav-right").style.display = "block";
                    document.querySelector("#nav-right a:nth-child(1)").innerHTML = headers["x-session-email"];
                }
                // session guid
                if(headers["x-session-guid"]){
                    sessionGUID = headers["x-session-guid"];
                    showProfileModal(); // this time it will show the profile

                    // show save button if a bakset is open
                    for(c in basket.cuisines){
                        document.querySelector("#basket-export-btn").style.display = "inline";
                        break;
                    }
                }
            }
            else{
                // error message
                appendModal("<p data='account-response'>" + res + "</p>");
            }
        });
    };

    // client terminates session and informs server
    var logoutAccount = function(){
        if(sessionGUID !== -1){
            sessionGUID = -1;

            CCAPI.logoutAccount(sessionGUID, function(res, status){
                // do something?
            });

            document.querySelector("#nav-right").style.display = "none";
        }
    };

    // shows the instructions modal
    var showHelp = function(){
        displayModal(
            "<div class='cc-container'>" +
                "<p><b>Cuisine</b> searches will find a cuisine by names matching the search.</p>" +
                "<p><b>Taste</b> searches will find cuisines that are associationed with the taste.</p>" +
                "<p><b>Technique</b> searches will find a cuisine that are associated with the technique.</p>" +
            "</div>",
            "Instructions"
        );
    };

    // shows the user profile
    var showProfileModal = function(){
        if(sessionGUID === -1){
            return showLoginModal();
        }

        displayModal(
            "<p>Loading...</p>",
            "Profile"
        );

        CCAPI.requestProfile(sessionGUID, function(res, status){
            if(status === 200){
                displayProfileData(res);
            }
            else{
                // session error, logout
                logout();
                showLoginModal();
            }
        });
    };

    var displayProfileData = function(data){
        try{
            data = JSON.parse(data);
            // looks like [{group_id: 1, name: "cuisine"}]
            setModal(""); // clear loading text
        }
        catch(err){
            setModal("<p>Error loading profile.</p>");
            return;
        }

        // no saved groups?
        if(data.length === 0){
            appendModal("<p>You have no saved groups yet.</p>");
            return;
        }

        // reset group figures
        groupFigures = {};

        // convert [{group_id: 1, name: "cuisine"}] to {1: ["cuisine"]}
        // sorts
        var groups = {};
        for(var i = 0 ; i < data.length; i++){
            var groupID = data[i].group_id,
                name = data[i].name;

            if(groupID.toString() in groups === false){
                groups[groupID] = [];
            }

            var group = groups[groupID];

            var df = new DisplayFigure(name);
            group.push(df);

            if(name in groupFigures === false){
                groupFigures[name] = [df];
            }
            else{
                groupFigures[name].push(df);
            }

        }

        for(var groupID in groups){
            var group = groups[groupID];

            var container = document.createElement("div");
            container.setAttribute("data-group", groupID);
            container.classList.add("cc-group-container");

            container.innerHTML += "<h3>Group " + groupID + "</h3>";
            container.innerHTML += "<button class='cc-btn-add' data-name='import' data-group='" + groupID + "'>Import</button>";
            container.innerHTML += "<button class='cc-btn-remove' data-name='delete' data-group='" + groupID + "'>Delete</button>";
            container.innerHTML += "<hr width='85%'>";

            for(var i = 0; i < group.length; i++){
                container.appendChild(group[i].figure)
            }

            container.appendChild(document.createElement("br")) // for spacing on bottom

            appendModal(container);
        }

        // ugly approach, but loops with functions inside cause problems!
        var setListener = function(btn){
            btn.addEventListener("click", function(evt){
                evt.preventDefault();
                (btn.getAttribute("data-name") === "delete") ? deleteGroup(btn.parentNode) : importGroup(btn.parentNode);
            });
        };

        var btns = document.querySelectorAll("button[data-group]");
        for(var i = 0; i < btns.length; i++){
            setListener(btns[i]);
        }
    };

    var deleteGroup = function(groupElement){
        var groupID = groupElement.getAttribute("data-group");

        CCAPI.deleteGroup(sessionGUID, groupID, function(res, status){
            if(status === 200){
                groupElement.style.display = "none";
            }
        });
    };

    var importGroup = function(groupElement){
        var names = groupElement.querySelectorAll(".item-block-name");
        for(var i = 0; i < names.length; i++){
            basket.add(names[i].textContent);
        }
    };

    var showLoginModal = function(){
        displayModal(
            "<form class='cc-form' action='#'>" +
                "<div class='form-group'>" +
                    "<label for='login-email-input'>Email</label>" +
                    "<input type='email' id='login-email-input' class='form-control' required='required' placeholder='username'>" +
                "</div>" +
                "<div class='form-group'>" +
                    "<label for='login-password-input'>Password</label>" +
                    "<input type='password' id='login-password-input' class='form-control' required='required' placeholder='password'>" +
                "</div>" +
                "<div class='form-group'>" +
                    "<button class='btn' id='submit-login'>Submit</button>" +
                "</div>" +
            "</form>",
            "Account Login"
        );

        document.querySelector("#submit-login").addEventListener("click", function(evt){
            evt.preventDefault();
            loginAccount();
        });

        document.querySelector(".cc-form").addEventListener("submit", function(evt){
            evt.preventDefault();
            loginAccount();
        });

        if(emailCookie){
            document.querySelector("#login-email-input").value = emailCookie;
        }
    };

    var showSignupModal = function(){
        displayModal(
            "<form class='cc-form'>" +
                "<div class='form-group'>" +
                    "<label for='account-firstname-input'>First Name</label>" +
                    "<input id='account-firstname-input' class='form-control' required='required' placeholder='first name'>" +
                "</div>" +
                "<div class='form-group'>" +
                    "<label for='account-lastname-input'>Last Name</label>" +
                    "<input id='account-lastname-input' class='form-control' required='required' placeholder='last name'>" +
                "</div>" +
                "<div class='form-group'>" +
                    "<label for='account-email-input'>Email</label>" +
                    "<input type='email' id='account-email-input' class='form-control' required='required' placeholder='email'>" +
                "</div>" +
                "<div class='form-group'>" +
                    "<label for='account-password-input'>Password</label>" +
                    "<input type='password' id='account-password-input' class='form-control' required='required' placeholder='password'>" +
                "</div>" +
                "<div class='form-group'>" +
                    "<label for='account-confirm-password-input'>Confirm Password</label>" +
                    "<input type='password' id='account-confirm-password-input' class='form-control' required='required' placeholder='confirm password'>" +
                "</div>" +
                "<div class='form-group'>" +
                    "<label for='account-prochef-input'>Professional Chef</label>" +
                    "&nbsp;&nbsp;&nbsp;&nbsp;" +
                    "<input type='checkbox' id='account-prochef-input'>" +
                "</div>" +
                "<div class='form-group'>" +
                    "<button class='btn' id='submit-account'>Submit</button>" +
                "</div>" +
            "</form>",
            "Account Registration"
        );

        document.querySelector("#submit-account").addEventListener("click", function(evt){
            evt.preventDefault();
            createAccount();
        });

        document.querySelector(".cc-form").addEventListener("submit", function(evt){
            evt.preventDefault();
            createAccount();
        });
    };

    var clearBasket = function(){
        for(var name in basket.cuisines){
            basket.remove(name);
        }
    };

    var exportBasket = function(){
        var group = [];
        for(var name in basket.cuisines){
            group.push(name);
        }

        if(group.length < 1){
            // no point in saving nothing!
            return;
        }

        CCAPI.saveGroup(sessionGUID, group, function(res, status){
            if(status === 200){
                displayModal("<p>" + res + "</p>");
                clearBasket();
            }
            else{
                displayModal("<p>Error saving group.</p>");
            }
        });
    };

    var logout = function(){
        sessionGUID = -1;
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
        document.querySelector("#profile-btn").addEventListener("click", showProfileModal);
        document.querySelector("#signup-btn").addEventListener("click", showSignupModal);
        document.querySelector("#help-btn").addEventListener("click", showHelp);
        document.querySelector("#logout-btn").addEventListener("click", logoutAccount);
        document.querySelector("#nav-right a:nth-child(1)").addEventListener("click", showProfileModal);

        // basket buttons
        document.querySelector("#basket-clear-btn").addEventListener("click", clearBasket);
        document.querySelector("#basket-export-btn").addEventListener("click", exportBasket);

        // extract cookies
        var cookies = document.cookie.split("; ");
        for(var i = 0; i < cookies.length; i++){
            if(cookies[i].indexOf("email=") > -1){
                emailCookie = cookies[i].split("=")[1];
                break;
            }
        }

        // load last basket
        loadLocalBasket();

        // parse the query strings...
        var qs = parseQueryStrings();
        if("search" in qs){
            // auto search query string
            document.querySelector("#search-input").value = qs["search"];
            document.querySelector("#search-btn").click();
        }
        else if("form" in qs){
            document.querySelector("#signup-btn").click();
            document.querySelector("#account-firstname-input").value = "anakin";
            document.querySelector("#account-lastname-input").value = "skywalker";
            document.querySelector("#account-email-input").value = "darth@vader.com";
            document.querySelector("#account-password-input").value = "deathstar123";
            document.querySelector("#account-confirm-password-input").value = "deathstar123";
            document.querySelector("#account-prochef-input").checked = true;
        }
        else if("login" in qs){
            document.querySelector("#profile-btn").click();
            document.querySelector("#login-email-input").value = "darth@vader.com";
            document.querySelector("#login-password-input").value = "deathstar123";
        }

        // minigame easter egg!
        //document.querySelector("footer").onclick = createMinigame;

        // version label
        var versionLabel = document.createElement("p");
        versionLabel.innerHTML = "v" + VERSION;
        document.querySelector("footer").appendChild(versionLabel);
    };
    window.addEventListener("load", init);

    // obligatory cool console 'art'
    console.log(
        "  _____________________________________\n" +
        " /\t\t\t\t\t\t\t\t\t   \\\n" +
        "|\t\t\tCUISINE CRUSADER\t\t\t|\n" +
        "|\t\t  ----[  RJ/DR  ]----\t\t\t|\n" +
        "|\t\t  ----[  " + VERSION + "  ]----\t\t\t|\n" +
        " \\_____________________________________/"
    );

    // return public methods
    return {
        basket: () => basket,
        associations: () => commonAssociationManager.associations,
        groupFigures: () => groupFigures
    };
})();
