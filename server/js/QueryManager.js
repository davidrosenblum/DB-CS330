"use strict";

let mysql = require("mysql"),
    Settings = require("./Settings.js");

const MAX_RESULT_ROWS = 10;

let QueryManager = class QueryManager{
    constructor(mysqlConn){
        this.conn = mysqlConn;
    }

    query(sql, callback){
        this.conn.query(sql, callback);
    }

    // cuisine name search
    queryCuisines(search, callback){
        search = (search instanceof Array) ? search[0] : search;

        /* search = (search instanceof Array) ? search : [search];
        let where = "WHERE";
        for(let name of search){
            where += " name LIKE '%" + name + "%' AND"
        }
        where = where.substring(0, where.length - 3) + " ";*/

        this.query(
            "SELECT name FROM cuisines " +
            "WHERE name LIKE '%" + search + "%' " +
            "ORDER BY name ASC LIMIT " + MAX_RESULT_ROWS,
            callback
        );
    }

    // all data for 1 cuisine
    queryCuisineInfo(search, callback){
        this.query(
            "SELECT * FROM cuisines " +
            "WHERE name = '" + search + "' LIMIT 1",
            callback
        );
    }

    // list of cuisine-cuisine associations
    queryCuisineAssociations(search, callback){
        /*search = (search instanceof Array) ? search : [search];

        let where = "WHERE ";
        for(let name of search){
            where += "(ca.cuisine_id = (SELECT id FROM cuisines WHERE name = '" + name + "') OR " +
            "ca.association_id = (SELECT id FROM cuisines WHERE name = '" + name + "')) AND "
        }

        let sql =
            "SELECT c.name FROM cuisines c " +
            "JOIN cuisine_associations ca " +
            "ON c.id = ca.association_id " +
            where.substring(0, where.length - 4) +
            "ORDER BY c.name ASC";

        this.query(
            sql,
            callback
        );*/

        this.query(
            "SELECT c.name FROM cuisines c " +
            "JOIN cuisine_associations ca " +
            "ON c.id = ca.association_id " +
            "WHERE ca.cuisine_id = (SELECT id FROM cuisines WHERE name = '" + search + "')" +
            "ORDER BY c.name ASC",
            callback
        );
    }

    // taste name search
    queryTastes(search, callback){
        this.query(
            "SELECT name FROM tastes " +
            "WHERE name LIKE '%" + search + "%' " +
            "ORDER BY NAME ASC LIMIT " + MAX_RESULT_ROWS,
            callback
        );
    }

    // list of taste-cuisine associations
    queryTasteAssociations(search, callback){
        this.query(
            "SELECT c.name FROM tastes t " +
            "JOIN taste_associations ta " +
            "ON t.id = ta.taste_id " +
            "JOIN cuisines c " +
            "ON c.id = ta.cuisine_id " +
            "WHERE t.name = '" + search + "'",
            callback
        );
    }

    // technique name search
    queryTechniques(search, callback){
        this.query(
            "SELECT name FROM techniques " +
            "WHERE name LIKE '%" + search + "%' " +
            "ORDER BY NAME ASC LIMIT " + MAX_RESULT_ROWS,
            callback
        );
    }

    // list of technique-cuisine associations
    queryTechniqueAssociations(search, callback){
        this.query(
            "SELECT c.name FROM techniques t " +
            "JOIN technique_associations ta " +
            "ON t.id = ta.technique_id " +
            "JOIN cuisines c " +
            "ON c.id = ta.cuisine_id " +
            "WHERE t.name = '" + search + "'",
            callback
        );
    }

    // create the database tables
    createTables(){
        // create techniques table
        this.query(
            "CREATE TABLE IF NOT EXISTS techniques(" +
                "id SMALLINT(4) AUTO_INCREMENT UNIQUE NOT NULL, " +
                "name VARCHAR(30) NOT NULL, " +
                "PRIMARY KEY (id)" +
            ")"
        );

        // create tastes table
        this.query(
            "CREATE TABLE IF NOT EXISTS tastes(" +
                "id SMALLINT(4) AUTO_INCREMENT UNIQUE NOT NULL, " +
                "name VARCHAR(30) NOT NULL, " +
                "PRIMARY KEY (id)" +
            ")"
        );

        // create cuisines table
        this.query(
            "CREATE TABLE IF NOT EXISTS cuisines(" +
                "id INT AUTO_INCREMENT UNIQUE NOT NULL, " +
                "name VARCHAR(30) UNIQUE NOT NULL, " +
                "season ENUM(" +
                    "'Autumn', 'Autumn-Spring', 'Autumn-Winter', 'Spring'," +
                    "'Spring-Autumn', 'Spring-Summer', 'Summer', 'Summer-Autumn'," +
                    "'Winter', 'Winter-Spring', 'Year-Round'" +
                ")," +
                "function ENUM(" +
                    "'Cooling', 'Heating', 'Warming'" +
                ")," +
                "weight ENUM(" +
                    "'Heavy', 'Light', 'Light-Medium', 'Medium'," +
                    "'Medium-Heavy', 'Very Light'" +
                ")," +
                "volume ENUM(" +
                    "'Loud', 'Mild-Moderate', 'Moderate-Loud', 'Quiet'," +
                    "'Quiet-Moderate', 'Variable', 'Very Loud', 'Very Quiet', 'Moderate'" +
                ")," +
                "tips VARCHAR(300), " +
                "PRIMARY KEY (id) " +
            ")"
        );

        this.query(
            "CREATE TABLE IF NOT EXISTS technique_associations(" +
                "cuisine_id INT(8) NOT NULL, " +
                "technique_id SMALLINT(4) NOT NULL, " +
                "INDEX (cuisine_id), " +
                "INDEX (technique_id), " +
                "FOREIGN KEY (cuisine_id) REFERENCES cuisines(id) " +
                    "ON UPDATE CASCADE " +
                    "ON DELETE RESTRICT, " +
                "FOREIGN KEY (technique_id) REFERENCES techniques(id) " +
                    "ON UPDATE CASCADE " +
                    "ON DELETE RESTRICT, " +
                "PRIMARY KEY (cuisine_id, technique_id)" +
            ")"
        );

        this.query(
            "CREATE TABLE IF NOT EXISTS taste_associations(" +
                "cuisine_id INT(8) NOT NULL, " +
                "taste_id SMALLINT(4) NOT NULL, " +
                "INDEX (cuisine_id), " +
                "INDEX (taste_id), " +
                "FOREIGN KEY (cuisine_id) REFERENCES cuisines(id) " +
                    "ON UPDATE CASCADE " +
                    "ON DELETE RESTRICT, " +
                "FOREIGN KEY (taste_id) REFERENCES tastes(id) " +
                    "ON UPDATE CASCADE " +
                    "ON DELETE RESTRICT, " +
                "PRIMARY KEY (cuisine_id, taste_id)" +
            ")"
        );

        this.query(
            "CREATE TABLE IF NOT EXISTS cuisine_associations(" +
                "cuisine_id INT(8) NOT NULL, " +
                "association_id INT(8) NOT NULL, " +
                "compatibility ENUM(" +
                    "'Avoid', 'Compatible', 'Recommended', " +
                    "'Highly Recommended', 'Highest Reccomendation'" +
                ")," +
                "INDEX (cuisine_id), " +
                "INDEX (association_id), " +
                "FOREIGN KEY (cuisine_id) REFERENCES cuisines(id) " +
                    "ON UPDATE CASCADE " +
                    "ON DELETE RESTRICT, " +
                "FOREIGN KEY (association_id) REFERENCES cuisines(id) " +
                    "ON UPDATE CASCADE " +
                    "ON DELETE RESTRICT, " +
                "PRIMARY KEY (cuisine_id, association_id)" +
            ")"
        );
    }

    get state(){
        return this.conn.state;
    }
};

module.exports = QueryManager;
