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
    "mysql_password": 	"",
    "mysql_port": 		3306,
    "mysql_database": 	"cuisine_crusader"
}

```

## Database Schema

| Table                  | Schema                                             |
|------------------------|----------------------------------------------------|
| cuisines               | {id, name, season, function, weight, volume, tips} |
| cuisine_associations   | {cuisine_id, association_id, compatibility}        |
| tastes                 | {id, name}                                         |
| taste_associations     | {cuisine_id, taste_id}                             |
| techniques             | {id, name}                                         |
| technique_associations | {cuisine_id, technique_id}                         |

## REST API
| URL                                                                     | Description                  | Returns                                        |
|-------------------------------------------------------------------------|------------------------------|------------------------------------------------|
| https://cuisine-crusader.herokuapp.com/cuisines/search/_SEARCH_         | Cuisine name search          | ["cusine1", "cuisine2", ..."cuisineN"]         |
| https://cuisine-crusader.herokuapp.com/cuisines/info/_SEARCH_           | Cuisine info search          | {name: "name", .... tips: "do something"}      |
| https://cuisine-crusader.herokuapp.com/cuisines/associations/_SEARCH_   | Cuisine associations search  | ["associate1", "associate2", ..."associateN"]  |
| https://cuisine-crusader.herokuapp.com/tastes/search/_SEARCH_           | Taste name search            | ["taste1", "taste2", ..."tasteN"]              |
| https://cuisine-crusader.herokuapp.com/tastes/associations/_SEARCH_     | Taste association search     | ["associate1", "associate2", ..."associateN"]  |
| https://cuisine-crusader.herokuapp.com/techniques/search/_SEARCH_       | Technique name search        | ["technique1, "technique2, ..., "techniquesN"] |
| https://cuisine-crusader.herokuapp.com/techniques/associations/_SEARCH_ | Technique association search | ["associate1", "associate2", ..."associateN"]  |

## Client Query Strings
| Parameter | Value              | Description                                  | Example       |
|-----------|--------------------|----------------------------------------------|---------------|
| search    | item name (string) | Auto fills in the input field with the value | ?search=anise |
