const sequelize = require('./config/database');
const Mechanic = require('./models/Mechanic');
const ServiceRequest = require('./models/ServiceRequest');

const replacements = [
  { from: /ðŸ”’/g, to: '🔐' },
  { from: /ðŸ””/g, to: '🔔' },
  { from: /ðŸš—/g, to: '🚗' },
  { from: /ðŸ”§/g, to: '🔧' },
  { from: /ðŸš¨/g, to: '🚨' },
  { from: /Â₹/g, to: '₹' },
  { from: /âœ…/g, to: '✅' },
  { from: /ðŸ“±/g, to: '📱' },
  { from: /ðŸ“/g, to: '📍' },
  { from: /ðŸ’³/g, to: '💳' },
  { from: /ðŸš•/g, to: '🚕' },
  { from: /ðŸ›/g, to: '🛠️' },
  { from: /â•/g, to: '—' },
  { from: /â€¢/g, to: '•' }
];

async function cleanDB() {
  try {
    await sequelize.authenticate();
    console.log('Connected to DB');

    // 1. Clean Mechanics
    const mechanics = await Mechanic.findAll();
    for (const m of mechanics) {
      let changed = false;
      let name = m.name;
      let district = m.district;
      let jobTitle = m.jobTitle;

      replacements.forEach(r => {
        if (name && r.from.test(name)) { name = name.replace(r.from, r.to); changed = true; }
        if (district && r.from.test(district)) { district = district.replace(r.from, r.to); changed = true; }
        if (jobTitle && r.from.test(jobTitle)) { jobTitle = jobTitle.replace(r.from, r.to); changed = true; }
      });

      if (changed) {
        await m.update({ name, district, jobTitle });
        console.log(`Cleaned Mechanic ID: ${m.id}`);
      }
    }

    // 2. Clean ServiceRequests
    const requests = await ServiceRequest.findAll();
    for (const r of requests) {
      let changed = false;
      let issueType = r.issueType;
      let district = r.district;

      replacements.forEach(rep => {
        if (issueType && rep.from.test(issueType)) { issueType = issueType.replace(rep.from, rep.to); changed = true; }
        if (district && rep.from.test(district)) { district = district.replace(rep.from, rep.to); changed = true; }
      });

      if (changed) {
        await r.update({ issueType, district });
        console.log(`Cleaned ServiceRequest ID: ${r.id}`);
      }
    }

    console.log('Database Mojibake Cleanup Complete.');
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

cleanDB();
