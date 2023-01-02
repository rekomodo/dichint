async function getTwitchName(twitchChannel){
    const tmiClient = require('./tmiClient.js');

    return await tmiClient.join(twitchChannel)
    .then(data => {
        return data[0];
    }).catch(err => {
        console.log(err);
        return undefined;
    });
}

module.exports = getTwitchName;