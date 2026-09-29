const { sequelize } = require('./config/database');
async function run() {
    try {
        await sequelize.query("ALTER TABLE item_features ADD COLUMN embedding_status ENUM('pending', 'processing', 'completed', 'failed') DEFAULT 'pending', ADD COLUMN embedding_error TEXT NULL");
        console.log('Columns added successfully');
    } catch (err) {
        console.error('Error:', err.message);
    }
    process.exit(0);
}
run();
