"use strict";

let mysql = require("mysql"),
    Settings = require("./Settings.js");

let DatabaseManager = class DatabaseManager{
    constructor(settings){
        // enforce settings argument is an instance of settings
        if(!settings || !(settings instanceof Settings)){
            throw new Error("settings argument must be of type Settings.");
        }

        // setup the mysql connection
        this.conn = mysql.createConnection({
            host:       settings.mysql_host,
            port:       settings.mysql_port,
            user:       settings.mysql_user,
            password:   settings.mysql_password,
            database:   settings.mysql_database
        });
    }

    query(sql, callback){
        this.conn.query(sql, callback);
    }

    connect(callback){
        this.conn.connect(callback);
    }

    queryName(data, callback){
        // sql query
        this.query(
            "SELECT * FROM ingredients " +
            "WHERE name = '" + data + "' LIMIT 1",
            callback
        );
    }

    queryAssociates(data, callback){
        // sql query
        this.query(
            "SELECT ingredients.name " +
            "FROM associations " +
            "JOIN ingredients " +
            "ON associations.sourceID = (SELECT id FROM ingredients WHERE name = '" + data + "' LIMIT 1) " +
            "AND ingredients.id = associations.associateID ",
            callback
        );
    }

    getIngredientsTableJSON(callback){
        this.query("SELECT * FROM ingredients", (err, rows) => {
            if(err || rows.length < 1){
                
            }
        });
    }

    getAssociationsTableJSON(callback){
        this.query("SELECT * FROM associations", (err, rows) => {
            if(!err){

            }
            else{

            }
        });
    }

    createTables(){
        /*
        // create the accounts tables
        this.query(
            "CREATE TABLE IF NOT EXISTS accounts(" +
                "id INT AUTO_INCREMENT UNIQUE NOT NULL, " +
                "username VARCHAR(25) UNIQUE NOT NULL, " +
                "password VARCHAR(25) UNIQUE NOT NULL, " +
                "PRIMARY KEY (id)" +
            ")",
            err = {}
        );*/

        // create ingredients table
        this.query(
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
        this.query(
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
        this.query(
            "INSERT INTO ingredients(name) " +
            "VALUES('Jawa Juice'), ('Szechuan McNugget Sauce'), ('Blue Milk'), ('Earl Gray Tea')",
            err => {}
        );

        // test associations
        this.query(
            "INSERT INTO associations(sourceID, associateID) " +
            "VALUES(1,2), (1,3)",
            err => {}
        );
    }

    get state(){
        return this.conn.state;
    }
};

module.exports = DatabaseManager;
