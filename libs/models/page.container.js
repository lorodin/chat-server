const PageModel = require('./page.model');
const DomainModel = require('./domain.model');

class PageContainer{

    constructor(){
        this.pages = [];
        
        this.incorrectDomains = [];
        this.domains = [];
    }

    setInvalidDomains(invalidDomains){
        this.incorrectDomains = invalidDomains;
        console.log('New invalid domains');
        console.log(this.incorrectDomains);
    }

    clearUrl(url){
        let split = url.split("?");
        return split[0];
    }

    validUrl(url){
        if(!url.startsWith("http://") && !url.startsWith("https://")){
            return {
                status: false,
                msg: "Url not valid"
            };
        }
        
        let domain = this.getDomain(url);

        if(this.incorrectDomains.indexOf(domain) != -1){
            return {
                status: false,
                msg: "Url not valid, domain error"
            };
        }

        return { status : true };
    }

    getDomain(url){
        if(!url || url == '') return null;
        
        let split = url.replace('http://','')
                        .replace('https://', '')
                        .split('/');

        let d_name = split[0].replace('www.', '');
        let d_s = d_name.split('.');
        
        return d_s[0];
    }

    canCommunicate(url, id1, id2){
        let page = this.pages.find((v, i, a) => v.url === url);
        if(!page) return false;
        let f_c1 = page.clients.find((v, i, a) => v.id == id1);
        let f_c2 = page.clients.find((v, i, a) => v.id == id2);
        return f_c1 && f_c2;
    }

    getClientsFromDomain(url, callback){
        let domain_url = this.getDomain(url);
        let domain = this.domains.find((v, i, a) => v.url === domain_url);
        if(domain){
            if(domain.pages && domain.pages.length > 0){
                domain.pages[0].clients.forEach((c) => callback(c));
            }
            // domain.pages.forEach((p)=>{
            //     p.clients.forEach((c)=>callback(c));
            // })
        }
    }

    getClientsFromURL(url, callback){
        let page = this.pages.find((p) => p.url === url);
        if(page){
            if(callback){
                page.clients.forEach((c)=> callback(c));
            }
        }
    }

    isEmpty(url){
        let page = this.pages.find((v, i, a) => url === v.url);
        if(!page) return false;

        return page.clients.length == 0;
    }

    registerNewPage(url, client, clinets_callback, callback, er){
        url = this.clearUrl(url);
        
        let valid = this.validUrl(url);

        if(!valid.status){
            if(er) er(valid.msg);
            return;
        }
        
        let page = this.pages.find((v, i, a) => v.url === url);

        if(page){
            console.log('Page finded:');
            console.log(page);
            let find_client = page.clients.find((v, i, a) => v.id == client.id);

            if(find_client) {
                if(er){
                    er("On this page, this user is already registered.");
                }
                return;
            }

            page.clients.forEach(c => {
                clinets_callback(c);
            });
        }else{
            page = new PageModel(url);
            this.pages.push(page);
            let domain_url = this.getDomain(url);

            let finded_domain = this.domains.find((v, i, a) => v.url === domain_url);
            
            if(finded_domain){
                finded_domain.setPage(page);
            }else{
                let domain = new DomainModel(domain_url);
                domain.setPage(page);
                this.domains.push(domain);
                console.log("Domain [" + domain.url + "] was be created!");
            }
        }

        page.setClient(client);

        if(callback) callback(page);
    }

    unregisterPage(url, client, clients_callback, callback, er){
        let page = this.pages.find((v, i, a) => v.url === url);
        
        if(!page){
            if(er) er("Page [" + url + "] was not found.");
            return;
        }

        let finded = page.clients.find((v, i, a) => v.id === client.id);

        if(!finded){
            if(er) er("Client was not found on this page");
            return;
        }

        page.clients.forEach((c)=>{
            if(c.id !== client.id){
                if(clients_callback) clients_callback(c);
            }
        });

        let index = page.clients.indexOf(finded);

        page.clients.splice(index, 1);

        if(page.clients.length == 0){
            let p_index = this.pages.indexOf(page);
            let domain_url = this.getDomain(page.url);
            let domain = this.domains.find((v, i, a) => v.url === domain_url);
            if(domain){
                domain.removePage(page);
                if(domain.isEmpty()){
                    let d_index = this.domains.indexOf(domain);
                    this.domains.splice(d_index, 1);
                    console.log("Domain [" + domain.url + "] was be removed!");
                }
            }
            this.pages.splice(p_index, 1);
        }

        if(callback) 
            callback({
                'url': url,
                'client': {
                    'name': client.name,
                    'id': client.id
                }
            });
    }
}

module.exports = PageContainer;