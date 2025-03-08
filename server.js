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
        console.log('Launching Puppeteer...');
        browser = await puppeteer.launch({
            args: chromium.args,
            defaultViewport: chromium.defaultViewport,
            executablePath: await chromium.executablePath(),
            headless: chromium.headless
        });
        console.log('Browser launched successfully');

        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');

        await page.setRequestInterception(true);
        page.on('request', (req) => {
            if (['image', 'stylesheet', 'font', 'media'].includes(req.resourceType())) {
                req.abort();
            } else {
                req.continue();
            }
        });

        await page.goto('https://www.forbes.com/profile/elon-musk/?list=rtb/', {
            waitUntil: 'domcontentloaded',
            timeout: 60000
        });

        const netWorthText = await page.evaluate(() => {
            const netWorthElement = document.querySelector('.profile-info__item-value');
            return netWorthElement ? netWorthElement.textContent.trim() : '$343B';
        });

        await browser.close();
        const netWorthValue = parseFloat(netWorthText.replace(/[^0-9.]/g, ''));
        const netWorth = netWorthText.includes('B') ? netWorthValue * 1e9 : netWorthValue * 1e6;
        res.json({ netWorth });
    } catch (error) {
        console.error('Scraping error details:', error.stack);
        if (browser) await browser.close();
        res.json({ netWorth: 343000000000 });
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});