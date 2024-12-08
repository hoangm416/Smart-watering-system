const express = require("express");
const router = express.Router();
const WebSocket = require("ws");
const HumidityData = require("../models/User");
const mqttClient = require("../config/mqtt");

// Khởi tạo WebSocket server
const wss = new WebSocket.Server({ noServer: true });

// Khi có kết nối mới, lắng nghe sự kiện và gửi dữ liệu về trình duyệt
wss.on("connection", (socket) => {
    console.log("WebSocket connected");
});

// Lưu server WebSocket vào biến toàn cục để có thể truy cập ở route khác
router.wss = wss;

// Route API cho việc hiển thị giá trị real-time và lưu vào cơ sở dữ liệu
router.post("/update-data", async (req, res) => {
    try {
        const { device, datetime, humidity } = req.body;

        // Gửi dữ liệu mới đến tất cả các kết nối WebSocket mở
        wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({ device, datetime, humidity }));
            }
        });

        // Lưu dữ liệu vào cơ sở dữ liệu
        await HumidityData.create({
            device,
            datetime,
            humidity,
        });

        res.json({
            success: true,
            message: "Data updated successfully.",
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
});

module.exports = router;
