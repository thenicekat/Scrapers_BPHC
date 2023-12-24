import fetch from "node-fetch";
import { DownloaderHelper } from "node-downloader-helper";
import fs from "fs";

const main = async (course) => {
    const url = encodeURI(
        "http://125.22.54.221:8080/jspui/simple-search?location=%2F&query=&rpp=10&sort_by=score&order=desc&filter_field_1=author&filter_type_1=contains&filter_value_1=" +
            course
    );
    fetch(url)
        .then((res) => res.text())
        .then((code) => {
            const matches = code
                .toString()
                .match(/<td headers="t2" ><a href="(.*?)"/g);
            if (matches == null) {
                console.log(url);
                console.log("No matches found");
                fs.rmdirSync("PYQs_" + course);
            } else {
                matches.forEach(async (link) => {
                    fetch(
                        "http://125.22.54.221:8080" +
                            link.split(`<a href="`)[1].split(`"`)[0]
                    )
                        .then((res) => res.text())
                        .then((content) => {
                            const year = content
                                .split(`name="citation_date" content=`)[1]
                                .split(`"`)[1];
                            // check if year if of format 20XX or 20XX-05
                            if (year.length != 4 && year.length != 7) {
                                console.log("Error in year: " + year);
                                return;
                            }
                            // If year is of format 20XX-05, take only 20XX and subtract 1
                            if (year.length == 7) {
                                year = year.slice(0, 4);
                            }
                            // subtract 1 from year
                            year = parseInt(year) - 1;
                            if (!fs.existsSync("PYQs_" + course + "/" + year)) {
                                fs.mkdirSync("PYQs_" + course + "/" + year);
                            } else {
                                const name = "PYQs_" + course + "/" + year;
                                let i = 0;
                                while (fs.existsSync(name + "_" + i)) {
                                    i++;
                                }
                                fs.mkdirSync(name + "_" + i);
                            }
                            const contentMatches = content.match(
                                /<a target="_blank" href="(.*?)"/g
                            );
                            contentMatches.forEach((link) => {
                                const downloadLink =
                                    "http://125.22.54.221:8080" +
                                    link.split(`href="`)[1].split(`"`)[0];
                                if (
                                    downloadLink
                                        .toLowerCase()
                                        .includes(".pdf") ||
                                    downloadLink
                                        .toLowerCase()
                                        .includes(".rar") ||
                                    downloadLink
                                        .toLowerCase()
                                        .includes(".doc") ||
                                    downloadLink.toLowerCase().includes(".docx")
                                ) {
                                    const dl = new DownloaderHelper(
                                        downloadLink,
                                        "./" +
                                            "PYQs_" +
                                            course +
                                            "/" +
                                            year +
                                            "/"
                                    );

                                    dl.on("end", () =>
                                        console.log("Download Completed")
                                    );
                                    dl.on("error", (err) =>
                                        console.log("Download Failed", err)
                                    );
                                    dl.start().catch((err) =>
                                        console.error(err)
                                    );
                                } else {
                                    console.log(
                                        "Unsupported File Type: " + downloadLink
                                    );
                                }
                            });
                        })
                        .catch((err) => console.log(err));
                });
            }
        })
        .catch((err) => console.log(err));
};

const course = process.argv.slice(2).join("+").toLocaleUpperCase();
if (!course) {
    console.log("Error: Run script with arguments");
} else {
    console.log("Downloading " + course);
    fs.mkdirSync("PYQs_" + course);
    await main(course);
}
