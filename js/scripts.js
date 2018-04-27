function executeGithubRequest(url, success_callback, failure_callback) {
    $.ajax({
        type: "GET",
        url: url,
        Accept: "application/vnd.github.v3+json",
        cache: false,
        beforeSend: function (xhr) {
            /* Authorization header */
            xhr.setRequestHeader("Authorization", "token --");
        },
        success: success_callback,
        failure: failure_callback
    });
}

function executeSyncGithubRequest(url, success_callback, failure_callback) {
    $.ajax({
        async: false,
        type: "GET",
        url: url,
        Accept: "application/vnd.github.v3+json",
        cache: false,
        beforeSend: function (xhr) {
            /* Authorization header */
            xhr.setRequestHeader("Authorization", "token 430b5060bf9b669569385180f356df182359c400");
        },
        success: success_callback,
        failure: failure_callback
    });
}

function executeGithubPaginatedRequest(url, success_callback, failure_callback) {

    executeGithubRequest(url,
        function (data, textStatus, request) {
            // process data from page
            success_callback(data)

            // check if there is a next page
            var nextpage_url = getNextPageLink(request.getResponseHeader('Link'))
            if (nextpage_url) {
                console.log('will retrieve next page from ' + nextpage_url)
                executeGithubPaginatedRequest(nextpage_url, success_callback, failure_callback)
            }

            return
        },
        function (errMsg) {
            console.log("Error: ", errMsg)
        }
    )
}

function loadRepositoryPullRequests(repository) {
    // url pattern : GET /repos/:owner/:repo/pulls
    let url = repository.pulls_url.replace("{/number}", "") + "?per_page=100&state=open"
    console.log(url)

    executeSyncGithubRequest(url,
        function (data, textStatus, request) {
            repository.open_pulls_count = data.length
        },
        function (errMsg) {
            console.log("Error: ", errMsg)
        }
    )
}


function loadOrganizationRepositories(organization, filter, success_callback) {
    let url = "https://api.github.com/" + organization + "/repos?per_page=100"

    console.log('retrieving org repos from ' + url)

    executeGithubPaginatedRequest(url,
        function(data) {
            let repos = Array()
            data.forEach(function(element) {
                //console.log('processing repository ' + element.full_name)
                if(filter) {
                    let regex = new RegExp(filter)
                    if(regex.test(element.full_name)) {
                        loadRepositoryPullRequests(element)
                        repos = repos.concat(element)
                    }
                } else {
                    loadRepositoryPullRequests(element)
                    repos = repos.concat(element)
                }
            });
            success_callback(repos)
        },
        function (errMsg) {
            console.log("Error: ", errMsg)
        }
    )
}

function getNextPageLink(linkHeader) {
    /*
    Link: <https://api.github.com/resource?page=2>; rel="next",
          <https://api.github.com/resource?page=5>; rel="last"
    */
    if(! linkHeader)
        return;

    console.log(linkHeader)
    let links = linkHeader.split(',');
    for (var i = 0; i < links.length; i++) {
        let link = links[i];
        //console.log(link)
        let linkParts = link.split(';')
        //console.log(linkParts[0])
        if (linkParts[1].includes('next')) {
            let nextLink = linkParts[0].trim().substring(1, (linkParts[0].length - 1))
            return nextLink
        }
    }
    return;
}

function getPageSize(linkHeader) {
    /*
    Link: <https://api.github.com/resource?page=2>; rel="next",
          <https://api.github.com/resource?page=5>; rel="last"

    Link: <https://api.github.com/organizations/1459110/repos?_=1524288397747&page=2>; rel="next",
          <https://api.github.com/organizations/1459110/repos?_=1524288397747&page=12>; rel="last"
    */
    //console.log(linkHeader)
    // process multiple links
    var links = linkHeader.split(',');
    for (var i = 0; i < links.length; i++) {
        // process each individual link
        var link = links[i];
        //console.log(link)
        var linkParts = link.split(';')
        //console.log(linkParts)
        if (linkParts[1].includes('last')) {
            p = linkParts[0].split("page=")[1]
            return p.substring(0, p.length - 1)
        }
    }
    return;
}
