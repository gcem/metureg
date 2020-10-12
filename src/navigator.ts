import fs from 'fs';
import path from 'path';
import { WebDriver, By, until, WebElement, ThenableWebDriver, WebElementPromise, TargetLocator, Key } from 'selenium-webdriver';
import { ImageHandler } from './imageHandler';
import { Credentials } from './models/credentials';
import { Utils } from './utils';

export class Navigator {
    private credentials: Credentials;

    constructor(
        private driver: WebDriver,
        private img: ImageHandler) {
        this.credentials = JSON.parse(fs.readFileSync(path.join(__dirname, '../credentials.json')).toString('ascii'));
        console.log('username:', this.credentials.username);
    }

    async login(timeout: number) {
        const containerFrame$ = this.driver.wait(until.elementLocated(By.css('iframe#container')), timeout);
        const loginButton$ = this.driver.wait(until.elementLocated(By.css('button[title^="Sign"]')), timeout);
        const raceResult = await Promise.race([containerFrame$, loginButton$]);
        if (!(await raceResult.getAttribute('title') || '').startsWith('Sign'))
            return;
        const loginButton = raceResult;
        const usernameInput = await this.driver.wait(until.elementLocated(By.id('textUsername')));
        const passwordInput = await this.driver.wait(until.elementLocated(By.id('textPassword')));
        await usernameInput.sendKeys(this.credentials.username);
        await passwordInput.sendKeys(this.credentials.password);
        await Utils.delay(1000);
        await loginButton.click();
    }

    async openPage() {
        await this.driver.get('https://student.metu.edu.tr/');
        const progLink = await this.driver.wait(until.elementLocated(By.css('[data-prog="158"]')));
        await progLink.click();
        this.login(60000);
        await this.queryLoop();
    }

    async queryLoop() {
        let rows: WebElement[] = [];

        this.driver.switchTo().frame(await this.driver.wait(until.elementLocated(By.css('iframe#container'))));
        // this loop ends when a correct captcha is found
        while (true) {
            const submitButton = await this.driver.wait(until.elementLocated(By.name('submit_search')), 60000);
            const captchaElem = await this.driver.wait(until.elementLocated(By.css('img[src^="image.php?"]')));
            await Utils.delay(1000);
            const code = await this.recognize(captchaElem);
            const courseCodeInput = await this.driver.findElement(By.id('text_course_code'));
            const captchaInput = await this.driver.findElement(By.id('text_img_number'));
            await courseCodeInput.clear();
            await captchaInput.clear();
            await courseCodeInput.sendKeys('5670445');
            await captchaInput.sendKeys(code, Key.ENTER);
            // await Utils.delay(1000);
            // await submitButton.click();
            await Utils.delay(1000);
            rows = await this.driver.wait(until.elementsLocated(By.css('table > tbody > tr')), 10000)
                .catch(reason => { console.log('Recognition failed. Will try again'); return []; });
            if (rows.length)
                break;
        }
        for (let row of rows) {
            const columns = await row.findElements(By.css('td')).catch((reason): WebElement[] => []);
            if (columns.length < 3)
                continue;
            const section = Number(await columns[0].getText());
            const capacity = Number(await columns[columns.length - 2].getText());
            const used = Number(await columns[columns.length - 1].getText());
            console.log('Section:', section, '\tCapacity:', capacity, '\tUsed:', used);
            if (used < capacity)
                console.log('AVAILABLE!');
        }
    }

    async recognize(elem: WebElement): Promise<string> {
        // take a screenshot and save it
        const imageString = await elem.takeScreenshot();
        const image = ImageHandler.addPrefix(imageString);
        const fileName = await ImageHandler.saveImage(image, 'code.png');
        console.log('Saved image as', fileName);

        // use external filtering code to make the screenshot more readable
        await ImageHandler.filter();

        const chosen = this.img.recognizeCaptchas();
        return chosen;
    }
}