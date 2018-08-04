const express = require('express');
const session = require('express-session');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const path = require('path');
const User = require('./models/user.model');
const login = require('./routs/login');
const index = require('./routs/index');
const fs = require('fs');
class HttpServer{
    constructor(app){
        this.app = app;
        app.set('view engine', 'ejs');
        app.set('views', path.join(__dirname, 'views'));
        
        app.use(logger('dev'));
        app.use(bodyParser.json());
        app.use(bodyParser.urlencoded({extended: false}));
        app.use(cookieParser());
        app.use(session({
            secret: 'secret',
            resave: false,
            saveUninitialized: true
        }));
        let main_dir = __dirname + '/../public/';
        app.use(express.static(main_dir));

        app.get('/login', login.form);
        app.post('/login', login.submit);
        app.post('/logout', login.logout);
        
        app.use('/', (req, res, next) => {
            if(!req.session.uid){
                res.redirect('/login');
                return;
            }
            next();
        });
 
        app.get('/ban_domains', (req, res)=>{
            let fileContent = fs.readFileSync('data/invalid-domains.txt', 'utf-8');
            let domains = fileContent.split('\r\n');
    
            res.setHeader('Content-Type', 'application/json');
            
            res.end(JSON.stringify(domains));
        })

        app.post('/remove_domain', (req, res) => {
            console.log(req.body.domain);
            
            let fileContent = fs.readFileSync('data/invalid-domains.txt', 'utf-8');
            let domains = fileContent.split('\r\n');
    
            fs.truncate("data/invalid-domains.txt", 0, function() {
                let find = domains.find(d => d === req.body.domain);
                if(!find){
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({'status': 'error', 'msg': 'Domain was not found'}));
                    return;
                }          
                let index = domains.indexOf(find);
                domains.splice(index, 1);
                let string = '';
                for(let i = 0; i < domains.length; i++){
                    string += domains[i];
                    if(i == domains.length - 1) continue;
                    string += '\r\n';
                }  
                fs.writeFile("data/invalid-domains.txt", string, function (err) {
                    if (err) {
                        res.setHeader('Content-Type', 'application/json');
                        res.end(JSON.stringify({'status': 'error'}));
                        return console.log("Error writing file: " + err);
                    }
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({'status': 'ok'}));
                });
            });
        });

        app.post('/add_domain', (req, res) => {
            let fileContent = fs.readFileSync('data/invalid-domains.txt', 'utf-8');
            let domains = fileContent.split('\r\n');
    
            if(domains.indexOf(req.body.domain) != -1){
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({'status':'error', 'msg': 'It`s domain exists!'}));
                return;
            }

            domains.push(req.body.domain);

            let string = domains.join('\r\n');
            
            console.log('Add domain!');
            console.log(domains);
            console.log(string);

            fs.truncate("data/invalid-domains.txt", 0, function() {
                fs.writeFile("data/invalid-domains.txt", string, function (err) {
                    if (err) {
                        res.setHeader('Content-Type', 'application/json');
                        res.end(JSON.stringify({'status': 'error', 'msg': err}));
                        return console.log("Error writing file: " + err);
                    }
                    console.log('Write file complete!');
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({'status': 'ok', 'data': domains}));
                });
            });
        })

        app.use('/', index.main);


        // const user = new User({name: 'Example', pass: 'test'});

        // User.getByName('Example', (err, user) => {
        //     if(err) console.error(err);
        //     console.log(user);
        // });
    }
}

module.exports = HttpServer;