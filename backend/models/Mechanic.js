const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User'); // Association if needed

const Mechanic = sequelize.define('Mechanic', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    phone: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    address: {
        type: DataTypes.STRING,
        allowNull: false
    },
    district: {
        type: DataTypes.STRING,
        allowNull: false
    },
    experience: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    idDoc: {
        type: DataTypes.STRING, // Path to file
        allowNull: false
    },
    certDoc: {
        type: DataTypes.STRING, // Path to file
        allowNull: false
    },
    latitude: {
        type: DataTypes.DECIMAL(10, 8),
        allowNull: true
    },
    longitude: {
        type: DataTypes.DECIMAL(11, 8),
        allowNull: true
    },
    jobTitle: {
        type: DataTypes.STRING,
        allowNull: true
    },
    profilePhoto: {
        type: DataTypes.STRING, // Path to file
        allowNull: true
    },
    status: {
        type: DataTypes.ENUM('pending', 'approved', 'rejected', 'suspended'),
        defaultValue: 'pending'
    }
});

// Define association: A Mechanic is also a User (based on phone, logically)
// But for simplicity, we might just keep them separate tables or link by phone.
// For now, let's keep them independent but enforcing phone uniqueness.

module.exports = Mechanic;
