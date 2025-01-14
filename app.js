const request = require('request-promise');
const cheerio = require('cheerio');
const fs = require('fs');
const jsonfile = require('jsonfile');
const { promisify } = require('util');

const url = 'https://webap0.nkust.edu.tw/nkust/ag_pro/ag202.jsp';
const courseDetailUrl = 'https://webap0.nkust.edu.tw/nkust/ag_pro/ag064_print.jsp';
process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';

async function fetchList() {
    try {
        console.log("Sending request...");
        const body = await request.get(url);
        const $ = cheerio.load(body);
        const ymsOptions = $('select[id="yms_yms"] > option').map((_, el) => ({
            value: $(el).attr('value'),
            text: $(el).text()
        })).get();

        const cmpOptions = $('select[id="cmp_area_id"] > option').slice(2).map((_, el) => ({
            value: $(el).attr('value'),
            text: $(el).text()
        })).get();

        const dgrOptions = $('select[id="dgr_id"] > option').slice(1).map((_, el) => ({
            value: $(el).attr('value'),
            text: $(el).text()
        })).get();

        for (const yms of ymsOptions) {
            for (const cmp of cmpOptions) {
                for (const dgr of dgrOptions) {
                    await fetchUnitId(yms.value, cmp.value, dgr.value);
                }
            }
        }
        console.log("Done!");
    } catch (error) {
        console.error(error);
    }
}

async function fetchUnitId(yms, cmp, dgr) {
    try {
        const body = await request.post(url, {
            form: { yms_yms: yms, cmp_area_id: cmp, dgr_id: dgr },
        });
        const $ = cheerio.load(body);
        const units = $('select[id="unt_id"] > option').slice(1).map((_, el) => $(el).attr('value')).get();

        await Promise.all(units.map(async unit => {
            await fetchCourse(yms, cmp, dgr, unit);
        }));
    } catch (error) {
        console.error(error);
    }
}

async function fetchCourse(yms, cmp, dgr, unit) {
    try {
        const body = await request.post(url, {
            form: {
                yms_yms: yms,
                cmp_area_id: cmp,
                dgr_id: dgr,
                unt_id: unit,
                clyear: "%",
                week: "%",
                period: "%",
                sub_name: "",
                teacher: "",
                reading: "reading",
            },
        });
        const $ = cheerio.load(body);
        const rows = $('[name=thisform] tbody tr').slice(2);

        const data = rows.map((_, row) => {
            const cells = $(row).children("td");
            const href = cells.eq(19).attr("onclick").match(/'(.*?)'/g).map(s => s.replace(/'/g, ''));
            return {
                code: cells.eq(0).text().trim(),
                cmp: cells.eq(1).text().trim(),
                dgr: cells.eq(2).text().trim(),
                unt: cells.eq(3).text().trim(),
                className: cells.eq(4).text().trim(),
                foreverID: cells.eq(6).text().trim(),
                courseName: cells.eq(7).text().trim(),
                hours: cells.eq(8).text().trim(),
                units: cells.eq(9).text().trim(),
                required: cells.eq(11).text().trim(),
                instructors: cells.eq(12).text().trim(),
                position: cells.eq(13).text().trim(),
                people: cells.eq(14).text().trim(),
                maxpeople: cells.eq(15).text().trim(),
                time: cells.eq(16).text().trim(),
                english: cells.eq(17).text().trim(),
                remote: cells.eq(18).text().trim(),
                href,
                note: cells.eq(20).text().trim(),
            };
        }).get();

        const directory = `./dist/${yms}`;
        fs.mkdirSync(directory, { recursive: true });
        fs.writeFileSync(`${directory}/${unit}.json`, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error(error);
    }
}

async function main() {
    await fetchList();
}

main();
