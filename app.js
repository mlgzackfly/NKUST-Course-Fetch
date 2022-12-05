const request = require('request');
const cheerio = require('cheerio');
const fs = require('fs');
const jsonfile = require('jsonfile');


url ='https://webap0.nkust.edu.tw/nkust/ag_pro/ag202.jsp?'
process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';

async function fetchList() {
    console.log("送出 request...")
    request.get(url,
        {
            method: 'GET',
    },async function (err, res, body) {
            // console.log(err)
            // console.log(res)
            const $ = cheerio.load(body);
            const yms_yms = $('select[id="yms_yms"] > option');
            for (var yms = 0; yms < yms_yms.length; yms++) {
                var yms_value = yms_yms.eq(yms).attr('value');
                var yms_name = yms_yms.eq(yms).text();
                console.log(`${yms_value} : ${yms_name}`);

                const cmp_area_id = $('select[id="cmp_area_id"] > option');
                for (var cmp = 2; cmp < cmp_area_id.length; cmp++) {
                    var cmp_value = cmp_area_id.eq(cmp).attr('value')
                    var cmp_area = cmp_area_id.eq(cmp).text()
                    console.log(`${cmp_value} : ${cmp_area}`);
                    const dgr_id = $('select[id="dgr_id"] > option');
                    for (var dgr = 1; dgr < dgr_id.length; dgr++) {
                        var dgr_value = dgr_id.eq(dgr).attr('value')
                        var dgr_name = dgr_id.eq(dgr).text()
                        console.log(`${dgr_value} : ${dgr_name}`);
                        fetchUntiId(yms_value, cmp_value, dgr_value)
                        await sleep(1000)
                    }
                }
            }

        });
    console.log("完成！！")
}

function fetchUntiId(yms_yms,cmp_area_id,dgr_id) {
    fs.exists("./dict", function(exists) {
        console.log(exists ? console.log("資料夾存在") : fs.mkdirSync(`./dist/${yms_yms}`, { recursive: true }) );
    });
    // console.log(`yms : ${yms_yms}, cmp : ${cmp_area_id}, dgr : ${dgr_id}`)
    request.post(url,
        {
            form:
                {
                    'yms_yms': yms_yms,
                    'cmp_area_id': cmp_area_id,
                    'dgr_id':dgr_id,
                },

    },async function (err, res, body) {
            try {
                // console.log("取得 UnitID :")
                const $ = cheerio.load(body);
                const unt_id = $('select[id="unt_id"] > option');
                for (let unt = 1; unt < unt_id.length; unt++) {
                    let unt_value = unt_id.eq(unt).attr('value');
                    let unt_name = unt_id.eq(unt).text()
                    // console.log(`yms_yms : ${yms_yms}, cmp : ${cmp_area_id}, dgr : ${dgr_id} , ${unt_value} : ${unt_name}`)

                    await fetchCourse(yms_yms, cmp_area_id, dgr_id, unt_value)
                    await sleep(1000)
                    // console.log(`${unt_value} : ${unt_name}`);
                }
                // jsonfile.writeFileSync(`./dist/${yms_yms}.json`, writeJson);
            } catch (e) {
                // console.log(e);
            }
        }
    )
}

async function fetchCourse(yms_yms,cmp_area_id,dgr_id,unt_value) {
    // console.log(`yms : ${yms_yms}, cmp : ${cmp_area_id}, dgr : ${dgr_id}, unt : ${unt_value}`)
    request.post({url,
        form : {
            "yms_yms": yms_yms,
            "cmp_area_id": cmp_area_id,
            "dgr_id": dgr_id,
            "unt_id": unt_value,
            "clyear":"%",
            "week":"%",
            "period":"%",
            "sub_name":"",
            "teacher":"",
            "reading":"reading"
        }
    },function (err,res,body) {
       try {
           console.log(err)
           let array = []
           const $ = cheerio.load(body);
           const form = $('[name=thisform] tbody tr')
           for (let i =2; i< form.length; i++){
               console.log("====================")
               let code = form.eq(i).children("td").eq(0).html().replace("&nbsp;", "")
               let cmp =  form.eq(i).children("td").eq(1).html().replace("&nbsp;", "")
               let dgr =  form.eq(i).children("td").eq(2).html().replace("&nbsp;", "")
               let unt = form.eq(i).children("td").eq(3).html().replace("&nbsp;", "")
               let className = form.eq(i).children("td").eq(4).html().replace("&nbsp;", "")
               let foreverID = form.eq(i).children("td").eq(6).html().replace("&nbsp;", "")
               let courseName = form.eq(i).children("td").eq(7).html().replace("&nbsp;", "")
               let hours = form.eq(i).children("td").eq(8).html().replace("&nbsp;", "")
               let units = form.eq(i).children("td").eq(9).html().replace("&nbsp;", "")
               let required = form.eq(i).children("td").eq(11).html().replace("&nbsp;", "")
               let instructors = form.eq(i).children("td").eq(12).html().replace("&nbsp;", "")
               let position = form.eq(i).children("td").eq(13).html().replace("&nbsp;", "")
               let people = form.eq(i).children("td").eq(14).html().replace("&nbsp;", "")
               let maxpeople = form.eq(i).children("td").eq(15).html().replace("&nbsp;", "")
               let time = form.eq(i).children("td").eq(16).html().replace("&nbsp;", "")
               let english = form.eq(i).children("td").eq(17).html().replace("&nbsp;", "")
               let remote = form.eq(i).children("td").eq(18).html().replace("&nbsp;", "")
               let href = form.eq(i).children("td").eq(19).attr("onclick").substring(9,form.eq(i).children("td").eq(19).attr("onclick").length - 2).split("','")
               let note = form.eq(i).children("td").eq(20).html().replace("&nbsp;", "")
               array.push(Object.assign({code,cmp,dgr,unt,className,foreverID,courseName,hours,units,required,instructors,position,people,maxpeople,time,english,remote,href,note}));
               console.log(array)
           }
           jsonfile.writeFileSync(`./dist/${yms_yms}/${unt_value}.json`, JSON.stringify(array));
       } catch (e) {

       }
    })
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function main() {
    fetchList();
}

main();
