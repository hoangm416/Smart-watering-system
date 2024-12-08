const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const bodyParser = require("body-parser");
const dashboardRoute = require("./routes/dashboard");
const mqttClient = require("./config/mqtt");

const app = express();
const server = http.createServer(app);

app.use(bodyParser.json());

// Kết nối route API cho dashboard với WebSocket Server
app.use("/api/dashboard", dashboardRoute);

// Kết nối WebSocket Server với máy chủ HTTP
server.on("upgrade", (request, socket, head) => {
    dashboardRoute.wss.handleUpgrade(request, socket, head, (ws) => {
        dashboardRoute.wss.emit("connection", ws, request);
    });
});

// Endpoint để gửi lệnh bơm nước
app.post("/api/dashboard/water-plants", (req, res) => {
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

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
