const sequelize = require('./config/database');
const User = require('./models/User');
const Mechanic = require('./models/Mechanic');
const ServiceRequest = require('./models/ServiceRequest');

async function checkMojibake() {
  try {
    await sequelize.authenticate();
    console.log('Connected to DB');

    const mechanics = await Mechanic.findAll();
    console.log('--- Mechanics ---');
    mechanics.forEach(m => {
      console.log(`ID: ${m.id}, Name: ${m.name}, District: ${m.district}`);
    });

    const requests = await ServiceRequest.findAll();
    console.log('--- Service Requests ---');
    requests.forEach(r => {
      console.log(`ID: ${r.id}, Issue: ${r.issueType}, Fare: ${r.fare}`);
    });

    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

checkMojibake();
