var sqlite3 = require('sqlite3').verbose()

const DBSOURCE = "db.sqlite"

let db = new sqlite3.Database(DBSOURCE, (err) => {
    if (err) {
      // Cannot open database
      console.error(err.message)
      throw err
    }else{
        console.log('Connected to the SQLite database.')
        db.run(`CREATE TABLE IF NOT EXISTS data_flow (
            
            tenant VARCHAR(50) NOT NULL,
            VA_Name VARCHAR(50) PRIMARY KEY NOT NULL,
            VA_Id INTEGER NOT NULL,
            nodes TEXT,
            shape TEXT,
            slink TEXT
            )`,
        (err) => {
            if (err) {
                console.log(err);
            }
        });  
    }
});


module.exports = db;