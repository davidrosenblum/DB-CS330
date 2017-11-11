"use strict";

// import node modules
let fs = require("fs"),                             // file system
    express = require("express"),                   // express (http server)
    mysql = require("mysql");                       // mysql database driver

// import local modules
let Settings = require("./js/Settings.js"),
    QueryManager = require("./js/QueryManager.js");

// fields
let settings =      null,   // settings object
    database =      null,   // database connection object
    queryManager =  null;   // object that queries the database

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
    let search = extractSearchValue(req.url);

    queryManager.queryCuisineInfo(search, (err, rows) => sendQueryResults(res, err, rows, search));
});

app.route("/cuisines/search*").get((req, res) => {
    let search = extractSearchValue(req.url);

    queryManager.queryCuisines(search, (err, rows) => sendQueryResults(res, err, rows, search));
});

app.route("/cuisines/associations*").get((req, res) => {
    let search = extractSearchValue(req.url);

    queryManager.queryCuisineAssociations(search, (err, rows) => sendQueryResults(res, err, rows, search));
});

app.route("/tastes/search*").get((req, res) => {
    let search = extractSearchValue(req.url);

    queryManager.queryTastes(search, (err, rows) => sendQueryResults(res, err, rows, search));
});

app.route("/tastes/associations*").get((req, res) => {
    let search = extractSearchValue(req.url);

    queryManager.queryTasteAssociations(search, (err, rows) => sendQueryResults(res, err, rows, search));
});

app.route("/techniques/search*").get((req, res) => {
    let search = extractSearchValue(req.url);

    queryManager.queryTechniques(search, (err, rows) => sendQueryResults(res, err, rows, search));
});

app.route("/techniques/associations*").get((req, res) => {
    let search = extractSearchValue(req.url);

    queryManager.queryTechniqueAssociations(search, (err, rows) => sendQueryResults(res, err, rows, search));
});

let sendQueryResults = (res, err, rows, search) => {
    if(!err && rows.length > 0){
        // match found
        let result;
        if(!("id" in rows[0]) && "name" in rows[0]){
            // its {name: a, name: b}
            result = formatNameList(rows);
        }
        else if("id" in rows[0]){
            // its the table data
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
