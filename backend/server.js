const express = require("express");
const { db, rowToItem } = require("./db");


const app = express();
app.use(express.json());

function sendOk(res , data, status = 200){
    res.status(status).json({status: "ok", data})
}

function sendError(res, status, code, message){
    res.status(status).json({ status: "error", error : {code, message}})
}

app.get("/health", (req, res) => res.json({ status: "ok" }));

app.get("/api/v1/items/:id", (req, res) =>{
    const row = db.prepare("SELECT * FROM items WHERE id = ?").get(req.params.id)
    if (!row){
        return sendError(res, 404, "NOT_FOUND", "Item not found")
    }
    sendOk(res, rowToItem(row))})

app.get("/api/v1/items", (req, res) => {
    let limit = req.query.limit === undefined ? 10 : Number(req.query.limit)
    let offset = req.query.offset === undefined ? 0 : Number(req.query.offset)
    
    if ( !Number.isInteger(limit) || limit <1){
        return sendError(res, 400, "VALIDATION_ERROR","limit must be a positive integer")
    }
    
    if (!Number.isInteger(offset) || offset <0){
        return sendError(res, 400, "VALIDATION_ERROR", "offset must be a non-negative integer")
    }

    limit = Math.min(limit, 50);
    
    const rows = db.prepare("SELECT * FROM items ORDER BY rowid LIMIT ? OFFSET ?").all(limit,offset)
    const items = rows.map(rowToItem)

    sendOk(res, items);
})

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Listening on port ${PORT}`));
