const express = require('express')
const app = express()
const { MongoClient } = require('mongodb');
const port = process.env.PORT || 5000;

// username- doctorsPortalDb
// pass- t1MyKYBATPnQIMQ2

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ckcl0.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

console.log(client)



app.get('/', (req, res) => {
  res.send('Hello World!')
})



app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})