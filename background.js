// Listen for content scripts requestion ADO oauth token
chrome.runtime.onMessage.addListener((message, sender, callback) => {
    chrome.cookies.get({ url: message.domain, name: message.name }).then(callback);
    return true;
});

// Handle navigation to pipeline runs view via history updates
// Ex: clicking the back button
const regex = new RegExp(/https:\/\/dev\.azure\.com\/.*_build\?.*definitionId=.*/,'i');
chrome.webNavigation.onHistoryStateUpdated.addListener(function(details) {
    if(regex.test(details.url) && details.frameId == 0 && details.transitionType == 'reload') {
        chrome.tabs.get(details.tabId, function(tab) {
            if(tab.url === details.url) {
                chrome.scripting.insertCSS({
                    target: { tabId: tab.id },
                    files: ['css/main.css']
                });    
                chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    files: ['include/jquery-3.6.0.slim.min.js','scripts/main.js']
                });    
            }
        });
    }
});