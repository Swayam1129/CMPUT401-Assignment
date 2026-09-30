const express = require("express");
const crypto = require("crypto");
const { db, rowToItem } = require("./db");
const { send } = require("process");


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

    limit = Math.min(limit, 50)
    
    const rows = db.prepare("SELECT * FROM items ORDER BY rowid LIMIT ? OFFSET ?").all(limit,offset)
    const items = rows.map(rowToItem)

    sendOk(res, items)
})
const ISO_UTC = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/
function validateItem(body){
    if ("id"in body){
        return "id must not be provided"
    }

    if ( typeof body.title !== "string" || body.title.trim() === ""){
        return "title must be non-empty string"
    }

    if ( typeof body.url !== "string" || body.url.trim() === ""){
        return "url must be non-empty string"
    }

    if (typeof body.summary !== "string"){
        return "summary must be a string"
    }

    const s = body.source;
    if(typeof s !== "object" || s === null || Array.isArray(s) || typeof s.name !== "string" || s.name.trim() === ""){
        return "source.name must be a non-empty string"
    }

    if ( !Array.isArray(body.tags) || !body.tags.every(t => typeof t === "string")){
        return "tags must be an array of strings"
    }
    
    if( typeof body.publishedAt !== "string" || !ISO_UTC.test(body.publishedAt)|| Number.isNaN(Date.parse(body.publishedAt))){
        return "publishedAt must be a valid UTC ISO 8601 datetime (e.g. 2025-03-01T09:00:00Z)"
    }
    return null
}

app.post("/api/v1/items", (req,res) =>{
    // body must be a json object
    const body = req.body
    if (typeof body !== "object" || body === null || Array.isArray(body)){
        return sendError(res, 400, "VALIDATION_ERROR", "request body must be a json object")
    }
    //validate body
    const error = validateItem(body)
    if (error){
        return sendError(res,400, "VALIDATION_ERROR",error)
    }
    // make new id
    const id = crypto.randomUUID()


    const insert = db.prepare('INSERT INTO items (id, title, source_name, published_at, url, summary, tags) VALUES(?,?,?,?,?,?,?)')

    insert.run(
        id,
        body.title,
        body.source.name,
        body.publishedAt,
        body.url,
        body.summary,
        JSON.stringify(body.tags)
    )
    //read it back and send 201
    const row = db.prepare("SELECT * FROM items WHERE id = ?").get(id)
    sendOk(res,rowToItem(row),201)

})

// catch-all : no route matched -> 404 in our format
app.use((req,res)=>{
    sendError(res,404,"NOT_FOUND","Route not Found")
})
// error handler: must have 4 params, must be LAST
app.use((err,req,res,next) => {
    if (err.type === "entity.parse.failed"){
        return sendError(res,400,"VALIDATION_ERROR","request body must be a valid json")
    }
    console.error(err)
    sendError(res,500,"INTERNAL_ERROR","internal server error")
})
const PORT = process.env.PORT || 8080
app.listen(PORT, () => console.log(`Listening on port ${PORT}`))
