const express = require('express');
const app = express();
require('dotenv').config();
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');

const port = process.env.PORT || 8000;

// middleware
const corsOptions = {
  origin: ['http://localhost:5173', 'http://localhost:5174'],
  credentials: true,
  optionSuccessStatus: 200,
};
app.use(cors(corsOptions));

app.use(express.json());
app.use(cookieParser());

// Verify Token Middleware
const verifyToken = async (req, res, next) => {
  const token = req.cookies?.token;
  console.log(token);
  if (!token) {
    return res.status(401).send({ message: 'unauthorized access' });
  }
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      console.log(err);
      return res.status(401).send({ message: 'unauthorized access' });
    }
    req.user = decoded;
    next();
  });
};

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.chn7ebi.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    const roomCollection = client.db('StayVistaDB').collection('rooms');
    const usersCollection = client.db('StayVistaDB').collection('users');

    // auth related api
    // to generate cookie and set to the http only cookies
    app.post('/jwt', async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.JWT_SECRET, {
        expiresIn: '365d',
      });
      res
        .cookie('token', token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
        })
        .send({ success: true });
    });
    // Logout
    app.get('/logout', async (req, res) => {
      try {
        res
          .clearCookie('token', {
            maxAge: 0,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
          })
          .send({ success: true });
        console.log('Logout successful');
      } catch (err) {
        res.status(500).send(err);
      }
    });

    //!---------------usersCollection-------------------
    // to save a user data in db
    app.put('/user', async (req, res) => {
      const user = req.body;
      const query = { email: user?.email };

      // check if user already exists
      const isExist = await usersCollection.findOne(query);
      if (isExist) {
        // if user requested to be a host,
        if (user?.status === 'Requested') {
          const result = await usersCollection.updateOne(query, { $set: { status: user?.status } });
          return res.send(result);
        } else {
          // if user login again
          return res.send({ 'already-exists': isExist });
        }
      }

      // save user for the first time
      const option = { upsert: true };
      const update = { $set: { ...user, timeStamp: Date.now() } };
      const result = await usersCollection.updateOne(query, update, option);
      res.send(result);
    });

    // to get a users info by email
    app.get('/users/:email', async (req, res) => {
      const email = req.params.email;
      const user = await usersCollection.findOne({ email });
      res.send(user);
    });

    // to get all users from db
    app.get('/users', async (req, res) => {
      const users = await usersCollection.find().toArray();
      res.send(users);
    });

    //! ------------- roomCollection--------------------
    // to get all room data
    app.get('/rooms', async (req, res) => {
      const category = req.query.category;
      let query = {};
      if (category && category !== 'null') query = { category };
      const rooms = await roomCollection.find(query).toArray();
      res.send(rooms);
    });

    // to get all self added room data by a specific host
    app.get('/my-listings/:email', async (req, res) => {
      const email = req.params.email;
      const rooms = await roomCollection.find({ 'host.email': email }).toArray();
      res.send(rooms);
    });

    // to save a room data in db
    app.post('/room', async (req, res) => {
      const room = req.body;
      const result = await roomCollection.insertOne(room);
      res.send(result);
    });

    // to delete a room data
    app.delete('/room/:id', async (req, res) => {
      const id = req.params.id;
      const result = await roomCollection.deleteOne({ _id: new ObjectId(id) });
      res.send(result);
    });

    // to get a specific room data  by _id
    app.get('/rooms/:id', async (req, res) => {
      const id = req.params.id;
      const room = await roomCollection.findOne({ _id: new ObjectId(id) });
      res.send(room);
    });

    // Send a ping to confirm a successful connection
    await client.db('admin').command({ ping: 1 });
    console.log('Pinged your deployment. You successfully connected to MongoDB!');
  } finally {
    // Ensures that the client will close when you finish/error
  }
}
run().catch(console.dir);

app.get('/', (req, res) => {
  res.send('Hello from StayVista Server..');
});

app.listen(port, () => {
  console.log(`StayVista is running on port ${port}`);
});
