import express, { json } from "express";
import { Validator as _Validator } from "jsonschema";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const notallowed = ["dashboard", "list", ".html"];
const port = parseInt(process.env.PORT) || 36;

// In-memory store for short links
let db = {};

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

app.get("/:id", (req, res) => {
  const id = req.params.id;
  const item = db[id];
  if (!item) {
    res.sendFile(path.join(__dirname, "public", "404.html"));
  } else {
    item.stats.clicks++;
    res.redirect(item.original_link);
  }
});

app.get("/api/list", (req, res) => {
  const limit = req.query.l || 5;
  const items = Object.values(db).slice(0, limit);
  res.status(200).json(items);
});

app.delete("/api/delete/:id", (req, res) => {
  const id = req.params.id;
  if (db[id]) {
    delete db[id];
    res.status(200).json({ status: "200", message: "delete item successfully" });
  } else {
    res.status(404).json({ status: "404", message: "item could not be found" });
  }
});

app.post("/api/update/:id", (req, res) => {
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
    db[idparam] = { ...db[idparam], ...data };
    res.status(200).json({ status: 200, message: "updated successfully", short_link: `${req.protocol}://${req.get("host")}/${data.id}` });
  }
});

app.post("/api/create", (req, res) => {
  const data = req.body;
  const v = new _Validator();
  const schema = {
    type: "object",
    properties: {
      original_link: { type: "string" },
      id: { type: "string" },
      stats: { type: "object", properties: { clicks: { type: "number" }, created_at: { type: "string" } } },
    },
    required: ["original_link"],
  };
  const resid = !data.id ? Math.random().toString(36).substr(2, 7) : data.id;
  const result = v.validate({ ...data, id: resid, created_at: new Date().toJSON(), stats: { clicks: 0 } }, schema);
  const ifslash = /\/\w+/;
  if (result.errors.length > 0 || !isValidURL(data.original_link) || notallowed.includes(resid) || ifslash.test(data.id)) {
    res.status(400).json({ status: 400, message: "bad request" });
  } else {
    db[resid] = { original_link: data.original_link, id: resid, created_at: new Date().toJSON(), stats: { clicks: 0 } };
    res.status(200).json({ status: 200, short_link: `${req.protocol}://${req.get("host")}/${resid}` });
  }
});

app.get("/link", (req, res) => {
  res.redirect(req.query.link);
});

app.listen(port, '0.0.0.0', () => {
  console.log("server started on http://0.0.0.0:" + port);
});