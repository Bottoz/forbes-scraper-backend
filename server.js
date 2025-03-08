const express = require('express');
const puppeteer = require('puppeteer-core');
const chromium = require('@sparticuz/chromium');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 10000;

app.use(cors());

let cachedNetWorth = 343000000000; // Initial fallback

async function scrapeNetWorth() {
    let browser;
    try {
        browser = await puppeteer.launch({
            args: chromium.args,
            defaultViewport: chromium.defaultViewport,
            executablePath: await chromium.executablePath(),
            headless: chromium.headless
        });
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
        cachedNetWorth = netWorthText.includes('B') ? netWorthValue * 1e9 : netWorthValue * 1e6;
    } catch (error) {
        console.error('Scraping error:', error);
    } finally {
        if (browser) await browser.close();
    }
}

// Scrape every 5 minutes
scrapeNetWorth(); // Initial scrape
setInterval(scrapeNetWorth, 300000); // 5 minutes

app.get('/elon-net-worth-forbes', async (req, res) => {
    res.json({ netWorth: cachedNetWorth });
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});