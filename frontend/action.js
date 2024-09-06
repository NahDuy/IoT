let actions = [];
let currentPage = 1;
let rowsPerPage = 10; // Default value

function fetchActions() {
    fetch('http://localhost:3000/api/actions')
    .then(response => response.json())
    .then(data => {
        actions = data;
        updateTable(actions);
    })
    .catch(error => {
        console.error('Error fetching actions:', error);
    });
}

function updateTable(data) {
    const tableBody = document.querySelector('#action-table tbody');
    tableBody.innerHTML = '';
    
    const start = (currentPage - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    const paginatedData = data.slice(start, end);
    
    paginatedData.forEach(action => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${action.id}</td>
            <td>${action.device}</td>
            <td>${action.action}</td>
            <td>${new Date(action.time).toLocaleString()}</td>
        `;
        tableBody.appendChild(row);
    });
    
    document.getElementById('page-info').textContent = `Page ${currentPage} of ${Math.ceil(data.length / rowsPerPage)}`;
}

function changePage(newPage) {
    if (newPage < 1 || newPage > Math.ceil(actions.length / rowsPerPage)) return;
    currentPage = newPage;
    updateTable(actions);
}

function changePageSize() {
    rowsPerPage = parseInt(document.getElementById('page-size').value);
    currentPage = 1; // Reset to first page
    updateTable(actions);
}

function filterTable() {
    const deviceFilter = document.getElementById('device-filter').value;
    const actionFilter = document.getElementById('action-filter').value;
    const timeFilter = document.getElementById('time-filter').value.trim();

    let filteredData = actions;

    if (deviceFilter !== 'all') {
        filteredData = filteredData.filter(action => action.device === deviceFilter);
    }

    if (actionFilter !== 'all') {
        filteredData = filteredData.filter(action => action.action === actionFilter);
    }

    if (timeFilter) {
        filteredData = filteredData.filter(action => {
            const formattedTime = new Date(action.time).toLocaleTimeString() + ' ' + new Date(action.time).toLocaleDateString();
            return formattedTime.includes(timeFilter);
        });
    }

    updateTable(filteredData);
}

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


