const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const cors = require('cors');
const sequelize = require('./config/database');
const fs = require('fs');
const path = require('path');

// Models
const User = require('./models/User');
const Mechanic = require('./models/Mechanic');
const OTP = require('./models/OTP');
const Vehicle = require('./models/Vehicle');
const ServiceRequest = require('./models/ServiceRequest');
const Admin = require('./models/Admin');
const CabDriver = require('./models/CabDriver');

// Routes
const authRoutes = require('./routes/auth');
const otpController = require('./controllers/otpController');
const serviceController = require('./controllers/serviceController');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:3000", "http://localhost:5001", "https://resq-delta-sable.vercel.app"],
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Make io accessible in controllers
app.set('io', io);

// Middleware
app.use(cors({
  origin: ["http://localhost:3000", "http://localhost:5001", "https://resq-delta-sable.vercel.app"],
  credentials: true
}));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Associations
User.hasMany(Vehicle, { foreignKey: 'userPhone' });
Vehicle.belongsTo(User, { foreignKey: 'userPhone' });
// ServiceRequest associations (optional but good for future)
User.hasMany(ServiceRequest, { foreignKey: 'userPhone' });
ServiceRequest.belongsTo(User, { foreignKey: 'userPhone' });
Mechanic.hasMany(ServiceRequest, { foreignKey: 'mechanicPhone', sourceKey: 'phone' });
ServiceRequest.belongsTo(Mechanic, { foreignKey: 'mechanicPhone', targetKey: 'phone' });

// Database Connection
sequelize.authenticate()
  .then(async () => {
    console.log('Database connected...');

    // SYNC Schema
    await sequelize.sync({ alter: true });
    console.log('Database synced.');

    // SEED ADMIN (Only if not exists)
    const adminExists = await Admin.findOne({ where: { username: 'admin' } });
    if (!adminExists) {
      await Admin.create({
        username: 'admin',
        password: 'password123'
      });
      console.log('Admin account created.');
    }

    // SEED CAB DRIVERS
    const existingCabs = await CabDriver.count();
    if (existingCabs === 0) {
      await CabDriver.bulkCreate([
        { name: 'Rajan Kumar', phone: '9000010001', vehicleNumber: 'KL-01-AB-1234', type: 'AC' },
        { name: 'Babu Thomas', phone: '9000010002', vehicleNumber: 'KL-02-XY-9876', type: 'NON_AC' },
        { name: 'Shamseer Ali', phone: '9000010003', vehicleNumber: 'KL-05-MN-2345', type: 'AC' },
        { name: 'RESQ Auto-Dispatch', phone: '9000010004', vehicleNumber: 'KL-07-ZZ-7777', type: 'AC' }
      ]);
      console.log('Dummy Cab Drivers created.');
    }

    console.log('Database ready.');
  })
  .catch(err => console.log('Error: ' + err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', require('./routes/admin'));
app.use('/api/vehicles', require('./routes/vehicles'));
app.use('/api/user', require('./routes/user'));
app.use('/api/requests', require('./routes/requests'));

app.get('/', (req, res) => {
  res.send('RESQ Backend API is running... 🚀');
});

app.get('/api/mechanics/nearest', serviceController.findNearestMechanics);


// Cabs API
app.get('/api/cabs', async (req, res) => {
  try {
    const CabDriver = require('./models/CabDriver');
    const type = req.query.type; // 'AC' or 'NON_AC'
    const whereClause = { isAvailable: true };
    if (type) whereClause.type = type;
    
    const cabs = await CabDriver.findAll({ where: whereClause });
    res.json(cabs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Routes
app.use('/api/auth', authRoutes);

// Socket.io Connection
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // Handle OTP Request
  socket.on('request_otp', (data) => {
    otpController.requestOTP(socket, data);
  });

  // Handle OTP Verification
  socket.on('verify_otp', (data) => {
    otpController.verifyOTP(socket, data);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });

  // Handle Calling Feature
  socket.on('initiate_call', (data) => {
    console.log('Initiating call to mechanic:', data.mechanicPhone);
    io.emit('incoming_call', data);
  });

  // Handle Cab Arrived notification
  socket.on('cab_arrived', (data) => {
    console.log('Cab arrived for request:', data.requestId);
    io.emit('cab_arrived', data);
  });

  // Handle Customer Picked Up
  socket.on('cab_pickup', (data) => {
    console.log('Customer picked up for request:', data.requestId);
    io.emit('cab_pickup', data);
  });

  // Handle Customer Dropped Off
  socket.on('cab_dropoff', (data) => {
    console.log('Customer dropped off for request:', data.requestId);
    io.emit('cab_dropoff', data);
  });

  // Handle Fraud Report from user
  socket.on('fraud_report', (data) => {
    console.log('⚠️ FRAUD REPORT received for request:', data.requestId, '| Reason:', data.reason);
    io.emit('fraud_alert_admin', data); // Notify admin panel if open
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => console.log(`Server started on port ${PORT}`));
