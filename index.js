const express = require('express');
const app = express();
const cors =require("cors");
const { MongoClient } = require('mongodb');
require('dotenv').config();
const port = process.env.PORT || 5000;

// middleware

app.use(cors());
app.use(express.json());

// username- doctorsPortalDb
// pass- t1MyKYBATPnQIMQ2

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ckcl0.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
console.log(uri)

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });


async function run () {

    try{
        await client.connect();

        const database = client.db("doctorsPortal");
        const appointmentsCollection = database.collection("appointments");
        const usersCollection = database.collection("users");


        app.get('/appointments', async(req, res) => {
          const email = req.query.email;
          const date = new Date (req.query.date).toLocaleDateString();
          const query = {email: email, date: date};
          console.log(query)
          const cursor = appointmentsCollection.find(query);
          const result = await cursor.toArray()
          res.send(result)
        });


        app.post('/appointments',async(req, res) => {
          const result = await appointmentsCollection.insertOne(req.body);
          console.log(result)
          res.json(result)
        });


        app.post('/users', async(req,res) => {
          console.log(req);
          const result = await usersCollection.insertOne(req.body);
          console.log(result)
          res.send(result);
        });

        app.put('/users', async(req, res) => {
          const user = req.body;
          const filter = {email: user.email};
          const options = { upsert: true };
          const updateDoc = {$set: user};
          const result = await usersCollection.updateOne(filter, updateDoc, options);
          res.send(result);
        });

        app.put('/users/admin', async(req,res) => {
          const user = req.body;
          const filter = {email: user.email};
          const updateDoc = { $set: { role: 'admin' } };
          const result = await usersCollection.updateOne(filter, updateDoc);
          res.send(result)
        });
    }
    finally{

    }
}
run().catch(console.dir);




app.get('/', (req, res) => {
  res.send('Hello World!')
})


app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})