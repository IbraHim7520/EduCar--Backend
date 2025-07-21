// server.js (entry point)
require('dotenv').config(); // Load env first!
const express = require('express');
const cors = require('cors');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const app = express();
const jwt = require('jsonwebtoken')
const port = process.env.PORT || 3000;
// Middlewares
app.use(cors());
app.use(express.json());

const verifyJWT = (req, res, next) => {
  const authHeader = req?.headers?.authorization;
  if (!authHeader) {
    return res.status(401).send({ message: "Unauthorized access!" });
  }
  const token = authHeader.split(' ')[1];
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: "Forbidden access!" });
    }
    req.decoded = decoded;
    next();
  });
};

app.get("/", (req, res) => {
  res.send("Server is running successfully.");
});

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
    const TeachingEvaluation =  database.collection("Teaching_Evaluation");
    


    app.post('/jwt', (req , res)=>{
      const email = {email: req.body.email}
     const jwtToken =  jwt.sign(email , process.env.JWT_SECRET, {expiresIn: "30d"})
    res.send({token: jwtToken})
    })

    app.get('/get-teacher-request', async (req, res) => {
      const data = await TeacherReq_Collection.find().toArray()
      res.send(data);
      } )
      


    app.post('/userrole', async (req, res) => {
      const roleData = req.body.RoleData;
      const userEmail = roleData.Email
      const emailQuery = { Email: userEmail };
      const result = await UserRole.findOne(emailQuery);
      if (result) {
        res.send({ message: "Email alredy registered" })
        return
      }
      const roleinsertResponse = await UserRole.insertOne(roleData)
      res.send(roleinsertResponse);
    })

app.get('/get-role/:email', verifyJWT, async (req, res) => {
  const requestedEmail = req.params.email;
  const tokenEmail = req.decoded.email;
  if (requestedEmail !== tokenEmail) {
    return res.status(403).send({ message: "Forbidden access!" });
  }
  const roles = { Email: requestedEmail };
  const users = await UserRole.findOne(roles);
  if (users) {
    res.send(users);
  } else {
    res.status(500).send({ message: "Internal Server Error!" });
  }
});

  app.get('/getroles', async (req, res) => {
      const AllUsers = await UserRole.find().toArray()
      res.send(AllUsers);
    })

    app.put('/update-role/:id', async (req, res) => {
      const reqID = req.params.id;
      const ReqInfo = await TeacherReq_Collection.findOne({ _id: new ObjectId(reqID) })
      if (!ReqInfo) {
        return
      }
      const TeacherReqUpdate = {
        $set: {
          Status: "Approved"
        }
      }
      const UpdatedReq = await TeacherReq_Collection.updateOne({ _id: new ObjectId(reqID) }, TeacherReqUpdate);
      if (!UpdatedReq) {
        return
      }
      const reqTeacherEmail = ReqInfo.TeacherMail;
      const roleUpdateQuery = { Email: reqTeacherEmail }
      const updatedRole = {
        $set: {
          Role: "Teacher"
        }
      }
      const updatedUserRole = await UserRole.updateOne(roleUpdateQuery, updatedRole)
      res.send(updatedUserRole);
    })

    app.put("/reject-req/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const updtaeDoc = {
        $set: {
          Status: "Rejected"
        }
      }
      const result = await TeacherReq_Collection.updateOne(query, updtaeDoc);
      res.send(result)
    })

    app.post('/post-teachereq', async (req, res) => {
      const data = req.body.data
      const result = await TeacherReq_Collection.insertOne(data);
      res.send(result);
    })

    app.get("/get-tecReq/:id", async (req, res) => {
      const id = req.params.id;
      const result = await TeacherReq_Collection.findOne({ _id: new ObjectId(id) })
      res.send(result)
    })

    app.post('/insert-class', async (req, res) => {
      const ClassData = req.body;
      const result = await Lectures.insertOne(ClassData);
      res.send(result)
    })

    app.get("/getallclass", async (req, res) => {
      const AllClass = await Lectures.find().toArray()
      res.send(AllClass);
    })



    app.get('/top-classes', async (req, res) => {
      // const query = {Status: Approved }
      const result = await Lectures.aggregate([
        {
          $addFields: {
            arrayLength: { $size: "$EnrolledBy" }
          }
        },
        {
          $match: {
            Status: "Approved"
          }
        },
        {
          $sort: { arrayLength: -1 }
        }
      ]).limit(6).toArray();
      res.send(result);
    })

    app.get('/get-class/:id', async (req, res) => {
      const id = req.params.id
      const qury = { _id: new ObjectId(id) }
      const result = await Lectures.findOne(qury);
      res.send(result);
    })
    app.put('/update-clsstats/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };

      const updateDoc = {
        $set: {
          Status: "Approved"
        }
      }
      const ClassInfo = await Lectures.updateOne(query, updateDoc);
      res.send(ClassInfo);
    })

    //not checked apies----------------------
    app.put('/make-admin/:id', async (req, res) => {
      const id = req.params.id;
      const roleQry = {_id: new ObjectId(id)}
      const response = await UserRole.updateOne(roleQry , {
        $set:{
          Role: "Admin",
          isAdmin: true
        }
      })
      res.send(response);
    })

    app.delete("/reject-cls/:id", async (req, res) => {
      const id = req.params.id;
      const ClassQry = { _id: new ObjectId(id) }
      const updateClassStats = {
        $set: {
          Status: "Rejected"
        }
      }
      const db_res = await Lectures.updateOne(ClassQry, updateClassStats);
      res.send(db_res)

    })

    app.put("/aprove-cls/:id", async (req, res) => {
      const classID = req.params.id;
      const clasQry = { _id: new ObjectId(classID) }
      const updateClassStats = {
        $set: {
          Status: "Approved"
        }
      }
      const response = await Lectures.updateOne(clasQry, updateClassStats);
      res.send(response)
    })

app.get('/my-class/:email', verifyJWT, async (req, res) => {
  const requestedEmail = req.params.email;
  const tokenEmail = req.decoded.email;

  if (requestedEmail !== tokenEmail) {
    return res.status(403).send({ message: "Forbidden access!" });
  }

  const classQry = { TeacherEmail: requestedEmail };
  const classes = await Lectures.find(classQry).toArray();
  res.send(classes);
});


    app.delete("/delete-class/:id", async (req, res) => {
      const id = req.params.id
      const deleteQry = { _id: new ObjectId(id) }
      const delereConfirmation = await Lectures.deleteOne(deleteQry);
      if (delereConfirmation) {
        res.send(delereConfirmation);
      }
    })

    app.put('/update-class/:id', async (req, res) => {
      const id = req.params.id
      const clsData = req.body.UpdatedData
      const docQury = { _id: new ObjectId(id) };
      const ClassTitle = clsData?.ClassTitle
      const Description = clsData?.Description
      const ClassPrice = clsData?.ClassPrice
      const Image = clsData?.Image


      const updaeDoc = {
        $set: {
          ClassTitle: ClassTitle,
          Description: Description,
          ClassPrice: ClassPrice,
          Image: Image
        }
      }
      const response = await Lectures.updateOne(docQury, updaeDoc);
      res.send(response)
    })


    app.put('/add-assignment/:id', async(req , res)=>{
      const id = req.params.id;
      const assignmentData = req.body.formData
      assignmentData.AssignmentId =  new Date();
      const qry = {_id: new ObjectId(id)};
      const updateAssignment = {
        $addToSet:{
          PublishAsgnment: assignmentData
        }
      }
      const result = await Lectures.updateOne(qry , updateAssignment);
      res.send(result);
    })

    app.put('/submit-assignment/:id', async(req , res)=>{
      const classID = req.params.id;
      const AssignmentData = req.body.classObeject;
      AssignmentData.SubmisionId = new Date();
      const qry = {_id: new ObjectId(classID)};
      const response = await Lectures.updateOne(qry , {
        $addToSet:{
          SubmittedAsgnment: AssignmentData
        }
      })
      res.send(response);
    })


    app.post('/create-payment-intent', async (req, res) => {
      try {
        const data = req.body.data;
       // console.log(data);
        const TotalPrice = data?.ClassPrice * 100;
        const paymentIntent = await stripe.paymentIntents.create({
          amount: TotalPrice,
          currency: 'usd',
          automatic_payment_methods: {
            enabled: true,
          },
        });
        res.send({ clientSecret: paymentIntent.client_secret })
      } catch (err) {
        res.status(500).send({ error: err.message });
      }
    })

    app.put("/class-enrollment/:id", async(req , res)=>{
      const classId = req.params.id;
      const PaymentDetails = req.body.PaymentDetails;
      const classQry = {
        _id: new ObjectId(classId)
      }
      const updateDoc ={
        $addToSet:{
          EnrolledBy:PaymentDetails
        }
      }
      const upatedResult = await Lectures.updateOne(classQry , updateDoc);
      res.send(upatedResult);
    })

app.get('/my-enrolled-class/:email', verifyJWT, async(req , res)=>{
  const requestedEmail = req.params.email;
  const tokenEmail = req.decoded.email;

  if (requestedEmail !== tokenEmail) {
    return res.status(403).send({ message: "Forbidden access!" });
  }

  const findingQuery = {
    EnrolledBy: {
      $elemMatch: {
        StudentEmail: requestedEmail
      }
    }
  };
  const classes = await Lectures.find(findingQuery).toArray()
  res.send(classes);
});


    app.put("/post-assignment/:id" , async(req , res)=>{
      const id = req.params.id
      const studentEmail = req.body.email;
      console.log(studentEmail)
      const qry = {_id: new ObjectId(id)};
      const docUpdate = {
        $addToSet:{
          PostedAsgnment:studentEmail
        }
      }
      const response = await Lectures.updateOne(qry , docUpdate);
      res.send(response);
    })

    app.post('/post-evaluation', async(req , res)=>{
      const Evaluationdata = req.body.Evaluationdata;
      const result = await TeachingEvaluation.insertOne(Evaluationdata);
      res.send(result);
    })

app.get('/total-enrolled', async (req, res) => {
  try {
    const Lectures = client.db("Educar-DB").collection("Lectures");

    const result = await Lectures.aggregate([
      {
        $project: {
          enrolledCount: {
            $cond: [{ $isArray: "$EnrolledBy" }, { $size: "$EnrolledBy" }, 0]
          }
        }
      },
      {
        $group: {
          _id: null,
          totalEnrolled: { $sum: "$enrolledCount" }
        }
      }
    ]).toArray(); 

    res.send({ totalEnrolled: result[0]?.totalEnrolled || 0 }); // cleaner response
  } catch (err) {
    console.error(err);
    res.status(500).send({ error: "Internal Server Error" });
  }
});

  app.get('/getreviews', async(req , res)=>{
    const allReviews = await TeachingEvaluation.find().toArray()
    res.send(allReviews);
  })

  app.get('/search-user/:query', async (req, res) => {
  const query = req.params.query;
  const users = await UserRole.find({
    $or: [
      { Name: { $regex: query, $options: 'i' } },
      { Email: { $regex: query, $options: 'i' } }
    ]
  }).toArray();
  res.send(users);
});


  } finally {

  }
}
run().catch(console.dir);


app.listen(port, () => {
  console.log("Server running")
})