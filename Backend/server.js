const nodeCrypto = require('crypto');
global.crypto = nodeCrypto.webcrypto || nodeCrypto;
if (!global.crypto.getRandomValues) {
    global.crypto.getRandomValues = (arr) => nodeCrypto.randomFillSync(arr);
}

require('dotenv').config();

const app = require('./src/app');
const connectDB = require('./src/db/db');

connectDB();

app.listen(process.env.PORT, () => {
    console.log(`Server is running on port ${process.env.PORT}`);
});