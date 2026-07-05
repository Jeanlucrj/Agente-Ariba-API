const fs = require('fs');
const initSqlJs = require('sql.js');

(async () => {
  try {
    const filebuffer = fs.readFileSync('ariba-dev.db');
    const SQL = await initSqlJs({ locateFile: file => `node_modules/sql.js/dist/${file}` });
    const db = new SQL.Database(filebuffer);
    
    db.run("UPDATE users SET status = 'active' WHERE email = 'jeanluiz38@gmail.com'");
    
    const data = db.export();
    fs.writeFileSync('ariba-dev.db', Buffer.from(data));
    console.log("User activated successfully in ariba-dev.db!");
  } catch (err) {
    console.error(err);
  }
})();
