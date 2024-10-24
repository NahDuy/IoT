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
    
    const id = Date.now(); // Sử dụng timestamp làm ID

    const actionData = { id, device, action};

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


function updateDustCount() {
    fetch('/api/dust-count')
      .then(response => response.json())
      .then(data => {
        document.getElementById('dust_count').innerText = data.dustCount;
      })
      .catch(error => console.error('Lỗi khi gọi API:', error));
  }



function updateChart(data) {
    chart.data.labels = data.labels;
    chart.data.datasets[0].data = data.values;
    chart.update();
}

