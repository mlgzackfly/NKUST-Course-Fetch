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
        console.log("送出 request...");
        const body = await request.get(url);
        const $ = cheerio.load(body);
        const yms_yms = $('select[id="yms_yms"] > option');
        for (let yms = 0; yms < yms_yms.length; yms++) {
            const yms_value = yms_yms.eq(yms).attr('value');
            const yms_name = yms_yms.eq(yms).text();
            // console.log(`${yms_value} : ${yms_name}`);

            const cmp_area_id = $('select[id="cmp_area_id"] > option');
            for (let cmp = 2; cmp < cmp_area_id.length; cmp++) {
                const cmp_value = cmp_area_id.eq(cmp).attr('value');
                const cmp_area = cmp_area_id.eq(cmp).text();
                // console.log(`${cmp_value} : ${cmp_area}`);
                const dgr_id = $('select[id="dgr_id"] > option');
                for (let dgr = 1; dgr < dgr_id.length; dgr++) {
                    const dgr_value = dgr_id.eq(dgr).attr('value');
                    const dgr_name = dgr_id.eq(dgr).text();
                    // console.log(`${dgr_value} : ${dgr_name}`);
                    await fetchUntiId(yms_value, cmp_value, dgr_value);
                    await sleep(1000);
                }
            }
        }
        console.log("完成！！");
    } catch (error) {
        console.error(error);
    }
}

async function fetchUntiId(yms_yms, cmp_area_id, dgr_id) {
    try {
        const exists = await promisify(fs.exists)("./dict");
        console.log(exists ? "資料夾存在" : fs.mkdirSync(`./dist/${yms_yms}`, { recursive: true }));
        const body = await request.post(url, {
            form: {
                'yms_yms': yms_yms,
                'cmp_area_id': cmp_area_id,
                'dgr_id': dgr_id,
            },
        });
        const $ = cheerio.load(body);
        const unt_id = $('select[id="unt_id"] > option');
        for (let unt = 1; unt < unt_id.length; unt++) {
            const unt_value = unt_id.eq(unt).attr('value');
            const unt_name = unt_id.eq(unt).text();
            await fetchCourse(yms_yms, cmp_area_id, dgr_id, unt_value);
            await sleep(1000);
        }
    } catch (error) {
        console.error(error);
    }
}

async function fetchCourse(yms_yms, cmp_area_id, dgr_id, unt_value) {
    try {
        const body = await request.post(url, {
            form: {
                'yms_yms': yms_yms,
                'cmp_area_id': cmp_area_id,
                'dgr_id': dgr_id,
                'unt_id': unt_value,
                'clyear': "%",
                'week': "%",
                'period': "%",
                'sub_name': "",
                'teacher': "",
                'reading': "reading",
            },
        });
        const $ = cheerio.load(body);
        const form = $('[name=thisform] tbody tr');
        const array = [];
        for (let i = 2; i < form.length; i++) {
            const code = form.eq(i).children("td").eq(0).html().replace("&nbsp;", "");
            const cmp = form.eq(i).children("td").eq(1).html().replace("&nbsp;", "");
            const dgr = form.eq(i).children("td").eq(2).html().replace("&nbsp;", "");
            const unt = form.eq(i).children("td").eq(3).html().replace("&nbsp;", "");
            const className = form.eq(i).children("td").eq(4).html().replace("&nbsp;", "");
            const foreverID = form.eq(i).children("td").eq(6).html().replace("&nbsp;", "");
            const courseName = form.eq(i).children("td").eq(7).html().replace("&nbsp;", "");
            const hours = form.eq(i).children("td").eq(8).html().replace("&nbsp;", "");
            const units = form.eq(i).children("td").eq(9).html().replace("&nbsp;", "");
            const required = form.eq(i).children("td").eq(11).html().replace("&nbsp;", "");
            const instructors = form.eq(i).children("td").eq(12).html().replace("&nbsp;", "");
            const position = form.eq(i).children("td").eq(13).html().replace("&nbsp;", "");
            const people = form.eq(i).children("td").eq(14).html().replace("&nbsp;", "");
            const maxpeople = form.eq(i).children("td").eq(15).html().replace("&nbsp;", "");
            const time = form.eq(i).children("td").eq(16).html().replace("&nbsp;", "");
            const english = form.eq(i).children("td").eq(17).html().replace("&nbsp;", "");
            const remote = form.eq(i).children("td").eq(18).html().replace("&nbsp;", "");
            const href = form.eq(i).children("td").eq(19).attr("onclick").substring(9, form.eq(i).children("td").eq(19).attr("onclick").length - 2).split("','");
            const note = form.eq(i).children("td").eq(20).html().replace("&nbsp;", "");
            let courseDetail =await fetchCourseDetail(href[0],href[1],href[2])
            array.push({ code, cmp, dgr, unt, className, foreverID, courseName, hours, units, required, instructors, position, people, maxpeople, time, english, remote, href, note, courseDetail});
        }
        const jsonData = JSON.stringify(array, null, 2);
        fs.writeFileSync(`./dist/${yms_yms}/${unt_value}.json`, jsonData);
    } catch (error) {
        console.error(error);
    }
}

async function fetchCourseDetail(schoolYear,semester,arg04,ok="outsidein"){
    try {
        const array = []
        const body = await request.post(courseDetailUrl, {
            headers: {
                'Referer': url,
            },
            form: {
                'arg01': schoolYear,
                'arg02': semester,
                'arg04': arg04,
                'ok': 'outsidein'
            },
        });
        const $ = cheerio.load(body);
        const techObjCn = $('body > table:nth-child(2) > tbody > tr:nth-child(2) > td > table > tbody > tr:nth-child(2) > td').text()
        const techObjEn = $('body > table:nth-child(2) > tbody > tr:nth-child(3) > td > table > tbody > tr:nth-child(2) > td').text()
        const descriptCn = $('body > table:nth-child(2) > tbody > tr:nth-child(4) > td > table > tbody > tr:nth-child(2) > td').text()
        const descriptEn = $('body > table:nth-child(2) > tbody > tr:nth-child(5) > td > table > tbody > tr:nth-child(2) > td').text()
        const coreAbilityCn = []
        const coreAbilityRowsCn = $('body > table:nth-child(2) > tbody > tr:nth-child(6) > td > table:nth-child(2)')
        const coreAbilitytrsCn = coreAbilityRowsCn.find('tr');
        coreAbilitytrsCn.each((index, element) => {
            if (index % 2 === 1) {
                const tds = $(element).find('td');
                const coreAbilityNameCn = $(tds[1]).text().trim();
                const coreAbilityPercentCn = $(tds[2]).text().trim();
                const courseDataCn = {
                    coreAbilityNameCn: coreAbilityNameCn,
                    coreAbilityPercentCn: coreAbilityPercentCn
                }
                coreAbilityCn.push(courseDataCn)
            }
        })
        const coreAbilityEn = []
        const coreAbilityRowsEn = $('body > table:nth-child(2) > tbody > tr:nth-child(7) > td > table:nth-child(2)')
        const coreAbilitytrsEn = coreAbilityRowsEn.find('tr');
        coreAbilitytrsEn.each((index, element) => {
            if (index % 2 === 1) {
                const tds = $(element).find('td');
                const coreAbilityNameEn = $(tds[1]).text().trim();
                const coreAbilityPercentEn = $(tds[2]).text().trim();
                const courseDataEn = {
                    coreAbilityNameEn: coreAbilityNameEn,
                    coreAbilityPercentEn: coreAbilityPercentEn
                }
                coreAbilityEn.push(courseDataEn)
            }
        })
        const textBook = []
        const textBookRows = $('body > table:nth-child(2) > tbody > tr:nth-child(8) > td > table:nth-child(2)')
        const textBooktrs = textBookRows.find('tr');
        let name, author, press, date;
        textBooktrs.each((index, element) => {
            const tds = $(element).find('td');

            switch (index) {
                case 0:
                    name = $(tds[1]).text().trim();
                    break;
                case 1:
                    author = $(tds[0]).text().trim();
                    break;
                case 2:
                    press = $(tds[0]).text().trim();
                    break;
                case 3:
                    date = $(tds[0]).text().trim();
                    break;
                default:
                    break;
            }
        });
        const textBookData = {
            name: name,
            author: author,
            press: press,
            date: date,
        };
        textBook.push(textBookData);
        const referenceBook = []
        const referenceBookRows = $('body > table:nth-child(2) > tbody > tr:nth-child(9) > td > table:nth-child(2)')
        const referenceBooktrs = referenceBookRows.find('tr');

        referenceBooktrs.each((index, element) => {
            const tds = $(element).find('td');

            switch (index) {
                case 0:
                    name = $(tds[1]).text().trim();
                    break;
                case 1:
                    author = $(tds[0]).text().trim();
                    break;
                case 2:
                    press = $(tds[0]).text().trim();
                    break;
                case 3:
                    date = $(tds[0]).text().trim();
                    break;
                default:
                    break;
            }
        });
        const referenceBookData = {
            name: name,
            author: author,
            press: press,
            date: date,
        };
        referenceBook.push(referenceBookData);
        const schedule = []
        const scheduleRows = $('body > table:nth-child(2) > tbody > tr:nth-child(10) > td > table:nth-child(2)')
        const scheduletrs = scheduleRows.find('tr');
        scheduletrs.each((index, element) => {
            if (index % 2 === 1) {
                const tds = $(element).find('td');
                const Items = $(tds[0]).text().trim();
                const ContentCn = $(tds[1]).text().trim();
                const ContentEn = $(tds[2]).text().trim();
                const assignedClasses = $(tds[3]).text().trim();
                const Note = $(tds[4]).text().trim();
                const scheduleData = {
                    Items: Items,
                    ContentCn: ContentCn,
                    ContentEn: ContentEn,
                    assignedClasses: assignedClasses,
                    Note: Note,
                }
                schedule.push(scheduleData)
            }
        })
        const evalMethodCn = $('body > table:nth-child(2) > tbody > tr:nth-child(11) > td > table > tbody > tr:nth-child(2) > td').text()
        const evalMethodEn = $('body > table:nth-child(2) > tbody > tr:nth-child(12) > td > table > tbody > tr:nth-child(2) > td').text()

        const requirementsCn = $('body > table:nth-child(2) > tbody > tr:nth-child(13) > td > table > tbody > tr:nth-child(2) > td').text()
        const requirementsEn = $('body > table:nth-child(2) > tbody > tr:nth-child(14) > td > table > tbody > tr:nth-child(2) > td').text()
        const SDGs = $('body > table:nth-child(2) > tbody > tr:nth-child(15) > td > table > tbody > tr:nth-child(2) > td').text()

        array.push({
            techObjCn,
            techObjEn,
            descriptCn,
            descriptEn,
            coreAbilityCn,
            coreAbilityEn,
            textBook,
            referenceBook,
            schedule,
            evalMethodCn,
            evalMethodEn,
            requirementsCn,
            requirementsEn,
            SDGs
        })
        return array
    } catch (error) {
        console.error(error);
    }
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
    await fetchList();
}

main();
