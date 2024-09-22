const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');
const mysql = require('mysql2');
const mqtt = require('mqtt'); // Sử dụng thư viện MQTT

const app = express();
app.use(bodyParser.json());
app.use(cors());
// Kết nối với MQTT Broker  
const ip = '192.168.1.16'; // Địa chỉ IP của MQTT broker
const mqttUrl = `ws://${ip}:8080`;


let actions = [];

const db = mysql.createConnection({
    host: '127.0.0.1',
    port: 3306,  // Chỉ định cổng ở đây
    user: 'root',
    password: 'root',
    database: 'mqtt_sql'
});

db.connect(err => {
    if (err) {
        console.error('Lỗi kết nối MySQL:', err);
    } else {
        console.log('Đã kết nối MySQL');
    }
});
// API để nhận và lưu action
app.post('/api/actions', (req, res) => {
    const { device, action } = req.body;
    const query = 'INSERT INTO actions (device, action) VALUES (?, ?)';
    db.query(query, [device, action], (err, result) => {
        if (err) {
            console.error('Lỗi khi chèn vào database:', err);
            res.status(500).send('Lỗi server');
        } else {
            res.status(201).json({ id: result.insertId, device, action, time: new Date() });
        }
    });
});

// API để lấy tất cả action
app.get('/api/actions', (req, res) => {
    const query = 'SELECT * FROM actions ORDER BY time DESC';
    db.query(query, (err, results) => {
        if (err) {
            console.error('Lỗi khi truy vấn database:', err);
            res.status(500).send('Lỗi server');
        } else {
            res.json(results);
        }
    });
});
// Kết nối với MQTT broker


const mqttClient = mqtt.connect(mqttUrl); // Kết nối MQTT
mqttClient.on('connect', () => {
    console.log('Đã kết nối với MQTT broker');
    mqttClient.subscribe('esp32/sensors'); // Lắng nghe topic sensor data
});

// Nhận dữ liệu từ MQTT và lưu vào MySQL
mqttClient.on('message', (topic, message) => {
    if (topic === 'esp32/sensors') {
        const sensorData = JSON.parse(message.toString());
        const { temperature, humidity, light } = sensorData;

        // Lưu dữ liệu vào MySQL, đổi tên bảng thành sensors
        const query = 'INSERT INTO sensors (temperature, humidity, light) VALUES (?, ?, ?)';
        db.query(query, [temperature, humidity, light], (err, result) => {
            if (err) {
                console.error('Lỗi khi chèn vào database:', err);
            } else {
                console.log('Dữ liệu cảm biến đã được lưu vào MySQL');
            }
        });
    }
});

// API để lấy dữ liệu cảm biến
app.get('/api/sensor-data', (req, res) => {
    const query = 'SELECT * FROM sensors ORDER BY time DESC';
    db.query(query, (err, results) => {
        if (err) {
            console.error('Lỗi khi truy vấn database:', err);
            res.status(500).send('Lỗi server');
        } else {
            res.json(results);
        }
    });
});
// Phục vụ các file tĩnh từ thư mục frontend
app.use(express.static(path.join(__dirname, '../frontend')));




const port = 3000;
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
