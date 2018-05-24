class ClientModel {
    constructor(){
        this.id = '';
        this.name = 'Guest';
        this.socket = null;
        this.time_z = 0;
    }

    setSocket(socket){
        this.socket = socket;
    }

    getSocket(){
        return this.socket;
    }

    setId(id){
        this.id = id;
    }

    getId(){
        return this.id;
    }

    setName(name){
        this.name = name;
    }

    getName(){
        return this.name;
    }
}

module.exports = ClientModel;