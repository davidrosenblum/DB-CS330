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
* Visual Studio Code is also a good choice -RJ
* https://code.visualstudio.com/

__Github__
* Git bash CLI
* https://git-scm.com/downloads

## Server Settings

__Settings.json__ file - created when server is first launched witih default values

```javascript
{
    "port": 			8080,
    "mysql_host": 		"127.0.0.1",
    "mysql_user": 		"root",
    "mysql_password": 	"admin",
    "mysql_port": 		3306,
    "mysql_database": 	"cuisine_crusader"
}

```

## REST API

| Endpoint                                                                 | Description                                                                     | Returns       |
|--------------------------------------------------------------------------|---------------------------------------------------------------------------------|---------------|
| https://cuisine-crusader.herokuapp.com/database                          | Current database connection state                                               | String        |
| https://cuisine-crusader.herokuapp.com/ingredients/name/INGREDIENT_NAME  | Ingredient data/info from name                                                  | Object        |
| https://cuisine-crusader.herokuapp.com/ingredients/find/TARGET_STRING    | Ingredient names from a target name  (ex: "j" gets names including that string) | Array<String> |
| https://cuisine-crusader.herokuapp.com/associations/name/INGREDIENT_NAME | Assocations from an ingredient name                                             | Array<String> |
| https://cuisine-crusader.herokuapp.com/ingredients/search                | Search for ingredients by parameters (search params JSON in request BODY!)      | Array<String> |
| https://cuisine-crusader.herokuapp.com/ingredients/get                   | Ingredients table as a JSON array                                               | Array<Object> |
| https://cuisine-crusader.herokuapp.com/associations/get                  | Association table as a JSON array                                               | Array<Object> |
