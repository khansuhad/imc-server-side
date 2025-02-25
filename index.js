const express = require('express');
const cors = require('cors');
require("dotenv").config();
const app = express();
const port = process.env.PORT || 3000;
const cron = require("node-cron");
const moment = require("moment-timezone");
// const allowedOrigins = ['http://localhost:5173','http://localhost:5174'];

// app.use(cors({
//   origin: (origin, callback) => {
//       if (!origin || allowedOrigins.includes(origin)) {
//           callback(null, true);
//       } else {
//           callback(new Error('Not allowed by CORS'));
//       }
//   },
//   credentials: true ,
// }));
app.use(cors(
  {
    origin : [ 
      'http://localhost:5173' ,
      'https://www.infinitymathcenter.com'
       ],
    credentials: true
  },

))
app.use(express.json())

const { MongoClient, ServerApiVersion , ObjectId } = require('mongodb');
const uri = `mongodb+srv://IMCDB:c6QJHvBLPtT548Ji@cluster0.jotdo.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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
    const usersCollection = client.db("imcDB").collection("users");
    app.post("/users", async (req, res) => {
      const user = req.body;
      const email = req.body.email;
      const cursor = { email: email };
      const existing = await usersCollection.findOne(cursor);

      if (existing) {
        return res.status(400).send({ message: "User already exists" });
      } else {
        const result = await usersCollection.insertOne(user);
        res.send(result);
      }
    });
    app.post("/make-admin", async (req, res) => {
      const user = req.body;
      const email = req.body.email;
      const cursor = { email: email };
      const existing = await usersCollection.findOne(cursor);

      if (existing) {
        return res.status(400).send({ message: "User already exists" });
      } else {
        const result = await usersCollection.insertOne(user);
        res.send(result);
      }
    });
    app.get("/all-users", async (req, res) => {
      const result = await usersCollection.find({$or: [
        { role: "student" }, // Notice sent to all batches
        { role: "teacher" }, // Notice sent to specific matching batch
      ],}).toArray();
     
      res.send(result.reverse());
    });
    app.get("/admin-users", async (req, res) => {
      const result = await usersCollection.find({role : 'admin'}).toArray();
     
      res.send(result.reverse());
    });
    app.get("/users-create", async (req, res) => {
      const email = req.query.email;
      const password =req.query.password;
      const role = req.query.role;
      const cursor = { email: email,defaultPassword :password,role :role };
      const result = await usersCollection.findOne(cursor);
//
      if (result) {
        return res.send(result);
      } else {
        return res.status(401).send({ message: "You can not create account , inform admin " });
      }
    });
      app.get("/users", async (req, res) => {
        const result = await usersCollection.find().toArray();
       
        res.send(result);
      });
  
      app.get("/users/:id", async (req, res) => {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await usersCollection.findOne(query);
        res.send(result);
      });
      app.delete("/users/:id", async (req, res) => {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await usersCollection.deleteOne(query);
        res.send(result);
      });
      app.get("/userInfo", async (req, res) => {

        const email = req.query.email;
        const cursor = { email: email };
        const result = await usersCollection.findOne(cursor);
        res.send(result);
       
      });
      app.patch('/users/:email' , async(req , res) => {
        const email = req.params.email ;
        const filter = { email :email }
        const update = req.body ;
        const updateDoc = {
       
            $set: {
              displayName:  update.displayName,
              photoURL:  update.photoURL,
            mobile:  update.mobile,
         
    
            },
          };
        const result = await usersCollection.updateOne(filter , updateDoc )
        res.send(result)
    })
      app.patch('/users/:email' , async(req , res) => {
        const email = req.params.email ;
        const filter = { email :email }
        const update = req.body ;
        const updateDoc = {
       
            $set: {
              displayName:  update.displayName,
              photoURL:  update.photoURL,
            mobile:  update.mobile,
         
    
            },
          };
        const result = await usersCollection.updateOne(filter , updateDoc )
        res.send(result)
    })
      app.patch('/users-password-change/:email' , async(req , res) => {
        const email = req.params.email ;
        const filter = { email :email }
        const update = req.body ;
        const updateDoc = {
       
            $set: {
              defaultPassword:  update.defaultPassword,
            },
          };
        const result = await usersCollection.updateOne(filter , updateDoc )
        res.send(result)
    })
      app.patch('/users-email-change/:email' , async(req , res) => {
        const email = req.params.email ;
        const filter = { email :email }
        const user = await usersCollection.findOne(filter)
        const update = req.body ;
          const updateDoc = {
         
              $set: {
                email:  update.email,
              },
            };

        if(user?.role === 'teacher' ){
         const result = await instructorCollection.updateOne(filter , updateDoc )
         const resultuser = await usersCollection.updateOne(filter , updateDoc )
         return res.send(result)
        }
        if(user?.role === 'student' ){
         const result = await admissionCollection.updateOne(filter , updateDoc )
         const resultuser = await usersCollection.updateOne(filter , updateDoc )
         return res.send(result)
        }
        
    })
    // batches start
    const batchCollection = client.db("imcDB").collection("batches");
    app.post("/batches", async (req, res) => {
      const batch = req.body;

      const result = await batchCollection.insertOne(batch);
      res.send(result);
    });
    app.get("/list-of-classes", async (req, res) => {
      try {
        // Get all batches
        const batches = await batchCollection.find().toArray();
    
        // Group batches by studentClass
        const classGroups = batches.reduce((acc, batch) => {
          const { studentClass, batchTitle } = batch;
    
          if (!acc[studentClass]) {
            acc[studentClass] = {
              studentClass,
              totalBatches: 0,
              totalStudents: 0,
              batchTitles: []
            };
          }
    
          acc[studentClass].totalBatches++;
          acc[studentClass].batchTitles.push(batchTitle);
    
          return acc;
        }, {});
    
        // Calculate total students for each class
        const finalResult = await Promise.all(
          Object.values(classGroups).map(async (classGroup) => {
            // Count total students for all batches in this class
            const totalStudents = await admissionCollection.countDocuments({
              batch: { $in: classGroup.batchTitles },
              completedInfo : "running student"
            });
    
            return {
              studentClass: classGroup.studentClass,
              totalBatches: classGroup.totalBatches,
              totalStudents: totalStudents
            };
          })
        );
    
        res.send(finalResult);
      } catch (error) {
        console.error(error);
        res.status(500).send({ error: "Failed to fetch list of classes" });
      }
    });
    
    app.get("/class-batches", async (req, res) => {
      const { studentClass } = req.query; // Capture 'studentClass' from query parameters
    
      // Build the search condition
      const batchQuery = {
        studentClass: studentClass,
      };
    
      try {
        // Query the database based on the search conditions
        const batchResult = await batchCollection.find(batchQuery).toArray();
    
        // Use Promise.all to resolve all the asynchronous operations
        const finalResult = await Promise.all(
          batchResult.map(async (batch) => {
            const totalStudents = await admissionCollection.countDocuments({
              batch: batch?.batchTitle,
              completedInfo: "running student"
            });

            return {
              ...batch,
              totalStudents,
            };
          })
        );
    
        res.send(finalResult); // Send the filtered records as the response
      } catch (error) {
        console.error(error);
        res.status(500).send({ error: "Failed to fetch admissions" });
      }
    });
    app.get("/class-students", async (req, res) => {
      const { studentClass } = req.query;
    
      try {
        // Step 1: Find all batches with the specified class
        const batchResult = await batchCollection
          .find({ studentClass: studentClass })
          .toArray();
    
        // Step 2: Extract batch titles from the found batches
        const batchTitles = batchResult.map(batch => batch.batchTitle);
    
        // Step 3: Find all students whose batch is in the list of batch titles
        const students = await admissionCollection
          .find({
            batch: { $in: batchTitles }
          })
          .toArray();
    
   
    
        res.send( students );
      } catch (error) {
        console.error(error);
        res.status(500).send({ error: "Failed to fetch student data" });
      }
    });
    
    
    app.get("/filter-batches", async (req, res) => {
      const { name } = req.query; // Capture 'name' from query parameters
    console.log(name);
      // Define the search condition, allowing for search on courseName, batchTitle, or status
      const query = name ? {
        $or: [  // Match courseName
          { batchTitle: { $regex: name, $options: "i" } },  // Match batchTitle
          { status: { $regex: name, $options: "i" } },      // Match status
        ]
      } : {}; // If no 'name' query parameter, return all records
    
      try {
        // Query the database based on the search conditions
        let result = (await batchCollection.find(query).toArray()).reverse();
        for (const batch of result) {
          // Assuming `batch._id` is the unique identifier for the batch
          const studentCount = await admissionCollection.countDocuments({
            batch: batch.batchTitle, // Match students assigned to this batch
          });
          batch.totalStudents = studentCount; // Add the totalStudents property
        }
        res.send(result); // Send the filtered batches as the response
      } catch (error) {
        console.error(error);
        res.status(500).send({ error: 'Failed to fetch batches' });
      }
    });
    app.get("/batches/:id", async (req, res) => {
      const query = req.params.id ;
      const filter = { _id: new ObjectId(query) }
      const result = await batchCollection.findOne(filter)
      res.send(result)
    })
    app.get("/batches", async (req, res) => {
      const query = req.query.id ;
      const filter = { batchTitle: query }
      const result = await batchCollection.findOne(filter)
      res.send(result)
    })
    app.delete("/batches/:id", async (req, res) => {
      const query = req.params.id ;
      const filter = { _id: new ObjectId(query) }
      const result = await batchCollection.deleteOne(filter)
      res.send(result)
    })
    app.patch('/batches/:id', async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const update = req.body;
    
      // Update batch information first
      const updateDoc = {
        $set: {
          batchTitle: update.batchTitle,
          classTime: update.classTime,
          studentClass: update.studentClass,
          classDay: update.classDay,
          startDate: update.startDate,
          status: update.status,
          batchMonthlyFee: update.batchMonthlyFee,
          batchModelTestFee: update.batchModelTestFee,
        },
      };
    
      try {
        const result = await batchCollection.updateOne(filter, updateDoc);
    
        // Check if batch was updated successfully
        if (result.modifiedCount > 0) {
          // Get the updated batch details
          const updatedBatch = await batchCollection.findOne(filter);
          const updatedFee = Number(updatedBatch.batchMonthlyFee);
          const batchTitle = updatedBatch.batchTitle;
    
          // Get current month in the format 'Feb 2025'
          const currentDate = new Date();
          const currentMonth = currentDate.toLocaleString('default', {
            month: 'short',
            year: 'numeric',
          });
    
          // Find all students in this batch
          const students = await admissionCollection.find({ batch: batchTitle }).toArray();
    
          // Update duesBatchMonthlyFee for the current month
          const updatePromises = students.map(async (student) => {

            const checkFeesReceive = student?.feesReceivedBatchMonthlyFee?.find(item => item?.month === currentMonth)  ;
            const checkDuesMonth = student?.duesBatchMonthlyFee?.find(item => item?.month === currentMonth)  ;
            if (updatedFee !== checkDuesMonth?.fee) {

            if(updatedFee <= 0){
              console.log("ok 1");
              const updatedDuesMonth = student?.duesBatchMonthlyFee.filter(item => item.month !== currentMonth)
              await admissionCollection.updateOne({ _id: new ObjectId(student?._id) }, {
                $set: {
                  duesBatchMonthlyFee: updatedDuesMonth
                }
            });
             
            }
            else{

              if (updatedFee > 0 && ( !checkFeesReceive && !checkDuesMonth)) {
                let updatedDuesMonth = student?.duesBatchMonthlyFee || []
                  updatedDuesMonth.push({month :currentMonth , fee : Number(updatedFee) })
                  console.log(updatedDuesMonth);
                  await admissionCollection.updateOne({ _id: new ObjectId(student?._id) }, {
                    $set: {
                      duesBatchMonthlyFee: updatedDuesMonth
                    }
                });
               
              
              }
              else if( updatedFee > 0 && (!checkFeesReceive && checkDuesMonth)  ){
                console.log("ok 2");
                const updatedDuesMonth = student?.duesBatchMonthlyFee.map((item) => {
                  if (item.month === currentMonth) {
                    console.log(item.month);
                      return {
                          ...item,
                          fee: Number(updatedFee), // Update fee with new studentMonthlyFee
                      };
                  }
                  return item;
              });
                        // Apply the updated duesMonth
                        await admissionCollection.updateOne({ _id: new ObjectId(student?._id) }, {
                          $set: {
                            duesBatchMonthlyFee: updatedDuesMonth
                          }
                      });
              }
              
            }
          
      
    
          }
          });
    
          await Promise.all(updatePromises);
    
          res.send({ message: 'Batch and student dues updated successfully.' });
        } else {
          res.status(404).send({ error: 'Batch not found or no changes made.' });
        }
      } catch (error) {
        console.error(error);
        res.status(500).send({ error: 'Failed to update batch and student dues.' });
      }
    });
    
    // batches end

    const createTestCollection = client.db("imcDB").collection("create-tests");
    app.post("/createTests", async (req, res) => {
      const formInfo = req.body;
      console.log(formInfo);
      const result = await createTestCollection.insertOne(formInfo);
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
    app.get("/tests/lastindex", async (req, res) => {
      const index = await createTestCollection.find().toArray()
      const lastIndex = index.length - 1
      console.log(index);
      const lastObject = index[lastIndex]
      const filter = {_id : new ObjectId(lastObject._id)}
      const result = await createTestCollection.findOne(filter)
      res.send(result)
    })
    app.get("/createTests/allStudents/:id", async (req, res) => {
      const query = req.params.id ;
      console.log(query);
      const filter = { _id: new ObjectId(query) }
      const testInfo = await createTestCollection.findOne(filter)
      console.log(testInfo );
      const queryStudentClass = {studentClass : testInfo?.testClass}
      const students = await admissionCollection.find(queryStudentClass).toArray()
      const result = { testInfo, students}
      console.log(result );
      res.send(result)
    })
    app.delete("/createTests/:id" , async (req,res) => {
      const id = req.params.id ;
      const query = { _id : new ObjectId(id)}
      const result = await createTestCollection.deleteOne(query);
      res.send(result)
    })
    // create test api end
    // marks code api start
    const marksCollection = client.db("imcDB").collection("marks");
    app.post("/test-marks", async (req, res) => {
      const formInfo = req.body;
      console.log(formInfo);
      const result = await marksCollection.insertOne(formInfo);
      res.send(result);
    });
    app.get("/test-marks/:id",async (req, res) => {
      const id = req.params.id
      const query = {testId : id}
      const allTest = await marksCollection.findOne(query);
      console.log(allTest);
      let newData = []
      for(var i = 0 ; i < allTest?.marksData?.length ; i++){
        const studentId = allTest.marksData[i]?.studentId ;
        console.log(studentId);
        const studentQuery = {_id : new ObjectId(studentId)}
        const studentData = await admissionCollection.findOne(studentQuery)
        console.log(studentData);
        const mainData = {studentData :studentData , mark :allTest.marksData[i]?.mark }
        newData.push(mainData)
      } 
      console.log(newData);
      res.send({data : newData , testId : allTest?.testId})
    })

    // marks code api end
    // addmission student api start
    const admissionCollection = client.db("imcDB").collection("admissions");
    app.post("/admissions", async (req, res) => {
        const formInfo = req.body;
        const result = await admissionCollection.insertOne(formInfo);
        res.send(result);
      });
      app.get("/admissions", async (req, res) => {
        // const result = await admissionCollection.find().toArray();

        res.send("result")
      })
      app.get("/total-student-length", async (req, res) => {
        const result = await admissionCollection.countDocuments();
        res.send({length : result})
      })
      app.get("/total-student-batch", async (req, res) => {
        const {batch} = req.query ;
        const result = await admissionCollection.countDocuments({batch:batch , completedInfo : "running student"});
        res.send({length : result})
      })
      app.get("/batch-students", async (req, res) => {
        const {batch} = req.query ;
        const result = await admissionCollection.find({batch:batch, completedInfo : "running student"}).sort({ registrationNo: 1 }).toArray();
        res.send(result)
      })
      app.get("/filter-admissions", async (req, res) => {
        const { name } = req.query; // Capture 'name' from query parameters
      
        // Build the search condition
        const query = {
          $and: [
            {
              $or: [
                { completedInfo: "running student" },
                { completedInfo: "off student" }
              ],
            },
            ...(name
              ? [
                  {
                    $or: [
                      { batch: { $regex: name, $options: "i" } },
                      { name: { $regex: name, $options: "i" } },
                      { registrationNo: { $regex: name, $options: "i" } },
                      { mobile: { $regex: name, $options: "i" } },
                      { dateOfBirth: { $regex: name, $options: "i" } }, // Assuming correct field name
                      { enrollDate: { $regex: name, $options: "i" } },
                    ],
                  },
                ]
              : []),
          ],
        };
      
        try {
          // Query the database based on the search conditions
          const result = await admissionCollection.find(query).sort({ registrationNo: 1 }).toArray();
          res.send(result); // Send the filtered records as the response
        } catch (error) {
          console.error(error);
          res.status(500).send({ error: "Failed to fetch admissions" });
        }
      });
      
      app.get("/admissions/:id", async (req, res) => {
        const query = req.params.id ;
        const filter = { _id: new ObjectId(`${query}`) }
        const result = await admissionCollection.findOne(filter)
        res.send(result)
      })
      app.get("/admissions-reg/:id", async (req, res) => {
        const query = req.params.id ;
        const filter = { registrationNo: query }
        const result = await admissionCollection.findOne(filter)
        res.send(result)
      })
      app.delete("/admissions-delete/:id", async (req, res) => {
        const query = req.params.id ;
        const filter = { _id: new ObjectId(query) }
        
        const updateDoc = {
       
            $set: {
     completedInfo : "deleted"
             
              
            },
          };
        const result = await admissionCollection.deleteOne(filter )
        res.send(result)
      })
      app.patch('/admissions/:id', async (req, res) => {
        const id = req.params.id;
        const filter = { _id: new ObjectId(id) };
        const update = req.body;
    
        // Get the current student record
        const student = await admissionCollection.findOne(filter);
    
        // Get the current month like "Feb 2025"
        const currentMonth = new Date().toLocaleString('default', { month: 'short', year: 'numeric' });
    
        // If changing from "running student" to "off student"
        if (student.completedInfo === "running student" && update.completedInfo === "off student") {
            // Check and remove the current month from duesMonth
            const updatedDuesMonth = student.duesMonth.filter(item => item.month !== currentMonth);
            // Check and remove the current month from duesBatchMonthlyFee
            const updatedDuesBatchMonthlyFee = student.duesBatchMonthlyFee.filter(item => item.month !== currentMonth);
    
            // Update the duesMonth and duesBatchMonthlyFee
            await admissionCollection.updateOne(filter, {
                $set: {
                    duesMonth: updatedDuesMonth,
                    duesBatchMonthlyFee: updatedDuesBatchMonthlyFee
                }
            });
        }
    
        // If changing from "off student" to "running student"
        if (student.completedInfo === "off student" && update.completedInfo === "running student") {
            const studentBatch = await batchCollection.findOne({ batchTitle: student?.batch });
            const { batchMonthlyFee } = studentBatch;
    
            // Add current month to duesMonth and duesBatchMonthlyFee
            await admissionCollection.updateOne(filter, {
                $push: {
                    duesMonth: { month: currentMonth, fee: Number(student?.studentMonthlyFee) },
                    duesBatchMonthlyFee: { month: currentMonth, fee: Number(batchMonthlyFee) },
                },
            });
        }
    
        // Check if studentMonthlyFee is changed
        if (update.studentMonthlyFee !== student.studentMonthlyFee) {
            // Update duesMonth for the current month
          if(student.studentMonthlyFee <= 0 && update.studentMonthlyFee > 0){
              let updatedDuesMonth = student.duesMonth || []
              updatedDuesMonth.push({month :currentMonth , fee : Number(update.studentMonthlyFee) })
              await admissionCollection.updateOne(filter, {
                $set: {
                    duesMonth: updatedDuesMonth
                }
            });
          }
          else{
            if( update?.studentMonthlyFee > 0 ){
              const updatedDuesMonth = student.duesMonth.map((item) => {
                if (item.month === currentMonth) {
                  console.log(item.month);
                    return {
                        ...item,
                        fee: Number(update.studentMonthlyFee), // Update fee with new studentMonthlyFee
                    };
                }
                return item;
            });
                      // Apply the updated duesMonth
                      await admissionCollection.updateOne(filter, {
                        $set: {
                            duesMonth: updatedDuesMonth
                        }
                    });
            }
            else {
              const updatedDuesMonth = student.duesMonth.filter(item => item.month !== currentMonth)
              await admissionCollection.updateOne(filter, {
                $set: {
                    duesMonth: updatedDuesMonth
                }
            });
            }
          }
        
    
  
        }
    
        // Prepare the update document
        const updateDoc = {
            $set: {
                name: update.name,
                fathersOrHusbandName: update.fathersOrHusbandName,
                fathersNumber: update.fathersNumber,
                fathersOccupation: update.fathersOccupation,
                mothersName: update.mothersName,
                mothersNumber: update.mothersNumber,
                mothersOccupation: update.mothersOccupation,
                gender: update.gender,
                dateOfBirth: update.dateOfBirth,
                studentSchool: update.studentSchool,
                studentSchoolRoll: update.studentSchoolRoll,
                studentMonthlyFee: update.studentMonthlyFee,
                mobile: update.mobile,
                guardiansMobile: update.guardiansMobile,
                photoURL: update.photoURL,
                presentAddress: update.presentAddress,
                permanentAddress: update.permanentAddress,
                batch: update.batch,
                enrollDate: update.enrollDate,
                bloodGroup: update.bloodGroup,
                religion: update.religion,
                group: update.group,
                service: update.service,
                studentNickname: update.studentNickname,
                completedInfo: update.completedInfo,
            }
        };
    
        // Update the rest of the fields
        const result = await admissionCollection.updateOne(filter, updateDoc);
        res.send(result);
    });
    
    
      app.get("/studentDetails", async (req, res) => {
        const query = req.query.id ;
        console.log(query);
        const filter = { _id: new ObjectId(query) }
        const result = await admissionCollection.findOne(filter)
        res.send(result)
      })
      app.get("/admissions/registration-number-check/:id", async (req, res) => {
        const query = req.params.id;
        console.log(query);
        
        // Use findOne to directly query the student with matching registrationNo
        const findStudent = await admissionCollection.findOne({ registrationNo: query });
        
        if (findStudent) {
          console.log("Student found:", findStudent);
          res.send({ result: true });
        } else {
          console.log("Student not found");
          res.send({ result: false });
        }
      })
      app.get("/admissions-roll-number-check", async (req, res) => {
        const {rollNo,batch} = req.query;
        const classFind = await batchCollection.findOne({batchTitle :batch })
        const batches =( await batchCollection.find({studentClass: classFind?.studentClass}).toArray())?.map(batch => {return batch?.batchTitle})
        // Use findOne to directly query the student with matching registrationNo
        const findStudent = await admissionCollection.findOne({ rollNo: rollNo , batch : {$in : batches} });
        
        if (findStudent) {
          console.log("Student found:", findStudent);
          res.send({ result: true });
        } else {
          console.log("Student not found");
          res.send({ result: false });
        }
      
      })
      app.get("/admissions-update/reg-number-update", async (req, res) => {
        const {query,registrationNo} = req.query;
        console.log(query);

        const admissions = await admissionCollection.find().toArray();
        const findReg = admissions.find(admission => admission.registrationNo == registrationNo);
        if(findReg){
          return res.send({message : "updated registration number already exists , it can't change ! Please change the registration number ."})
        }
        const updatedDoc = {
          $set: {
            registrationNo: registrationNo,
 
            
          },
        };
        // Use findOne to directly query the student with matching registrationNo
        const findStudent = await admissionCollection.updateOne({ registrationNo: `${query}` }, updatedDoc);
        
 res.send(findStudent)
      
      })
      app.get("/admissions-update/reg-number-update-roll", async (req, res) => {
        const {query,registrationNo} = req.query;
        console.log(query);
        const admissions = await admissionCollection.find().toArray();
        const findReg = admissions.find(admission => admission.registrationNo == registrationNo);
        if(findReg){
          return res.send({message : "updated registration number already exists , it can't change ! Please change the registration number ."})
        }
        const updatedDoc = {
          $set: {
            registrationNo: registrationNo,
 
            
          },
        };
        // Use findOne to directly query the student with matching registrationNo
        const findStudent = await admissionCollection.updateOne({ rollNo: `${query}` }, updatedDoc);
        
 res.send(findStudent)
      
      })
//       app.get("/admissions-update/deleted-update-roll", async (req, res) => {

   
//         // Use findOne to directly query the student with matching registrationNo
//         const findStudent = await admissionCollection.deleteMany({ completedInfo : "deleted" });
        
//  res.send(findStudent)
      
//       })
      app.get("/admissions-update/dues-month-update", async (req, res) => {
        try {
          const students = await admissionCollection.find().toArray();
      
          await Promise.all(
            students.map(async (student) => {
              // If student has duesMonth array
              if (student.duesBatchMonthlyFee && student.duesBatchMonthlyFee.length > 0) {

      
                // Update the database
                await admissionCollection.updateOne(
                  { _id: student._id },
                  { $set: { duesBatchMonthlyFee: [] } }
                );
              }
            })
          );
      
          res.json({ message: "Dues month fees updated successfully" });
        } catch (error) {
          res.status(500).json({ message: "Internal Server Error", error: error.message });
        }
      });
      
      app.get("/admissions-update/dues-month-update-two", async (req, res) => {
        try {
            const students = await admissionCollection.find().toArray();
            const currentDate = new Date(); // Get today's date
            
            await Promise.all(students.map(async (student) => {
              const studentBatch = await batchCollection.findOne({batchTitle : student?.batch})
              if(studentBatch?.batchMonthlyFee === undefined){
                console.log(studentBatch , student?.batch ,student?.name ,student?.registrationNo);
              }
                if (!student.enrollDate || studentBatch.batchMonthlyFee <= 0) return  await admissionCollection.updateOne(
                  { _id: student._id },
                  { $set: { duesBatchMonthlyFee : []  } } // Update duesMonth with new calculated values
              );;
    
                let enrollDate = new Date(student.enrollDate);
                let duesBatchMonthlyFee = [];
    
                while (enrollDate <= currentDate) {
                    let monthYear = enrollDate.toLocaleString('en-US', { month: 'short', year: 'numeric' });
                    duesBatchMonthlyFee.push({ month: monthYear, fee: Number(studentBatch.batchMonthlyFee )});
    
                    duesBatchMonthlyFee.setMonth(enrollDate.getMonth() + 1); // Move to next month
                }
    
                await admissionCollection.updateOne(
                    { _id: student._id },
                    { $set: { duesBatchMonthlyFee  } } // Update duesMonth with new calculated values
                );
            }));
    
            res.json({ message: "Dues month fees updated successfully" });
    
        } catch (error) {
            res.status(500).json({ message: "Internal Server Error", error: error.message });
        }
    });
    
    

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
            dueMonth: details.dueMonth,
            
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
//     cron.schedule("* * * * *", async () => {
//     console.log("Test cron job running...");
//     // Your update logic here
// });
    // all student api end
    // addpayment api start
    const paymentCollection = client.db("imcDB").collection("payments");
    // Bangladesh Time Cron Job


cron.schedule("0 0 0 1 * *", async () => {
  try {
    console.log("Cron job started at:", moment().tz("Asia/Dhaka").format());

    // Get the current time in Bangladesh
    const bangladeshMonth = moment().tz("Asia/Dhaka").format("MMM YYYY");

    // Fetch all students
    const students = await admissionCollection.find({}).toArray();

    // Process students in parallel
    const bulkOperations = students.map(async (student) => {
      const { batch, studentMonthlyFee } = student;

      // Fetch batch details
      const studentBatch = await batchCollection.findOne({ batchTitle: batch });
      if (!studentBatch) {
        console.warn(`Batch not found for student ID: ${student._id}`);
        return null;
      }

      const { batchMonthlyFee } = studentBatch;

      // Update student dues
      return admissionCollection.updateOne(
        { _id: student._id },
        {
          $push: {
            duesMonth: { month: bangladeshMonth, fee: Number(studentMonthlyFee) },
            duesBatchMonthlyFee: { month: bangladeshMonth, fee: Number(batchMonthlyFee) },
          },
        }
      );
    });

    await Promise.all(bulkOperations); // Wait for all updates to complete

    console.log("Cron job completed successfully!");

  } catch (error) {
    console.error("Cron Job Error:", error);
  }
}, {
  timezone: "Asia/Dhaka", // Ensures correct timezone
});

    app.post("/payment/admissions", async (req, res) => {
      const batch = req.body;

      const result = await paymentCollection.insertOne(batch);
      res.send(result);
    });
    
    app.get("/filter-due-alert", async (req, res) => {
      const { batch, studentClass } = req.query; // Capture 'batch' from query parameters
    
      let totalBatch = [];
    
      if (batch && batch !== "false") {
        totalBatch = batch.includes(",") ? batch.split(",") : [batch]; // Ensure array format
      } else {
        // Fetch batch list based on studentClass
        const batchQuery = { studentClass: studentClass };
        const batchResult = await batchCollection.find(batchQuery).toArray();
        totalBatch = batchResult?.map(batch => batch?.batchTitle) || [];
      }
    
      console.log("Total Batch:", totalBatch); // Debugging
    
      // Ensure batches exist in batchCollection
      const batchSearch = await batchCollection.find({
        batchTitle: { $in: totalBatch },
        studentClass: studentClass
      }).toArray();
    
      if (batchSearch.length <= 0) {
        return res.send([]);
      }
    
      // Build the search condition
      const query = {
        completedInfo: "running student",
        batch: { $in: totalBatch } // Ensure filtering works for multiple batches
      };
    
      try {
        // Query the database based on the search conditions
        const result = await admissionCollection.find(query).sort({ registrationNo: 1 }).toArray();
        // const result = await admissionCollection.countDocuments(query);
        res.send(result); // Send the filtered records as the response
        // res.send({length : result}); // Send the filtered records as the response
      } catch (error) {
        console.error(error);
        res.status(500).send({ error: "Failed to fetch admissions" });
      }
    });

app.get("/filter-payments", async (req, res) => {
  const { name } = req.query; // Capture 'name' and 'transmittedDate' from query parameters

  try {
    const fees = await paymentCollection.find().sort({ date: -1 }).toArray();
    const currentStudents = await admissionCollection.find().toArray();
    console.log(currentStudents);
    // Perform data transformation or join operation
    const transformedData = fees?.map(fee => {
      const studentInfo = currentStudents?.find(student => student?.registrationNo === fee?.registrationNo);
   
      if (studentInfo) {
        const { _id,registrationNo, ...std } = studentInfo; // Exclude `_id` field from the student info
        return { ...fee, ...std };
      }
      return fee;
    });

    // Build the search conditions
    const regexConditions = name
      ? [
          { field: "category", regex: new RegExp(name, "i") },
          { field: "enrollDate", regex: new RegExp(name, "i") },
          { field: "date", regex: new RegExp(name, "i") },
          { field: "batch", regex: new RegExp(name, "i") },
          { field: "name", regex: new RegExp(name, "i") },
          { field: "registrationNo", regex: new RegExp(name, "i") },
          { field: "mobile", regex: new RegExp(name, "i") },
          { field: "birthOfDate", regex: new RegExp(name, "i") },
        ]
      : [];

    // Filter the transformed data based on the conditions
    const filteredData = transformedData.filter(item => {
      // Apply `name` filter
      const matchesName = name
        ? regexConditions.some(condition => condition.regex.test(item[condition.field]))
        : true;


     

      return matchesName ;
    });

    res.send(filteredData); // Send the filtered records as the response
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: "Failed to fetch fees" });
  }
});
app.post("/payment", async (req, res) => {
  const formInfo = req.body;
  console.log(formInfo);
  const registrationNo = formInfo?.registrationNo;
  const months = formInfo?.duesMonthPayment; // Array of objects like [{ month: "January", fee: 100 }, ...]
  const monthlyFees = formInfo?.duesBatchMonthlyFeePayment; // Array of objects like [{ month: "January", fee: 100 }, ...]
console.log(formInfo);
  try {
    // Update the admission collection
    const updateResult = await admissionCollection.updateOne(
      { registrationNo: registrationNo }, // Match student by registration number
      {
        $push: { feesReceivedMonth: { $each: months }, feesReceivedBatchMonthlyFee: { $each: monthlyFees } }, // Add to feesReceivedMonth
        $pull: { duesMonth: { $in: months } ,duesBatchMonthlyFee: { $in: monthlyFees } }, // Remove matching objects from duesMonth
      },

    );

    // Insert into payment collection
    const result = await paymentCollection.insertOne(formInfo);

    res.send({ updateResult, paymentResult: result });
  } catch (error) {
    console.error("Error processing payment:", error);
    res.status(500).send({ error: "An error occurred while processing the payment." });
  }
});

    app.delete("/payment/:id", async (req, res) => {
      const id = req.params.id
      const searchQuery = {_id : new ObjectId(id)}
      const transection = await paymentCollection.findOne(searchQuery)
      console.log(transection);
      const registrationNo = transection?.registrationNo
      const months = transection?.duesMonthPayment 
      const monthlyFees = transection?.duesBatchMonthlyFeePayment;
      const updateResult = await admissionCollection.updateOne(
        { registrationNo: registrationNo }, // Match student by registration number
        {
            $pull: { feesReceivedMonth: { $in: months },feesReceivedBatchMonthlyFee: { $in: monthlyFees }  }, // Add to feesReceivedMonth
            $push: { duesMonth: { $each: months },duesBatchMonthlyFee: { $each: monthlyFees } } // Remove from duesMonth
        }
    );
    const result = await paymentCollection.deleteOne(searchQuery);
      res.send(result);
    });
    app.get("/addpayment", async (req, res) => {
      const result = await paymentCollection.find().toArray();
      res.send(result)
    })
    app.get("/payment-count", async (req, res) => {
      const result = await paymentCollection.countDocuments();
      res.send({length :result})
    })
    // addpayment api end
    const smsCollection = client.db("imcDB").collection("sms");
    app.post("/sms", async (req, res) => {
        const formInfo = req.body;
        const result = await smsCollection.insertOne(formInfo);
        res.send(result);
      });
      app.get("/sms", async (req, res) => {
        const result = await smsCollection.find().toArray();

        res.send(result)
      })
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