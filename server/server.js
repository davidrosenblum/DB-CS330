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

// associations table JSON requested
app.route("/associations/get*").get((req, res) => {
    queryManager.getAssociationsTableJSON((err, rows) => {
        if(err) console.log(err.message);
        res.writeHead(200);
        res.end(JSON.stringify((rows || []), null, 2));
    });
});

// request assocations for ingredient by name
app.route("/associations/name*").get((req, res) => {
    // extract the name from the url
    let name = extractUrlValue(req.url);

    queryManager.queryAssociates(name, (err, rows) => {
        if(!err && rows.length > 0){
            // successful query
            // convert [{name: "..."}] to ["..."]
            let resultData = [];
            for(var associate of rows){
                resultData.push(associate.name);
            }

            // respond
            res.writeHead(200);
            res.end(JSON.stringify(resultData, null, 2));
        }
        else{
            // error or no data
            if(err) console.log(err.message);
            res.writeHead(400);
            res.end("No associations for \"" + name + "\".");
        }
    });
});

// ingredients table JSON requested
app.route("/ingredients/get*").get((req, res) => {
    queryManager.getIngredientsTableJSON((err, rows) => {
        if(err) console.log(err.message);
        res.writeHead(200);
        res.end(JSON.stringify((rows || []), null, 2));
    });
});

// get ingredient by name request
app.route("/ingredients/name*").get((req, res) => {
    let name = extractUrlValue(req.url);

    queryManager.queryName(name, (err, rows) => {
        if(!err && rows.length > 0){
            res.writeHead(200);
            res.end(JSON.stringify(rows[0], null, 2));
        }
        else{
            if(err) console.log(err.message);
            res.writeHead(400);
            res.end("No results for \"" + name + "\".");
        }
    });
});

app.route("/ingredients/find*").get((req, res) => {
    let name = extractUrlValue(req.url);

    queryManager.queryNameMatches(name, (err, rows) => {
        if(!err && rows.length > 0){
            // successful query
            // convert [{name: "..."}] to ["..."]
            let resultData = [];
            for(var associate of rows){
                resultData.push(associate.name);
            }

            res.writeHead(200);
            res.end(JSON.stringify(resultData, null, 2));
        }
        else{
            if(err) console.log(err.message);
            res.writeHead(400);
            res.end("No results for \"" + name + "\".");
        }
    });
});

app.route("/ingredients/search*").post((req, res) => {
    // read the body
    req.on("data", (body) => {
        try{
            let json = JSON.parse(body);


        }
        catch(err){

        }
    });
});

// extracts the name from the url
let extractUrlValue = (url) => {
    // ex: 'http://host/directory/hello_there' -> 'hello there'
    let split = url.split("/"),
        extract = split[split.length - 1];

    return extract.replace(new RegExp("_", "g"), " ");
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
