"use strict";

// import modules
let fs = require("fs"),                 // file system
    ws = require("nodejs-websocket"),   // websocket server
    express = require("express"),       // express (http server)
    mysql = require("mysql");           // mysql database driver

// default settings object
let DEFAULT_SETTINGS = {
    host:           "0.0.0.0",
    http_port:      80,
    ws_port:        9000,
    mysql_host:     "127.0.0.1",
    mysql_user:     "root",
    mysql_password: "",
    mysql_port:     3306,
    mysql_database: "cuisine-crusader"
};

let lastSocketID =  0,      // unique id for sockets
    settings =      null,   // settings object
    database =      null;   // database connection object

// create the http server
let app = express();

// http server's files folder (the client-side file folder)
app.use("/", express.static(__dirname + "/public"));

// route http get requests to the host and send the index file
app.route("/").get((req, res) => {
    res.sendFile("index.html");
});

// REST API functionality, give accounts JSON
/*app.route("/database/accounts*").get((req, res) => {
    database.query("SELECT * FROM accounts", (err, rows) => {
        res.writeHead(200);
        res.end(JSON.stringify(rows));
    });
});*/

// REST API functionality, give associations JSON
app.route("/database/associations*").get((req, res) => {
    database.query("SELECT * FROM assocations", (err, rows) => {
        res.writeHead(200);
        res.end(JSON.stringify(rows));
    });
});

// REST API functionality, give ingredients JSON
app.route("/database/ingredients*").get((req, res) => {
    database.query("SELECT * FROM ingredients", (err, rows) => {
        res.writeHead(200);
        res.end(JSON.stringify(rows));
    });
});

// REST API functionality, give DB connection state
app.route("/database").get((req, res) => {
    res.writeHead(200);
    res.end("Database state = " + database.state);
});

// create the websocket server
let server = ws.createServer(socket => {
    // socket connected
    socket.id = ++lastSocketID;
    console.log("Socket-" + socket.id + " connected.");


    // socket sent request...
    socket.on("text", data => handleSocketData(socket, data));

    // socket disconnected...
    socket.on("close", () => console.log("Socket-" + socket.id + " disconnected."));

    // socket error...
    socket.on("error", err => console.log("Socket error."));
});

// websocket server on listening handler
server.on("listening", () => console.log("WS server listening on " + settings.host + ":" + settings.ws_port + "."));

// handler for when the ws server has an error
server.on("error", err => console.log("WS server error.\n" + err.message));

// handler for when a socket submits a request
let handleSocketData = (socket, text) => {
    // parse the socket data
    let type, data;
    try{
        let json = JSON.parse(text);
        type = json.type || null;
        data = json.data || null;

        if(!type || !data){
            // json formatted wrong
            throw new Error("Invalid request - type or data is invalid or missing.");
        }
    }
    catch(err){
        // bad request (prob json parse err)
        socket.send(err.message);
        return;
    }

    // request parsed
    handleRequest(socket, type, data);
};

let handleRequest = (socket, type, data) => {
    // node is not connected to database
    if(database.state !== "authenticated"){
        socket.send("Database is currently offline.");
        return;
    }

    // determine the function the socket is requesting
    if(type === "name"){
        searchByName(socket, data);
    }
    else if(type === "like"){
        searchLikeName(socket, data);
    }
    else if(type === "associate"){
        socket.send("\"Associate feature not yet implemented.\"");
    }
    else if(type === "add"){
        socket.send("\"Add feature not yet implemented.\"");
    }
    else{
        socket.send("Bad request.");
    }
};

let searchByName = (socket, data) => {
    // sql query
    database.query(
        "SELECT * FROM ingredients " +
        "WHERE name = '" + data + "' LIMIT 1",
        (err, rows) => {
            if(err || rows.length < 1){
                // invalid response
                socket.send("No results found for \"" + data + "\".");
            }
            else{
                // success, respond to the socket
                socket.send(JSON.stringify(rows[0]));
            }
        }
    );
};

let searchLikeName = (socket, data) => {
    // sql query
    database.query(
        "SELECT ingredients.name " +
        "FROM associations " +
        "JOIN ingredients " +
        "ON associations.sourceID = (SELECT id FROM ingredients WHERE name = '" + data + "' LIMIT 1) " +
        "AND ingredients.id = associations.associateID ",
        (err, rows) => {
            if(err || rows.length < 1){
                // invalid response
                if(err) console.log(err);
                socket.send("No assocations found for \"" + data + "\".");
            }
            else{
                // success, respond to the socket
                socket.send(JSON.stringify(rows));
            }
        }
    );
};

// adds an ingredient to the database
let addIngredient = (socket, data) => {
    // create the sql query
    let query = "INSERT INTO ingredients";
        params = "(",
        values = "(";

    for(let param in data){
        query += param + ", ";
        values += data[param] + ", ";
    }

    params = params.substring(0, params.length - 2) + ")";
    values = values.substring(0, values.length - 2) + ")";

    // respond to the socket
    database.query(query, err => {
        socket.send((err) ? err.message : "Ingredient added.");
    });
};

let searchByParams = (socket, data) => {
    database.query();
};

let openDBThenServer = (callback) => {
    // make sure settings is not null
    settings = null ? DEFAULT_SETTINGS : settings;
    // process env override
    settings.http_port = ((process.env.PORT) ? process.env.PORT : settings.http_port);


    // setup the mysql connection
    database = mysql.createConnection({
        host:       settings.mysql_host,
        port:       settings.mysql_port,
        user:       settings.mysql_user,
        password:   settings.mysql_password,
        database:   settings.mysql_database
    });

    // connect to the database
    database.connect(err => {
        if(err){
            // database failed to connect
            console.log(err.message);
            //process.exit();
            openServer();
        }
        else{
            // database connected, open the ws/http server and create the DB (if it doesnt exist)
            createDB();
            console.log("Database connected.");
            openServer();
        }
    })
};

// open the http & ws servers
let openServer = () => {
    // open the websocket server
    server.listen(settings.ws_port, settings.host);

    // open the http server
    app.listen(settings.http_port, settings.host, (err) => {
        if(err){
            // http server failed to open
            console.log("HTTP server error:\n" + err.message);
            //process.exit();
        }
        else{
            // http server opened
            console.log("HTTP server listening on " + settings.host + ":" + settings.http_port + ".");
        }
    });
};

// reads the 'settings.json' file
let readSettings = (callback) => {
    // load the settings fille (async)...
    fs.readFile("settings.json", (err, res) => {
        settings = {};

        if(!err){
            // file read
            try{
                // attempt to parse the file
                settings = JSON.parse(res);
            }
            catch(err){
                // error parsing file - do nothing
                // defaults will be loaded in next step
            }
        }
        else{
            // file NOT read - write the default
            console.log("(Writing default settings file)");
            fs.writeFile("settings.json", JSON.stringify(DEFAULT_SETTINGS, null, 4));
        }

        // add missing or invalid setting parameters
        for(let opt in DEFAULT_SETTINGS){
            if(typeof settings[opt] !== typeof DEFAULT_SETTINGS[opt]){
                settings[opt] = DEFAULT_SETTINGS[opt];
            }
        }

        // trigger optional callback
        if(typeof callback === "function"){
            callback(err, settings);
        }
    });
};

// creates the database and tables
let createDB = () => {
    // create the database tables
    /*database.query(
        "CREATE TABLE IF NOT EXISTS accounts(" +
            "id INT AUTO_INCREMENT UNIQUE NOT NULL, " +
            "username VARCHAR(25) UNIQUE NOT NULL, " +
            "password VARCHAR(25) UNIQUE NOT NULL, " +
            "PRIMARY KEY (id)" +
        ")",
        err = {}
    );*/

    // create ingredients table
    database.query(
        "CREATE TABLE IF NOT EXISTS ingredients(" +
            "id INT AUTO_INCREMENT UNIQUE NOT NULL, " +
            "name VARCHAR(50) UNIQUE NOT NULL, " +
            "flavor ENUM('Sweet', 'Sour', 'Hot') NOT NULL, " +
            "weight ENUM('Heavy', 'Medium', 'Light') NOT NULL, " +
            "season ENUM('Summer', 'Spring', 'Winter', 'Fall') NOT NULL, " +
            "volume ENUM('Quiet', 'Moderate', 'Loud') NOT NULL, " +
            "calories INT, " +
            "calorieServing VARCHAR(255), " +
            "protein INT, " +
            "techniques VARCHAR(255), " +
            "PRIMARY KEY (id) " +
        ")",
        err => {}
    );

    // create the associations table
    database.query(
        "CREATE TABLE IF NOT EXISTS associations(" +
            /*"id INT AUTO_INCREMENT UNIQUE NOT NULL, " +*/
            "sourceID INT NOT NULL, " +
            "associateID INT NOT NULL, " +
            "PRIMARY KEY (sourceID, associateID), " +
            "FOREIGN KEY (sourceID) REFERENCES ingredients(id) ON DELETE CASCADE, " +
            "FOREIGN KEY (associateID) REFERENCES ingredients(id) ON DELETE CASCADE" +
        ")",
        err => {}
    );

    // test ingredients
    database.query(
        "INSERT INTO ingredients(name) " +
        "VALUES('Jawa Juice'), ('Szechuan McNugget Sauce'), ('Blue Milk'), ('Earl Gray Tea')",
        err => {}
    );

    // test associations
    database.query(
        "INSERT INTO associations(sourceID, associateID) " +
        "VALUES(1,2), (1,3)",
        err => {}
    );
};

// initializes the entire server
let init = () => {
    // read the settings file
    console.log("Loading settings...");
    readSettings(err => {
        // settings loaded (uses settings file OR defaults)
        (err) ? console.log("Using default settings.") : console.log("Settings loaded.");

        // connect to the database then open the http/ws servers
        console.log("Connecting to database...");
        openDBThenServer();
    });
};

console.log("|-------------> Cuisine Crusader Server <-------------|");
init();
