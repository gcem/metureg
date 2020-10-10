import { Browser, WebElement, Builder } from 'selenium-webdriver';
import { ImageHandler } from './imageHandler';
import { Navigator } from './navigator';

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