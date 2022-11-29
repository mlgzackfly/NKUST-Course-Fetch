const request = require('request');
const cheerio = require('cheerio');
url ='http://webap0.nkust.edu.tw/nkust/ag_pro/ag202.jsp?'

async function fetch() {
    request.get({
        url: url,
    },function (err,res,body){
        const $ = cheerio.load(body);
        const yms_yms = $('select[id="yms_yms"] > option');
        for (var yms = 0; yms<yms_yms.length; yms ++) {
            var yms_value = yms_yms.eq(yms).attr('value');
            var yms_name = yms_yms.eq(yms).text();
            console.log(`${yms_value} : ${yms_name}`);

            const cmp_area_id = $('select[id="cmp_area_id"] > option');
            for (var cmp = 1; cmp< cmp_area_id.length; cmp++) {
                var cmp_value = cmp_area_id.eq(cmp).attr('value')
                var cmp_area = cmp_area_id.eq(cmp).text()
                console.log(`${cmp_value} : ${cmp_area}`);
                const dgr_id = $('select[id="dgr_id"] > option');
                for (var dgr =1; dgr< dgr_id.length; dgr++) {
                    var dgr_value = dgr_id.eq(dgr).attr('value')
                    var dgr_name = dgr_id.eq(dgr).text()
                    console.log(`${dgr_value} : ${dgr_name}`);
                    // await sleep(1000);
                    FetchUntiId(yms_value,cmp_value,dgr_value)
                }
            }
        }

    });
}

function FetchUntiId(yms_yms,cmp_area_id,dgr_id) {
    console.log(`yms_yms : ${yms_yms}, cmp : ${cmp_area_id}, dgr : ${dgr_id}`)
    request.post(url,
        {
            form:
                {
                    'yms_yms': yms_yms,
                    'cmp_area_id': cmp_area_id,
                    'dgr_id':dgr_id,
                }
    },function (err, res,body) {
        try {
            const $ = cheerio.load(body);
            const unt_id = $('select[id="unt_id"] > option');
            for (let unt = 1; unt < unt_id.length; unt++) {
                let unt_value = unt_id.eq(unt).attr('value');
                let unt_name = unt_id.eq(unt).text()
                console.log(`${unt_value} : ${unt_name}`);
            }
        }
        catch (e) {
            console.log(e);
        }
        finally {
            // const $ = cheerio.load(body);
            // const unt_id = $('select[id="unt_id"] > option');
            // for (var unt =1; unt< unt_id.length; unt++) {
            //     var value = unt_id.eq(unt).attr('value')
            //     var name = unt_id.eq(unt).text()
            //     console.log(`${value} : ${name}`);
            // }
        }

        }
    )
}

function main() {
    fetch();
}

main();