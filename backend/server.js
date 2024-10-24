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
const ip = '172.20.10.7'; // Địa chỉ IP của MQTT broker
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
        const { temperature, humidity, light, dust } = sensorData;


        const timeInVietnam = dayjs().tz('Asia/Ho_Chi_Minh').format('YYYY-MM-DD HH:mm:ss');

        // Chèn dữ liệu bao gồm dust vào cơ sở dữ liệu
        const query = 'INSERT INTO sensor_data_temp (temperature, humidity, light, dust, time) VALUES (?, ?, ?, ?, ?)';
        db.query(query, [temperature, humidity, light, dust, timeInVietnam], (err, result) => {
            if (err) {
                console.error('Lỗi khi chèn vào database:', err);
            } else {

            }
        });

    }
});

app.get('/api/dust-count', (req, res) => {
    const query = 'SELECT COUNT(*) AS count FROM sensor_data_temp WHERE dust > 60';

    db.query(query, (err, result) => {
        if (err) {
            console.error('Lỗi khi truy vấn database:', err);
            res.status(500).send('Lỗi server');
        } else {
            res.json({ dustCount: result[0].count });
        }
    });
});

app.get('/api/search-sensor-data', (req, res) => {
    const { startTime = '' } = req.query;

    if (!startTime) {
        return res.status(400).json({ error: 'Thời gian bắt đầu không hợp lệ' });
    }

    const startDateTime = dayjs(startTime, 'YYYY-MM-DD HH:mm:ss', true).format('YYYY-MM-DD HH:mm:ss');
    if (startDateTime === 'Invalid Date') {
        return res.status(400).json({ error: 'Định dạng thời gian không hợp lệ' });
    }
    // const endDateTime = dayjs(startDateTime).add(59, 'second').format('YYYY-MM-DD HH:mm:ss');
    const query = `SELECT * FROM sensor_data_temp WHERE time = ? ORDER BY time DESC`;
    db.query(query, [startDateTime], (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Lỗi server, vui lòng thử lại sau.' });
        }
        res.json({
            data: results,
            totalItems: results.length
        });
    });
});



app.get('/api/sensor-data', (req, res) => {
    const { page = 1, pageSize = 5, order = 'DESC' } = req.query;  // Lấy page và pageSize từ query
    const sortOrder = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    const offset = (page - 1) * pageSize;  // Tính toán offset

    // Câu truy vấn để lấy tổng số bản ghi
    const countQuery = 'SELECT COUNT(*) AS totalItems FROM sensor_data_temp';

    // Câu truy vấn để lấy dữ liệu theo trang và kích thước trang
    const dataQuery = `SELECT * FROM sensor_data_temp ORDER BY time ${sortOrder}  LIMIT ?, ?`;

    // Thực hiện truy vấn để đếm tổng số bản ghi
    db.query(countQuery, (err, countResult) => {
        if (err) {
            console.error('Lỗi khi truy vấn tổng số lượng bản ghi:', err);
            res.status(500).send('Lỗi server');
            return;
        }

        const totalItems = countResult[0].totalItems;

        // Thực hiện truy vấn để lấy dữ liệu
        db.query(dataQuery, [offset, parseInt(pageSize)], (err, dataResults) => {
            if (err) {
                console.error('Lỗi khi truy vấn dữ liệu:', err);
                res.status(500).send('Lỗi server');
            } else {
                // Trả về dữ liệu bao gồm tổng số trang và trang hiện tại
                res.json({
                    totalItems: totalItems,
                    data: dataResults,
                    totalPages: Math.ceil(totalItems / pageSize),
                    currentPage: parseInt(page)
                });
            }
        });
    });
});

// Phục vụ các file tĩnh từ thư mục frontend
app.use(express.static(path.join(__dirname, '../frontend')));




const port = 3000;
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
