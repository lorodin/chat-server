exports.main = (req, res) => {
    // if(!req.session.uid) res.redirect('/login');
    res.render('index', {active_element: 'ban_domains'});
}