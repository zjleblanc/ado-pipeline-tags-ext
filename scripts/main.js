/**
 * Wait for element to exist in DOM
 * @param {string} query - selector for target element(s).
 * @param {function} callback - callback function which receives the existing element(s).
 * @param {number} interval - ms between check for element(s) to exist.
 */
function waitForElements(query, callback, interval=100){
    var elementsExist = setInterval(function(){
        let elements = $(query)
        if(elements.length) {
            callback(elements);
            clearInterval(elementsExist);
        }
    }, interval);
}

/**
 * Get a list of ADO build ids from <a> elements
 * @param {list} builds - list of <a> elements which represent builds.
 * @returns {list} list of build ids
 */
function extractBuildIds(builds) {
    return $.map(builds, function(val) {
        let url = val.href;
        return url.split("buildId=")[1];
    });
}

/**
 * Create a new <span> element to represent a list of build tags
 * @param {list} tags - list of builds tags retrieved from ADO API.
 * @returns {list} <span> element containing bolt pills to display tags.
 */
function createElement(tags){
    let pillsContainer = $('<span class="ext-gen-tags flex-row flex-center">');
    $.each(tags, function(idx, tag){
        let pillWrapper = $('<div class="margin-right-4 bolt-pill flex-row flex-center standard compact" role="presentation" aria-label="' + tag + '">');
        pillWrapper.append($('<div class="bolt-pill-content text-ellipsis">' + tag + "</div>"));
        pillsContainer.append(pillWrapper);
    });
    return pillsContainer;
}

/**
 * Retrieve build details from ADO API, create bolt pills, and inject html into runs table
 * @async
 * @param {list} buildIds - list of build ids to query details from ADO API.
 * @param {list} token - ADO oauth token sourced from cookies
 */
async function addElements(buildIds, token) {
    let baseUrl = window.location.toString().split("_build")[0];
    let query = buildIds.join(",")
    fetch(baseUrl + "_apis/build/builds?api-version=5.1&buildIds=" + query, {
        method: 'get',
        headers: {
            'Authorization': 'Bearer ' + token
        }
    })
    .then(function(response) {
        return response.json()
    })
    .then(function(json){
        $.each(json.value, function(idx, build) {
            let buildQuery = "a[href$=" + build.id + "] > td[data-column-index=1] > div.bolt-table-cell-content > div.flex-row";
            waitForElements(buildQuery, function(builds){
                builds.append(createElement(build.tags));
            });
        });
    });
}

/**
 * Bind functionality to add build tags to new builds inserted into the DOM
 */
function bindToNewBuilds() {
    waitForElements('table.runs-table', function(tbl){
        tbl.bind('DOMNodeInserted', function(e) {
            if(e.target.parentNode.localName == "tbody"){
                addElements(extractBuildIds([e.target]))
            }
        });
    });
}

chrome.storage.local.get(['ado_token'], function(result){
    let rowQuery = "table.runs-table > tbody > a[role=row]";

    // ADO Token exists in local storage
    if("ado_token" in result)
    {
        waitForElements(rowQuery, function(rows){
            addElements(extractBuildIds(rows), result.ado_token);
            bindToNewBuilds();
        });
    }
    // ADO token needs to be loaded from cookies
    else 
    {
        chrome.runtime.sendMessage({domain: "https://dev.azure.com/*", name: "UserAuthentication"}, function(cookie) {
            oauth_token = cookie.value;
            chrome.storage.local.set({ado_token: cookie.value}, function(){
                addElements(extractBuildIds($(rowQuery)), cookie.value);
                bindToNewBuilds();
            });
        });
    }
});