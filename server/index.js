const express = require('express');
const app = express();
require('dotenv').config();
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const nodemailer = require('nodemailer');
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

// send email
const sendEmail = (emailAddress, emailData) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // Use `true` for port 465, `false` for all other ports
    auth: {
      user: process.env.TRANSPORTER_EMAIL,
      pass: process.env.TRANSPORTER_PASS,
    },
  });

  // verify transporter
  // verify connection configuration
  transporter.verify(function (error, success) {
    if (error) {
      console.log(error);
    } else {
      console.log('Server is ready to take our messages');
    }
  });

  const mailBody = {
    from: `"Stay Vista" <${process.env.TRANSPORTER_EMAIL}>`, // sender address
    to: emailAddress, // list of receivers
    subject: emailData.subject, // Subject line
    html: emailData.message, // html body
  };

  // send mail with defined transport object
  transporter.sendMail(mailBody, (error, info) => {
    if (error) {
      console.log(error);
    } else {
      console.log('email sent: ' + info.response);
    }
  });
};

// Verify Token Middleware
const verifyToken = async (req, res, next) => {
  const token = req.cookies?.token;
  console.log('token inside verifyToken', token);
  if (!token) {
    return res.status(401).send({ message: 'unauthorized access' });
  }
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      console.log(err);
      return res.status(401).send({ message: 'unauthorized access' });
    }
    req.decodedUser = decoded;
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
    const bookingsCollection = client.db('StayVistaDB').collection('bookings');

    // verify admin middleware
    const verifyAdmin = async (req, res, next) => {
      const decodedUser = req.decodedUser;
      const query = { email: decodedUser.email };
      const user = await usersCollection.findOne(query);
      if (!user || user.role !== 'admin') {
        return res.status(403).send({ message: 'forbidden access' });
      }
      next();
    };

    // verify host middleware
    const verifyHost = async (req, res, next) => {
      const decodedUser = req.decodedUser;
      const query = { email: decodedUser.email };
      const user = await usersCollection.findOne(query);
      if (!user || user.role !== 'host') {
        return res.status(403).send({ message: 'forbidden access' });
      }
      next();
    };

    //! stripe create-payment-intent
    app.post('/stripe/create-payment-intent', async (req, res) => {
      const { price } = req.body;
      const amount = parseInt(price * 100);
      const paymentIntent = await stripe.paymentIntents.create({
        amount,
        currency: 'usd',
        payment_method_types: ['card'],
      });
      res.send({ clientSecret: paymentIntent.client_secret });
    });

    //!------------ auth related api --------------------
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

    // to update a user's role
    app.patch('/users/update/:email', async (req, res) => {
      const email = req.params.email;
      const user = req.body;
      const query = { email };
      const update = { $set: { ...user, timeStamp: Date.now() } };
      const result = await usersCollection.updateOne(query, update);
      res.send(result);
    });

    // to get a users info by email
    app.get('/users/:email', async (req, res) => {
      const email = req.params.email;
      const user = await usersCollection.findOne({ email }, { projection: { _id: 0, role: 1 } });
      res.send(user);
    });

    // to get all users from db
    app.get('/users', verifyToken, verifyAdmin, async (req, res) => {
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
    app.get('/my-listings/:email', verifyToken, verifyHost, async (req, res) => {
      const email = req.params.email;
      const rooms = await roomCollection.find({ 'host.email': email }).toArray();
      res.send(rooms);
    });

    // to save a room data in db
    app.post('/room', verifyToken, verifyHost, async (req, res) => {
      const room = req.body;
      const result = await roomCollection.insertOne(room);
      res.send(result);
    });

    // to delete a room data
    app.delete('/room/:id', verifyToken, verifyHost, async (req, res) => {
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

    // to update a room data
    app.put('/room/update/:id', verifyToken, verifyHost, async (req, res) => {
      const id = req.params.id;
      const room = req.body;
      const query = { _id: new ObjectId(id) };
      const update = { $set: room };
      const result = await roomCollection.updateOne(query, update);
      res.send(result);
    });

    // update room availability status
    app.patch('/room/status/:id', verifyToken, async (req, res) => {
      const id = req.params.id;
      const isBooked = req.body.isBooked;
      const query = { _id: new ObjectId(id) };
      const update = { $set: { isBooked } };
      const result = await roomCollection.updateOne(query, update);
      res.send(result);
    });

    // ! ----------------bookingsCollection--------------------
    // to save a booking data in db
    app.post('/booking', verifyToken, async (req, res) => {
      const bookingData = req.body;
      // save room booking info
      const result = await bookingsCollection.insertOne(bookingData);

      // send email to guest
      sendEmail(bookingData?.guest?.email, {
        subject: 'Your booking is successful!',
        message: `You've successfully booked a room through StayVista! Transaction Id: ${bookingData?.transactionId}`,
      });
      // send email to host
      sendEmail(bookingData?.host?.email, {
        subject: 'Your room got booked!',
        message: `Your room has been successfully booked by a guest! Transaction Id: ${bookingData?.transactionId}. Get ready to welcome ${bookingData?.guest?.name}`,
      });

      res.send(result);
    });

    // to get all bookings data for a specific guest
    app.get('/bookings/:email', async (req, res) => {
      const email = req.params.email;
      const query = { 'guest.email': email };
      const bookings = await bookingsCollection.find(query).toArray();
      res.send(bookings);
    });

    // to get all bookings data for a specific host
    app.get('/manage-bookings/:email', async (req, res) => {
      const email = req.params.email;
      const query = { 'host.email': email };
      const bookings = await bookingsCollection.find(query).toArray();
      res.send(bookings);
    });

    // to delete a booking data by id
    app.delete('/bookings/:id', verifyToken, async (req, res) => {
      const id = req.params.id;
      const result = await bookingsCollection.deleteOne({ _id: new ObjectId(id) });
      res.send(result);
    });

    // !---------------Stats------------------
    // Admin stats
    app.get('/admin-stats', verifyToken, verifyAdmin, async (_req, res) => {
      const bookingDetails = await bookingsCollection.find({}, { projection: { date: 1, price: 1 } }).toArray();
      const totalUsers = await usersCollection.countDocuments();
      const totalRooms = await roomCollection.countDocuments();
      const totalPrice = bookingDetails.reduce((acc, curr) => acc + curr.price, 0);

      // const data = [
      //   ['Day', 'Sales'],
      //   ['9/5', 1000],
      //   ['10/2', 1170],
      //   ['11/1', 660],
      //   ['12/11', 1030],
      // ]   send data in this shape
      const chartData = bookingDetails.map((booking) => {
        const day = new Date(booking.date).getDate();
        const month = new Date(booking.date).getMonth();
        const data = [`${day}/${month}`, booking.price];
        return data;
      });
      chartData.unshift(['Day', 'Sales']);

      res.send({ totalBookings: bookingDetails.length, totalUsers, totalRooms, totalPrice, chartData });
    });

    // Host stats
    app.get('/host-stats', verifyToken, verifyHost, async (req, res) => {
      const { email } = req.decodedUser;
      const bookingDetails = await bookingsCollection.find({ 'host.email': email }, { projection: { date: 1, price: 1 } }).toArray();
      const totalRooms = await roomCollection.countDocuments({ 'host.email': email });
      const totalPrice = bookingDetails.reduce((acc, curr) => acc + curr.price, 0);

      const { timeStamp } = await usersCollection.findOne({ email }, { projection: { timeStamp: 1 } });

      // const data = [
      //   ['Day', 'Sales'],
      //   ['9/5', 1000],
      //   ['10/2', 1170],
      //   ['11/1', 660],
      //   ['12/11', 1030],
      // ]   send data in this shape
      const chartData = bookingDetails.map((booking) => {
        const day = new Date(booking.date).getDate();
        const month = new Date(booking.date).getMonth();
        const data = [`${day}/${month}`, booking.price];
        return data;
      });
      chartData.unshift(['Day', 'Sales']);

      res.send({ totalBookings: bookingDetails.length, hostSince: timeStamp, totalRooms, totalPrice, chartData });
    });

    // Guest stats
    app.get('/guest-stats', verifyToken, async (req, res) => {
      const { email } = req.decodedUser;
      const bookingDetails = await bookingsCollection.find({ 'guest.email': email }, { projection: { date: 1, price: 1 } }).toArray();
      const totalPrice = bookingDetails.reduce((acc, curr) => acc + curr.price, 0);

      const { timeStamp } = await usersCollection.findOne({ email }, { projection: { timeStamp: 1 } });

      // const data = [
      //   ['Day', 'Sales'],
      //   ['9/5', 1000],
      //   ['10/2', 1170],
      //   ['11/1', 660],
      //   ['12/11', 1030],
      // ]   send data in this shape
      const chartData = bookingDetails.map((booking) => {
        const day = new Date(booking.date).getDate();
        const month = new Date(booking.date).getMonth();
        const data = [`${day}/${month}`, booking.price];
        return data;
      });
      chartData.unshift(['Day', 'Sales']);

      res.send({ totalBookings: bookingDetails.length, guestSince: timeStamp, totalPrice, chartData });
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
