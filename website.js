const express = require('express');
const app = express();
const port = 5000;

// Serve static files from the public directory
app.use(express.static('public'));

// Serve the landing page
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

// Add security headers
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
});

app.listen(port, '0.0.0.0', () => {
    console.log(`Bot website running on port ${port}`);
});