function identify() {
    setIdentifier(null)
}

function load() {
    loadAsync()
    .then(processResults)
    .catch(processError)
}

async function loadAsync() {
    const text = await sendRequest(site + "/feed");
    const obj = xmlParse(text);

    return obj.feed.entry.map(entry => {
        const date = new Date(entry.published);

        const identity = Identity.createWithName(entry.author.name);
        identity.name = "@" + entry.author.name;
        identity.uri = site + "/" + entry.author.name;
        identity.avatar = "https://profiles.cache.lol/" + entry.author.name + "/picture";

        const item = Item.createWithUriDate(entry.id, date);
        item.body = entry.content;
        item.author = identity;

        return item;
    });
}