CREATE DATABASE IF NOT EXISTS cuisine_crusader;

CREATE TABLE IF NOT EXISTS techniques (
  id    SMALLINT(4)   NOT NULL  AUTO_INCREMENT  UNIQUE,
  name  VARCHAR(30)   NOT NULL,
  PRIMARY KEY (id)
);

ALTER TABLE techniques AUTO_INCREMENT=11;

CREATE TABLE IF NOT EXISTS taste (
  id    SMALLINT(4)   NOT NULL  AUTO_INCREMENT  UNIQUE,
  name  VARCHAR(30)   NOT NULL,
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
    cuisine_id    INT(8)      NOT NULL,
    technique_id  SMALLINT(4) NOT NULL,
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
    cuisine_id    INT(8)      NOT NULL,
    taste_id      SMALLINT(4) NOT NULL,
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
    cuisine_id      INT(8) NOT NULL,
    association_id  INT(8) NOT NULL,
    compatibility   ENUM('Avoid', 'Compatible', 'Recommended', 'Highly Recommended', 'Highest Recommendation'),
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

INSERT INTO techniques (id, name) VALUES
  (11, 'Sauté'),
  (12, 'Bake'),
  (13, 'Grill'),
  (14, 'Poach'),
  (15, 'Raw'),
  (16, 'Stew'),
  (17, 'Braise'),
  (18, 'Boil'),
  (19, 'Broil'),
  (20, 'Deep-Fry'),
  (21, 'Roast'),
  (22, 'Steam'),
  (23, 'Blanche'),
  (24, 'Cream'),
  (25, 'Fry'),
  (26, 'Soups'),
  (27, 'Wilt'),
  (28, 'Pan Roast'),
  (29, 'Simmer'),
  (30, 'Stir-Fry'),
  (31, 'Glaze'),
  (32, 'Caramelize'),
  (33, 'Ceviche'),
  (34, 'Sear'),
  (35, 'Cooked Applications'),
  (36, 'Puree'),
  (37, 'Refry'),
  (38, 'Barbecue'),
  (39, 'Dry Roast'),
  (40, 'Carpaccio'),
  (41, 'Chips'),
  (42, 'Stuff'),
  (43, 'Blacken'),
  (44, 'Ferment'),
  (45, 'Gratin'),
  (46, 'Gratiné'),
  (47, 'Parboil'),
  (48, 'Candy'),
  (49, 'Cakes'),
  (50, 'Steep'),
  (51, 'Tempura'),
  (52, 'Pickle'),
  (53, 'Scramble'),
  (54, 'Terrine'),
  (55, 'Juice'),
  (56, 'Marinades'),
  (57, 'Sauces'),
  (58, 'Emulsify')
;

INSERT INTO taste (id, name) VALUES
  (66, 'Sweet'),
  (67, 'Salty'),
  (68, 'Bitter'),
  (69, 'Astringent'),
  (70, 'Anise'),
  (71, 'Various'),
  (72, 'Sour'),
  (73, 'Pungent'),
  (74, 'Rich'),
  (75, 'Piquant'),
  (76, 'Hot'),
  (77, 'Very Hot'),
  (78, 'Spicy'),
  (79, 'Bittersweet'),
  (80, 'Savory')
;

INSERT INTO cuisine (id, name, season, function, weight, volume, tips) VALUES
  (3003, 'Achiote Seeds', NULL, NULL, NULL, NULL, NULL),
  (3004, 'Afghan Cuisine', NULL, NULL, NULL, NULL, NULL),
  (3005, 'African Cuisine', NULL, NULL, NULL, NULL, NULL),
  (3006, 'African Cuisine (North)', NULL, NULL, NULL, NULL, NULL),
  (3007, 'African Cuisine (South)', NULL, NULL, NULL, NULL, NULL),
  (3008, 'African Cuisine (West)', NULL, NULL, NULL, NULL, NULL),
  (3009, 'Allspice', 'Autumn-Winter', NULL, 'Medium', 'Loud', 'Add early in cooking.'),
  (3010, 'Almonds', NULL, 'Warming', 'Medium', 'Quiet', NULL),
  (3011, 'Amaretto', NULL, NULL, NULL, NULL, NULL),
  (3012, 'Anchovies', NULL, NULL, 'Light', 'Loud', NULL),
  (3013, 'Angelica', NULL, NULL, NULL, 'Loud', 'Add late in cooking; use in baking. Use to balance high-acid fruit, to reduce the need for sweeteners.'),
  (3014, 'Anise', NULL, 'Warming', 'Light-Medium', 'Moderate-Loud', 'Add early in cooking.'),
  (3015, 'Anise Hyssop', 'Spring-Summer', NULL, 'Light-Medium', 'Quiet-Moderate', NULL),
  (3016, 'Anise, Star', NULL, NULL, 'Medium', 'Moderate-Loud', 'Add at the beginning of the cooking process. Use in stir-fries.'),
  (3017, 'Apples', 'Autumn', 'Cooling', 'Medium', 'Quiet-Moderate', NULL),
  (3018, 'Apricots', 'Summer', NULL, 'Medium', 'Moderate', NULL),
  (3019, 'Apricots, Dried', NULL, NULL, NULL, NULL, NULL),
  (3020, 'Argentinian Cuisine', NULL, NULL, NULL, NULL, NULL),
  (3021, 'Artichokes', 'Spring-Autumn', NULL, 'Medium', 'Moderate-Loud', NULL),
  (3022, 'Artichokes, Jerusalem', 'Autumn-Spring', NULL, 'Medium', 'Moderate', NULL),
  (3022, 'Arugula', 'Spring-Summer', NULL, 'Light-Medium', 'Moderate-Loud', NULL),
  (3023, 'Asparagus', 'Spring', NULL, 'Light-Medium', 'Moderate', NULL),
  (3024, 'Asparagus, White', 'Spring', NULL, 'Light', 'Quiet-Moderate', 'Covered to deprive it of sunlight while growing, white asparagus is lighter in flavor and texture than green asparagus.'),
  (3025, 'Astringency', NULL, 'Cooling', NULL, NULL, NULL),
  (3026, 'Australian Cuisine', NULL, NULL, NULL, NULL, NULL),
  (3027, 'Austrian Cuisine', NULL, NULL, NULL, NULL, NULL),
  (3028, 'Avocados', 'Spring-Summer', NULL, 'Medium-Heavy', 'Quiet', 'Use to add richness to a dish.'),
  (3029, 'Bacon', NULL, NULL, 'Medium', 'Moderate', NULL),
  (3030, 'Bananas', 'Winter', 'Cooling', 'Medium', 'Quiet', 'Sugar enhances the flavor of bananas.'),
  (3031, 'Barley', NULL, 'Cooling', NULL, NULL, NULL),
  (3032, 'Basil', 'Summer', NULL, 'Light', 'Mild-Moderate', 'Add just before serving. Use to add a note of freshness to a dish.'),
  (3033, 'Basil, Thai', NULL, NULL, NULL, NULL, NULL),
  (3034, 'Bass', NULL, NULL, 'Light', 'Quiet', NULL),
  (3035, 'Bass, Black', NULL, NULL, 'Medium', 'Quiet', NULL),
  (3036, 'Bass, Sea', 'Winter-Spring', NULL, 'Medium', 'Quiet', NULL),
  (3037, 'Bass, Striped', NULL, NULL, 'Medium', 'Quiet', NULL),
  (3038, 'Bay Leaf', NULL, NULL, 'Light', 'Variable', NULL),
  (3039, 'Beans, General', NULL, NULL, NULL, NULL, NULL),
  (3040, 'Beans, Black', NULL, NULL, 'Medium-Heavy', 'Moderate', NULL),
  (3041, 'Beans, Cannellini', NULL, NULL, 'Medium', 'Quiet-Moderate', NULL),
  (3042, 'Beans, Fava', 'Spring-Summer', NULL, 'Light-Medium', 'Moderate', NULL),
  (3043, 'Beans, Flageolet', NULL, NULL, 'Light-Medium', 'Quiet', NULL),
  (3044, 'Beans, Green', 'Summer-Autumn', NULL, 'Light-Medium', 'Moderate', NULL),
  (3045, 'Beans, Kidney', NULL, 'Cooling', 'Medium', 'Moderate', NULL),
  (3046, 'Beans, Lima', 'Summer', NULL, 'Medium', 'Moderate', NULL),
  (3047, 'Beans, Navy', NULL, NULL, 'Medium', 'Moderate', NULL),
  (3048, 'Beans, Pinto', 'Winter', NULL, 'Medium', 'Moderate', NULL),
  (3049, 'Beans, Red', NULL, NULL, 'Medium', 'Moderate', NULL),
  (3050, 'Beans, White', 'Winter', NULL, 'Medium', 'Moderate', NULL),
  (3051, 'Beef, General', NULL, 'Heating', 'Medium-Heavy', 'Moderate', 'Clove adds richness to beef.'),
  (3052, 'Beef, Brisket', NULL, NULL, NULL, NULL, NULL),
  (3053, 'Beef, Cheeks', NULL, NULL, NULL, NULL, NULL),
  (3054, 'Beef, Kobe', NULL, NULL, NULL, NULL, NULL),
  (3055, 'Beef, Loin', NULL, NULL, NULL, NULL, NULL),
  (3056, 'Beef, Oxtails', NULL, NULL, NULL, NULL, NULL),
  (3057, 'Beef, Ribs', NULL, NULL, NULL, NULL, NULL),
  (3058, 'Beef, Roast', NULL, NULL, NULL, NULL, NULL),
  (3059, 'Beef, Round', NULL, NULL, NULL, NULL, NULL),
  (3060, 'Beef, Shank', NULL, NULL, NULL, NULL, NULL),
  (3061, 'Beef, Short Ribs', NULL, NULL, NULL, NULL, NULL),
  (3062, 'Beef, Steak: General', NULL, NULL, NULL, NULL, NULL),
  (3063, 'Beef, Steak: Chuck', NULL, NULL, NULL, NULL, NULL),
  (3064, 'Beef, Steak: Filet Mignon', NULL, NULL, NULL, NULL, NULL),
  (3065, 'Beef, Steak: Flank', NULL, NULL, NULL, NULL, NULL),
  (3066, 'Beef, Steak: Hangar', NULL, NULL, NULL, NULL, NULL),
  (3067, 'Beef, Steak: Rib Eye', NULL, NULL, NULL, NULL, NULL),
  (3068, 'Beef, Steak: Skirt', NULL, NULL, NULL, NULL, NULL),
  (3069, 'Beer', NULL, NULL, 'Medium-Heavy', 'Variable', NULL),
  (3070, 'Beets', 'Year-Round', 'Heating', 'Medium', 'Moderate', NULL),
  (3071, 'Belgian Cuisine', NULL, NULL, NULL, NULL, NULL),
  (3072, 'Bell Peppers', 'Summer-Autumn', NULL, 'Light-Medium', 'Moderate-Loud', NULL),
  (3073, 'Berries, general', 'Spring-Summer', NULL, 'Light', 'Quiet-Moderate', NULL),
  (3074, 'Bitterness', NULL, 'Cooling', NULL, NULL, 'Bitterness stimulates appetite, promotes other tastes, and relieves thirst.'),
  ()
;

INSERT INTO technique_associations (cuisine_id, technique_id) VALUES
  ()
;
INSERT INTO taste_associations (cuisine_id, taste_id) VALUES
  ()
;

INSERT INTO cuisine_associations (cuisine_id, association_id, compatibility) VALUES
  ()
;