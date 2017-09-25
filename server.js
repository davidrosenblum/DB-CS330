"use strict";

// import node modules
let fs = require("fs"),                 // file system
    ws = require("nodejs-websocket"),   // websocket server
    express = require("express"),       // express (http server)
    mysql = require("mysql");           // mysql database driver

// import local modules
let Settings = require("./server_modules/Settings.js"), // settings utils
    DatabaseManager = require("./server_modules/DatabaseManager.js");

// fields
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

// websocket configuration
let serverConfig = {
    secure: false,
    validProtocols: ["ws:", "wss:"]
};

// create the websocket server
let server = ws.createServer(serverConfig, socket => {
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
    // node connected to db?
    if(database.state !== "authenticated"){
        socket.send("Database is currently offline.");
        return;
    }

    // determine the function the socket is requesting
    if(type === "get-by-name"){
        getByName(socket, data);
    }
    else if(type === "get-associations"){
        getAssociations(socket, data);
    }
    else if(type === "get-by-params"){
        socket.send("\"Paramater search feature not yet implemented.\"");
    }
    else if(type === "set-association"){
        socket.send("\"Associate feature not yet implemented.\"");
    }
    else if(type === "add-ingredient"){
        socket.send("\"Add feature not yet implemented.\"");
    }
    else{
        socket.send("Bad request type.");
    }
};

let getByName = (socket, data) => {
    database.queryName(data, (err, rows) => {
        if(err || rows.length < 1){
            // invalid response
            if(err) console.log(err);
            socket.send("No results found for \"" + data + "\".");
        }
        else{
            // success, respond to the socket
            socket.send(JSON.stringify(rows[0]));
        }
    });
};

let getAssociations = (socket, data) => {
    database.queryAssociates(data, (err, rows) => {
        if(err || rows.length < 1){
            // error or no result
            if(err) console.log(err.message);
            socket.send("No assocations found for \"" + data + "\".");
        }
        else{
            // success, send the results
            socket.send(JSON.stringify(rows));
        }
    });
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
    database = new DatabaseManager(settings);

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
            database.createTables();
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

// initializes the entire server
let init = () => {
    // read the settings file
    console.log("Loading settings...");
    Settings.readSettings((err, json) => {
        // settings loaded (uses settings file OR defaults)
        (err) ? console.log("Using default settings.") : console.log("Settings loaded.");
        settings = json;

        // process env override
        settings.http_port = ((process.env.PORT) ? process.env.PORT : settings.http_port);

        // connect to the database then open the http/ws servers
        console.log("Connecting to database...");
        openDBThenServer();
    });
};

console.log("|-------------> Cuisine Crusader Server <-------------|");
init();
