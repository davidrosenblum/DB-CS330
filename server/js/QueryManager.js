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

    createAccount(email, password, firstName, lastName, proChef, callback){
        this.query(
            "INSERT INTO accounts(email, password, first_name, last_name, pro_chef) " +
            "VALUES('" + email + "','" + password + "','" + firstName + "', '" + lastName + "', " + proChef + ")",
            callback
        );
    }

    retrieveAccountData(email, password, callback){
        this.query(
            "SELECT * FROM accounts " +
            "WHERE email = '" + email + "' AND password = '" + password + "'",
            callback
        );
    }

    retrieveSavedAssociations(email, callback){
        this.query(
            "SELECT name, group_id FROM saved_associations s " +
            "JOIN cuisines c " +
            "ON s.cuisine_id = c.id " +
            "WHERE s.account_id = (" +
                "SELECT account_id FROM accounts WHERE email = '" + email + "'" +
            ")" +
            "ORDER BY s.group_id ASC",
            callback
        );
    }

    saveAssociations(email, cuisines, callback){
        let errors = [],
            resolved = 0,
            allSent = false;

        this.query(
            "SELECT MAX(group_id) + 1 AS 'group_id' FROM saved_associations " +
            "WHERE account_id = (" +
                "SELECT account_id FROM accounts " +
                "WHERE email = '" + email + "'" +
            ")",
            (err, rows) => {
                if(!err){
                    for(let name of cuisines){
                        this.query(
                            "INSERT INTO saved_associations(account_id, group_id, cuisine_id) " +
                            "VALUES(" +
                                "(SELECT account_id FROM accounts WHERE email = '" + email + "'), " +
                                ((typeof rows[0].group_id === "number") ? rows[0].group_id : 1) + ", " +
                                "(SELECT id FROM cuisines WHERE name = '" + name + "')" +
                            ")",
                            (err) => {
                                if(err) errors.push(err);
                                resolved++;

                                if(allSent && resolved === cuisines.length){
                                    callback(errors.length === 0 ? null : errors);
                                }
                            }
                        );
                    }
                    allSent = true;
                }
                else{
                    console.log(err);
                    callback([err]);
                }
            }
        );
    }

    deleteAssociationsGroup(email, groupID, callback){
        this.query(
            "DELETE FROM saved_associations " +
            "WHERE group_id = " + groupID + " " +
            "AND account_id = (" +
                "SELECT account_id FROM accounts WHERE email = '" + email + "'" +
            ")",
            callback
        );
    }

    // cuisine name search
    queryCuisines(search, callback){
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

    // returns the letter the associations table is completed up to
    queryAssociationCompleteness(callback) {
        this.query(
            "SELECT SUBSTRING(name, 1, 1) AS 'highest_letter'" +
            "FROM cuisines c " +
            "JOIN cuisine_associations ca " +
            "ON c.id = ca.cuisine_id " +
            "ORDER BY name DESC " +
            "LIMIT 1 ;",
            callback
        );
    }

    // returns the number of records in the cusine table for each letter
    queryCuisineCompleteness(callback) {
        this.query(
            "SELECT SUBSTRING(name, 1, 1) AS 'letter', COUNT(SUBSTRING(name, 1, 1)) AS 'count'" +
            "FROM cuisines " +
            "GROUP BY SUBSTRING(name, 1, 1) ;",
            callback
        )
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

        // create techniques associations table
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

        // create taste associations table
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

        // create cuisines association table
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

        // create accounts table
        this.query(
            "CREATE TABLE IF NOT EXISTS accounts(" +
                "account_id INT(8) AUTO_INCREMENT NOT NULL, " +
                "email VARCHAR(255) UNIQUE NOT NULL, " +
                "password VARCHAR(255) NOT NULL, " +
                "first_name VARCHAR(25) NOT NULL, " +
                "last_name VARCHAR(25) NOT NULL, " +
                "pro_chef BOOL NOT NULL DEFAULT 0, " +
                "PRIMARY KEY (account_id)" +
            ")"
        );

        // save Associations
        this.query(
            "CREATE TABLE IF NOT EXISTS saved_associations(" +
                "account_id INT(8) NOT NULL, " +
                "group_id INT(8) NOT NULL, " +
                "cuisine_id INT(8) NOT NULL, " +
                "PRIMARY KEY (account_id, group_id, cuisine_id), " +
                "FOREIGN KEY (account_id) REFERENCES accounts(account_id) " +
                    "ON DELETE CASCADE, " +
                "FOREIGN KEY (cuisine_id) REFERENCES cuisines(id) " +
                    "ON DELETE CASCADE " +
            ")"
        );
    }

    // getter for database connection state
    get state(){
        return this.conn.state;
    }
};

module.exports = QueryManager;
