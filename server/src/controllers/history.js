const Humidity = require("../models/humidity");

async function getHistory(req, res) {
    try {
        const history = await Humidity.findAll();
        res.json({
            success: true,
            data: history,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
}

module.exports = {
    getHistory,
};