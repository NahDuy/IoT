const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');
const mysql = require('mysql2');
const mqtt = require('mqtt'); // Sử dụng thư viện MQTT
const axios = require('axios');

const app = express();
app.use(bodyParser.json());
app.use(cors());
// Kết nối với MQTT Broker  
const ip = '192.168.12.119'; // Địa chỉ IP của MQTT broker
const mqttUrl = `ws://${ip}:8080`;
    
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
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');

dayjs.extend(utc);
dayjs.extend(timezone);

// Khi lưu thời gian vào cơ sở dữ liệu
app.post('/api/actions', (req, res) => {
    const { device, action } = req.body;
    const timeInVietnam = dayjs().tz('Asia/Ho_Chi_Minh').format('YYYY-MM-DD HH:mm:ss');
    const query = 'INSERT INTO actions (device, action, time) VALUES (?, ?, ?)';

    db.query(query, [device, action, timeInVietnam], (err, result) => {
        if (err) {
            console.error('Lỗi khi chèn vào database:', err);
            res.status(500).send('Lỗi server');
        } else {
            res.status(201).json({ id: result.insertId, device, action, time: timeInVietnam });
        }
    });
});


// API để lấy tất cả action
app.get('/api/actions', (req, res) => {
    const { order = 'DESC' } = req.query;  // Mặc định là giảm dần
    const query = `SELECT * FROM actions ORDER BY time ${order}`;

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



const mqttClient = mqtt.connect(mqttUrl, {
    username: 'duy',  // Thay bằng username của bạn
    password: '1'     // Thay bằng password của bạn
}); // Kết nối MQTT
mqttClient.on('connect', () => {
    console.log('Đã kết nối với MQTT broker');
    mqttClient.subscribe('esp32/sensors'); // Lắng nghe topic sensor data
});

mqttClient.on('message', async (topic, message) => {
    if (topic === 'esp32/sensors') {
        const sensorData = JSON.parse(message.toString());
        const { temperature, humidity, light } = sensorData;
        const apiKey = '3d83934e6e30d07e089871d45e9ce784';
        const city = 'Hanoi';
        const apiUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`;

        try {
            const response = await axios.get(apiUrl);
            const currentDustValue = response.data.main ? response.data.main.pressure : 0; // Lấy giá trị áp suất từ API
            const timeInVietnam = dayjs().tz('Asia/Ho_Chi_Minh').format('YYYY-MM-DD HH:mm:ss');

            // Chèn dữ liệu bao gồm dust vào cơ sở dữ liệu
            const query = 'INSERT INTO sensor_data_temp (temperature, humidity, light, dust, time) VALUES (?, ?, ?, ?, ?)';
            db.query(query, [temperature, humidity, light, currentDustValue, timeInVietnam], (err, result) => {
                if (err) {
                    console.error('Lỗi khi chèn vào database:', err);
                } else {
                    
                }
            });
        } catch (error) {
            console.error('Lỗi khi gọi API OpenWeatherMap:', error);
        }
    }
});

app.get('/api/dust-count', (req, res) => {
    const query = 'SELECT COUNT(*) AS count FROM sensor_data_temp WHERE dust > 800';

    db.query(query, (err, result) => {
        if (err) {
            console.error('Lỗi khi truy vấn database:', err);
            res.status(500).send('Lỗi server');
        } else {
            res.json({ dustCount: result[0].count });
        }
    });
});



// API để lấy dữ liệu cảm biến
app.get('/api/sensor-data', (req, res) => {
    const { order = 'DESC' } = req.query;
    const sortOrder = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    const query = `SELECT * FROM sensor_data_temp ORDER BY time ${sortOrder}`;

    db.query(query, (err, results) => {
        if (err) {
            console.error('Lỗi khi truy vấn database:', err);
            res.status(500).send('Lỗi server');
        } else {
        
            res.json(results);
        }
    });
});


// API tìm kiếm dữ liệu cảm biến theo thời gian cụ thể
app.get('/api/search-sensor-data', (req, res) => {
    const { startTime = '' } = req.query;

    // Nếu người dùng cung cấp startTime, tạo khoảng thời gian từ startTime đến startTime + 59 giây
    if (!startTime) {
        return res.status(400).send('Thời gian bắt đầu không hợp lệ');
    }

    const startDateTime = dayjs(startTime).format('YYYY-MM-DD HH:mm:ss');
    const endDateTime = dayjs(startTime).add(59, 'second').format('YYYY-MM-DD HH:mm:ss');

    const query = `SELECT * FROM sensor_data_temp WHERE time BETWEEN ? AND ? ORDER BY time DESC`;
    
    db.query(query, [startDateTime, endDateTime], (err, results) => {
        if (err) {
            console.error('Lỗi khi truy vấn database:', err);
            res.status(500).send('Lỗi server');
        } else {
            res.json({
                data: results,
                totalItems: results.length
            });
        }
    });
});

// Phục vụ các file tĩnh từ thư mục frontend
app.use(express.static(path.join(__dirname, '../frontend')));




const port = 3000;
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
