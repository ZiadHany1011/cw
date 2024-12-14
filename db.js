const sqlite3 = require('sqlite3');
const db = new sqlite3.Database('bitebuilders.db');

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
    FOREIGN KEY (USER_ID) REFERENCES USER(ID)
)`;

const createCartItemTable = `
CREATE TABLE IF NOT EXISTS CART_ITEM (
    ID INTEGER PRIMARY KEY AUTOINCREMENT,
    USER_ID INTEGER NOT NULL,
    SANDWICH_ID INTEGER NOT NULL,
    QUANTITY INTEGER NOT NULL
    FOREIGN KEY (USER_ID) REFERENCES USER(ID),
    FOREIGN KEY (SANDWICH_ID) REFERENCES SANDWICH(ID)
)`;
const createordertable = `
CREATE TABLE IF NOT EXISTS ORDER_ITEM (
    ID INTEGER PRIMARY KEY AUTOINCREMENT,
    USER_ID INTEGER NOT NULL,
    SANDWICH_ID INTEGER NOT NULL,
    QUANTITY INTEGER NOT NULL,
    PRICE REAL NOT NULL,
    FOREIGN KEY (USER_ID) REFERENCES USER(ID),
    FOREIGN KEY (SANDWICH_ID) REFERENCES SANDWICH(ID)
)`;

const createFeedbackTable = `
CREATE TABLE IF NOT EXISTS FEEDBACK (
    ID INTEGER PRIMARY KEY AUTOINCREMENT,
    USER_ID INTEGER NOT NULL,
    SANDWICH_ID INT NOT NULL,
    COMMENT TEXT,
    FOREIGN KEY (USER_ID) REFERENCES USER(ID),
    FOREIGN KEY (ORDER_ITEM_ID) REFERENCES ORDER_ITEM(ID)
)`;

// Exporting the database connection
module.exports = {
    db,
    createUserTable,
    createSandwichTable,
    createCartItemTable,
    createordertable,
    createFeedbackTable
}
