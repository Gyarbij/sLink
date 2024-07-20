import express, { json } from "express";
import { Validator as _Validator } from "jsonschema";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import dotenv from "dotenv";
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const notallowed = ["dashboard", "list", ".html"];
const port = parseInt(process.env.PORT) || 36;

// SQLite database setup
let db;

async function setupDatabase() {
  db = await open({
    filename: 'slink.db',
    driver: sqlite3.Database
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS links (
      id TEXT PRIMARY KEY,
      original_link TEXT NOT NULL,
      created_at TEXT NOT NULL,
      clicks INTEGER DEFAULT 0,
      UNIQUE(id)
    )
  `);
}

setupDatabase().catch(err => {
  console.error('Failed to set up database:', err);
  process.exit(1);
});

app.use(express.static(path.join(__dirname, "public")));
app.use((req, res, next) => {
  res.setHeader("cache-control", "maxage=3600, immutable");
  next();
});

function isValidURL(string) {
  var res = string.match(
    /(http(s)?:\/\/.)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/g
  );
  return res !== null;
}

app.use(cors());
app.use(json());

app.get("/", (req, res) => {
  res.redirect("/dashboard");
});

app.get("/dashboard", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "/dashboard/index.html"));
});

app.get("/dashboard/list", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "/dashboard/list.html"));
});

app.get("/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const item = await db.get('SELECT * FROM links WHERE id = ?', id);
    if (!item) {
      res.sendFile(path.join(__dirname, "public", "404.html"));
    } else {
      await db.run('UPDATE links SET clicks = clicks + 1 WHERE id = ?', id);
      res.redirect(item.original_link);
    }
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ status: 500, message: "Internal server error" });
  }
});

app.get("/api/list", async (req, res) => {
  try {
    const limit = req.query.l || 5;
    const items = await db.all('SELECT * FROM links LIMIT ?', limit);
    const count = await db.get('SELECT COUNT(*) as count FROM links');
    
    const formattedItems = items.map(item => ({
      key: item.id,
      id: item.id,
      original_link: item.original_link,
      created_at: item.created_at,
      stats: {
        clicks: item.clicks
      }
    }));

    res.status(200).json({
      items: formattedItems,
      count: count.count
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ status: 500, message: "Internal server error" });
  }
});

app.delete("/api/delete/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const result = await db.run('DELETE FROM links WHERE id = ?', id);
    if (result.changes > 0) {
      res.status(200).json({ status: "200", message: "delete item successfully" });
    } else {
      res.status(404).json({ status: "404", message: "item could not be found" });
    }
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ status: 500, message: "Internal server error" });
  }
});

app.post("/api/update/:id", async (req, res) => {
  try {
    const data = req.body;
    const idparam = req.params.id;
    const v = new _Validator();
    const schema = {
      type: "object",
      properties: {
        original_link: { type: "string" },
        id: { type: "string" },
      },
      required: ["id"],
    };
    const result = v.validate(data, schema);
    const ifslash = /\/\w+/;
    if (result.errors.length > 0 || !isValidURL(data.original_link) || notallowed.includes(data.id) || ifslash.test(data.id)) {
      res.status(400).json({ status: 400, message: "bad request" });
    } else {
      await db.run('UPDATE links SET original_link = ? WHERE id = ?', [data.original_link, idparam]);
      res.status(200).json({ status: 200, message: "updated successfully", short_link: `${req.protocol}://${req.get("host")}/${data.id}` });
    }
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ status: 500, message: "Internal server error" });
  }
});

app.post("/api/create", async (req, res) => {
  try {
    const data = req.body;
    const v = new _Validator();
    const schema = {
      type: "object",
      properties: {
        original_link: { type: "string" },
        id: { type: "string" },
        action: { type: "string" },  // New field for handling existing ID
      },
      required: ["original_link"],
    };
    const resid = !data.id ? Math.random().toString(36).substr(2, 7) : data.id;
    const result = v.validate({ ...data, id: resid }, schema);
    const ifslash = /\/\w+/;
    if (result.errors.length > 0 || !isValidURL(data.original_link) || notallowed.includes(resid) || ifslash.test(data.id)) {
      res.status(400).json({ status: 400, message: "bad request" });
    } else {
      try {
        // Check if the ID already exists
        const existingLink = await db.get('SELECT * FROM links WHERE id = ?', resid);
        
        if (existingLink) {
          if (data.action === 'modify') {
            // If action is 'modify', update the existing link
            await db.run('UPDATE links SET original_link = ? WHERE id = ?', [data.original_link, resid]);
            res.status(200).json({ 
              status: 200, 
              message: "Link updated successfully", 
              short_link: `${req.protocol}://${req.get("host")}/${resid}` 
            });
          } else {
            // If no action specified, return a warning
            res.status(409).json({ 
              status: 409, 
              message: "ID already exists", 
              existingLink: existingLink.original_link,
              options: ['cancel', 'modify']
            });
          }
        } else {
          // If ID doesn't exist, create a new link
          await db.run('INSERT INTO links (id, original_link, created_at, clicks) VALUES (?, ?, ?, 0)', [resid, data.original_link, new Date().toJSON()]);
          res.status(200).json({ 
            status: 200, 
            message: "Link created successfully", 
            short_link: `${req.protocol}://${req.get("host")}/${resid}` 
          });
        }
      } catch (dbError) {
        console.error('Database error:', dbError);
        res.status(500).json({ status: 500, message: "Internal server error" });
      }
    }
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ status: 500, message: "Internal server error" });
  }
});

app.get("/link", (req, res) => {
  res.redirect(req.query.link);
});

app.listen(port, '0.0.0.0', () => {
  console.log("server started on http://0.0.0.0:" + port);
});