const express = require("express");
const { db, rowToItem } = require("./db");
const app = express();

app.use(express.json());

app.get("/health", (req, res) => res.json({ status: "ok" }));

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Listening on port ${PORT}`));