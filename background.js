chrome.runtime.onMessage.addListener((message, sender, callback) => {
    chrome.cookies.get({ url: message.domain, name: message.name }).then(callback);
    return true;
});