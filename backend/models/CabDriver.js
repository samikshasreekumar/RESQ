const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CabDriver = sequelize.define('CabDriver', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    vehicleNumber: {
        type: DataTypes.STRING,
        allowNull: false
    },
    phone: {
        type: DataTypes.STRING,
        allowNull: false
    },
    type: {
        type: DataTypes.ENUM('AC', 'NON_AC'),
        allowNull: false,
        defaultValue: 'NON_AC'
    },
    isAvailable: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    }
}, {
    timestamps: true
});

module.exports = CabDriver;
