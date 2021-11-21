const express = require('express');
const app = express();
const cors =require("cors");
const { MongoClient } = require('mongodb');
require('dotenv').config();
const ObjectId = require("mongodb").ObjectId;
const admin = require("firebase-admin");
const fileUpload = require("express-fileupload")
const port = process.env.PORT || 5000;
const stripe = require("stripe")(process.env.STRIPE_SECRET);


// sk_test_51JwKPsJquxAPgLX0snZNEvscIs2orLssRNgX6QuLV0oEXS3GUa4iLM5C1S9Z4ZxoJt1QYW4CvelbYcjYlAxN7i7T00zRkZtqgr

const serviceAccount = require("./doctors-portal-f37ae-firebase-adminsdk-nv2hd-2e75c79ac5.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// middleware

app.use(cors());
app.use(express.json());
app.use(fileUpload());

// username- doctorsPortalDb
// pass- t1MyKYBATPnQIMQ2

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ckcl0.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
console.log(uri)

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });


async function verifyToken(req, res, next) {


  if (req.headers?.authorization?.startsWith('Bearer ')) {

    const token = req.headers.authorization.split(' ')[1]

    try{
      const decodedUser = await admin.auth().verifyIdToken(token);
      req.decodedEmail = decodedUser.email;
    }
    finally{

    }
  }

  next()
}

async function run () {

    try{
        await client.connect();

        const database = client.db("doctorsPortal");
        const appointmentsCollection = database.collection("appointments");
        const usersCollection = database.collection("users");
        const doctorsCollection = database.collection("doctors");


        app.get('/appointments', async(req, res) => {
          const email = req.query.email;
          const date = new Date (req.query.date).toLocaleDateString();
          const query = {email: email, date: date};
          console.log(query)
          const cursor = appointmentsCollection.find(query);
          const result = await cursor.toArray()
          res.send(result)
        });

        app.get('/appointments/:id', async(req, res) => {
          const id = req.params.id;
          const query ={_id: ObjectId(id)};
          const result = await appointmentsCollection.findOne(query);
          res.send(result);
        });

        app.post('/appointments',async(req, res) => {
          const result = await appointmentsCollection.insertOne(req.body);
          console.log(result)
          res.json(result)
        });

        // update appointment
        app.put('/appointments/:id', async(req,res) => {
          const id = req.params.id;
          const payment = req.body;
          const filter = {_id: ObjectId(id)};
          const updateDoc ={
            $set: {
              payment: payment
            }
          }
          const result = await appointmentsCollection.updateOne(filter, updateDoc);
          res.send(result);
        })

        app.get("/doctors", async(req, res) => {
          const result = await doctorsCollection.find({}).toArray()
          res.send(result);
        });

        app.post('/doctors', async(req, res) => {
          const name =  req.body.name;
          const email =  req.body.email;
          const pic =  req.files.image;
          const picData = pic.data;
          const encodedPic = picData.toString('base64');
          const imageBuffer = Buffer.from(encodedPic, 'base64')
          const doctor ={
            name,
            email,
            image: imageBuffer
          }
          const result = await doctorsCollection.insertOne(doctor);
          res.send(result)
        })

        // get er khetre usually params e request send kora hoy
        app.get('/users/:email', async(req, res) => {
            const email  = req.params.email;
            const query = {email: email};
            const user = await usersCollection.findOne(query);
            let isAdmin = false;
            if (user?.role === 'admin') {
              isAdmin = true;
            }
           res.send({admin: isAdmin});
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

        app.put('/users/admin', verifyToken, async(req,res) => {
          const user = req.body;
          const requester = req.decodedEmail;
          if (requester) {
            const requesterAccount =await usersCollection.findOne({email: requester});
            if (requesterAccount.role === 'admin') {
              const filter = {email: user.email};
              const updateDoc = { $set: { role: 'admin' } };
              const result = await usersCollection.updateOne(filter, updateDoc);
              res.send(result)
            }
          }
          else{
            res.status(403).json({message: "You haven't got any access to make an admin"})
          }
        });


        app.post('/create-payment-intent', async (req, res) => {
          const paymentInfo = req.body;
          const amount = paymentInfo.price * 100;
          const paymentIntent = await stripe.paymentIntents.create({
              currency: 'usd',
              amount: amount,
              payment_method_types: ['card']
          });
          res.json({ clientSecret: paymentIntent.client_secret })
      })
  
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

