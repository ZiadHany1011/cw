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
    DESCRIPTION TEXT NOT NULL,
    PRICE INT NOT NULL,
    QUANTITY INT NOT NULL,
    USER_ID INT,
    FOREIGN KEY (USER_ID) REFERENCES USER(ID)
)`;

const createIngredientTable = `
CREATE TABLE IF NOT EXISTS INGREDIENT (
    ID INTEGER PRIMARY KEY AUTOINCREMENT,
    NAME TEXT NOT NULL,
    PRICE INT NOT NULL,
    STOCK INT NOT NULL
)`;

const createCartItemTable = `
CREATE TABLE IF NOT EXISTS CART_ITEM (
    ID INTEGER PRIMARY KEY AUTOINCREMENT,
    USER_ID INTEGER,
    SANDWICH_ID INTEGER,
    QUANTITY INT NOT NULL,
    PRICE INT NOT NULL,
    FOREIGN KEY (USER_ID) REFERENCES USER(ID),
    FOREIGN KEY (SANDWICH_ID) REFERENCES SANDWICH(ID)
)`;

const createOrderItemTable = `
CREATE TABLE IF NOT EXISTS ORDER_ITEM (
    ID INTEGER PRIMARY KEY AUTOINCREMENT,
    USER_ID INT,
    SANDWICH_ID INT,
    QUANTITY INT NOT NULL,
    TOTAL_PRICE INT NOT NULL,
    FOREIGN KEY (USER_ID) REFERENCES USER(ID),
    FOREIGN KEY (SANDWICH_ID) REFERENCES SANDWICH(ID)
)`;

const createFeedbackTable = `
CREATE TABLE IF NOT EXISTS FEEDBACK (
    ID INTEGER PRIMARY KEY AUTOINCREMENT,
    USER_ID INT,
    ORDER_ITEM_ID INT,
    COMMENT TEXT,
    FOREIGN KEY (USER_ID) REFERENCES USER(ID),
    FOREIGN KEY (ORDER_ITEM_ID) REFERENCES ORDER_ITEM(ID)
)`;

db.serialize(() => {
    db.run(createUserTable, (err) => {
        if (err) console.log("Error creating user table", err);
    });
    db.run(createSandwichTable, (err) => {
        if (err) console.log("Error creating sandwich table", err);
    });
    db.run(createIngredientTable, (err) => {
        if (err) console.log("Error creating ingredient table", err);
    });
    db.run(createCartItemTable, (err) => {
        if (err) console.log("Error creating cart item table", err);
    });
    db.run(createOrderItemTable, (err) => {
        if (err) console.log("Error creating order item table", err);
    });
    db.run(createFeedbackTable, (err) => {
        if (err) console.log("Error creating feedback table", err);
        else console.log("Table createed")
    });
});
// Exporting database and table creation queries
module.exports = {
    db
    // createUserTable,
    // createSandwichTable,
    // createIngredientTable,
    // createCartItemTable,
    // createOrderItemTable,
    // createFeedbackTable,
};
