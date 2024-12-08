const mqtt = require("mqtt");
const humidity = require("../models/humidity");
const client = mqtt.connect("mqtt://localhost");

client.on("connect", () => {
    console.log("Connected to MQTT broker!");

    client.subscribe("stat/water_sensor/STATUS", (err) => {
        if (err) {
            console.error("Subcribe topic failed:", err);
        }
    });
});

// // Publish dữ liệu lên MQTT broker
// const topic = "test";
// const message = "Hello, MQTT!";

// client.publish(topic, message, (err) => {
//     if (err) {
//         console.error("Publish error:", err);
//     } else {
//         console.log("Message published successfully");
//         client.end(); // Đóng kết nối MQTT sau khi hoàn thành việc publish
//     }
// });

// Xử lý sự kiện khi nhận được message từ MQTT broker
client.on('message', (topic, message) => {
  console.log('Received message from topic:', topic);
  console.log('Message:', message.toString());

  humidity.create(JSON.parse(message))
    .then((data) => {
      console.log(data);
    })
    .catch((err) => {
      console.error(err);
    });

});
