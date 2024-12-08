const express = require("express");
const router = express.Router();
const History = require("../models/User");
const sequelize = require("../configs/connectDb");


router.get("/history", async (req, res) => {
    try {
        await sequelize.authenticate(); // Kiểm tra kết nối đến cơ sở dữ liệu

        const history = await History.findAll({ order: [['datetime', 'DESC']] });

        const formattedHistory = history.map(entry => ({
            device: entry.device,
            date: formatDate(entry.datetime),
            time: formatTime(entry.datetime),
            humidity: entry.humidity,
        }));

        res.json({
            success: true,
            data: formattedHistory,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
});

router.post("/water-plants", (req, res) => {
    try {
        mqttClient.sendWateringCommand();
        res.json({
            success: true,
            message: "Watering command sent successfully.",
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
});

function formatDate(datetime) {
    const date = new Date(datetime);
    return date.toLocaleDateString("en-US");
}

function formatTime(datetime) {
    const date = new Date(datetime);
    return date.toLocaleTimeString("en-US", { hour: '2-digit', minute: '2-digit' });
}

module.exports = router;
