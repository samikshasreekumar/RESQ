const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ServiceRequest = sequelize.define('ServiceRequest', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    userPhone: {
        type: DataTypes.STRING,
        allowNull: false
    },
    mechanicPhone: {
        type: DataTypes.STRING,
        allowNull: true
    },
    issueType: {
        type: DataTypes.STRING,
        allowNull: false
    },
    userLat: {
        type: DataTypes.FLOAT,
        allowNull: false
    },
    userLng: {
        type: DataTypes.FLOAT,
        allowNull: false
    },
    userAddress: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    status: {
        type: DataTypes.ENUM('Pending', 'Approved', 'Arrived', 'Work Started', 'Completed', 'Rejected', 'Cancelled'),
        defaultValue: 'Pending'
    },
    district: {
        type: DataTypes.STRING,
        allowNull: true // To filter requests for mechanics
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    imageUrl: {
        type: DataTypes.STRING,
        allowNull: true
    },
    rating: {
        type: DataTypes.INTEGER,
        allowNull: true,
        validate: { min: 1, max: 5 }
    },
    feedback: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    estimatedTime: {
        type: DataTypes.STRING,
        allowNull: true
    },
    repairDays: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    cabServiceEnabled: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    cabDriverName: {
        type: DataTypes.STRING,
        allowNull: true
    },
    cabVehicleNumber: {
        type: DataTypes.STRING,
        allowNull: true
    },
    cabETA: {
        type: DataTypes.STRING,
        allowNull: true
    },
    failureReason: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    reassignedFrom: {
        type: DataTypes.STRING,
        allowNull: true
    }
});

module.exports = ServiceRequest;
