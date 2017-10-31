CREATE DATABASE IF NOT EXISTS cuisine_crusader;

CREATE TABLE IF NOT EXISTS techniques (
  id    INT(4)      NOT NULL  AUTO_INCREMENT  UNIQUE,
  name  VARCHAR(30) NOT NULL,
  PRIMARY KEY (id)
);

ALTER TABLE techniques AUTO_INCREMENT=11;

CREATE TABLE IF NOT EXISTS taste (
  id    INT(4)      NOT NULL  AUTO_INCREMENT  UNIQUE,
  name  VARCHAR(30) NOT NULL,
  PRIMARY KEY (id)
);

ALTER TABLE taste AUTO_INCREMENT=66;

CREATE TABLE IF NOT EXISTS cuisine (
    id        INT(8)      NOT NULL  AUTO_INCREMENT  UNIQUE,
    name      VARCHAR(30) NOT NULL,
    season    ENUM('Autumn', 'Autumn-Spring',
                   'Autumn-Winter', 'Spring',
                   'Spring-Autumn', 'Spring-Summer',
                   'Summer', 'Summer-Autumn', 'Winter',
                   'Winter-Spring', 'Year-Round'),
    function  ENUM('Cooling', 'Heating', 'Warming'),
    weight    ENUM('Heavy', 'Light', 'Light-Medium', 'Medium', 'Medium-Heavy', 'Very Light'),
    volume    ENUM('Loud', 'Mild-Moderate', 'Moderate-Loud', 'Quiet',
                   'Quiet-Moderate', 'Variable', 'Very Loud', 'Very Quiet'),
    tips      VARCHAR(300),
    PRIMARY KEY (id)
);

ALTER TABLE cuisine AUTO_INCREMENT=3003;

CREATE TABLE IF NOT EXISTS technique_associations (
    cuisine_id    INT(8)  NOT NULL,
    technique_id  INT(4)  NOT NULL,
    INDEX (cuisine_id),
    INDEX (technique_id),
    FOREIGN KEY (cuisine_id)
      REFERENCES cuisine(id)
      ON UPDATE CASCADE
      ON DELETE RESTRICT,
    FOREIGN KEY (technique_id)
      REFERENCES techniques(id)
      ON UPDATE CASCADE
      ON DELETE RESTRICT,
    PRIMARY KEY (cuisine_id, technique_id)
);

CREATE TABLE IF NOT EXISTS taste_associations (
    cuisine_id    INT(8)  NOT NULL,
    taste_id      INT(4)  NOT NULL,
    INDEX (cuisine_id),
    INDEX (taste_id),
    FOREIGN KEY (cuisine_id)
      REFERENCES cuisine(id)
      ON UPDATE CASCADE
      ON DELETE RESTRICT,
    FOREIGN KEY (taste_id)
      REFERENCES taste(id)
      ON UPDATE CASCADE
      ON DELETE RESTRICT,
    PRIMARY KEY (cuisine_id, taste_id)
);

CREATE TABLE IF NOT EXISTS cuisine_associations (
    cuisine_id INT(8) NOT NULL,
    association_id INT(8) NOT NULL,
    compatibility ENUM('Avoid', 'Compatible', 'Recommended', 'Highly Recommended', 'Highest Recommendation'),
    INDEX (cuisine_id),
    INDEX (association_id),
    FOREIGN KEY (cuisine_id)
      REFERENCES cuisine(id)
      ON UPDATE CASCADE
      ON DELETE RESTRICT,
    FOREIGN KEY (association_id)
      REFERENCES cuisine(id)
      ON UPDATE CASCADE
      ON DELETE RESTRICT,
    PRIMARY KEY (cuisine_id, association_id)
);

INSERT INTO techniques (name) VALUES
  ('Sauté'),
  ('Bake'),
  ('Grill'),
  ('Poach'),
  ('Raw'),
  ('Stew'),
  ('Braise'),
  ('Boil'),
  ('Broil'),
  ('Deep-Fry'),
  ('Roast'),
  ('Steam'),
  ('Blanche'),
  ('Cream'),
  ('Fry'),
  ('Soups'),
  ('Wilt'),
  ('Pan Roast'),
  ('Simmer'),
  ('Stir-Fry'),
  ('Glaze'),
  ('Caramelize'),
  ('Ceviche'),
  ('Sear'),
  ('Cooked Applications'),
  ('Puree'),
  ('Refry'),
  ('Barbecue'),
  ('Dry Roast'),
  ('Carpaccio'),
  ('Chips'),
  ('Stuff'),
  ('Blacken'),
  ('Ferment'),
  ('Gratin'),
  ('Gratiné'),
  ('Parboil'),
  ('Candy'),
  ('Cakes'),
  ('Steep'),
  ('Tempura'),
  ('Pickle'),
  ('Scramble'),
  ('Terrine'),
  ('Juice'),
  ('Marinades'),
  ('Sauces'),
  ('Emulsify')
;

INSERT INTO taste (name) VALUES
  ('Sweet'),
  ('Salty'),
  ('Bitter'),
  ('Astringent'),
  ('Anise'),
  ('Various'),
  ('Sour'),
  ('Pungent'),
  ('Rich'),
  ('Piquant'),
  ('Hot'),
  ('Very Hot'),
  ('Spicy'),
  ('Bittersweet'),
  ('Savory')
;