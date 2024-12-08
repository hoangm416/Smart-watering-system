const sequelize = require("../configs/connectDb");
const Humidity = require("./humidity");

(async () => {
    await sequelize.sync({ alter: true });
})();

module.exports = sequelize;