import { exec } from 'child_process';
import { ImageHandler } from './imageHandler';

export class CommandRunner {
    static async filterImage() {
        let promise = new Promise<any>((resolve, reject) => {
            exec('python3 src/processing/process.py ' + ImageHandler.PATH, (err, stdout, stderr) => {
                if (err) {
                    console.log(err);
                    reject('Python script exited with an error');
                }
                console.log('executed python script');
                if (stdout.length > 0)
                    console.log('output:\n', stdout);
                if (stderr.length > 0)
                    console.log('stderr:\n', stderr);
                resolve();
            });
        });
        return await promise;
    }
}
