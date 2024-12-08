const express = require("express");
const router = express.Router();
const { getHistory } = require("../controllers/history");

/**
 * Lấy dữ liệu lịch sử
 */
router.get("/history", getHistory);

// // API endpoint để nhận dữ liệu từ MQTT Broker và lưu vào MongoDB
// app.post("/api/mqtt-data", (req, res) => {
//     // Đọc dữ liệu từ request body
//     const { humidity, pumpStatus } = req.body;

//     // Lưu vào database
//     const newData = new Data({
//         humidity,
//         pumpStatus,
//         pumpTime: new Date(),
//     });

//     newData.save((err) => {
//         if (err) {
//             console.error("Error saving data to MongoDB:", err);
//             res.status(500).json({
//                 success: false,
//                 message: "Internal Server Error",
//             });
//         } else {
//             res.json({
//                 success: true,
//                 message: "Data received and stored successfully.",
//             });
//         }
//     });
// });

// app.post("/api/controlPump", (req, res) => {
//     // Đọc trạng thái yêu cầu từ request body
//     const { wateringStatus } = req.body;

//     // Gửi yêu cầu tưới nước qua MQTT Broker
//     mqttClient.publish("watering_system/control", wateringStatus);

//     res.json({ success: true, message: "Watering request sent successfully." });
// });

/**
 * Xử lý lỗi 404 - Not Found
 */
router.use("/", (req, res, next) => {
    res.status(404).json({
        message: "Not found!",
    });
});

module.exports = router;
