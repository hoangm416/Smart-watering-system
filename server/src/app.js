// Import các module cần thiết
require("./models/index");
const bodyParser = require("body-parser");
const cors = require("cors");
const express = require("express");
// const mqtt = require("mqtt");
const mqtt = require("./configs/mqtt");
const router = require("./routes/index");

// Khởi tạo Express app và MQTT client
const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use("/api", router);

// const mqttClient = mqtt.connect("mqtt://localhost");

// // Khi kết nối đến MQTT Broker, subscribe vào topic để lấy dữ liệu
// mqttClient.on("connect", () => {
//     mqttClient.subscribe("watering_system/info");
// });

// // Xử lý khi nhận được dữ liệu từ MQTT Broker
// mqttClient.on("message", (topic, message) => {
//     // Parse dữ liệu từ JSON
//     const data = JSON.parse(message);

//     // Lưu vào database
//     const newData = new Data({
//         humidity: data.humidity,
//         pumpStatus: data.pumpStatus,
//         pumpTime: new Date(),
//     });

//     newData.save((err) => {
//         if (err) {
//             console.error("Error saving data to MongoDB:", err);
//         }
//     });
// });


// Khởi động web server
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
