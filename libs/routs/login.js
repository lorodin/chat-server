const User = require('../models/user.model');

exports.form = (req, res) => {
    res.render('login', {title: 'Login'});
}

exports.submit = (req, res) => {
    const data = {name: req.body.name, pass: req.body.pass};
    User.authenticate(data.name, data.pass, (err, user) => {
        if(err) return next(err);
        if(user){
            req.session.uid = user.id;
            res.redirect('/');
        }else{
            res.redirect('back');
        }
    })
}

exports.logout = (req, res) => {
    req.session.uid = undefined;
    res.redirect('/login');
}