import { Browser, WebElement, Builder } from 'selenium-webdriver';
import { ImageHandler } from './imageHandler';
import { Navigator } from './navigator';

async function trackMetuCourses() {
    const driver = await new Builder().forBrowser(Browser.FIREFOX).build();
    
    const img = await ImageHandler.build();
    const nav = new Navigator(driver, img);
    await nav.openPage();
    await img.destroy();
    // try {
    //     const img = await ImageHandler.build();
    //     const nav = new Navigator(driver, img);
    //     await nav.openPage();
    //     await img.destroy();
    // }
    // catch {
    //     await driver.close();
    // }
};

if (process.argv[process.argv.length - 1] == 'recognize')
    ImageHandler.build().then(async img => {
        await img.recognizeCaptchas();
        await img.destroy();
    });
else
    trackMetuCourses();