// const express = require('express');
// const app = express();
// const http = require('http');//.Server(app);
require('node-json-color-stringify');

const io = require('socket.io');//(server);
const ClientModel = require('./models/client.model');
const uniqid = require('uniqid');
const Responce = require('./models/responce.model');
const PageContainer = require('./models/page.container');

function logJson(data){
    console.log(JSON.colorStringify(data));
}

class Server{
    constructor(){
        this.clients = [];
        this.sockets = {};
        this.client_pages = {};
        this.pageContainer = new PageContainer();
    }

    removeClient(client){
        let index = this.clients.indexOf(client);
        
        if(index == -1) {
            console.log("Error removed client");
            return;
        }

        this.clients.splice(index, 1);

        console.log('Client was deleted [' + this.clients.length + ']');
    }

    start(server){
        let _this = this;

        this.io = io(server);   
        
        this.io.on('connection', (socket)=>{
            console.log('new connection');

            let client = new ClientModel();

            socket.on('disconnect', () => {
                if(_this.client_pages[client.id]){
                    _this.client_pages[client.id].forEach(url => {
                        _this.pageContainer.unregisterPage(url, client, 
                            (c) =>{
                                if(_this.sockets[c.id])
                                    _this.sockets[c.id].emit('unregister_client_on_page', 
                                                     new Responce('OK', {
                                                         'url': url,
                                                         'client': {
                                                             'name': client.name,
                                                             'id': client.id
                                                         }
                                                     }, 'ok'));
                        })
                    });
                }

                _this.removeClient(client);
                
                delete _this.sockets[client.id];

                delete _this.client_pages[client.id];

                socket.disconnect();
            });

            socket.on('register_user', function(req){
                if(req == undefined || req.data === undefined) req = JSON.parse(req);

                console.log('register new user');
                console.log(req);
                console.log(req.time);

                client.setId(uniqid());
                client.setName(req.data.name);
                
                client.time_z = Math.ceil((req.time - (Date.now() / 1000)) / (3600));

                _this.clients.push(client);

                logJson({
                    'client_length': _this.clients.length,
                    'new_client': client
                });

                _this.sockets[client.id] = socket;
                _this.client_pages[client.id] = [];

                socket.emit('register_user_complete', new Responce('OK', client, ''));
            });

            socket.on('register_page', function(req){
                if(req == undefined || req.data === undefined) req = JSON.parse(req);

                console.log(JSON.colorStringify({
                    'cmd': 'register_new_page',
                    'req': req
                }));
                
                _this.pageContainer
                     .registerNewPage(req.data, client, 
                        (c)=>{
                            if(!_this.sockets[c.id]) return;
                            _this.sockets[c.id].emit('set_new_client', new Responce('OK', {
                                'url': req.data,
                                'client': {
                                    'name': client.name,
                                    'id': client.id
                                }
                            }));
                        },
                        (page)=>{
                            if(!_this.sockets[client.id]) return;
                            console.log('Register page complete');
                            
                            logJson(page);
                            
                            _this.client_pages[client.id].push(page.url);

                            _this.sockets[client.id].emit('register_page_complete', 
                                new Responce('OK', page, 'ok'));
                        },
                        (msg)=>{
                            if(!_this.sockets[client.id]) return;
                            _this.sockets[client.id].emit('register_page_complete', 
                                new Responce('ERROR', null, msg));
                        }
                    );
            });

            socket.on('unregister_page', function(req){
                if(req == undefined || req.data === undefined) req = JSON.parse(req);
                
                logJson({
                    'cmd': 'unregister_page',
                    'req': req
                });

                let url = req.data;

                _this.pageContainer.unregisterPage(url, client, 
                    (c) => {
                        if(_this.sockets[c.id])
                            _this.sockets[c.id].emit('unregister_client_on_page', 
                                                     new Responce('OK', {
                                                         'url': url,
                                                         'client': {
                                                             'name': client.name,
                                                             'id': client.id
                                                         }
                                                     }, 'ok'));
                    },
                    (data) => {
                        if(!_this.sockets[client.id]) return;
                        
                        let index = _this.client_pages[client.id].indexOf(url);

                        if(index != -1) _this.client_pages[client.id].splice(index, 1);


                        _this.sockets[client.id].emit('unregister_page_complete', 
                                                      new Responce('OK', url, 'ok'));
                    },
                    (msg) => {
                        if(!_this.sockets[client.id]) return;
                        _this.sockets[client.id].emit('unregister_page_complete',
                                                      new Responce('ERROR', url, msg));
                    }
                )
            });

            socket.on('change_name', function(req){
                if(req == undefined || req.data === undefined) req = JSON.parse(req);

                logJson({
                    'cmd': 'change_name',
                    'req': req,
                });

                if(!_this.client_pages[client.id]) return;

                _this.client_pages[client.id].forEach((url) => {
                    _this.pageContainer.getClientsFromURL(url, (c) => {
                        if(!_this.sockets[c.id]) return;
                        _this.sockets[c.id].emit('change_client_name', new Responce('OK',{
                            'url': url,
                            'client': {
                                'name': req.data,
                                'id': client.id
                            }
                        }, 'ok'));
                    });
                });

                client.setName(req.data);

                if(_this.sockets[client.id]) 
                    _this.sockets[client.id].emit('change_name_complete', 
                    new Responce('OK', req.data, 'ok'));
            });

            socket.on('send_message', function(req){
                if(req == undefined || req.data == undefined) req = JSON.parse(req);

                logJson({
                    'cmd': 'send_message',
                    'req': req
                });

                let msg = req.data;

                msg.time = Math.ceil(Date.now() / 1000);

                if(req.data.to === ''){
                    msg.to = 'room';
                    _this.pageContainer.getClientsFromURL(msg.url, (c)=>{
                        if(_this.sockets[c.id]){
                            _this.sockets[c.id].emit("new_message", new Responce('OK', msg, 'ok'));
                        }
                    });
                }else if(_this.sockets[req.data.from] && _this.sockets[req.data.to]){
                    let resp = new Responce('OK', msg, 'ok');
                    _this.sockets[req.data.from].emit("new_message", resp);
                    _this.sockets[req.data.to].emit("new_message", resp);
                }
            })
        });
    }
}

module.exports = Server;