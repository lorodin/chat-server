class Responce{
    constructor(type, data, msg = null){
        this.type = type;
        this.data = data;
        this.msg = msg;
    }
}

module.exports = Responce;