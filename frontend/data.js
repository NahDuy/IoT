let sensorData = [];
let currentPage = 1;
let rowsPerPage = 10; // Default value

// Lấy dữ liệu cảm biến từ API
function fetchSensorData() {
    fetch('http://localhost:3000/api/sensor-data')
    .then(response => response.json())
    .then(data => {
        sensorData = data;
        updateTable(sensorData);
    })
    .catch(error => {
        console.error('Error fetching sensor data:', error);
    });
}
setInterval(fetchSensorData, 1000);
// Cập nhật bảng với dữ liệu cảm biến
function updateTable(data) {
    const tableBody = document.querySelector('#data-table tbody');
    tableBody.innerHTML = '';

    const start = (currentPage - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    const paginatedData = data.slice(start, end);

    paginatedData.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item.id}</td>
            <td>${item.temperature}</td>
            <td>${item.humidity}</td>
            <td>${item.light}</td>
            <td>${new Date(item.time).toLocaleString()}</td>
        `;
        tableBody.appendChild(row);
    });

    document.getElementById('page-info').textContent = `Page ${currentPage} of ${Math.ceil(data.length / rowsPerPage)}`;
}

function changePage(newPage) {
    if (newPage < 1 || newPage > Math.ceil(sensorData.length / rowsPerPage)) return;
    currentPage = newPage;
    updateTable(sensorData);
}

function changePageSize() {
    rowsPerPage = parseInt(document.getElementById('page-size').value);
    currentPage = 1; // Reset to first page
    updateTable(sensorData);
}

// Event listeners for filters and pagination
document.getElementById('page-size').addEventListener('change', changePageSize);
document.getElementById('prev-page').addEventListener('click', () => changePage(currentPage - 1));
document.getElementById('next-page').addEventListener('click', () => changePage(currentPage + 1));

// Gọi hàm để lấy dữ liệu cảm biến khi trang tải
fetchSensorData();


function filterTable() {
    const deviceFilter = document.getElementById('device-filter').value;

    // Ẩn tất cả các cột trước
    const allColumns = document.querySelectorAll('#data-table th, #data-table td');
    allColumns.forEach(column => column.style.display = 'none');

    // Hiển thị cột ID và Time
    showColumn(0); // Hiển thị cột ID
    showColumn(4); // Hiển thị cột Time

    // Hiển thị các cột dựa trên lựa chọn của người dùng
    if (deviceFilter === 'Lamp') {
        showColumn(1); // Hiển thị cột Temperature
    } else if (deviceFilter === 'Air Conditioner') {
        showColumn(2); // Hiển thị cột Humidity
    } else if (deviceFilter === 'Fan') {
        showColumn(3); // Hiển thị cột Light
    } else if (deviceFilter === 'all') {
        // Hiển thị tất cả các cột
        showColumn(1); // Temperature
        showColumn(2); // Humidity
        showColumn(3); // Light
    }
}

function showColumn(index) {
    const columns = document.querySelectorAll(`#data-table th:nth-child(${index + 1}), #data-table td:nth-child(${index + 1})`);
    columns.forEach(column => column.style.display = '');
}

// Thêm event listener cho bộ lọc
document.getElementById('device-filter').addEventListener('change', filterTable);

// Gọi filterTable khi trang được tải để đảm bảo trạng thái bảng ban đầu
window.onload = filterTable;


document.getElementById('time-filter').addEventListener('input', filterTable);



// Event listeners for filters, sorting, and page size change
document.getElementById('device-filter').addEventListener('change', filterTable);
document.getElementById('action-filter').addEventListener('change', filterTable);
document.getElementById('time-filter').addEventListener('input', filterTable);
document.getElementById('page-size').addEventListener('change', changePageSize);
document.getElementById('prev-page').addEventListener('click', () => changePage(currentPage - 1));
document.getElementById('next-page').addEventListener('click', () => changePage(currentPage + 1));

// Initial data fetch
fetchActions();


