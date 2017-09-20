# Cuisine Crusaders

https://cuisine-crusader.herokuapp.com/

## Local Setup

Node & MySQL are required to launch the server

__NodeJS (with NPM)__
* This is the http/websockets server
* https://nodejs.org/en/download/
* run __npm&#x5f;install.bat__ to download node modules
* run __start&#x5f;node.bat__ to run the server

__MySQL 5.7.x__
* The DB software
* https://dev.mysql.com/downloads/mysql/

__A Database Editor__ (any should be fine)
* GUI for reading/writing rows
* I like HeidiSQL
* https://www.heidisql.com/download.php

__JavaScript/Web IDE__ (any should be fine)
* For building our website/server
* I like atom or sublime
* https://atom.io/
* https://www.sublimetext.com/3&#x5f

__Github__
* Git bash CLI
* https://git-scm.com/downloads

## Server Settings

__Settings.json__ file - created when server is first launched witih default values

```javascript
{
    "host": "0.0.0.0",
    "http_port": 80,
    "ws_port": 9000,
    "mysql_host": "127.0.0.1",
    "mysql_user": "root",
    "mysql_password": "",
    "mysql_port": 3306,
    "mysql_database": "cuisine-crusader"
}
```

## REST API

Current database connection state
```
https://cuisine-crusader.herokuapp.com/database
```

Association table as a JSON array
```
https://cuisine-crusader.herokuapp.com/database/associations
```

Ingredients table as a JSON array
```
https://cuisine-crusader.herokuapp.com/database/ingredients
```



## WebSockets

| Request Type | Data          | Description                                              |
|--------------|---------------|----------------------------------------------------------|
| name         | "name string" | Retrieves all rows for the given ingredient              |
| search       | params json   | Retrieves all ingredients matching the search parameters |
| like         | "name string" | Retrieves all associates for the given ingredient        |
| add          | params json   | Adds an ingredient to the database                       |
| associate    | "name1,name2" | Associates 2 ingredients with each other                 |


## Client Query Strings

Query strings go in the URL, sample below
```
http://www.foobar.com?test_mode=true&hello=world
```

| Paramter  | Value             | Description                                |
|-----------|-------------------|--------------------------------------------|
| test_mode | true              | Forces the webpage to connect to localhost |
