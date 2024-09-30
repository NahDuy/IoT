let sensorData = [];   // Dữ liệu gốc từ API
let filteredData = []; // Dữ liệu đã lọc
let currentPage = 1;
let rowsPerPage = 10;  // Giá trị mặc định
let totalItems = 0;    // Tổng số lượng dữ liệu
// Lấy dữ liệu từ API
function fetchSensorData() {
    fetch('http://localhost:3000/api/sensor-data')
        .then(response => response.json())
        .then(data => {
            sensorData = data.map(item => {
                return { ...item, time: dayjs(item.time).tz('Asia/Ho_Chi_Minh') }; // Định dạng thời gian
            });
            applyFilters(false);  // Áp dụng bộ lọc ngay khi nhận được dữ liệu
        })
        .catch(error => {
            console.error('Error fetching sensor data:', error);
        });
}
// API tìm kiếm dữ liệu theo thời gian
function fetchSearchSensorData() {
    const startTime = document.getElementById('start-time').value;  // Lấy giá trị thời gian bắt đầu

    if (!startTime) {
        alert('Vui lòng nhập thời gian!');
        return;
    }

    stopAutoUpdate();  // Dừng cập nhật tự động khi người dùng tìm kiếm

    fetch(`http://localhost:3000/api/search-sensor-data?startTime=${startTime}`)
        .then(response => response.json())
        .then(result => {
            sensorData = result.data.map(item => {
                return { ...item, time: dayjs(item.time).tz('Asia/Ho_Chi_Minh') }; // Định dạng thời gian
            });
            // Đặt lại trang hiện tại về trang đầu tiên sau khi tìm kiếm
            currentPage = 1;
            totalItems = result.totalItems; // Cập nhật tổng số hàng
            applyFilters(false);  // Áp dụng bộ lọc và phân trang cho dữ liệu mới
            // Hiển thị nút quay lại toàn bộ dữ liệu
            // Hiển thị nút quay lại cập nhật tự động
            document.getElementById('reset-button').style.display = 'block';
        })
        .catch(error => {
            console.error('Error fetching sensor data:', error);
        });
}
// Sự kiện khi người dùng muốn quay lại cập nhật tự động
document.getElementById('reset-button').addEventListener('click', () => {
    // Khôi phục lại API cập nhật tự động
    currentPage = 1;
    startAutoUpdate();
    fetchSensorData();  // Lấy lại dữ liệu từ API liên tục
    // Ẩn nút quay lại cập nhật tự động sau khi đã nhấn
    document.getElementById('reset-button').style.display = 'none';

});
let sortDirection = 'DESC'; // Mặc định là giảm dần
function sortTableByTime() {
    // Đảo chiều sắp xếp
    sortDirection = sortDirection === 'DESC' ? 'ASC' : 'DESC';
    if (sortDirection === 'ASC') {
        stopAutoUpdate(); // Dừng cập nhật tự động khi sắp xếp theo ASC
    }
    else{
        startAutoUpdate();
    }
    // Nếu đã có dữ liệu lọc (filteredData), sắp xếp trên dữ liệu đó
    if (filteredData.length > 0) {
        
        filteredData.sort((a, b) => {
            const timeA = new Date(a.time);
            const timeB = new Date(b.time);
            return sortDirection === 'ASC' ? timeA - timeB : timeB - timeA;
        });
        currentPage = 1; // Đặt lại về trang 1 sau khi sắp xếp
        updateTable(filteredData); // Cập nhật bảng với dữ liệu đã lọc và sắp xếp
    } else {
        // Nếu không có dữ liệu lọc, sắp xếp toàn bộ dữ liệu từ API
        fetch(`/api/sensor-data?order=${sortDirection}`)
            .then(response => response.json())
            .then(data => {
                sensorData = data;
                filteredData = sensorData; // Cập nhật dữ liệu lọc với toàn bộ dữ liệu
                currentPage = 1; // Đặt lại về trang 1 sau khi sắp xếp
                updateTable(filteredData); // Cập nhật bảng với dữ liệu mới
            })
            .catch(error => console.error('Error fetching sorted sensors:', error));
    }
}




// Hàm xử lý tìm kiếm khi người dùng nhấn nút
document.getElementById('search-button').addEventListener('click', fetchSearchSensorData);

// Cập nhật bảng với dữ liệu đã phân trang
function updateTable(data) {
    const tableBody = document.querySelector('#data-table tbody');
    tableBody.innerHTML = '';  // Xóa nội dung cũ

    const start = (currentPage - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    const paginatedData = data.slice(start, end);  // Hiển thị dữ liệu theo trang

    paginatedData.forEach(item => {
       
        const formattedTime = dayjs(item.time).tz('Asia/Ho_Chi_Minh').format('DD/MM/YYYY HH:mm:ss');
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item.id}</td>
            <td>${item.temperature}</td>
            <td>${item.humidity}</td>
            <td>${item.light}</td>
            <td>${formattedTime}</td>
        `;
        tableBody.appendChild(row);
    });

    document.getElementById('page-info').textContent = `Page ${currentPage} of ${Math.ceil(data.length / rowsPerPage)}`;
    filterTable();
}

// Hàm thay đổi trang

let intervalId; // Biến lưu trữ interval

// Hàm bắt đầu cập nhật dữ liệu tự động
function startAutoUpdate() {
    intervalId = setInterval(fetchSensorData, 1000); // Cứ 5 giây cập nhật
}

// Hàm dừng cập nhật dữ liệu tự động
function stopAutoUpdate() {
    clearInterval(intervalId); // Dừng cập nhật dữ liệu
}

/// Hàm lọc dữ liệu
function applyFilters(resetPage = true) {
    let data = [...sensorData]; // Sao chép dữ liệu gốc

    // Kiểm tra bộ lọc thời gian
    const timeFilterElement = document.getElementById('time-filter');
    if (timeFilterElement) {
        const timeFilterValue = timeFilterElement.value.trim();
        if (timeFilterValue) {
            stopAutoUpdate(); // Dừng cập nhật nếu người dùng nhập bộ lọc thời gian
            data = data.filter(item => {
                const itemTime = dayjs(item.time).tz('Asia/Ho_Chi_Minh').format('DD/MM/YYYY HH:mm');
                return itemTime.includes(timeFilterValue);
            });
        } else {
            startAutoUpdate(); // Khôi phục cập nhật tự động nếu không có tìm kiếm
        }
    }

    // Kiểm tra bộ lọc thiết bị
    const deviceFilterElement = document.getElementById('device-filter');
    if (deviceFilterElement) {
        const deviceFilter = deviceFilterElement.value;
        if (deviceFilter !== 'all') {
            data = data.filter(item => {
                if (deviceFilter === 'Lamp') return item.temperature !== undefined;
                if (deviceFilter === 'Air Conditioner') return item.humidity !== undefined;
                if (deviceFilter === 'Fan') return item.light !== undefined;
                return true;
            });
        }
    }

    filteredData = data;  // Cập nhật dữ liệu đã lọc

    if (resetPage) {
        currentPage = 1; // Chỉ reset trang nếu cần
    }

    updateTable(filteredData);  // Hiển thị bảng với dữ liệu đã lọc
}

// Event listeners for filters and pagination
const pageSizeElement = document.getElementById('page-size');
if (pageSizeElement) {
    pageSizeElement.addEventListener('change', changePageSize);
}

const prevPageElement = document.getElementById('prev-page');
if (prevPageElement) {
    prevPageElement.addEventListener('click', () => changePage(currentPage - 1));
}

const nextPageElement = document.getElementById('next-page');
if (nextPageElement) {
    nextPageElement.addEventListener('click', () => changePage(currentPage + 1));
}

const deviceFilterElement = document.getElementById('device-filter');
if (deviceFilterElement) {
    deviceFilterElement.addEventListener('change', applyFilters);
}


// Hàm thay đổi trang (không đặt lại currentPage)
function changePage(newPage) {
    const totalPages = Math.ceil(filteredData.length / rowsPerPage);
    if (newPage < 1 || newPage > totalPages) return;
    currentPage = newPage;
    updateTable(filteredData);  // Cập nhật bảng với dữ liệu đã lọc
}

// Hàm thay đổi số hàng mỗi trang (không đặt lại currentPage)
function changePageSize() {
    rowsPerPage = parseInt(document.getElementById('page-size').value);
    updateTable(filteredData);  // Cập nhật bảng với dữ liệu đã lọc
}


// Bắt đầu cập nhật dữ liệu ngay khi trang tải
startAutoUpdate();
fetchSensorData();


// // Event listeners for filters and pagination
// document.getElementById('page-size').addEventListener('change', changePageSize);
// document.getElementById('prev-page').addEventListener('click', () => changePage(currentPage - 1));
// document.getElementById('next-page').addEventListener('click', () => changePage(currentPage + 1));

// Lọc dữ liệu khi có sự thay đổi trong bộ lọc
document.getElementById('device-filter').addEventListener('change', applyFilters);


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

function hideColumn(index) {
    const columns = document.querySelectorAll(`#data-table th:nth-child(${index + 1}), #data-table td:nth-child(${index + 1})`);
    columns.forEach(column => column.style.display = 'none');
}

function showColumn(index) {
    const columns = document.querySelectorAll(`#data-table th:nth-child(${index + 1}), #data-table td:nth-child(${index + 1})`);
    columns.forEach(column => column.style.display = '');
}

// Event listener để gọi hàm filterTable khi thay đổi bộ lọc thiết bị
document.getElementById('device-filter').addEventListener('change', filterTable);

// Gọi filterTable khi trang được tải để đảm bảo trạng thái bảng ban đầu
window.onload = filterTable;
