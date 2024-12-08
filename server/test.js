// Import các module cần thiết
const express = require('express');
const mqtt = require('mqtt');
const mongoose = require('mongoose');
const bodyParser = require('body-parser'); // Thêm body-parser

// Khởi tạo Express app và MQTT client
const app = express();
app.use(bodyParser.json()); 
const mqttClient = mqtt.connect('mqtt://localhost');

// Kết nối đến MongoDB
mongoose.connect('mongodb://localhost:27017/pump_water', { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;

// Định nghĩa Schema cho dữ liệu
const dataSchema = new mongoose.Schema({
  humidity: Number,
  pumpStatus: String,
  pumpTime: Date
});

// Tạo model từ Schema
const Data = mongoose.model('Data', dataSchema);

// Khi kết nối đến MQTT Broker, subscribe vào topic để lấy dữ liệu
mqttClient.on('connect', () => {
  mqttClient.subscribe('watering_system/info');
});

// Xử lý khi nhận được dữ liệu từ MQTT Broker
mqttClient.on('message', (topic, message) => {
  // Parse dữ liệu từ JSON
  const data = JSON.parse(message);

  // Lưu vào database
  const newData = new Data({
    humidity: data.humidity,
    pumpStatus: data.pumpStatus,
    pumpTime: new Date(data.pumpTime)
  });

  newData.save()
    .then(() => {
      console.log('Data saved to MongoDB successfully.');
    })
    .catch((err) => {
      console.error('Error saving data to MongoDB:', err);
    });
});

// Định nghĩa API endpoint để trả lời yêu cầu HTTP từ web application
app.get('/api/data', (req, res) => {
  // Truy vấn dữ liệu từ MongoDB và trả về
  Data.find({}, (err, data) => {
    if (err) {
      console.error('Error querying data from MongoDB:', err);
      res.status(500).send('Internal Server Error');
    } else {
      res.json(data);
    }
  });
});

// API endpoint để nhận dữ liệu từ MQTT Broker và lưu vào MongoDB
app.post('/api/mqtt-data', (req, res) => {
  // Đọc dữ liệu từ request body
  const { humidity, pumpStatus } = req.body;

  // Lưu vào database
  const newData = new Data({
    humidity,
    pumpStatus,
    pumpTime: new Date()
  });

  newData.save((err) => {
    if (err) {
      console.error('Error saving data to MongoDB:', err);
      res.status(500).json({ success: false, message: 'Internal Server Error' });
    } else {
      res.json({ success: true, message: 'Data received and stored successfully.' });
    }
  });
});

app.post('/api/controlPump', (req, res) => {
  // Đọc trạng thái yêu cầu từ request body
  const { wateringStatus } = req.body;

  // Gửi yêu cầu tưới nước qua MQTT Broker
  mqttClient.publish('watering_system/control', wateringStatus);

  res.json({ success: true, message: 'Watering request sent successfully.' });
});

// Khởi động web server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});