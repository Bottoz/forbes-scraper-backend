const express = require('express');
const puppeteer = require('puppeteer-core');
const chromium = require('@sparticuz/chromium');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 10000; // Render default port

app.use(cors());

app.get('/elon-net-worth-forbes', async (req, res) => {
    try {
        const browser = await puppeteer.launch({
            args: chromium.args, // Default args for cloud compatibility
            defaultViewport: chromium.defaultViewport,
            executablePath: await chromium.executablePath(), // Auto-resolves Chromium path
            headless: chromium.headless // Ensures headless mode
        });
        const page = await browser.newPage();
        await page.goto('https://www.forbes.com/profile/elon-musk/?list=rtb/', { waitUntil: 'networkidle2' });
        const netWorthText = await page.evaluate(() => {
            const netWorthElement = document.querySelector('.subheader-amount');
            return netWorthElement ? netWorthElement.textContent.trim() : '$343B';
        });
        await browser.close();
        const netWorthValue = parseFloat(netWorthText.replace(/[^0-9.]/g, ''));
        const netWorth = netWorthText.includes('B') ? netWorthValue * 1e9 : netWorthValue * 1e6;
        res.json({ netWorth });
    } catch (error) {
        console.error('Scraping error:', error);
        res.json({ netWorth: 343000000000 }); // Fallback
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});