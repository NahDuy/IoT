#include <WiFi.h>
#include <PubSubClient.h>
#include <DHT.h>
#include <ArduinoJson.h>

// Cài đặt thông tin WiFi và MQTT Broker
const char* ssid = "_zuyy";
const char* password = "1242003333";
const char* mqtt_server = "172.20.10.7";
// // Cài đặt thông tin WiFi và MQTT Broker
// const char* ssid = "P102 BT";
// const char* password = "66668888";
// const char* mqtt_server = "192.168.12.134";

// Cài đặt chân cho các cảm biến và đèn LED
#define DHTPIN 4           // Chân kết nối cảm biến DHT11
#define DHTTYPE DHT11      // DHT 11 (hoặc DHT22 nếu dùng)
#define lightSensorPin 34  // Chân cảm biến ánh sáng
const int ledPin1 = 14;    // Chân LED 1
const int ledPin2 = 26;    // Chân LED 2
const int ledPin3 = 5;     // Chân LED 3
const int ledPin4 = 18;     // Chân LED 3

bool isBlinking = false; // Biến để theo dõi trạng thái nhấp nháy của LED4
unsigned long previousMillis = 0; // Biến để lưu thời gian lần cuối LED4 thay đổi trạng thái
const long blinkInterval = 500; // Khoảng thời gian nhấp nháy (500ms)

void blinkLED4() {
  if (isBlinking) {
    unsigned long currentMillis = millis();
    if (currentMillis - previousMillis >= blinkInterval) {
      previousMillis = currentMillis;
      digitalWrite(ledPin4, !digitalRead(ledPin4)); // Đảo trạng thái LED4 để tạo hiệu ứng nhấp nháy
    }
  }
}

WiFiClient espClient;
PubSubClient client(espClient);
DHT dht(DHTPIN, DHTTYPE);

void setup_wifi() {
  delay(10);
  Serial.println();
  Serial.print("Đang kết nối với WiFi: ");
  Serial.println(ssid);

  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println();
  Serial.println("WiFi đã kết nối");
  Serial.print("IP Address: ");
  Serial.println(WiFi.localIP());
}

// Xử lý tin nhắn nhận từ MQTT
// Hàm callback xử lý tín hiệu MQTT
// Xử lý tin nhắn nhận từ MQTT
// Xử lý tin nhắn nhận từ MQTT
void callback(char* topic, byte* payload, unsigned int length) {
  String messageTemp;

  for (int i = 0; i < length; i++) {
    messageTemp += (char)payload[i];
  }

  Serial.print("Tin nhắn nhận được: ");
  Serial.println(messageTemp);

  // Xử lý tín hiệu điều khiển LED
  if (String(topic) == "esp32/ledControl") {
    StaticJsonDocument<200> doc;
    DeserializationError error = deserializeJson(doc, messageTemp);

    if (error) {
      Serial.print(F("deserializeJson() failed: "));
      Serial.println(error.c_str());
      return;
    }

    // Điều khiển LED 1, 2, 3 thủ công
    if (doc.containsKey("led1")) {
      String led1State = doc["led1"];
      digitalWrite(ledPin1, (led1State == "ON") ? HIGH : LOW);
    }

    if (doc.containsKey("led2")) {
      String led2State = doc["led2"];
      digitalWrite(ledPin2, (led2State == "ON") ? HIGH : LOW);
    }

    if (doc.containsKey("led3")) {
      String led3State = doc["led3"];
      digitalWrite(ledPin3, (led3State == "ON") ? HIGH : LOW);
    }

    // Gửi phản hồi lại MQTT sau khi bật/tắt đèn LED
    StaticJsonDocument<200> response;
    response["led1"] = digitalRead(ledPin1) == HIGH ? "ON" : "OFF";
    response["led2"] = digitalRead(ledPin2) == HIGH ? "ON" : "OFF";
    response["led3"] = digitalRead(ledPin3) == HIGH ? "ON" : "OFF";
    char buffer[128];
    serializeJson(response, buffer);

    client.publish("esp32/leds", buffer);  // Gửi phản hồi tới topic 'esp32/leds'
    Serial.println("Gửi phản hồi lại MQTT: esp32/leds");  // Thêm dòng in ra thông báo
  }

  // Xử lý riêng cho LED 4 qua một cổng khác (esp32/led4Control)
  if (String(topic) == "esp32/led4Control") {
    StaticJsonDocument<200> doc;
    DeserializationError error = deserializeJson(doc, messageTemp);
     if (error) {
      Serial.print(F("deserializeJson() failed: "));
      Serial.println(error.c_str());
      return;
    }
    if (doc.containsKey("led4")) {
      String led4State = doc["led4"];
      if (led4State == "BLINK") {
        isBlinking = true;  // Bắt đầu nhấp nháy LED4
      } else {
        isBlinking = false; // Dừng nhấp nháy LED4
        digitalWrite(ledPin4, (led4State == "ON") ? HIGH : LOW); // Cập nhật trạng thái LED4 nếu không nhấp nháy
      }
    }
      

    // Gửi phản hồi lại MQTT sau khi bật/tắt đèn LED 4
    StaticJsonDocument<100> response;
    response["led4"] = digitalRead(ledPin4) == HIGH ? "ON" : "OFF";
    char buffer[64];
    serializeJson(response, buffer);
    client.publish("esp32/led4Status", buffer);  // Gửi phản hồi tới topic 'esp32/led4Status'
    Serial.println("Gửi phản hồi lại MQTT: esp32/led4Status");  // Thêm dòng in ra thông báo
  }
}

// void reconnect() {
//   while (!client.connected()) {
//     Serial.print("Đang kết nối với MQTT...");
//     if (client.connect("ESP32Client")) {
//       Serial.println("MQTT đã kết nối");
//       client.subscribe("esp32/ledControl");  // Đăng ký đúng topic để điều khiển đèn LED
//     } else {
//       Serial.print("Kết nối thất bại, rc=");
//       Serial.print(client.state());
//       Serial.println(" Thử lại sau 5 giây.");
//       delay(5000);
//     }
//   }
// }


void reconnect() {
  while (!client.connected()) {
    Serial.print("Đang kết nối với MQTT...");
    if (client.connect("ESP32Client", "duy", "1")) {
      Serial.println("MQTT đã kết nối");
      client.subscribe("esp32/ledControl"); 
      client.subscribe("esp32/led4Control"); // Đăng ký đúng topic để điều khiển đèn LED
    } else {
      Serial.print("Kết nối thất bại, rc=");
      Serial.print(client.state());
      Serial.println(" Thử lại sau 5 giây.");
      delay(5000);
    }
  }
}




void setup() {
  Serial.begin(115200);

  // Cài đặt chân input/output cho LED và cảm biến
  pinMode(ledPin1, OUTPUT);
  pinMode(ledPin2, OUTPUT);
  pinMode(ledPin3, OUTPUT);
  pinMode(ledPin4, OUTPUT);
  pinMode(lightSensorPin, INPUT);

  dht.begin();  // Khởi động cảm biến DHT

  setup_wifi();
  client.setServer(mqtt_server, 1899); //suacong
  client.setCallback(callback);
}

void loop() {
  if (!client.connected()) {
    reconnect();
  }
  client.loop();
  blinkLED4();

  // Đọc dữ liệu từ cảm biến DHT (nhiệt độ và độ ẩm)
  float h = dht.readHumidity();
  float t = dht.readTemperature();

  // Đọc dữ liệu từ cảm biến ánh sáng
  int lightLevel = analogRead(lightSensorPin);

  // Đảo ngược giá trị cảm biến ánh sáng (4095 là giá trị tối đa)
  int adjustedLightLevel = 4095 - lightLevel;

  // Xuất dữ liệu cảm biến lên MQTT
  char tempStr[8];
  dtostrf(t, 1, 2, tempStr);
  char humStr[8];
  dtostrf(h, 1, 2, humStr);
  char lightStr[8];
  dtostrf(adjustedLightLevel, 1, 0, lightStr);
  int random_value = random(0, 101);
  char dustStr[8];
  dtostrf(random_value, 1, 0, dustStr);

  // Tạo chuỗi JSON đơn giản để gửi dữ liệu cảm biến
  char jsonBuffer[128];
  snprintf(jsonBuffer, sizeof(jsonBuffer), "{\"temperature\":%s,\"humidity\":%s,\"light\":%s,\"dust\":%s}", tempStr, humStr, lightStr,dustStr);

  client.publish("esp32/sensors", jsonBuffer);

  delay(2000);  // Gửi dữ liệu mỗi 2 giây
}
