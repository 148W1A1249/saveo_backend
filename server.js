const express =  require('express');
const fileUpload = require('express-fileupload');
var cors = require("cors");
var csvToJson = require('convert-csv-to-json');

const mongodb = require('mongodb');
const MongoClient = mongodb.MongoClient;


const app = express();
app.use(express.json());
app.use(cors());
app.use(fileUpload());

const connectionURl = 'mongodb+srv://khasim:khasimDB@cluster0.xezl9.mongodb.net/medicinStore?retryWrites=true&w=majority';
const databaseName = 'medicinStore';
const port = process.env.PORT || 8000;;

app.post('/uploadCSV',(req,res)=>{
    if(req.files === null){
        return res.status(400).json({msg: "No File Uploaded"});
    }
    const file = req.files.file;

    file.mv(`${__dirname}/client/public/uploads/${file.name}`, err=>{
        if(err){
            console.log(err);
            return res.status(500).send(err);
        }
        
        let fileInputName = `${__dirname}/client/public/uploads/${file.name}`; 
        let csvFileData = csvToJson.fieldDelimiter(',').getJsonFromCsv(fileInputName);
        MongoClient.connect(
            connectionURl,
            { useNewUrlParser: true },
            (error, client) => {
                if (error) {
                    return console.log('unable to connect to database');
                }        
                const db = client.db(databaseName);        
                db.collection('medicineRecord').insertMany(csvFileData);
            }
        );
        res.json({csvFileData})
    })
})

app.post('/searchMedicine',(req,res)=>{
    MongoClient.connect(
        connectionURl,
        { useNewUrlParser: true },
        async (error, client) => {
            if (error) {
                return console.log('unable to connect to database');
            }        
            const db = await client.db(databaseName);  
            const pattern = new RegExp(".*" + req.body.search + ".*", 'i');
            let data = await db.collection('medicineRecord').find({ c_name: { $regex:  pattern}}).toArray();
            res.json(data)
        }
    );
})

app.get('/getMedicineid',async (req,res)=>{
    let client = await MongoClient.connect(connectionURl);
    let db = client.db("medicinStore");
    let data = await db.collection('medicineRecord').find().toArray();
    res.json(data)
})

app.post('/getMedicineDetails',(req,res)=>{
    MongoClient.connect(
        connectionURl,
        { useNewUrlParser: true },
        async (error, client) => {
            if (error) {
                return console.log('unable to connect to database');
            }        
            const db = await client.db(databaseName);        
            let data =  await db.collection('medicineRecord').find({c_unique_code:req.body.queryId}).toArray();
            res.json(data);
        }
    );
})

app.post("/placeorder",(req,res)=>{
     MongoClient.connect(
        connectionURl,
        { useNewUrlParser: true },
        async (error, client) => {
            if (error) {
                return console.log('unable to connect to database');
            }        
            const db = await client.db(databaseName);        

             db.collection('medicineRecord').updateMany( { c_unique_code: req.body.queryId},{ $set: { "order_id" : `ORD${req.body.queryId}` } });
            
            res.json({msg:"Order Placed"});
        }
    );
})


app.listen(port,()=>console.log(`::: server runs with the port ${port}`));


