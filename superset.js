import { launch } from "puppeteer";
import fs from "fs";
import "dotenv/config";

const superset_url = "https://app.joinsuperset.com/students/jobprofiles";
const superset_username = process.env.SUPERSET_USERNAME;
const superset_password = process.env.SUPERSET_PASSWORD;

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
        let job = jobs[i];
        await job.evaluate((b) => b.click());

        let currentjob = {};

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
        if (jobdetails.length >= 1)
            currentjob["companyName"] = await jobdetails[0].evaluate(
                (node) => node.innerText
            );
        if (jobdetails.length >= 2)
            currentjob["companyLocation"] = await jobdetails[1].evaluate(
                (node) => node.innerText
            );
        if (jobdetails.length >= 3)
            currentjob["companyType"] = await jobdetails[2].evaluate(
                (node) => node.innerText
            );

        console.log("Job " + counter++ + " " + currentjob["companyName"]);

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

        job_data.push(currentjob);

        // save the data
        fs.writeFile(
            "superset.json",
            JSON.stringify(job_data, null, 2),
            function (err) {
                if (err) throw err;
            }
        );
    }
}

run();
