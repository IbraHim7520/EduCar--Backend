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

    app.get('/get-teacher-request', async (req, res)=>{
     const data = await TeacherReq_Collection.find().toArray()
     res.send(data);      
    })
  
    app.post('/userrole', async(req , res)=>{
      const roleData = req.body.RoleData;
      const userEmail = roleData.Email
      const emailQuery = {Email: userEmail};
      const result = await UserRole.findOne(emailQuery);
      if(result){
        res.send({message:"Email alredy registered"})
        return
      }
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
      const reqID = req.params.id;
      const ReqInfo = await TeacherReq_Collection.findOne({_id: new ObjectId(reqID)})
      if(!ReqInfo){
        return
      }
      const TeacherReqUpdate = {
        $set:{
          Status: "Approved"
        }
      }
      const UpdatedReq = await TeacherReq_Collection.updateOne({_id: new ObjectId(reqID)}, TeacherReqUpdate);
      if(!UpdatedReq){
        return
      }
      const reqTeacherEmail = ReqInfo.TeacherMail;
      const roleUpdateQuery = {Email: reqTeacherEmail}
      const updatedRole = {
        $set:{
          Role: "Teacher"
        }
      }
      const updatedUserRole = await UserRole.updateOne(roleUpdateQuery, updatedRole)
      res.send(updatedUserRole);
    })

    app.put("/reject-req/:id", async(req , res)=>{
        const id = req.params.id;
        const query = {_id: new ObjectId(id)}
        const updtaeDoc = {
          $set:{
            Status : "Rejected"
          }
        }
        const result = await TeacherReq_Collection.updateOne(query , updtaeDoc);
        res.send(result)
    })

    app.post('/post-teachereq', async(req , res)=>{
      const data  = req.body.data
     const result = await TeacherReq_Collection.insertOne(data);
     res.send(result);
    })

    app.get("/get-tecReq/:id", async(req , res)=>{
      const id = req.params.id;
      const result = await TeacherReq_Collection.findOne({_id: new ObjectId(id)})
      res.send(result)
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
    const updatetoAdminRole = {
      $set:{
        Role: "Admin",
        isAdmin : true
      }
    }

    const db_response = await UserRole.updateOne(
      {_id: new ObjectId(id)},
      updatetoAdminRole
    )
    if(db_response){
      res.send(db_response);
    }
    
  })

  app.delete("/reject-cls/:id", async(req , res)=>{
        const id = req.params.id;
      const ClassQry = {_id: new ObjectId(id)}
      const updateClassStats = {
        $set:{
          Status: "Rejected"
        }
      }
      const db_res = await Lectures.updateOne(ClassQry , updateClassStats);
      res.send(db_res)
 
  })

  app.put("/aprove-cls/:id" , async(req , res)=>{
    const classID = req.params.id;
    const clasQry = {_id: new ObjectId(classID)}
    const updateClassStats = {
      $set:{
        Status: "Approved"
      }
    }
    const response = await Lectures.updateOne(clasQry, updateClassStats);
    res.send(response)
  })

  app.get('/my-class/:email', async(req , res)=>{
    const teacherMail = req.params.email;
    const classQry = {TeacherEmail: teacherMail};
    const classes = await Lectures.find(classQry).toArray();
    res.send(classes);
  })

  app.delete("/delete-class/:id", async(req , res)=>{
    const id = req.params.id
    const deleteQry = {_id: new ObjectId(id)}
    const delereConfirmation = await Lectures.deleteOne(deleteQry);
    if(delereConfirmation){
      res.send(delereConfirmation);
    }
  })

  app.put('/update-class/:id', async(req , res)=>{
    const id = req.params.id
    const clsData = req.body.UpdatedData
    const docQury = {_id: new ObjectId(id)};
    const ClassTitle = clsData?.ClassTitle
    const Description = clsData?.Description
    const ClassPrice = clsData?.ClassPrice
    const Image = clsData?.Image


    const updaeDoc = {
      $set:{
        ClassTitle : ClassTitle,
        Description :Description,
        ClassPrice : ClassPrice,
        Image:Image
      }
    }
    const response = await Lectures.updateOne(docQury, updaeDoc);
    res.send(response)
  })

  }finally{

  }
}
run().catch(console.dir);


app.listen(port, () => {
  console.log("Server running")
})