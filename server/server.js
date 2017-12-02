"use strict";

// import node modules
let fs = require("fs"),                             // file system
    express = require("express"),                   // express (http server)
    mysql = require("mysql");                       // mysql database driver

// import local modules
let Settings = require("./js/Settings.js"),
    QueryManager = require("./js/QueryManager.js");

// constants
const SESSION_DURATION = 1000 * 60 * 12;

// fields
let settings =      null,   // settings object
    database =      null,   // database connection object
    queryManager =  null,   // object that queries the database
    guids =         {};   // dictionary of guids=account

// create the http server
let app = express();

// http server's files folder (the client-side file folder)
app.use("/", express.static(__dirname + "/public"));

// route http get requests to the host and send the index file
app.route("/").get((req, res) => {
    res.sendFile("index.html");
});

// DB connection state requested
app.route("/database").get((req, res) => {
    res.writeHead(200);
    res.end("Database state = " + database.state);
});

app.route("/cuisines/info*").get((req, res) => {
    // extract search
    let search = extractSearchValue(req.url);

    // query and respond
    queryManager.queryCuisineInfo(search, (err, rows) => sendQueryResults(res, err, rows, search));
});

app.route("/cuisines/search*").get((req, res) => {
    // extract search
    let search = extractSearchValue(req.url);

    // query and respond
    queryManager.queryCuisines(search, (err, rows) => sendQueryResults(res, err, rows, search));
});

app.route("/cuisines/associations*").get((req, res) => {
    // extract search
    let search = extractSearchValue(req.url);

    // query and respond
    queryManager.queryCuisineAssociations(search, (err, rows) => sendQueryResults(res, err, rows, search));
});

app.route("/tastes/search*").get((req, res) => {
    // extract search
    let search = extractSearchValue(req.url);

    // query and respond
    queryManager.queryTastes(search, (err, rows) => sendQueryResults(res, err, rows, search));
});

app.route("/tastes/associations*").get((req, res) => {
    // extract search
    let search = extractSearchValue(req.url);

    // query and respond
    queryManager.queryTasteAssociations(search, (err, rows) => sendQueryResults(res, err, rows, search));
});

app.route("/techniques/search*").get((req, res) => {
    // extract search
    let search = extractSearchValue(req.url);

    // query and respond
    queryManager.queryTechniques(search, (err, rows) => sendQueryResults(res, err, rows, search));
});


app.route("/techniques/associations*").get((req, res) => {
    // extract search
    let search = extractSearchValue(req.url);

    // query and respond
    queryManager.queryTechniqueAssociations(search, (err, rows) => sendQueryResults(res, err, rows, search));
});


// handle account create post requests
app.route("/accounts/create*").post((req, res) => {
    console.log("CREATE");
    // enforce requried header
    if(isMissingHeader(req)){
        return;
    }

    handleAccountRequest(req, res);
});

// handle login post requests
app.route("/accounts/login*").post((req, res) => {
    // enforce requried header
    if(isMissingHeader(req)){
        return;
    }

    handleLoginRequest(req, res);
});

app.route("/accounts/profile/get*").get((req, res) => {
    // enforce requried header
    if(isMissingHeader(req)){
        return;
    }

    if(isMissingSessionGUID(req)){
        return;
    }

    let email = requestToEmail(req);
    if(!email) return;

    queryManager.retrieveSavedAssociations(email, (err, rows) => {
        if(err){
            // should never happen!
            console.log(err.message);
            res.writeHead(500);
            res.end("Server error.");
        }
        else{
            res.writeHead(200);
            res.end(JSON.stringify(rows, null, 2));
        }
    });
});

app.route("/accounts/profile/set*").post((req, res) => {
    // enforce requried header
    if(isMissingHeader(req)){
        return;
    }

    if(isMissingSessionGUID(req)){
        return;
    }

    let email = requestToEmail(req);
    if(!email) return;

    extractPostJSON(req, (err, data) => {
        queryManager.saveAssociations(email, data, errs => {
            if(errs){
                for(let err of errs){
                    console.log(err.message);
                }
            }

            res.writeHead(200);
            res.end("Saved with " + (errs ? errs.length : 0) + " errors.");
        });
    });
});

app.route("/accounts/profile/delete*").post((req, res) => {
    // enforce requried header
    if(isMissingHeader(req)){
        return;
    }

    if(isMissingSessionGUID(req)){
        return;
    }

    let email = requestToEmail(req);
    if(!email) return;

    let groupID = req.headers["x-group-id"] || -1;
    if(groupID < 0){
        res.writeHead(400);
        res.end("Group does not exist.");
        return;
    }

    queryManager.deleteAssociationsGroup(email, groupID, (err) => {
        if(err){
            res.writeHead(500);
            res.end("Server error.");
            console.log(err.message);
        }
        else{
            res.writeHead(200);
            res.end("Group " + groupID + " successfully deleted.");
        }
    });
});

// http options
app.route("*").options((req, res) => {
    res.writeHead(200, {
        "Access-Control-Allow-Headers": "x-cuisine-crusader"
    });
    res.end();
});

app.route("/sesssions/clear").get((req, res) => {
    if(req.headers["x-cc-dev"] === "darksouls3"){
        guids = {};
        res.writeHead(200);
        res.end("Session IDs cleared.");
    }
    else{
        res.writeHead(403);
        res.end("I find your lack of access disturbing.");
    }
});

// secret backdoor for session guids!
app.route("/sessions/guids").get((req, res) => {
    if(req.headers["x-cc-dev"] === "darksouls3"){
        res.writeHead(200);
        res.end(JSON.stringify(guids, null, 2));
    }
    else{
        res.writeHead(403);
        res.end("I find your lack of access disturbing.");
    }
});

// secret backdoor for server termination!
app.route("/killswitch/engage").get((req, res) => {
    if(req.headers["x-cc-dev"] === "darksouls3"){
        res.writeHead(200);
        res.end("Server shutdown.");

        console.log("Server shutdown.");
        process.exit();
    }
    else{
        res.writeHead(403);
        res.end("I find your lack of access disturbing.");
    }
});

// send the 404 page to non-existent urls
app.route("*").get((req, res) => {
    res.sendFile(__dirname + "/public/404.html");
});

let isMissingHeader = (req) => {
    if(req.headers["x-cuisine-crusader"] !== "rjdr"){
        res.writeHead(400);
        res.end("You shall not pass.");
        return true;
    }
    return false;
};

let isMissingSessionGUID = (req) => {
    if(!req.headers["x-session-guid"]){
        res.writeHead(400);
        res.end("You're not logged in.");
        return true;
    }
    return false;
};

let requestToEmail = (req) => {
    let email = guids[req.headers["x-session-guid"]];
    if(!email){
        res.writeHead(400);
        res.end("Invalid session ID.");
        return null;
    }
    return email;
};

// generates a unique session guid
let generateSessionGUID = () => {
    // extract current date string
    let guid = Date.now().toString();
    guid = "CC" + guid.substring(guid.length-6, guid.length)

    // append 5 random numbers (1-9)
    for(let i = 0; i < 5; i++){
        guid +=  parseInt(Math.random() * 8 + 1);
    }

    // enforce uniquness
    return (guid in guids) ? generateSessionGUID() : guid;
};

// creates an account from an http request
let handleAccountRequest = (req, res) => {
    // read the post body
    extractPostJSON(req, (err, data) => {
        // if the post body was successfully parsed... validate all fields are present
        if(!err){
            if(typeof data.email !== "string")              err = new Error("Email not specified.");
            else if(typeof data.password !== "string")      err = new Error("Password not specified.");
            else if(typeof data.first_name !== "string")    err = new Error("First name not specified.");
            else if(typeof data.last_name !== "string")     err = new Error("Last name not specified.");
        }

        // json parse error or 'not specified' error
        if(err){
            res.writeHead(400);
            res.end(err.message);
            return;
        }

        // email must be an email
        if(data.email.indexOf(".") === -1 || data.email.indexOf("@") === -1){
            res.writeHead(400);
            res.end("Please enter a valid email.");
            return;
        }

        // default values
        data.pro_chef = (typeof data.pro_chef === "boolean") ? data.pro_chef : false;

        // create the account in the database
        queryManager.createAccount(data.email, data.password, data.first_name, data.last_name, data.pro_chef, err => {
            if(err){
                // database error
                res.writeHead(400);
                res.end("Account \"" + data.email + "\" already registered.");
            }
            else{
                // success
                res.writeHead(200);
                res.end("Account \"" + data.email + "\" created.");
            }
        });
    });
};

// validates an account from an http request, stamps it with a session guid on success
let handleLoginRequest = (req, res) => {
    extractPostJSON(req, (err, data) => {
        // if the post body was successfully parsed... validate all fields are present
        if(!err){
            if(typeof data.email !== "string")              err = new Error("Email not specified.");
            else if(typeof data.password !== "string")      err = new Error("Password not specified.");
        }

        // json parse error or 'not specified' error
        if(err){
            res.writeHead(400);
            res.end(err.message);
            return;
        }

        queryManager.retrieveAccountData(data.email, data.password, (err, rows) => {
            if(err || rows.length < 1){
                res.writeHead(400);
                res.end("Username and password match not found.");
            }
            else{
                // rows array will only have 1 value (email is unique)
                let account = rows[0];

                // force case sensitivity (ignored by sql)
                if(data.email !== account.email || data.password !== account.password){
                    res.writeHead(400);
                    res.end("Username and password match not found.");
                    return;
                }

                // successful login
                let guid = generateSessionGUID();
                guids[guid] = data.email;
                setTimeout(() => delete guids[guid], SESSION_DURATION);

                res.writeHead(200, {
                    "set-cookie": "email=" + data.email,
                    "x-session-guid": guid
                });
                res.end("Successful login!");
            }
        });
    });
};

// reads the post data (body) from a post http request
let extractPostJSON = (req, callback) => {
    // read the data
    req.on("data", data => {
        try{
            // attempt to parse the data
            let json = JSON.parse(data);
            callback(null, json);
        }
        catch(err){
            // parse error
            callback(err, null);
            return;
        }
    });
};

// formatted response to an http request
let sendQueryResults = (res, err, rows, search) => {
    if(!err && rows.length > 0){
        // match found
        let result;
        if(!("id" in rows[0]) && "name" in rows[0]){
            // its {name: a, name: b}
            result = formatNameList(rows);
        }
        else if("id" in rows[0]){
            // its the table data [{...}]
            result = rows[0];
        }

        res.writeHead(200);
        res.end(JSON.stringify(result, null, 4));
    }
    else if(!err){
        // no match
        res.writeHead(400);
        res.end("No results for \"" + search + "\".");
    }
    else{
        // query error
        console.log(err.message);
        res.writeHead(500);
        res.end("Server error.")
    }
};

// converts {name: a, name: b} to [a, b]
let formatNameList = (rows) => {
    let list = [];
    for(let row of rows){
        if("name" in row){
            list.push(row.name);
        }
    }
    return list;
};

// extracts the name from the url
let extractSearchValue = (url) => {
    // ex: 'http://host/directory/hello_there' -> 'hello there'
    let split = url.split("/"),
        extract = split[split.length - 1];

    // query string (multiple search params)?
    if(extract.indexOf("?") > -1){
        // ex: 'http://host/directory/hello_there?c[]=darnkess&c[]=my_old_friend' ->
        // ['hello there', 'darkness', 'my old friend']

        let extractSplit = extract.split("?"),
            qs = extractSplit[1].split("&");

        let searches = [formatSearchValue(extractSplit[0])];
        for(let qsPair of qs){
            let qsSplit = qsPair.split("=");

            if(qsSplit[0] === "c[]"){
                searches.push(formatSearchValue(qsSplit[1]));
            }
        }

        return searches;
    }

    return formatSearchValue(extract);
};

let formatSearchValue = (search) => {
    return search.replace(new RegExp("_", "g"), " ");
};

// reconnects the DB when it crashes
let connectDB = (callback) => {
    // setup the mysql connection
    database = mysql.createConnection({
        host:       settings.mysql_host,
        port:       settings.mysql_port,
        user:       settings.mysql_user,
        password:   settings.mysql_password,
        database:   settings.mysql_database
    });

    // handle database error
    database.on("error", (err) => {
        // log the error msg
        console.log("DB ERR\t" + err);

        // attempt reconnect
        connectDB(err => {
            if(!err) console.log("Database reconnected.");
        });
    });

    // create the query manager for the databse connection instance
    queryManager = new QueryManager(database);

    // connect
    database.connect(callback);
};

// initializes the entire server
// scary async function... loads settings -> connects to DB -> opens HTTP server
let init = () => {
    // read the settings file
    console.log("Loading settings...");
    Settings.readSettings((err, json) => {
        // settings loaded (uses settings file OR defaults)
        (err) ? console.log("Using default settings.") : console.log("Settings loaded.");
        settings = json;

        // process env override
        settings.port = ((process.env.PORT) ? process.env.PORT : settings.port);

        // connect to the database
        console.log("Connecting to database...");

        // connect to the database
        connectDB(err => {
            if(err){
                // database failed to connect
                console.log(err.message);
            }
            else{
                // database connected
                queryManager.createTables();
                console.log("Database connected.");
            }

            // open the http server
            app.listen(settings.port, err => {
                if(err){
                    // http server failed to open
                    console.log("HTTP server error:\n" + err.message);
                    process.exit();
                }
                else{
                    // http server opened
                    console.log("HTTP server listening on port " + settings.port + ".");
                }
            });
        });
    });
};

console.log("|-------------> Cuisine Crusader Server <-------------|");
init();
