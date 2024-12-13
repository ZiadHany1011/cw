const sqlite3 = require('sqlite3');
const db = new sqlite3.Database('bitebuilder.db');

// Table creation queries
const createUserTable = `
CREATE TABLE IF NOT EXISTS USER (
    ID INTEGER PRIMARY KEY AUTOINCREMENT,
    NAME TEXT NOT NULL,
    EMAIL TEXT UNIQUE NOT NULL,
    PASSWORD TEXT NOT NULL,
    ISADMIN INT 
)`;

const createSandwichTable = `
CREATE TABLE IF NOT EXISTS SANDWICH (
    ID INTEGER PRIMARY KEY AUTOINCREMENT,
    NAME TEXT NOT NULL,
    DESCRIPTION TEXT,
    PRICE INT NOT NULL,
    QUANTITY INTEGER NOT NULL,
    USER_ID INTEGER NOT NULL,
    FOREIGN KEY (USER_ID) REFERENCES USER(ID)
)`;

const createIngredientTable = `
CREATE TABLE IF NOT EXISTS INGREDIENT (
    ID INTEGER PRIMARY KEY AUTOINCREMENT,
    NAME TEXT NOT NULL,
    PRICE INT NOT NULL,
    STOCK INTEGER NOT NULL
)`;

const createCartItemTable = `
CREATE TABLE IF NOT EXISTS CART_ITEM (
    ID INTEGER PRIMARY KEY AUTOINCREMENT,
    USER_ID INTEGER NOT NULL,
    SANDWICH_ID INTEGER NOT NULL,
    QUANTITY INTEGER NOT NULL CHECK (QUANTITY > 0),
    PRICE INT NOT NULL,
    FOREIGN KEY (USER_ID) REFERENCES USER(ID),
    FOREIGN KEY (SANDWICH_ID) REFERENCES SANDWICH(ID)
)`;

const createOrderItemTable = `
CREATE TABLE IF NOT EXISTS ORDER_ITEM (
    ID INTEGER PRIMARY KEY AUTOINCREMENT,
    USER_ID INTEGER NOT NULL,
    SANDWICH_ID INTEGER NOT NULL,
    QUANTITY INTEGER NOT NULL,
    TOTAL_PRICE INT NOT NULL,
    FOREIGN KEY (USER_ID) REFERENCES USER(ID),
    FOREIGN KEY (SANDWICH_ID) REFERENCES SANDWICH(ID)
)`;

const createFeedbackTable = `
CREATE TABLE IF NOT EXISTS FEEDBACK (
    ID INTEGER PRIMARY KEY AUTOINCREMENT,
    USER_ID INTEGER NOT NULL,
    ORDER_ITEM_ID INTEGER NOT NULL,
    COMMENT TEXT,
    FOREIGN KEY (USER_ID) REFERENCES USER(ID),
    FOREIGN KEY (ORDER_ITEM_ID) REFERENCES ORDER_ITEM(ID)
)`;

const createSandwichIngredientsTable = `
CREATE TABLE IF NOT EXISTS SANDWICH_INGREDIENTS (
    ID INTEGER PRIMARY KEY AUTOINCREMENT,
    SANDWICH_ID INTEGER NOT NULL,
    INGREDIENT_ID INTEGER NOT NULL,
    QUANTITY INTEGER NOT NULL,
    FOREIGN KEY (SANDWICH_ID) REFERENCES SANDWICH(ID),
    FOREIGN KEY (INGREDIENT_ID) REFERENCES INGREDIENT(ID)
)`;

// Execute table creation
db.serialize(() => {
    db.run(createUserTable, (err) => {
        if (err) console.error("Error creating USER table:", err);
    });
    db.run(createSandwichTable, (err) => {
        if (err) console.error("Error creating SANDWICH table:", err);
    });
    db.run(createIngredientTable, (err) => {
        if (err) console.error("Error creating INGREDIENT table:", err);
    });
    db.run(createCartItemTable, (err) => {
        if (err) console.error("Error creating CART_ITEM table:", err);
    });
    db.run(createOrderItemTable, (err) => {
        if (err) console.error("Error creating ORDER_ITEM table:", err);
    });
    db.run(createFeedbackTable, (err) => {
        if (err) console.error("Error creating FEEDBACK table:", err);
    });
    db.run(createSandwichIngredientsTable, (err) => {
        if (err) console.error("Error creating SANDWICH_INGREDIENTS table:", err);
    });
});

// Exporting the database connection
module.exports = {
    db,
    createUserTable,
    createSandwichTable,
    createIngredientTable,
    createCartItemTable,
    createOrderItemTable,
    createFeedbackTable,
    createSandwichIngredientsTable

};
