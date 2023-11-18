import { launch } from "puppeteer";
import fs from "fs";

const superset_url = "https://app.joinsuperset.com/students/jobprofiles";
const superset_username = "YOUR_USERNAME";
const superset_password = "YOUR_PASSWORD";

async function run() {
    const browser = await launch({
        headless: false,
        defaultViewport: null,
        args: ["--start-maximized"],
    });
    const page = await browser.newPage();
    await page.goto(superset_url, { waitUntil: "networkidle2" });

    let inputs = await page.$$(`.css-1o6z5ng`);

    await inputs[0].type(superset_username);
    await inputs[1].type(superset_password);
    await page.click('button[type="submit"]');

    // Wait for the elements with class .css-w96w9x to be present
    await page.waitForSelector(".css-w96w9x");

    // Now try to select the elements
    let jobs = await page.$$(`.css-1goof65`);

    let job_data = [];

    let counter = 0;

    for (let i = 0; i < jobs.length; i++) {
        console.log("Job " + counter++);
        let job = jobs[i];

        let currentjob = {};

        // Click on the job division

        await new Promise((resolve) => setTimeout(resolve, 20000));

        // wait for the job details to be present
        await page.waitForSelector(".css-1o88tww");
        // get the job details
        let jobname = await page.$$(".css-1o88tww");
        for (let i = 0; i < jobname.length; i++) {
            currentjob["name"] = await jobname[i].evaluate(
                (node) => node.innerText
            );
        }

        // wait for the job details to be present
        await page.waitForSelector(".css-1lk8o79");
        // get the job details
        let jobdetails = await page.$$(".css-1lk8o79");
        currentjob["companyName"] = await jobdetails[0].evaluate(
            (node) => node.innerText
        );
        currentjob["companyLocation"] = await jobdetails[1].evaluate(
            (node) => node.innerText
        );
        currentjob["companyType"] = await jobdetails[2].evaluate(
            (node) => node.innerText
        );

        let jobdescription = [];
        // wait for the job details to be present
        await page.waitForSelector(".css-1uc3zia");
        // get the job details
        let jobdesc = await page.$$(".css-1uc3zia");
        for (let i = 0; i < jobdesc.length; i++) {
            jobdescription.push(
                await jobdesc[i].evaluate((node) => node.innerText)
            );
        }

        currentjob["jobDescription"] = jobdescription;
        await job.evaluate((b) => b.click());

        job_data.push(currentjob);
    }

    // save the data
    fs.writeFile(
        "superset.json",
        JSON.stringify(job_data, null, 2),
        function (err) {
            if (err) throw err;
            console.log("Saved!");
        }
    );
}

run();
