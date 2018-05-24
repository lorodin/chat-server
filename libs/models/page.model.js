class PageModel {
    
    constructor(url){
        this.url = url;
        this.clients = [];
    }

    setClient(client){
        this.clients.push(client);
    }

    removeClient(client){
        let index = this.clients.indexOf(client);
        
        if(idnex == -1) return;

        this.clients.splice(index, 1);
    }

    getClients(){
        return this.clients;
    }

    hasClient(client){
        return this.clients.indexOf(client) != -1;
    }
}

module.exports = PageModel;