const express = require('express');
const crypto = require('crypto');
const app = express();
const port = 3000;

// In-memory store for temporary links
const linkStore = new Map();

app.use(express.json());
app.use(express.static('public'));

// Generate temporary link
app.post('/generate', (req, res) => {
    const { url } = req.body;

    // Validate URL
    try {
        new URL(url);
    } catch {
        return res.status(400).json({ error: 'Invalid URL' });
    }

    // Generate unique token
    const token = crypto.randomBytes(16).toString('hex');
    const expires = Date.now() + 10 * 1000; // 1 hour expiration

    // Store link
    linkStore.set(token, { url, expires });

    res.json({ token });
});

// Handle redirect
app.get('/redirect/:token', (req, res) => {
    const { token } = req.params;
    const linkData = linkStore.get(token);

    if (!linkData || linkData.expires < Date.now()) {
        linkStore.delete(token); // Clean up expired/invalid token
        return res.status(404).send('Link expired or invalid');
    }

    res.redirect(linkData.url);
});

// Periodic cleanup of expired links
setInterval(() => {
    const now = Date.now();
    for (const [token, { expires }] of linkStore) {
        if (expires < now) {
            linkStore.delete(token);
        }
    }
}, 10 * 60 * 1000); // Run every 10 minutes

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});