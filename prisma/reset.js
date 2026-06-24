/* Deletes the SQLite db file so the next `npm run dev` recreates and reseeds it. */
const fs = require("fs");
const path = require("path");
for (const f of ["dev.db", "dev.db-journal"]) {
  const p = path.join(__dirname, f);
  if (fs.existsSync(p)) { fs.unlinkSync(p); console.log("Deleted", f); }
}
console.log("Database reset. Run `npm run dev` to recreate and reseed.");
