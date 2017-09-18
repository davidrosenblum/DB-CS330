"use strict";

// import modules
let fs = require("fs"),                 // file system
    ws = require("nodejs-websocket"),   // websocket server
    express = require("express"),       // express (http server)
    mysql = require("mysql");           // mysql database driver

let DEFAULT_SETTINGS = {
    host:           "0.0.0.0",
    http_port:      80,
    ws_port:        9000,
    mysql_host:     "127.0.0.1",
    mysql_user:     "root",
    mysql_password: "",
    mysql_port:     3306
};

let allSockets =    {},
    lastSocketID =  0,  // unique id for sockets
    settings =      null,
    database =      null;

// create the http server
let app = express();

app.use("/", express.static(__dirname + "/public"));

app.route("/").get((req, res) => {
    res.sendFile("index.html");
});

app.route("/database/accounts*").get((req, res) => {
    database.query("SELECT * FROM test.accounts", (err, rows) => {
        res.writeHead(200);
        res.end(JSON.stringify(rows));
    });
});

app.route("/database/associations*").get((req, res) => {
    database.query("SELECT * FROM test.assocations", (err, rows) => {
        res.writeHead(200);
        res.end(JSON.stringify(rows));
    });
});

app.route("/database/ingredients*").get((req, res) => {
    database.query("SELECT * FROM test.ingredients", (err, rows) => {
        res.writeHead(200);
        res.end(JSON.stringify(rows));
    });
});

// create the websocket server
let server = ws.createServer(socket => {
    // socket connected
    socket.id = ++lastSocketID;
    allSockets[socket.id] = socket;

    console.log("Socket-" + socket.id + " connected.");


    // socket sent request...
    socket.on("text", data => handleSocketData(socket, data));

    // socket disconnected...
    socket.on("close", () => {
        console.log("Socket-" + socket.id + " disconnected.");
        delete allSockets[socket.id];
    });

    socket.on("error", err => console.log("Socket error."));
});

// websocket server on listening handler
server.on("listening", () => {
    console.log("WS server listening on " + settings.host + ":" + settings.ws_port + ".");
});

server.on("error", (err) => console.log("WS ERR."));

let handleSocketData = (socket, text) => {
    let type, data;
    try{
        let json = JSON.parse(text);
        type = json.type || null;
        data = json.data || null;

        if(!type || !data){
            throw new Error("Invalid request.");
        }
    }
    catch(err){
        socket.send(err.message);
        return;
    }

    handleRequest(socket, type, data);
};

let handleRequest = (socket, type, data) => {
    if(type === "name"){
        searchByName(socket, data);
    }
    else if(type === "like"){
        searchLikeName(socket, data);
    }
    else{
        socket.send("Bad request.");
    }
};

let searchByName = (socket, data) => {
    database.query(
        "SELECT * FROM test.ingredients " +
        "WHERE name = '" + data + "' LIMIT 1",
        (err, rows) => {
            if(err || rows.length < 1){
                socket.send("No results found for \"" + data + "\".");
            }
            else{
                socket.send(JSON.stringify(rows[0]));
            }
        }
    );
};

let searchLikeName = (socket, data) => {
    database.query(
        "SELECT name FROM ( " +
            "(" +
                "SELECT test.associations.sourceID, test.associations.associateID, test.ingredients.name " +
                "FROM test.associations " +
                "JOIN test.ingredients " +
                "ON test.associations.sourceID = (SELECT id FROM test.ingredients WHERE name = '" + data + "' LIMIT 1) " +
                "AND test.ingredients.id = test.associations.associateID " +
            ") AS search " +
        ")",
        (err, rows) => {
            if(err || rows.length < 1){
                if(err) console.log(err);
                socket.send("No assocations found for \"" + data + "\".");
            }
            else{
                socket.send(JSON.stringify(rows));
            }
        }
    );
};

let addIngredient = (socket, data) => {
    let query = "INSERT INTO test.ingredients";
        params = "(",
        values = "(";

    for(let param in data){
        query += param + ", ";
        values += data[param] + ", ";
    }

    params = params.substring(0, params.length - 2) + ")";
    values = values.substring(0, values.length - 2) + ")";

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

    database = mysql.createConnection({
        host:       settings.mysql_host,
        port:       settings.mysql_port,
        user:       settings.mysql_user,
        password:   settings.mysql_password
    });

    database.connect(err => {
        if(err){
            console.log(err.message);
            process.exit();
        }
        else{
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
            console.log("HTTP server error:\n" + err.message);
            process.exit();
        }
        else{
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

let createDB = () => {
    database.query("CREATE DATABASE IF NOT EXISTS test", (err) => {
        if(!err){
            database.query(
                "CREATE TABLE IF NOT EXISTS test.accounts(" +
                    "id INT AUTO_INCREMENT UNIQUE NOT NULL, " +
                    "username VARCHAR(25) UNIQUE NOT NULL, " +
                    "password VARCHAR(25) UNIQUE NOT NULL, " +
                    "PRIMARY KEY (id)" +
                ")"
            );

            database.query(
                "CREATE TABLE IF NOT EXISTS test.ingredients(" +
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
                ")"
            );

            database.query(
                "CREATE TABLE IF NOT EXISTS test.associations(" +
                    "id INT AUTO_INCREMENT UNIQUE NOT NULL, " +
                    "sourceID INT NOT NULL, " +
                    "associateID INT NOT NULL, " +
                    "PRIMARY KEY (id), " +
                    "FOREIGN KEY (sourceID) REFERENCES test.ingredients(id), " +
                    "FOREIGN KEY (associateID) REFERENCES test.ingredients(id)" +
                ")"
            );

            database.query(
                "INSERT INTO test.ingredients(name) " +
                "VALUES('Jawa Juice'), ('Szechuan McNugget Sauce'), ('Blue Milk'), ('Earl Gray Tea')",
                (err) => {}
            );

            /*database.query(
                "INSERT INTO test.associations(sourceID, associateID) " +
                "VALUES(1,2), (1,3)",
                (err) = {}
            );*/
        }
    });
};

// initializes the entire server
let init = () => {
    console.log("Loading settings...");
    readSettings(err => {
        // settings loaded
        (err) ? console.log("Using default settings.") : console.log("Settings loaded.");

        console.log("Connecting to database...");
        openDBThenServer();
    });
};

init();
