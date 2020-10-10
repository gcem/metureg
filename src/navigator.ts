import { WebDriver, By, until } from 'selenium-webdriver';
import { ImageHandler } from './imageHandler';

export class Navigator {
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
