function identify() {
	setIdentifier(null)
}

function verify() {
	sendRequest(`https://glass.photo/${inputUsername}/rss`)
	.then(_ => {
		const verification = {
			displayName: "Glass @" + inputUsername
		}

		processVerification(verification);
	})
	.catch(_ => {
		processError(`No user ${inputUsername} found on Glass.`);
	});
}

function load() {
	loadAsync()
	.then(processResults)
	.catch(processError)
}

async function loadAsync() {
	const text = await sendRequest(`https://glass.photo/${inputUsername}/rss`);
	const obj = xmlParse(text);
	const regex = /<img\s+src="([^"]+)"\s+width="(\d+)"\s+height="(\d+)"/;
	const results = []

	const nameRegex = /Photo feed of (.*?) on Glass/;
	const nameMatch = obj.rss.channel.title.match(nameRegex);

	for (const entry of obj.rss.channel.item) {
		const date = new Date(entry.pubDate);
		const match = entry["content:encoded"].match(regex);

		if (!match) continue;

		const imageURL = match[1];
		const width = match[2];
		const height = match[3];

		const item = Item.createWithUriDate(entry.guid, date);

		if (inputShowDescriptions == "on") {
			item.body = entry.title;
		}

		const identity = Identity.createWithName(inputUsername);
		if (nameMatch && nameMatch[1]) {
			identity.name = nameMatch[1];
		}
		identity.username = "@" + inputUsername;
		identity.uri = obj.rss.channel.link;
		item.author = identity;

		const attachment = MediaAttachment.createWithUrl(imageURL);
		attachment.mimeType = "image/jpg";
		attachment.aspectSize = {width: width, height: height};
		item.attachments = [attachment];

		results.push(item);
	}

	return results;
}
