import { launch } from "puppeteer";
import fs from "fs";

async function run() {
    const browser = await launch({
        headless: false,
        defaultViewport: null,
        args: ["--start-maximized"],
    });

    const page = await browser.newPage();

    // Find maximum number of pages
    let allFaculties = [];
    let facultyDetails = [];
    let maxPage = 2;

    for (let i = 1; i <= maxPage; i++) {
        await page.goto(
            "https://www.bits-pilani.ac.in/faculty/page/" +
                i +
                "?&campus=hyderabad&department=humanities-and-social-sciences",
            {
                waitUntil: "networkidle2",
                waitUntil: "domcontentloaded",
            }
        );
        await page.waitForTimeout(4000);

        // simulate cursror scroll
        await page.evaluate(() => {
            window.scrollBy(0, window.innerHeight);
        });

        const faculty = await page.$$(".faculty-item");
        /// Find apply-btn acc_link for each faculty
        for (let i = 0; i < faculty.length; i++) {
            let facultyItem = faculty[i];
            // get a tag which is inside div tag which has class apply-btn
            let facultyLink = await facultyItem.$eval(
                ".apply-btn a",
                (node) => node.href
            );
            allFaculties.push(facultyLink);
        }
    }

    for (let i = 0; i < allFaculties.length; i++) {
        await page.goto(allFaculties[i], {
            waitUntil: "networkidle2",
            waitUntil: "domcontentloaded",
        });
        await page.waitForTimeout(4000);

        // We wait for faculty page to load then we get the details\
        let facultyInfo = await page.$$(".facuty-info");
        let facultyName = await page.$(".faculty-profile-txt");

        let facultyDetailsObject = {
            name: "",
            email: "",
            phone: "",
        };
        facultyDetailsObject.name = await facultyName.$eval("h2", (node) =>
            node.innerText.trim()
        );

        for (let i = 0; i < facultyInfo.length; i++) {
            let faculty = facultyInfo[i];
            let facultyDetails = await faculty.evaluate((node) =>
                node.innerText.trim()
            );
            if (facultyDetails.includes("@")) {
                facultyDetailsObject.email = facultyDetails.trim();
            }
            if (facultyDetails.includes("+") || facultyDetails.includes("40")) {
                facultyDetailsObject.phone = facultyDetails.trim();
            }
        }
        let secondaryNavbar = await page.$$(".sec_nav_a");
        if (secondaryNavbar == null) {
            facultyDetailsObject["profileStatus"] = "No Tabs Found";
        } else {
            facultyDetailsObject["profileStatus"] =
                secondaryNavbar.length + " Tabs Found";
        }
        let overview = await page.$(".ex_space");
        if (overview != null) {
            let overviewText = await overview.evaluate((node) =>
                node.innerText.trim()
            );
            facultyDetailsObject["overview"] = overviewText;
            if (overviewText == "") {
                facultyDetailsObject["overviewStatus"] = "No Overview Found";
            } else {
                facultyDetailsObject["overviewStatus"] = "Overview Found";
            }
        }
        facultyDetails.push(facultyDetailsObject);
    }

    // Write all this into cscv format
    let csv = "Name,Email,Phone,Profile Status,Overview Status\n";
    for (let i = 0; i < facultyDetails.length; i++) {
        let faculty = facultyDetails[i];
        csv += `${faculty.name},${faculty.email},${faculty.phone},${faculty.profileStatus},${faculty.overviewStatus}\n`;
    }

    // Write to file
    fs.writeFileSync("faculty.csv", csv);
    console.log("File written successfully");
}

run();
