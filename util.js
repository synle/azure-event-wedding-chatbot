// funcs
function getRandomItem(list) {
    return list[Math.floor(Math.random() * (list.length -1))];
}

function getRandomPosInteger(max) {
    return getRandomFromRange(1, max);
}

function getRandomFromRange(min, max) {
    return Math.floor(Math.random() * (max - min) + min);
}

function getRandomPhoneNumber(){
    var resp = '';
    for (var i = 0; i < 10; i++){
        resp += getRandomFromRange(0,9)
    }
    return resp;
}


module.exports = {
    getRandomItem,
    getRandomPosInteger,
    getRandomFromRange,
    getRandomPhoneNumber,
}
