import fetch from 'node-fetch';
import { DownloaderHelper } from 'node-downloader-helper';
import fs from 'fs';

const main = async (course) => {
    fetch('http://125.22.54.221:8080/jspui/browse?type=author&value=' + course + "&sort_by=1&order=ASC&rpp=100&etal=0&submit_browse=Update")
    .then(res => res.text())
    .then(code => {
        const matches = code.toString().match(/<td headers="t2" ><a href="(.*?)"/g);
        matches.forEach(async link => {
            fetch('http://125.22.54.221:8080' + link.split(`<a href="`)[1].split(`"`)[0])
            .then(res => res.text())
            .then(content => {
                const year = content.split(`name="citation_date" content=`)[1].split(`"`)[1];
                if(!fs.existsSync("PYQs_" + course + "/" + year)){
                    fs.mkdirSync("PYQs_" + course + "/" + year);
                }else{
                    const name = "PYQs_" + course + "/" + year;
                    let i = 0;
                    while(fs.existsSync(name + "_" + i)){
                        i++;
                    }
                    fs.mkdirSync(name + "_" + i);
                }
                const contentMatches = content.match(/<a target="_blank" href="(.*?)"/g);
                contentMatches.forEach(link => {
                    const downloadLink = ('http://125.22.54.221:8080' + link.split(`href="`)[1].split(`"`)[0]);
                    if(downloadLink.includes(".pdf") || downloadLink.includes(".rar") || downloadLink.includes(".doc") || downloadLink.includes(".docx")){
                        const dl = new DownloaderHelper(downloadLink, './' + "PYQs_" + course + "/" + year + '/');

                        dl.on('end', () => console.log('Download Completed'));
                        dl.on('error', (err) => console.log('Download Failed', err));
                        dl.start().catch(err => console.error(err));
                    }
                });
            })
            .catch(err => console.log(err))
        })
    })
    .catch(err => console.log(err));
}

const course = process.argv.slice(2).join('+').toLocaleUpperCase();
if(!course){
    console.log("Error: Run script with arguments")
}else{
    console.log("Downloading " + course)
    fs.mkdirSync("PYQs_" + course)
    await main(course);
}