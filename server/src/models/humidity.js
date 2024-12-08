const { DataTypes } = require("sequelize");
const sequelize = require("../configs/connectDb");

const User = sequelize.define("Humidity", {
    device: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    datetime: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    humidity: {
        type: DataTypes.FLOAT,
        allowNull: false,
    },
});

module.exports = User;