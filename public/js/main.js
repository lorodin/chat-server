let domains = undefined;

$(function(){
    window.onhashchange = ()=>{
        let hash = getLocation();
        loadContent(hash);
    };
    let hash = getLocation();
    loadContent(hash);

})

function getLocation(){
    $('nav a').removeClass('active');
    let hash = '#ban';

    if(window.location.hash) {
        hash = window.location.hash;
    }

    switch(hash){
        case '#ban':
            $('#ban-link').addClass('active');
        break;
        case '#other':
            $('#other-link').addClass('active');
        break;
        case '#logs':
            $('#logs-link').addClass('active');
        break;
    }

    return hash;
}

function loadContent(hash){
    // Загружаем три разных контента, в зависимости от хэшав
    $("#content").empty();
    switch(hash){
        case '#ban':
            loadBans();
        break;
        case '#other':
            loadOther();
        break;
        case '#logs':
            loadLogs();
        break;
    }
}

function loadBans(){
    $.ajax({
        'url': '/ban_domains',
        'method': 'get',
        'success': (data)=>{
            if(data.status === 'error'){
                setError(data.msg);
                return;
            }
            domains = data;
            updateBanDomains();
        }
    })
}

function updateBanDomains(){
    $("#content").empty();
    let html = "<table class='small-table table'>";
    html += "<tr>";
    html += "<td><input class='form-control' type='text' id='new-domain' placeholder='New domain'/></td>";
    html += "<td><span onclick='addDomain()' class='btn btn-success'>Add</span></td>"
    html += "</tr>"
    html += "</table>";
    html += "<div id='info-message'></div>";
    html += "<table class='small-table table'>";
    html += "<thead><tr><td>#</td><td>Domain</td><td>Remove</td></tr></thead>";
    html += "<tbody>";
    for(let i = 0; i < domains.length; i++){
        let index = i + 1;
        html += "<tr>"
        html += "<td>" + index + "</td>";
        html += "<td>" + domains[i] + "</td>";
        html += "<td><span onclick='removeDomain(\"" + domains[i] + "\")' class='btn-remove btn btn-danger'>Remove</span></td>";
        html += "</tr>"
    }
    html += "</tbody>"
    html += "</table>";
    $("#content").append(html);
}

function setError(text){
    $("#info-message").empty();
    let html = '<span class="label label-danger">' + text + '</span>';
    $("#info-message").append(html);
}

function setSuccess(text){
    $("#info-message").empty();
    let html = '<span class="label label-success">' + text + '</span>';
    $("#info-message").append(html);
}

function addDomain(){
    let domain = $('#new-domain').val();
    if(domain.trim() === '')
        return setError('Domain is empty!');
    
    domain = domain.trim();
    console.log('Domain ' + domain);
    console.log(domains);
    if(domains.indexOf(domain) != -1)
        return setError('Domain alredy exists!');
    
    $.ajax({
        'url': '/add_domain',
        'method': 'post',
        'data': {domain: domain},
        'success': (data) => {
            if(data.status === 'error'){
                return setError(data.msg);
            }
            domains = data.data;
            updateBanDomains();
            setSuccess('Domain add');
        }
    })
}

function removeDomain(domain){  
    if(!domains) return;
    let find = domains.find(d => d === domain);
    if(!find) return;
    $.ajax({
        'url': '/remove_domain',
        'data': {domain: domain},
        'method': 'post',
        'success': (data) => {
            if(data.status === 'error'){
                setError(data.msg)
                return;
            }
            let index = domains.indexOf(find);
            if(index === -1) return;
            domains.splice(index, 1);
            updateBanDomains();
            setSuccess('Domain was deleted.');
        }
    })
}

function loadOther(){

}

function loadLogs(){

}