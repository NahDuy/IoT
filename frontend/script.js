// Lấy các phần tử đại diện cho các nút bật/tắt
const airToggleButton = document.querySelector('.air .group-20');
const fanToggleButton = document.querySelector('.fan .group-20');
const lampToggleButton = document.querySelector('.lamp .group-19');
const lightbulbImage = document.querySelector('.lamp .lightbulb');
const fanbuibImage = document.querySelector('.fan .fan-table');
const airbuibImage = document.querySelector('.air .air-conditioner');

// Hàm khôi phục trạng thái từ localStorage
function restoreState() {
    console.log('Đang khôi phục trạng thái từ localStorage...');
    const savedState = localStorage.getItem('buttonState');
    if (savedState) {
        const state = JSON.parse(savedState);
        console.log('Trạng thái khôi phục từ localStorage:', state); // Log trạng thái để kiểm tra

        if (state.airState === 'On') {
            airToggleButton.classList.add('active');
            airbuibImage.src = 'img/air_off.png';
        } else {
            airToggleButton.classList.remove('active');
            airbuibImage.src = 'img/air-on.png';
        }

        if (state.fanState === 'On') {
            fanToggleButton.classList.add('active');
            fanbuibImage.src = 'img/fan-animate.gif';
        } else {
            fanToggleButton.classList.remove('active');
            fanbuibImage.src = 'img/fan-off.png';
        }

        if (state.lampState === 'On') {
            lampToggleButton.classList.add('active');
            lightbulbImage.src = 'img/light-on.png';
        } else {
            lampToggleButton.classList.remove('active');
            lightbulbImage.src = 'img/light-off.png';
        }
    } else {
        console.log('Không tìm thấy trạng thái trong localStorage');
    }
}

// Hàm lưu trạng thái vào localStorage
function saveState() {
    const airState = airToggleButton.classList.contains('active') ? 'On' : 'Off';
    const fanState = fanToggleButton.classList.contains('active') ? 'On' : 'Off';
    const lampState = lampToggleButton.classList.contains('active') ? 'On' : 'Off';

    const state = { airState, fanState, lampState };

    localStorage.setItem('buttonState', JSON.stringify(state));
    console.log('Trạng thái đã được lưu vào localStorage:', state); // Log trạng thái để kiểm tra
}

// Lưu trữ các hành động bật/tắt và gửi đến server
function logAction(device, action) {
    const time = new Date();
    const id = Date.now(); // Sử dụng timestamp làm ID

    const actionData = { id, device, action, time };

    fetch('http://localhost:3000/api/actions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(actionData),
    })
        .then(response => response.json())
        .then(data => {
            console.log('Action logged:', data);
        })
        .catch(error => {
            console.error('Error:', error);
        });
}

// Đảm bảo tất cả các phần tử DOM đã sẵn sàng trước khi thực hiện thao tác
document.addEventListener('DOMContentLoaded', function () {
    restoreState(); // Khôi phục trạng thái khi trang tải lại

    // Thêm sự kiện click cho các nút và lưu trạng thái
    if (airToggleButton) {
        airToggleButton.addEventListener('click', function () {
            const isAirOn = airToggleButton.classList.toggle('active');
            saveState();
            logAction('Air Conditioner', isAirOn ? 'On' : 'Off');
            airbuibImage.src = isAirOn ? 'img/air-off.png' : 'img/air-on.png';
        });
    }

    if (fanToggleButton) {
        fanToggleButton.addEventListener('click', function () {
            const isFanOn = fanToggleButton.classList.toggle('active');
            saveState();
            logAction('Fan', isFanOn ? 'On' : 'Off');
            fanbuibImage.src = isFanOn ? 'img/fan-animate.gif' : 'img/fan-off.png';
        });
    }

    if (lampToggleButton) {
        lampToggleButton.addEventListener('click', function () {
            const isLampOn = lampToggleButton.classList.toggle('active');
            saveState();
            logAction('Lamp', isLampOn ? 'On' : 'Off');
            // Đổi hình ảnh đèn khi bật/tắt
            lightbulbImage.src = isLampOn ? 'img/light-on.png' : 'img/light-off.png';

        });
    }
});

// Lấy và hiển thị thông tin thời tiết
function fetchWeather() {
    const url = `https://api.openweathermap.org/data/2.5/weather?q=Hanoi,vn&APPID=3d83934e6e30d07e089871d45e9ce784`;

    fetch(url)
        .then(response => response.json())
        .then(data => {
            const iconCode = data.weather[0].icon;
            const iconUrl = `http://openweathermap.org/img/wn/${iconCode}@2x.png`;

            document.getElementById('weather-icon').innerHTML = `
            <img src="${iconUrl}" alt="Weather Icon">
        `;
        })
        .catch(error => console.log(error));
}

// Gọi hàm lấy thời tiết khi trang tải
fetchWeather();

// Cập nhật thời tiết mỗi 60 giây
setInterval(fetchWeather, 60000);

// Biểu đồ Chart.js - sử dụng dữ liệu giả lập
function generateFakeData() {
    return {
        labels: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August'],
        values: Array.from({ length: 8 }, () => Math.floor(Math.random() * 100))
    };
}

const ctx = document.getElementById('chart').getContext('2d');
const chart = new Chart(ctx, {
    type: 'line',
    data: {
        labels: [],
        datasets: [
            {
                label: 'Dataset 1',
                data: [],
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1
            },
            {
                label: 'Dataset 2',
                data: [],
                backgroundColor: 'rgba(153, 102, 255, 0.2)',
                borderColor: 'rgba(153, 102, 255, 1)',
                borderWidth: 1
            }
        ]
    },
    options: {
        scales: {
            y: {
                beginAtZero: true
            }
        }
    }
});

function updateChart(data) {
    chart.data.labels = data.labels;
    chart.data.datasets[0].data = data.values;
    chart.update();
}

function testChartWithFakeData() {
    const fakeData = generateFakeData();
    updateChart(fakeData);
}

testChartWithFakeData();

// Cập nhật thông tin người dùng
document.querySelector('.user-name').textContent = 'Jane Smith';
document.querySelector('.user-class').textContent = 'Class: 12B';
document.querySelector('.user-id').textContent = 'MSV: 87654321';
document.querySelector('.user-image').src = 'path/to/new-profile-image.jpg';
