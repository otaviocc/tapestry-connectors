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
	const regex = /<img\s+[^>]*width="(\d+)"\s+height="(\d+)"\s+alt="([^"]+)"\s+[^>]*src="([^"]+)"[^>]*>.*?<a\s+href="[^"]*">@([^<]+)<\/a>/;
	const results = []

	for (const entry of obj.rss.channel.item) {
		const date = new Date(entry.pubDate);
		const match = entry.description.match(regex);

		if (!match) continue;

		const width = match[1];
		const height = match[2];
		const altText = match[3];
		const imageURL = match[4];
		const author = match[5];

		const item = Item.createWithUriDate(entry.guid, date);
		if (inputShowDescriptions == "on") {
			item.body = entry.title;
		}

		const identity = Identity.createWithName(author);
		identity.name = "@" + author;
		identity.uri = `https://${author}.omg.lol`;
		identity.avatar = "https://profiles.cache.lol/" + author + "/picture";
		item.author = identity;

		const attachment = MediaAttachment.createWithUrl(imageURL);
		attachment.mimeType = "image";
		attachment.aspectSize = {width: width, height: height};
		attachment.text = altText;
		item.attachments = [attachment];

		results.push(item);
	}

	return results;
}
