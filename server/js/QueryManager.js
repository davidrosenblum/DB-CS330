"use strict";

let mysql = require("mysql"),
    Settings = require("./Settings.js");

let QueryManager = class QueryManager{
    constructor(mysqlConn){
        this.conn = mysqlConn;
    }

    query(sql, callback){
        this.conn.query(sql, callback);
    }

    queryName(name, callback){
        // sql query
        this.query(
            "SELECT * FROM ingredients " +
            "WHERE name = '" + name + "' LIMIT 1",
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
            "AND ingredients.id = associations.associateID " +
            "ORDER BY name ASC",
            callback
        );
    }

    queryNameMatches(name, callback){
        this.query(
            "SELECT name FROM ingredients " +
            "WHERE name LIKE '%" + name + "%' " +
            "ORDER BY name ASC LIMIT 10",
            callback
        );
    }

    getIngredientsTableJSON(callback){
        this.query("SELECT * FROM ingredients", callback);
    }

    getAssociationsTableJSON(callback){
        this.query("SELECT * FROM associations", callback);
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
            err => {
                if(err) return console.log(err.message);
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
                    err => {
                        if(err) return console.log(err.message);
                        // test ingredients
                        this.query(
                            "INSERT INTO ingredients(name) " +
                            "VALUES('Jawa Juice'), ('Szechuan McNugget Sauce'), ('Blue Milk'), ('Earl Gray Tea')",
                            err => {
                                this.query(
                                    "INSERT INTO associations(sourceID, associateID) " +
                                    "VALUES(1,2), (1,3)",
                                    err => {}
                                );
                            }
                        );
                    }
                );
            }
        );
    }

    get state(){
        return this.conn.state;
    }
};

module.exports = QueryManager;
