// API để lấy dữ liệu cảm biến
app.get('/api/sensor-data', (req, res) => {
    const query = 'SELECT * FROM sensors ORDER BY time DESC';
    
    db.query(query, (err, results) => {
        if (err) {
            console.error('Lỗi khi truy vấn database:', err);
            res.status(500).send('Lỗi server');
        } else {
            res.json(results);
        }
    });
});