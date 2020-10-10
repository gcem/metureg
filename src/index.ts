import { WebDriver, By, Browser, until, WebElement, Builder, promise } from 'selenium-webdriver';
import { Options } from 'selenium-webdriver/firefox';
import { createWorker } from 'tesseract.js';
import { exec } from 'child_process';
const base64image = require('base64-to-image');
const imagebase64 = require('image-to-base64');

class Navigator {
    constructor(
        private driver: WebDriver,
        private img: ImageHandler) { }

    async openPage() {
        await this.driver.get('http://localhost:4200/welcomeee');
        let image: string;
        await this.recognizeById('code');
    }

    async recognizeById(id: string) {
        const elem = await this.driver.wait(until.elementLocated(By.id(id)));
        const imageString = await elem.takeScreenshot();
        const image = ImageHandler.addPrefix(imageString);
        //const data = await this.img.recognize(image);
        //console.log(data);
        const fileName = await ImageHandler.saveImage(image, 'code.png');
        console.log('Saved image as', fileName);
        await ImageHandler.filter();
        const filteredImage = await ImageHandler.readImage('filtered.png');
        let resultf = await this.img.recognize(ImageHandler.addPrefix(filteredImage));
        console.log('Recognized text:', resultf.text.trim());
        console.log('Confidence:', resultf.confidence);
        const cleanedImage = await ImageHandler.readImage('cleaned.png');
        let resultc = await this.img.recognize(ImageHandler.addPrefix(cleanedImage));
        console.log('Recognized text:', resultc.text.trim());
        console.log('Confidence:', resultc.confidence);
    }
}

class ImageHandler {
    // path from environment variable IMAGES_PATH, or the
    // default path if this variable does not exist
    private static _PATH = process.env.IMAGES_PATH;
    static get PATH() {
        if (!ImageHandler._PATH) {
            ImageHandler._PATH = '../saved/';
            console.log('IMAGES_PATH variable does not exist. Using default path.')
        }
        if (!ImageHandler._PATH.endsWith('/'))
            ImageHandler._PATH += '/';
        return ImageHandler._PATH;
    }

    private tesWorker: Tesseract.Worker;

    private constructor() {
        this.tesWorker = createWorker();
    }

    static async build(): Promise<ImageHandler> {
        let handler = new ImageHandler();
        await handler.tesWorker.load();
        await handler.tesWorker.loadLanguage('eng');
        await handler.tesWorker.initialize('eng');
        await handler.tesWorker.setParameters({
            tessedit_char_whitelist: '0123456789'
        });
        return handler;
    }

    async destroy() {
        await this.tesWorker.terminate();
    }

    async recognize(image: string): Promise<any> {
        const { data: { text, confidence } } =
            await this.tesWorker.recognize(image);
        return { text: text.trim(), confidence };
    }

    static async filter() {
        await CommandRunner.filterImage();
    }

    static addPrefix(base64image: string): string {
        return 'data:image/png;base64,' + base64image;
    }

    static removePrefix(image: string): string {
        const split = image.split(',');
        return split[split.length - 1];
    }

    static async saveImage(image: string, fileName: string): Promise<string> {
        console.log('path:', this.PATH);
        const options = { 'fileName': fileName, 'type': 'png' };

        const imageInfo = await base64image(image, this.PATH, options);
        return imageInfo.fileName;
    }

    static async readImage(fileName: string): Promise<string> {
        console.log('read from path:', this.PATH);
        console.log('file:', fileName);
        return await imagebase64(this.PATH + fileName);
    }
}

class CommandRunner {
    static async filterImage() {
        let promise = new Promise<any>((resolve, reject) => {
            exec('python3 src/processing/process.py ' + ImageHandler.PATH, (err, stdout, stderr) => {
                if (err) {
                    console.log(err);
                    reject('Python script exited with an error')
                }
                console.log('executed python script');
                console.log('output:\n', stdout);
                console.log('stderr:\n', stderr);
                resolve();
            })
        });
        return await promise;
    }
}

(async () => {
    const driver = await new Builder().forBrowser(Browser.FIREFOX).build();
    try {
        const img = await ImageHandler.build();
        const nav = new Navigator(driver, img);
        await nav.openPage();
        await img.destroy();
    }
    finally {
        await driver.close();
    }
})();