let actions = [];
let filteredData = [];  // Dữ liệu đã lọc
let currentPage = 1;
let rowsPerPage = 10;   // Giá trị mặc định

// Lấy dữ liệu từ API
function fetchActions() {
    fetch('http://localhost:3000/api/actions')
        .then(response => response.json())
        .then(data => {
            actions = data;
            filteredData = actions;  // Khởi tạo dữ liệu đã lọc bằng toàn bộ dữ liệu

            updateTable(filteredData);  // Cập nhật bảng với dữ liệu ban đầu
        })
        .catch(error => {
            console.error('Error fetching actions:', error);
        });
}

// Cập nhật bảng với dữ liệu (có thể là đã lọc hoặc không)
function updateTable(data) {
    const tableBody = document.querySelector('#action-table tbody');
    tableBody.innerHTML = '';

    const start = (currentPage - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    const paginatedData = data.slice(start, end);  // Phân trang trên dữ liệu đã lọc

    paginatedData.forEach(action => {
        const formattedTime = dayjs(action.time).tz('Asia/Ho_Chi_Minh').format('DD/MM/YYYY HH:mm:ss');
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${action.id}</td>
            <td>${action.device}</td>
            <td>${action.action}</td>
            <td>${formattedTime}</td>
        `;
        tableBody.appendChild(row);
    });

    document.getElementById('page-info').textContent = `Page ${currentPage} of ${Math.ceil(data.length / rowsPerPage)}`;
}

// Chuyển trang (trên dữ liệu đã lọc)
function changePage(newPage) {
    if (newPage < 1 || newPage > Math.ceil(filteredData.length / rowsPerPage)) return;
    currentPage = newPage;
    updateTable(filteredData);  // Hiển thị lại bảng với dữ liệu đã lọc
}

// Thay đổi số lượng bản ghi mỗi trang
function changePageSize() {
    rowsPerPage = parseInt(document.getElementById('page-size').value);
    currentPage = 1;  // Đặt lại về trang 1
    updateTable(filteredData);  // Cập nhật bảng với dữ liệu đã lọc
}

// Hàm lọc dữ liệu
function filterTable() {
    const deviceFilter = document.getElementById('device-filter').value;
    const actionFilter = document.getElementById('action-filter').value;
    const startTime = document.getElementById('start-time').value;

    filteredData = actions;  // Bắt đầu từ toàn bộ dữ liệu

    if (deviceFilter !== 'all') {
        filteredData = filteredData.filter(action => action.device === deviceFilter);
    }

    if (actionFilter !== 'all') {
        filteredData = filteredData.filter(action => action.action === actionFilter);
    }
    let check = 0;
    // Lọc theo thời gian
    if (startTime) {
        
        const formattedStartTime = dayjs(startTime).tz('Asia/Ho_Chi_Minh').format('YYYY-MM-DDTHH:mm');
        filteredData = filteredData.filter(action => {
            const actionTime = dayjs(action.time).tz('Asia/Ho_Chi_Minh').format('YYYY-MM-DDTHH:mm');
            return actionTime.includes(formattedStartTime);
        });
        check = 1;  // Nếu lọc theo thời gian thì đặt check thành 1
    }

    currentPage = 1;  // Reset về trang đầu tiên sau khi lọc
    updateTable(filteredData);  // Hiển thị dữ liệu đã lọc
    // Hiển thị nút quay lại toàn bộ dữ liệu
    // Hiển thị nút quay lại toàn bộ dữ liệu chỉ khi check = 1 (lọc theo thời gian)
    if (check === 1) {
        document.getElementById('reset-button').style.display = 'block';
    } else {
        document.getElementById('reset-button').style.display = 'none'; // Ẩn nếu không có lọc theo thời gian
    }
}

// Sự kiện cho nút quay lại toàn bộ dữ liệu
document.getElementById('reset-button').addEventListener('click', resetData);
// Hàm để quay lại toàn bộ dữ liệu
function resetData() {
    filteredData = actions;  // Khôi phục lại toàn bộ dữ liệu gốc
    currentPage = 1;  // Đặt lại về trang 1

    // Xóa các giá trị lọc
    document.getElementById('device-filter').value = 'all';
    document.getElementById('action-filter').value = 'all';
    document.getElementById('start-time').value = '';

    updateTable(filteredData);  // Cập nhật bảng với toàn bộ dữ liệu

    // Ẩn nút quay lại toàn bộ dữ liệu sau khi đã quay lại
    document.getElementById('reset-button').style.display = 'none';
}
let sortDirection = 'DESC'; // Mặc định là giảm dần

function sortTableByTime() {
    // Đảo chiều sắp xếp
    sortDirection = sortDirection === 'DESC' ? 'ASC' : 'DESC';

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



// Event listeners for filters, sorting, and page size change
document.getElementById('device-filter').addEventListener('change', filterTable);
document.getElementById('action-filter').addEventListener('change', filterTable);
document.getElementById('search-button').addEventListener('click', filterTable);
document.getElementById('page-size').addEventListener('change', changePageSize);
document.getElementById('prev-page').addEventListener('click', () => changePage(currentPage - 1));
document.getElementById('next-page').addEventListener('click', () => changePage(currentPage + 1));
// Khi trang tải, lấy dữ liệu ban đầu
window.onload = function() {
    fetchActions();  // Gọi API để lấy dữ liệu ban đầu
};
