const moment=require('moment');
function fromatmessage(username,text)
{
    return {
        username,
        text,
        time:moment().format('H:mm')
    };
}
module.exports={
    fromatmessage
}