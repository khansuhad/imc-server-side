const express = require('express');
const cors = require('cors');
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;

app.use(cors())
app.use(express.json())

const { MongoClient, ServerApiVersion , ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_NAME}:${process.env.DB_PASS}@cluster0.5y6t7ws.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    // create test api start
    const createTestCollection = client.db("imcDB").collection("createtests");
    app.post("/createTests", async (req, res) => {
      const formInfo = req.body;
      const result = await createTestCollection.insertMany(formInfo);
      res.send(result);
    });
    app.get("/createTests", async (req, res) => {
      const result = await createTestCollection.find().toArray();
      res.send(result)
    })
    app.get("/createTests/:id", async (req, res) => {
      const query = req.params.id ;
      const filter = { _id: new ObjectId(query) }
      const result = await createTestCollection.findOne(filter)
      res.send(result)
    })
    // create test api end
    // addmission student api start
    const admissionCollection = client.db("imcDB").collection("admissions");
    app.post("/admissionStudents", async (req, res) => {
        const formInfo = req.body;
        const result = await admissionCollection.insertOne(formInfo);
        res.send(result);
      });
      app.get("/admissionStudents", async (req, res) => {
        const result = await admissionCollection.find().toArray();
        res.send(result)
      })
      app.get("/studentDetails/:id", async (req, res) => {
        const query = req.params.id ;
        const filter = { _id: new ObjectId(query) }
        const result = await admissionCollection.findOne(filter)
        res.send(result)
      })
      app.get("/studentDetails", async (req, res) => {
        const query = req.query.id ;
        console.log(query);
        const filter = { _id: new ObjectId(query) }
        const result = await admissionCollection.findOne(filter)
        res.send(result)
      })
      app.patch("/studentDetails/:id",  async (req, res) => {
        const details = req.body;
        const query = req.params.id ;
        const cursor = {  _id :new ObjectId(query)};
        console.log(details , cursor);
        const updatedDoc = {
          $set: {
            name: details.name,
            studentClass: details.studentClass,
            parentsPhoneNumber: details.parentsPhoneNumber,
            admissionDate: details.admissionDate,
            batch: details.batch,
            school: details.school,
            message: details.message,
          },
        };
        const result = await admissionCollection.updateOne(cursor, updatedDoc);
        res.send(result);
      });
    // addmission student api end
    // all student api start
    const allStudentCollection = client.db("imcDB").collection("allStudent");
    app.get("/studentFilter", async (req, res) => {
      const filter = req.query ;
      console.log(filter);
    const query = {
      id :{$regex : filter.id } ,
      name : {$regex : filter.name , $options : 'i'},
      studentClass : {$regex : filter.studentClass }
    }
    const result = await admissionCollection.find(query).toArray();
    res.send(result)
  })
    app.get("/studentClassFilter", async (req, res) => {
      const filter = req.query ;
      console.log(filter);
    const query = {
      studentClass : {$regex : filter.studentClass }
    }
    const result = await admissionCollection.find(query).toArray();
    res.send(result)
    
      
    })
    // all student api end
    // addpayment api start
    const paymentCollection = client.db("imcDB").collection("payments");
    app.post("/addpayment", async (req, res) => {
      const formInfo = req.body;
      const result = await paymentCollection.insertOne(formInfo);
      res.send(result);
    });
    app.get("/addpayment", async (req, res) => {
      const result = await paymentCollection.find().toArray();
      res.send(result)
    })
    // addpayment api end
    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get('/',( req , res) =>{
    res.send("database coming soon")
})

app.listen(port , (req , res) =>{
    console.log(`database is running successfully in port : ${port}`);
})