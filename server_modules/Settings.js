"use strict";

// import file system node module
let fs = require("fs");

// default settings object
let DEFAULT_SETTINGS = {
    port:           8080,
    mysql_host:     "127.0.0.1",
    mysql_user:     "root",
    mysql_password: "",
    mysql_port:     3306,
    mysql_database: "cuisine-crusader"
};

let Settings = class Settings{
    constructor(opts){
        opts = !opts ? {} : opts;

        // add missing or invalid setting parameters
        for(let opt in DEFAULT_SETTINGS){
            if(typeof opts[opt] !== typeof DEFAULT_SETTINGS[opt]){
                this[opt] = DEFAULT_SETTINGS[opt];
            }
            else{
                this[opt] = opts[opt];
            }
        }
    }

    static writeDefaultSettings(callback){
        // write the file
        return fs.writeFile("settings.json", JSON.stringify(DEFAULT_SETTINGS, null, 4));
    }

    static readSettings(callback){
        // load the settings fille (async)...
        fs.readFile("settings.json", (err, res) => {
            // read operation complete
            let settings = null;

            if(!err){
                // file read
                try{
                    // attempt to parse the file
                    settings = new Settings(JSON.parse(res));
                }
                catch(err){
                    // error parsing file - use defaults
                    settings = new Settings();
                }
            }
            else{
                // file NOT read - write and use the default
                console.log("(Writing default settings file)");
                Settings.writeDefaultSettings();
                settings = new Settings(); // use defaults
            }

            // trigger optional callback
            if(typeof callback === "function"){
                callback(err, settings);
            }
        });
    }
};

Settings.DEFAULT_SETTINGS = DEFAULT_SETTINGS;

module.exports = Settings;
