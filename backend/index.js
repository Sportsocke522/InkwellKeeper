const express = require('express');
const app = express();
app.use(express.json());
app.use(require('cors')());

app.get('/', (req, res) => res.send('Backend läuft!'));
app.listen(5000, () => console.log('Backend auf Port 5000'));
