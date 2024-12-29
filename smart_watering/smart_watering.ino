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
bool signupOK = false;
int humidity, value;
bool isPumpOn = false;
const int humidityThresholdLow = 30;  // Ngưỡng độ ẩm thấp để bật máy bơm
const int humidityThresholdHigh = 75; // Ngưỡng độ ẩm cao để tắt máy bơm
const unsigned long pumpTimeout = 15000; // Thời gian tối đa chạy máy bơm nếu độ ẩm không tăng (15 giây)
const unsigned long historyInterval = 15000; // Chu kỳ gửi lịch sử khi máy bơm bật (15 giây)
unsigned long lastHistoryMillis = 0;

// NTP Server và múi giờ
const char* ntpServer = "pool.ntp.org";
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
}

void turnPumpOn() {
  digitalWrite(relay_pin, HIGH);
  isPumpOn = true;
  pumpStartMillis = millis();
  Firebase.RTDB.setBool(&fbdo, "Plant_Watering/Devices/dev01/Status", true);
  Serial.println("Pump turned ON");
}

void turnPumpOff() {
  digitalWrite(relay_pin, LOW);
  isPumpOn = false;
  Firebase.RTDB.setBool(&fbdo, "Plant_Watering/Devices/dev01/Status", false);
  Serial.println("Pump turned OFF");
}

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
    // Kiểm tra nếu vượt quá thời gian chạy mà độ ẩm không tăng
    if (millis() - pumpStartMillis > pumpTimeout) {
      turnPumpOff();
      Serial.println("Pump turned off due to timeout.");
      return;
    }

    // Gửi lịch sử theo chu kỳ 15 giây khi máy bơm đang bật
    if (millis() - lastHistoryMillis > historyInterval) {
      lastHistoryMillis = millis();
      sendHistoryData();
    }

    // Tắt máy bơm nếu độ ẩm đạt ngưỡng cao
    if (humidity >= humidityThresholdHigh) {
      turnPumpOff();
    }
  } else {
    // Kiểm tra nếu độ ẩm dưới ngưỡng thấp thì bật máy bơm
    if (humidity <= humidityThresholdLow) {
      turnPumpOn();
      lastHistoryMillis = millis(); // Reset thời gian gửi lịch sử
    }
  }

  // Gửi dữ liệu mặc định mỗi 30 giây nếu máy bơm tắt
  if (!isPumpOn && Firebase.ready() && signupOK && (millis() - sendDataPrevMillis > 30000 || sendDataPrevMillis == 0)) {
    sendDataPrevMillis = millis();
    sendHistoryData();
  }
}