class DomainModel {

    constructor(url){
        this.url = url;
        this.pages = [];
    }

    setPage(page){
        this.pages.push(page);
    }

    removePage(page){
        let index = this.pages.indexOf(page);
        if(index != -1){
            this.pages.splice(index, 1);
        }
    }

    isEmpty(){
        return this.pages.length == 0;
    }
}

module.exports = DomainModel;