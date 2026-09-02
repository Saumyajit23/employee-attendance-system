const app = require('./src/app');
const connectDB = require('./src/config/database');

const PORT = process.env.PORT || 5000;

// Connect to database
connectDB();

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📡 Test API: http://localhost:${PORT}/api/test`);
});