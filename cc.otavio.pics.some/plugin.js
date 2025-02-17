function identify() {
	setIdentifier(null)
}

function load() {
	loadAsync()
	.then(processResults)
	.catch(processError)
}

async function loadAsync() {
	const text = await sendRequest(site + "/rss");
	const obj = xmlParse(text);
	const regex = /src="(https:\/\/cdn\.some\.pics\/[^"]+)"(?:.|\n)*?Shared by <a href="https:\/\/[^"]+">@([^<]+)<\/a>/;
	const results = []

	for (const entry of obj.rss.channel.item) {
		const date = new Date(entry.pubDate);
		const match = entry.description.match(regex);

		if (!match) continue;

		const imageURL = match[1];
		const author = match[2];
		const item = Item.createWithUriDate(entry.guid, date);

		if (inputShowDescriptions == "on") {
			item.body = entry.title;
		}

		const identity = Identity.createWithName(author);
		identity.name = "@" + author;
		identity.avatar = "https://profiles.cache.lol/" + author + "/picture";
		item.author = identity;

		const attachment = MediaAttachment.createWithUrl(imageURL);
		attachment.mimeType = "image";
		attachment.aspectFit = {width: 400, height: 300};
		attachment.focalPoint = {x: 0, y: 0};
		item.attachments = [attachment];

		results.push(item);
	}

	return results;
}
