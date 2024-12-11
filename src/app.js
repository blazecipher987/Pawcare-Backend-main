require('dotenv').config();

const { Pool } = require('pg');
const express = require("express");
const path = require("path");
const app = express();
const request = require('request');
const db = require('./database/dbconnection');
const cors = require('cors');
var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));


//^---- For connecting to the FrontEnd, This will change later after hosting is done
// app.use(cors({
//   //origin: 'http://localhost:5173' // Your frontend's URL
//   origin: 'http://20.197.3.244:80'
//   // origin: 'https://paw-care-front-end.vercel.app/'
//   // origin: ''
// }));

app.use(
  cors()
);

//^---- Routes from the Route Folder
const loginRoute = require('./routes/loginRoute');
const donationRoute = require('./routes/donationRoute');
const registerRoute = require('./routes/registerRoute');
const profileRoute = require('./routes/profileRoute');
const adminRoute = require('./routes/adminRoute');
const adoptionRoute = require('./routes/adoptionRoute');
const forumRoute = require('./routes/forumRoute');
const vetRoute = require('./routes/vetRoute');



app.use(express.static("public"));
app.use(express.json());



//^---- Dummy Endpoints for testing purpose
app.get("/test", (_req, res) => {
  res.status(200).send("Hello world 2");
  console.log("Hey ya");
  
});

app.get("/cse408", (_req, res) => {
  res.status(200).send("Are you ready for Deploy your own project on aws ecr?");
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// app.post('/showpost', (req, res) => {
//   console.log('check log')
//   const url = `https://secure.shippingapis.com/ShippingAPI.dll?API=ZipCodeLookup&XML=<ZipCodeLookupRequest USERID="661PARAP3185">
//               <Address>
//               <Address1>${req.body.address1}</Address1>
//               <Address2>${req.body.address2}</Address2>
//               <City>${req.body.city}</City>
//               <State>${req.body.state}</State>
//               </Address>
//               </ZipCodeLookupRequest>`;
//   console.log(url)
//   res.status(200).send(url)
// })

const queryDatabase = async () => {
  try {
      // Get a client from the connection pool
      const client = await pool.connect();

      // Run a sample query - replace this with your actual query
      const res = await client.query('SELECT * from "Pet"');

      // Log the query results
      console.log(res.rows);

      // Release the client back to the pool
      client.release();
  } catch (err) {
      console.error(err);
  }
};

//& Working on local machine
app.get('/example', async (req, res) => {
  try {
    
    const result = await db.query('SELECT * FROM "Pet"');
    res.json(result.rows);
    console.log(result.rows[0]);
  } catch (error) {
    console.error('Error executing query:', error);
    res.status(500).json({ error: 'An error occurred while fetching data' });
  }
});


//^ Routing Setups
app.use('/login', loginRoute);
app.use('/donation',donationRoute);
app.use('/register',registerRoute);
app.use('/profile',profileRoute)
app.use('/admin',adminRoute);
app.use('/adoption',adoptionRoute);
app.use('/forum',forumRoute);
app.use('/vet',vetRoute);


// queryDatabase();

module.exports = app;
