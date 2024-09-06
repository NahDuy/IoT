const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
app.use(bodyParser.json());
app.use(cors());

let actions = [];

// Phục vụ các file tĩnh từ thư mục frontend
app.use(express.static(path.join(__dirname, '../frontend')));

// API Endpoints
app.get('/api/actions', (req, res) => {
    res.json(actions);
});

app.post('/api/actions', (req, res) => {
    const action = req.body;
    actions.push(action);
    res.status(201).json(action);
});

// // Chuyển hướng đến trang index.html khi truy cập vào đường dẫn gốc
// app.get('/', (req, res) => {
//     res.sendFile(path.join(__dirname, '../frontend/index.html'));
// });

let isServerRestarted = true;

app.get('/server-restart', (req, res) => {
    if (isServerRestarted) {
        isServerRestarted = false;
        res.json({ restart: true });
    } else {
        res.json({ restart: false });
    }
});

let buttonState = {};

app.post('/save-state', (req, res) => {
    buttonState = req.body;
    res.sendStatus(200);
});

app.get('/get-state', (req, res) => {
    res.json(buttonState);
});


let actions1 = [
    {
        id: 1,
        temperature: 25,
        humidity: 60,
        light: 400,
        time: '2024-08-26T12:34:56Z'
    },
    // thêm dữ liệu khác vào đây
];

// API Endpoints
app.get('/api/actions', (req, res) => {
    res.json(actions);
});



const port = 3000;
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});