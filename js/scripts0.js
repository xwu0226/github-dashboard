// Empty JS for your own code to be here

function executeGithubRequest(url, success_callback, failure_callback) {
  $.ajax({
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

function loadOrganizationRepositories(object, organization, filter) {
  var url = "https://api.github.com/orgs" + organization + "/repos"

  executeGithubRequest(url,
    success_callback: function(data, textStatus, request){
      data.forEach(function(element) {
          if(element.full_name.startsWith(filter)) {

            var row = "<tr>"
            + "<td>" + element.full_name +"</td>"
            + "<td>" + element.stargazers_count +"</td>"
            + "<td>" + element.forks_count +"</td>"
            + "<td>" + element.open_issues_count +"</td>"
            + "<td>" + element.open_pulls_count +"</td>"
            + "</tr>"

            object.append(row)
          }
      });
    },
    failure_callback: function(errMsg) {
        console.log("Error: ", errMsg)
    }
  )
}

function retrieveRepositoryPage(identity, filter, page) {
  var pageLink = "https://api.github.com/" + identity + "?page=" + page

  console.log('page link:' + pageLink)

  $.ajax({
      async: false,
      type: "GET",
      url: pageLink,
      Accept: "application/vnd.github.v3+json",
      cache: false,
      beforeSend: function (xhr) {
        /* Authorization header */
        xhr.setRequestHeader("Authorization", "token 430b5060bf9b669569385180f356df182359c400");
      },
      success: function(data, textStatus, request){
        data.forEach(function(element) {
            if(element.full_name.startsWith(filter)) {
              console.log(element)
              repositories.push(element)
            }
        });
      },
      failure: function(errMsg) {
          console.log("Error: ", errMsg)
      }
  });
}

function retrieveAllRepositories(identity, filter) {
  var pageLink = "https://api.github.com/" + identity

  $.ajax({
      async: false,
      type: "GET",
      url: pageLink,
      Accept: "application/vnd.github.v3+json",
      cache: false,
      beforeSend: function (xhr) {
        /* Authorization header */
        xhr.setRequestHeader("Authorization", "token 430b5060bf9b669569385180f356df182359c400");
      },
      success: function(data, textStatus, request){
        console.log('processing response...')
        var pages = getPageSize(request.getResponseHeader('Link'))
        console.log('==> pages = ' + pages)

        for(p=1; p<=pages; p++){
          console.log('processing page ' + p)
          retrieveRepositoryPage(identity, filter, p)
        }
      },
      failure: function(errMsg) {
          console.log("Error: ", errMsg)
      }
  });
}


function retrieveIBMRepositories() {
  // clear existing repository list
  repositories.length = 0

  retrieveAllRepositories("orgs/ibm/repos", "IBM/MAX-")

  console.log('>>> Filtered repositories')
  repositories.forEach(function(element) {
        console.log(element.full_name);
  });
}



function getRepositoryList() {
  retrieveIBMRepositories()
}

function getNextPageLink(linkHeader) {
  /*
  Link: <https://api.github.com/resource?page=2>; rel="next",
        <https://api.github.com/resource?page=5>; rel="last"
  */
  console.log('getNextPageLink')
  console.log(linkHeader)
  var links = linkHeader.split(',');
  for(var i=0; i<links.length; i++) {
    var link = links[i];
    //console.log(link)
    var linkParts = link.split(';')
    //console.log(linkParts)
    if(linkParts[1].includes('next')) {
      return linkParts[0].substring(1, (linkParts[0].length-1))
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
  console.log(linkHeader)
  // process multiple links
  var links = linkHeader.split(',');
  for(var i=0; i<links.length; i++) {
    // process each individual link
    var link = links[i];
    //console.log(link)
    var linkParts = link.split(';')
    //console.log(linkParts)
    if(linkParts[1].includes('last')) {
      p = linkParts[0].split("page=")[1]
      return p.substring(0, p.length - 1)
    }
  }
  return;
}
