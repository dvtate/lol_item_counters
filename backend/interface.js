

const teemo = require("../lol/teemo");
const db = require("./db");


/*
module.exports.itemStats =

{
    champid: {
        itemid: { w : ###, l: ### },
    }, ..
}

*/


module.exports.itemStats = {};
Object.keys(teemo.champNames).forEach(id => module.exports.itemStats[id] = {});


module.exports.getWr = (champ) => {
    if (champ) {
        return db.getWr(champ);
    } else {
        return db.getWrs();
    }
    return ret;
}




// called in matches.js
// this may need mutex a proper mutex...
let update_item_stats_mutex_lock = false; // javascript variables are atomic iirc...
module.exports.updateStats = match_data => {
    /* accepts
    {
        teams: [
            {
                "champid" : [items]
                "champid" : [items]
                "champid" : [items]
                "champid" : [items]
                "champid" : [items]
            }, {
                "champid" : [items]
                "champid" : [items]
                "champid" : [items]
                "champid" : [items]
                "champid" : [items]
            }
        ],
        win: 0/1, // index of winning team
    },
    or null if there is nothing to do/invalid match
    */

    if (!match_data)
        return;
    //console.log("updating match data");

    // only one win/loss per game
    let update_item = (champ, item, win) => {
        if (!update_item_stats_mutex_lock) {
            update_item_stats_mutex_lock = true;
            let data = module.exports.itemStats[champ][item] || { w: 0, l: 0 };
            if (win)
                data.w++;
            else
                data.l++;
            module.exports.itemStats[champ][item] = data;
            update_item_stats_mutex_lock = false;
        } else {
            // wait 10ms for mutex lock to go away (hopefully)
            setTimeout(update_item, 10, champ, item, win);
        }
    };

    //Object.keys(match_data.teams[0]).forEach(c => console.log(c));
    //Object.keys(match_data.teams[1]).forEach(c => console.log(c));

    // update item stats for both teams

    Object.keys(match_data.teams[0]).forEach(achamp => {
        Object.keys(match_data.teams[1]).forEach(echamp =>
            match_data.teams[1][echamp].forEach(item =>
                update_item(achamp, item, match_data.win == 0)));
        db.updateWr(achamp, match_data.win == 1);
    });

    Object.keys(match_data.teams[1]).forEach(achamp => {
        Object.keys(match_data.teams[0]).forEach(echamp =>
            match_data.teams[0][echamp].forEach(item =>
                update_item(achamp, item, match_data.win == 1)));
        db.updateWr(achamp, match_data.win == 0);
    });

}
