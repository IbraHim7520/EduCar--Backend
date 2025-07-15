const express = require('express')
const app = express()
app.use(express.json())
const port = process.env.PORT || 3000
require('dotenv').config()
const cors = require('cors')
app.use(cors())

app.get("/", (req, res) => {
  res.send("Hello")
})


const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASS}@cluster0.9vvyx12.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    const database = client.db("Educar-DB")
    const TeacherReq_Collection = database.collection("TeacherReq_Collection")
    const UserRole = database.collection("User_Role");
    const Lectures = database.collection("Lectures");
    app.post("/to-be-teacher-request", async(req , res)=>{
      const Request = req.body;
      const insertResponse = await TeacherReq_Collection.insertOne(Request);
      res.send(insertResponse);
    })

    app.get('/get-teacher-request', async (req, res)=>{
     const data = await TeacherReq_Collection.find().toArray()
     res.send(data);
        
      
    })
    app.post('/userrole', async(req , res)=>{
      const roleData = req.body.RoleData;
      const roleinsertResponse = await UserRole.insertOne(roleData)
      res.send(roleinsertResponse);
    } )

    app.get('/get-role/:email', async(req , res)=>{
      const UserEmail = req.params.email
      //console.log(UserEmail);
      const roles = {Email : UserEmail};
      const users = await UserRole.findOne(roles);
      if(users){
        res.send(users)
      }else{
        res.status(500).send({message: "Internal Server Error!"})
      }
    })

    app.get('/getroles', async(req , res)=>{
      const AllUsers = await UserRole.find().toArray()
      res.send(AllUsers);
    })

    app.put('/update-role/:id', async(req, res)=>{
        const id = req.params.id;
        const query = {_id: new ObjectId(id)}
        const updtaeDoc = {
          $set:{
            status : "Approved"
          }
        }
        const result = await TeacherReq_Collection.updateOne(query , updtaeDoc);
        res.send(result)
    })

    app.put("/reject-req/:id", async(req , res)=>{
        const id = req.params.id;
        const query = {_id: new ObjectId(id)}
        const updtaeDoc = {
          $set:{
            status : "Rejected"
          }
        }
        const result = await TeacherReq_Collection.updateOne(query , updtaeDoc);
        res.send(result)
    })

    app.get('/get_one_req/:email', async(req , res)=>{
      const email = req.params.email;
      const query = {TeacherMail: email};
      const result = await TeacherReq_Collection.findOne(query);
      res.send(result);
    })

    app.post('/insert-class', async(req, res)=>{
      const ClassData = req.body;
      const result = await Lectures.insertOne(ClassData);
      res.send(result)
    })

    app.get("/getallclass", async(req , res)=>{
      const AllClass = await Lectures.find().toArray()
      res.send(AllClass);
    })
    app.get('/top-classes', async(req , res)=>{
     // const query = {Status: Approved }
      const result = await Lectures.aggregate([
        {
          $addFields: {
            arrayLength: {$size : "$EnrolledBy"}
          }
        },
        {
          $match : {
            Status : "Approved"
          }
        },
        {
          $sort: {arrayLength : -1}
        }
      ]).limit(6).toArray();
      res.send(result);
    })

    app.get('/get-class/:id' , async(req , res)=>{
      const id = req.params.id
      const qury = {_id: new ObjectId(id)}
      const result = await Lectures.findOne(qury);
      res.send(result);
    })
    app.put('/update-clsstats/:id', async(req , res)=>{
      const id  = req.params.id;
      const query = {_id: new ObjectId(id)};

        const updateDoc = {
          $set:{
            Status: "Approved"
          }
        }
      const ClassInfo = await Lectures.updateOne(query, updateDoc);
      res.send(ClassInfo);
  })

  //not checked apies----------------------
  app.put('/make-admin/:id', async(req , res)=>{
    const id = req.params.id;
    const qry = {_id: new ObjectId(id)}
    const updateDoc = {
      $set:{
        Role: "Admin",
        isAdmin: true
      }
    }
    const result = await UserRole.updateOne(qry , updateDoc);
    res.send(result)
    
  })

  app.put("/reject-cls/:id", async(req , res)=>{
        const id = req.params.id;
    const qry = {_id: new ObjectId(id)}
    const updateDoc = {
      $set:{
        Status: "Rejected",
      }
    }
    const result = await Lectures.updateOne(qry , updateDoc);
    res.send(result)
  })

  }finally{

  }
}
run().catch(console.dir);


app.listen(port, () => {
  console.log("Server running")
})