let sensorData = [];   // Dữ liệu gốc từ API
let filteredData = []; // Dữ liệu đã lọc
let currentPage = 1;
let rowsPerPage = 5;  // Giá trị mặc định
let totalItems = 0;    // Tổng số lượng dữ liệu
let totalPages = 1;  // Khai báo tổng số trang
function fetchSensorData() {
    fetch(`http://localhost:3000/api/sensor-data?page=${currentPage}&pageSize=${rowsPerPage}`)
        .then(response => response.json())
        .then(result => {
            const { totalItems, data, totalPages: totalPageCount, currentPage: currentPg } = result;

            sensorData = data.map(item => {
                return { ...item, time: dayjs(item.time).tz('Asia/Ho_Chi_Minh') };
            });
            updateTable(sensorData);  // Cập nhật bảng dữ liệu
            totalPages = totalPageCount;  // Cập nhật tổng số trang
            currentPage = currentPg;      // Cập nhật trang hiện tại
            filterTable();
            // Cập nhật thông tin phân trang
            document.getElementById('page-info').textContent = `Page ${currentPage} of ${totalPages}`;
        })
        .catch(error => {
            console.error('Error fetching sensor data:', error);
        });
}

function fetchSearchSensorData(startTime) {
    fetch(`http://localhost:3000/api/search-sensor-data?startTime=${startTime}`)
        .then(response => response.json())
        .then(result => {
            if (result.totalItems === 0) {
                alert("Không tìm thấy kết quả phù hợp!");
                return;
            }


            sensorData = result.data.map(item => {
                return { ...item, time: dayjs(item.time).tz('Asia/Ho_Chi_Minh') };
            });

            updateTable(sensorData);  // Hiển thị kết quả tìm kiếm trong bảng
            filterTable();  // Gọi hàm lọc bảng sau khi cập nhật dữ liệu

            // Hiển thị "Total results" khi có tìm kiếm theo thời gian


            // Luôn hiển thị là "Page 1 of 1"
            document.getElementById('page-info').textContent = `Page 1 of 1`;
            // Vô hiệu hóa các nút phân trang
            document.getElementById('prev-page').disabled = true;
            document.getElementById('next-page').disabled = true;

            document.getElementById('reset-button').style.display = 'block';  // Hiển thị nút reset
        })
        .catch(error => {
            console.error('Lỗi khi tìm kiếm dữ liệu:', error);
        });
}

let sortDirection = 'DESC'; // Default sorting direction

function sortTableByTime() {
    // Toggle sorting direction
    sortDirection = sortDirection === 'DESC' ? 'ASC' : 'DESC';

    // Sort the data (either filtered or full sensor data)
    const dataToSort = filteredData.length > 0 ? filteredData : sensorData;

    dataToSort.sort((a, b) => {
        const timeA = new Date(a.time);
        const timeB = new Date(b.time);
        return sortDirection === 'ASC' ? timeA - timeB : timeB - timeA;
    });

    currentPage = 1; // Reset to page 1 after sorting
    updateTable(dataToSort); // Update the table with sorted data
}

// Fetch sorted data from API if no filtered data exists
if (filteredData.length === 0) {
    fetch(`/api/sensor-data?order=${sortDirection}`)
        .then(response => response.json())
        .then(result => {
            sensorData = result.data;
            updateTable(sensorData); // Display the sorted sensor data
        })
        .catch(error => console.error('Error fetching sorted sensor data:', error));
}


function updateTable(data) {
    const tableBody = document.querySelector('#data-table tbody');
    tableBody.innerHTML = '';  // Xóa nội dung cũ

    if (data.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6">Không có kết quả</td></tr>';
        return;
    }

    data.forEach(item => {
        const formattedTime = dayjs(item.time).tz('Asia/Ho_Chi_Minh').format('DD/MM/YYYY HH:mm:ss');
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item.id}</td>
            <td>${item.temperature}</td>
            <td>${item.humidity}</td>
            <td>${item.light}</td>
            <td>${item.dust}</td>
            <td>${formattedTime}</td>
        `;
        tableBody.appendChild(row);
    });

    // document.getElementById('page-info').textContent = `Total results: ${data.length}`;
}



function searchByTime() {
    let timeFilterValue = document.getElementById('time-filter').value.trim();  // Get the entered time value

    if (!timeFilterValue) {
        alert('Vui lòng nhập thời gian!');
        return;
    }

    // Check if the format is 'DD/MM/YYYY HH:mm' (missing seconds)
    const timeWithoutSecondsPattern = /^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}$/;
    if (timeWithoutSecondsPattern.test(timeFilterValue)) {
        timeFilterValue += ':00';  // Append ":00" for the seconds
    }

    // Validate the time format 'DD/MM/YYYY HH:mm:ss'
    const timePattern = /^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}:\d{2}$/;
    if (!timePattern.test(timeFilterValue)) {
        alert('Vui lòng nhập thời gian theo định dạng DD/MM/YYYY HH:mm:ss!');
        return;
    }
    // Convert and search using the correct format
    const startTime = dayjs(timeFilterValue, 'DD/MM/YYYY HH:mm:ss', true).format('YYYY-MM-DD HH:mm:ss');

    if (!dayjs(startTime).isValid()) {
        alert('Định dạng thời gian không hợp lệ. Vui lòng kiểm tra lại!');
        return;
    }

    fetchSearchSensorData(startTime);
}



// Hàm applyFilters kết hợp cả bộ lọc thời gian và thiết bị
function applyFilters(resetPage = true) {
    let data = [...sensorData]; // Clone the original data

    // Device filtering logic
    const deviceFilterElement = document.getElementById('device-filter');
    if (deviceFilterElement && deviceFilterElement.value !== 'all') {
        const deviceFilter = deviceFilterElement.value;
        data = data.filter(item => {
            if (deviceFilter === 'Lamp') return item.temperature !== undefined;
            if (deviceFilter === 'Air Conditioner') return item.humidity !== undefined;
            if (deviceFilter === 'Fan') return item.light !== undefined;
            if (deviceFilter === 'Dust') return item.dust !== undefined;
            return true;
        });
        document.getElementById('reset-button').style.display = 'block'; // Show reset button when filtering
    }

    filteredData = data;  // Update filtered data
    

    updateTable(filteredData);  // Update table with filtered data
}

const deviceFilterElement = document.getElementById('device-filter');
if (deviceFilterElement) {
    deviceFilterElement.addEventListener('change', applyFilters);
}
function changePage(newPage) {
    if (newPage < 1 || newPage > totalPages) return;
    currentPage = newPage;
    fetchSensorData();  // Gọi lại API để lấy dữ liệu cho trang mới
}
function changePageSize() {
    rowsPerPage = parseInt(document.getElementById('page-size').value);  // Lấy số lượng bản ghi trên mỗi trang
    currentPage = 1;  // Đặt lại trang hiện tại về 1 khi thay đổi số lượng bản ghi
    fetchSensorData();  // Gọi lại API với số lượng bản ghi mới
}



fetchSensorData();

function filterTable() {
    const deviceFilter = document.getElementById('device-filter').value;

    // Ẩn tất cả các cột trước
    const allColumns = document.querySelectorAll('#data-table th, #data-table td');
    allColumns.forEach(column => column.style.display = 'none');

    // Hiển thị cột ID và Time
    showColumn(0); // Hiển thị cột ID
    showColumn(5); // Hiển thị cột Time

    // Hiển thị các cột dựa trên lựa chọn của người dùng
    if (deviceFilter === 'Lamp') {
        showColumn(1); // Hiển thị cột Temperature
    } else if (deviceFilter === 'Air Conditioner') {
        showColumn(2); // Hiển thị cột Humidity
    } else if (deviceFilter === 'Fan') {
        showColumn(3); // Hiển thị cột Light
    } else if (deviceFilter === 'Dust') {
        showColumn(4); // Hiển thị cột Dust
    } else if (deviceFilter === 'all') {
        // Hiển thị tất cả các cột
        showColumn(1); // Temperature
        showColumn(2); // Humidity
        showColumn(3); // Light
        showColumn(4); // Dust
    }
}

function showColumn(index) {
    const columns = document.querySelectorAll(`#data-table th:nth-child(${index + 1}), #data-table td:nth-child(${index + 1})`);
    columns.forEach(column => column.style.display = '');
}


function hideColumn(index) {
    const columns = document.querySelectorAll(`#data-table th:nth-child(${index + 1}), #data-table td:nth-child(${index + 1})`);
    columns.forEach(column => column.style.display = 'none');
}

document.getElementById('reset-button').addEventListener('click', () => {
    currentPage = 1;
    document.getElementById('device-filter').value = 'all';
    document.getElementById('time-filter').value = '';
    fetchSensorData();  // Gọi lại để lấy toàn bộ dữ liệu

    // Kích hoạt lại phân trang sau khi quay lại bảng dữ liệu
    document.getElementById('prev-page').disabled = false;
    document.getElementById('next-page').disabled = false;

    document.getElementById('reset-button').style.display = 'none';
});

// Event listener để gọi hàm filterTable khi thay đổi bộ lọc thiết bị
document.getElementById('device-filter').addEventListener('change', filterTable);
document.getElementById('page-size').addEventListener('change', changePageSize);
document.getElementById('prev-page').addEventListener('click', () => changePage(currentPage - 1));
document.getElementById('next-page').addEventListener('click', () => changePage(currentPage + 1));
document.getElementById('device-filter').addEventListener('change', applyFilters);
document.getElementById('search-button').addEventListener('click', searchByTime);
// Gọi filterTable khi trang được tải để đảm bảo trạng thái bảng ban đầu
window.onload = filterTable;