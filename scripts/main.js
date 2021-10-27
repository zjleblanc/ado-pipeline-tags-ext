let oauth_token = "UNSET";
let rowQuery = "table.runs-table > tbody > a[role=row]";
let rows = $(rowQuery);

function extractBuildIds(builds) {
    return $.map(builds, function(val) {
        let url = val.href;
        let buildId = url.split("buildId=")[1];
        val.classList.add(buildId)
        return url.split("buildId=")[1];
    });
}

function createElement(tags){
    let pillsContainer = $('<span class="ext-gen-tags flex-row flex-center">');
    $.each(tags, function(idx, tag){
        let pillWrapper = $('<div class="margin-right-4 bolt-pill flex-row flex-center standard compact" role="presentation" aria-label="' + tag + '">');
        pillWrapper.append($('<div class="bolt-pill-content text-ellipsis">' + tag + "</div>"));
        pillsContainer.append(pillWrapper);
    });
    return pillsContainer;
}

async function addElements(buildIds) {
    let query = buildIds.join(",")
    fetch(baseUrl + "_apis/build/builds?api-version=5.1&buildIds=" + query, {
        method: 'get',
        headers: {
            'Authorization': 'Bearer ' + oauth_token
        }
    })
    .then(function(response) {
        return response.json()
    })
    .then(function(json){
        $.each(json.value, function(idx, build) {
            $("a." + build.id + " > td[data-column-index=1] > div.bolt-table-cell-content > div.flex-row")
                .append(createElement(build.tags));
        });
    });
}

let baseUrl = window.location.toString().split("_build")[0];
chrome.runtime.sendMessage({domain: "https://dev.azure.com/*", name: "UserAuthentication"}, function(cookie) {
    oauth_token = cookie.value;
    addElements(extractBuildIds(rows));
});

$("table.runs-table > tbody").bind('DOMNodeInserted', function(e) {
    if(oauth_token != "UNSET" && e.target.parentNode.localName == "tbody"){
        addElements(extractBuildIds([e.target]))
    }
});