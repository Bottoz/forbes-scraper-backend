const express = require('express');
const puppeteer = require('puppeteer-core');
const chromium = require('@sparticuz/chromium');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 10000;

app.use(cors());

app.get('/elon-net-worth-forbes', async (req, res) => {
    let browser;
    try {
        browser = await puppeteer.launch({
            args: chromium.args,
            defaultViewport: chromium.defaultViewport,
            executablePath: await chromium.executablePath(),
            headless: chromium.headless
        });
        const page = await browser.newPage();

        // Optimize: Disable unnecessary resources
        await page.setRequestInterception(true);
        page.on('request', (req) => {
            if (['image', 'stylesheet', 'font', 'media'].includes(req.resourceType())) {
                req.abort();
            } else {
                req.continue();
            }
        });

        // Increase timeout to 60 seconds
        await page.goto('https://www.forbes.com/profile/elon-musk/?list=rtb/', {
            waitUntil: 'domcontentloaded', // Faster than 'networkidle2'
            timeout: 60000 // 60 seconds
        });

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
        if (browser) await browser.close(); // Ensure cleanup
        res.json({ netWorth: 343000000000 }); // Fallback
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});