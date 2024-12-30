#include <WiFi.h>
#include <Firebase_ESP_Client.h>
#include "addons/TokenHelper.h"
#include "addons/RTDBHelper.h"
#include <time.h>

// Wi-Fi và Firebase
#define WIFI_SSID "Hoang"
#define WIFI_PASSWORD "liemkhiet"
#define sensor_pin 35   /* Soil moisture sensor O/P pin */
#define relay_pin 27    /* Relay điều khiển máy bơm */
#define API_KEY "AIzaSyDm9JTh2asPyvghYfTThNuYe2vESgvRTfw"
#define DATABASE_URL "https://iot-watering-caf9b-default-rtdb.asia-southeast1.firebasedatabase.app"

FirebaseData fbdo;
FirebaseAuth auth;
FirebaseConfig config;

unsigned long sendDataPrevMillis = 0;
unsigned long pumpStartMillis = 0;
int lastHumidity = -1; // Lưu độ ẩm trước đó để so sánh
bool signupOK = false;
int humidity, value;
bool isPumpOn = false;
const int humidityThreshold = 30;  // Ngưỡng độ ẩm để bật/tắt máy bơm
const unsigned long pumpTimeout = 30000; // Thời gian tối đa chạy máy bơm nếu độ ẩm không tăng (30 giây)
const unsigned long historyInterval = 5000; // Chu kỳ gửi lịch sử khi máy bơm bật (5 giây)
unsigned long lastHistoryMillis = 0;

// NTP Server và múi giờ
const char* ntpServer = "time.google.com";
const long gmtOffset_sec = 7 * 3600; // GMT+7
const int daylightOffset_sec = 0;

// Lấy thời gian định dạng đầy đủ (YYYY-MM-DD HH:MM:SS)
String getFormattedTime() {
  struct tm timeinfo;
  if (!getLocalTime(&timeinfo)) {
    return "0000-00-00 00:00:00";
  }
  char timeString[20];
  strftime(timeString, sizeof(timeString), "%Y-%m-%d %H:%M:%S", &timeinfo);
  return String(timeString);
}

// Lấy thời gian ngắn hơn (HH:MM:SS)
String getTimeKey() {
  struct tm timeinfo;
  if (!getLocalTime(&timeinfo)) {
    return "1970-01-01 00:00:00";
  }
  char dateTimeString[20];
  strftime(dateTimeString, sizeof(dateTimeString), "%Y-%m-%d %H:%M:%S", &timeinfo);
  return String(dateTimeString);
}

void setup() {
  // Khởi động Serial và Wi-Fi
  Serial.begin(115200);
  pinMode(relay_pin, OUTPUT);
  digitalWrite(relay_pin, LOW); // Tắt máy bơm ban đầu

  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Connecting to Wi-Fi");
  while (WiFi.status() != WL_CONNECTED) {
    Serial.print(".");
    delay(1000);
  }
  Serial.println();
  Serial.print("Connected with IP: ");
  Serial.println(WiFi.localIP());
  Serial.println();

  // Cấu hình NTP
  configTime(gmtOffset_sec, daylightOffset_sec, ntpServer);
  struct tm timeinfo;
  Serial.print("Synchronizing time...");
  while (!getLocalTime(&timeinfo)) {
    Serial.print(".");
    delay(1000);
  }
  Serial.println("Time synchronized:");
  Serial.println(&timeinfo, "%Y-%m-%d %H:%M:%S");

  // Firebase cấu hình
  config.api_key = API_KEY;
  config.database_url = DATABASE_URL;

  if (Firebase.signUp(&config, &auth, "", "")) {
    Serial.println("Firebase sign-up OK");
    signupOK = true;
  } else {
    Serial.printf("Sign-up error: %s\n", config.signer.signupError.message.c_str());
  }

  config.token_status_callback = tokenStatusCallback; // Xem addons/TokenHelper.h
  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true);

  // Gửi ngưỡng lên Firebase
  if (Firebase.RTDB.setInt(&fbdo, "Plant_Watering/Devices/dev01/humidityThreshold", humidityThreshold)) {
    Serial.println("Humidity threshold uploaded successfully.");
  } else {
    Serial.println("Failed to upload humidity threshold:");
    Serial.println("REASON: " + fbdo.errorReason());
  }
}

void turnPumpOn() {
  digitalWrite(relay_pin, HIGH);
  isPumpOn = true;
  pumpStartMillis = millis();
  lastHumidity = humidity; // Ghi nhận độ ẩm khi bật máy bơm
  Firebase.RTDB.setBool(&fbdo, "Plant_Watering/Devices/dev01/Status", true);
  Firebase.RTDB.setString(&fbdo, "Plant_Watering/Devices/dev01/message", "Độ ẩm dưới " + String(humidityThreshold) + "%, máy bơm đang bật.");
  Serial.println("Pump turned ON");
}

void turnPumpOff() {
  digitalWrite(relay_pin, LOW);
  isPumpOn = false;
  Firebase.RTDB.setBool(&fbdo, "Plant_Watering/Devices/dev01/Status", false);
  Firebase.RTDB.setString(&fbdo, "Plant_Watering/Devices/dev01/message", "Độ ẩm đạt ngưỡng, máy bơm đã tắt.");
  Serial.println("Pump turned OFF");
}

// void handlePumpTimeout() {
//   digitalWrite(relay_pin, LOW);
//   isPumpOn = false;
//   Firebase.RTDB.setBool(&fbdo, "Plant_Watering/Devices/dev01/Status", false);
//   Firebase.RTDB.setString(&fbdo, "Plant_Watering/Devices/dev01/message", "Vui lòng kiểm tra bể nước và dây dẫn.");
//   Serial.println("Pump turned OFF due to timeout. Please check water tank and connections.");
// }

void sendHistoryData() {
  String currentTime = getFormattedTime();
  String timeKey = getTimeKey();
  String historyPath = "Plant_Watering/Devices/dev01/history";

  if (Firebase.RTDB.setFloat(&fbdo, historyPath + "/" + timeKey + "/humidity", humidity) &&
      Firebase.RTDB.setString(&fbdo, historyPath + "/" + timeKey + "/timestamp", currentTime)) {
    Serial.println("History data sent successfully:");
    Serial.print("Humidity : ");
    Serial.println(humidity);
    Serial.print("Time : ");
    Serial.println(currentTime);
  } else {
    Serial.println("Failed to send history data:");
    Serial.println("REASON: " + fbdo.errorReason());
  }
}

void loop() {
  value = analogRead(sensor_pin);
  humidity = (100 - ((value / 4095.00) * 100));

  if (isPumpOn) {
    // Gửi lịch sử theo chu kỳ 10 giây khi máy bơm đang bật
    if (millis() - lastHistoryMillis > historyInterval) {
      lastHistoryMillis = millis();
      sendHistoryData();
    }

    // Tắt máy bơm nếu độ ẩm đạt ngưỡng
    if (humidity >= humidityThreshold) {
      turnPumpOff();
    }
  } else {
    // Kiểm tra nếu độ ẩm dưới ngưỡng thì bật máy bơm
    if (humidity < humidityThreshold) {
      turnPumpOn();
      lastHistoryMillis = millis(); // Reset thời gian gửi lịch sử
    }
  }

  // Gửi dữ liệu mặc định mỗi 5 giây nếu máy bơm tắt
  if (!isPumpOn && Firebase.ready() && signupOK && (millis() - sendDataPrevMillis > 5000 || sendDataPrevMillis == 0)) {
    sendDataPrevMillis = millis();
    sendHistoryData();
  }
}