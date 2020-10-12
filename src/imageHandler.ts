import { createWorker } from 'tesseract.js';
import { CommandRunner } from "./commandRunner";
const base64image = require('base64-to-image');
const imagebase64 = require('image-to-base64');

export class ImageHandler {
    // path from environment variable IMAGES_PATH, or the
    // default path if this variable does not exist
    private static _PATH = process.env.IMAGES_PATH;
    static get PATH() {
        if (!ImageHandler._PATH) {
            ImageHandler._PATH = '../saved/';
            console.log('IMAGES_PATH variable does not exist. Using default path.');
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

    async recognizeCaptchas(): Promise<string> {
        const filteredImage = await ImageHandler.readImage('filtered.png');
        let resultf = await this.recognize(ImageHandler.addPrefix(filteredImage));
        console.log('Recognized text:', resultf.text.trim());
        console.log('Confidence:', resultf.confidence);

        const cleanedImage = await ImageHandler.readImage('cleaned.png');
        let resultc = await this.recognize(ImageHandler.addPrefix(cleanedImage));
        console.log('Recognized text:', resultc.text.trim());
        console.log('Confidence:', resultc.confidence);

        // choose the OCR result with higher confidence level
        const chosen: string = resultc.confidence < resultf.confidence ? resultf.text : resultc.text;
        console.log('Chosen captcha:', chosen);
        return chosen;
    }

    async recognize(image: string): Promise<any> {
        const { data: { text, confidence } } = await this.tesWorker.recognize(image);
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
        console.log('read image:', this.PATH + fileName);
        return await imagebase64(this.PATH + fileName);
    }
}
