const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const OUTPUT_DIR = path.join(__dirname, '..', 'ppt_assets');

if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function captureAll() {
    console.log("Launching Chrome...");
    const browser = await puppeteer.launch({
        executablePath: CHROME_PATH,
        headless: 'new',
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-gpu',
            '--window-size=1920,1080',
            '--hide-scrollbars'
        ]
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 2 });

    const URL = "https://portfolio-builder-one-brown.vercel.app/";
    console.log(`Navigating to ${URL}...`);
    await page.goto(URL, { waitUntil: 'networkidle2', timeout: 60000 });

    // Wait for animations and Three.js
    await new Promise(r => setTimeout(r, 4000));

    console.log("Capturing 1: Hero Dark...");
    await page.screenshot({
        path: path.join(OUTPUT_DIR, 'web_hero_dark.png'),
        clip: { x: 0, y: 0, width: 1920, height: 1050 }
    });

    console.log("Capturing 2: Floating Studio Editor Graphic...");
    await page.screenshot({
        path: path.join(OUTPUT_DIR, 'web_editor_mockup.png'),
        clip: { x: 850, y: 160, width: 1020, height: 750 }
    });

    console.log("Capturing 3: System Capabilities / Features Grid...");
    await page.evaluate(() => {
        const sections = document.querySelectorAll('section');
        if (sections.length > 1) {
            sections[1].scrollIntoView({ behavior: 'instant', block: 'start' });
        }
    });
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({
        path: path.join(OUTPUT_DIR, 'web_system_capabilities.png'),
        clip: { x: 0, y: 0, width: 1920, height: 1080 }
    });

    console.log("Capturing 4: The Deployment Pipeline...");
    await page.evaluate(() => {
        const sections = document.querySelectorAll('section');
        if (sections.length > 2) {
            sections[2].scrollIntoView({ behavior: 'instant', block: 'center' });
        }
    });
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({
        path: path.join(OUTPUT_DIR, 'web_deployment_pipeline.png'),
        clip: { x: 0, y: 0, width: 1920, height: 1080 }
    });

    console.log("Capturing 5: Auth & Setup Modal...");
    await page.evaluate(() => window.scrollTo(0, 0));
    await new Promise(r => setTimeout(r, 500));
    const initButtons = await page.$$('button');
    for (const btn of initButtons) {
        const text = await page.evaluate(el => el.textContent, btn);
        if (text && text.includes('Initialize Workspace')) {
            await btn.click();
            break;
        }
    }
    await new Promise(r => setTimeout(r, 1500));
    await page.screenshot({
        path: path.join(OUTPUT_DIR, 'web_auth_modal.png'),
        clip: { x: 0, y: 0, width: 1920, height: 1080 }
    });

    // Enter name to show step 2 details
    const nameInput = await page.$('input[name="name"]');
    if (nameInput) {
        await nameInput.type('M. Bharanidharan');
        await new Promise(r => setTimeout(r, 500));
        const continueBtn = await page.$('button[type="submit"]');
        if (continueBtn) {
            await continueBtn.click();
            await new Promise(r => setTimeout(r, 1500));
            await page.screenshot({
                path: path.join(OUTPUT_DIR, 'web_modal_step2.png'),
                clip: { x: 0, y: 0, width: 1920, height: 1080 }
            });
        }
    }

    // Close modal
    await page.keyboard.press('Escape');
    await new Promise(r => setTimeout(r, 1000));

    console.log("Capturing 6: Light Mode Hero...");
    const sunBtn = await page.$('button[title="Light Theme"]');
    if (sunBtn) {
        await sunBtn.click();
        await new Promise(r => setTimeout(r, 2000));
        await page.screenshot({
            path: path.join(OUTPUT_DIR, 'web_hero_light.png'),
            clip: { x: 0, y: 0, width: 1920, height: 1050 }
        });
    }

    console.log("Capturing 7: Mobile Viewport...");
    const mobilePage = await browser.newPage();
    await mobilePage.setViewport({ width: 420, height: 900, deviceScaleFactor: 2, isMobile: true });
    await mobilePage.goto(URL, { waitUntil: 'networkidle2', timeout: 60000 });
    await new Promise(r => setTimeout(r, 3000));
    await mobilePage.screenshot({
        path: path.join(OUTPUT_DIR, 'web_mobile_hero.png')
    });
    await mobilePage.close();

    console.log("Capturing 8: Full Page Capture...");
    await page.screenshot({
        path: path.join(OUTPUT_DIR, 'web_fullpage.png'),
        fullPage: true
    });

    console.log("All screenshots captured successfully!");
    await browser.close();
}

captureAll().catch(err => {
    console.error("Error during capture:", err);
    process.exit(1);
});
