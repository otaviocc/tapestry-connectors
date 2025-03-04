/**
 * Clears any existing identifier
 */
function identify() {
  setIdentifier(null);
}

/**
 * Loads content from the RSS feed
 */
function load() {
  loadAsync()
    .then(processResults)
    .catch(processError);
}

/**
 * Fetches and processes the RSS feed
 * @returns {Promise<Array>} Array of processed items
 */
async function loadAsync() {
  try {
    const feedURL = `${site}/rss`;
    const text = await sendRequest(feedURL);
    const parsedXML = xmlParse(text);

    return processRSSItems(parsedXML.rss.channel.item || []);
  } catch (error) {
    throw error;
  }
}

/**
 * Processes RSS items into structured items
 * @param {Array} entries - The RSS items to process
 * @returns {Array} Array of processed items
 */
function processRSSItems(entries) {
  const results = [];
  const imageRegex = /<img\s+[^>]*width="(\d+)"\s+height="(\d+)"\s+alt="([^"]+)"\s+[^>]*src="([^"]+)"[^>]*>.*?<a\s+href="[^"]*">@([^<]+)<\/a>/;

  for (const entry of entries) {
    const item = createItemFromEntry(entry, imageRegex);
    if (item) {
      results.push(item);
    }
  }

  return results;
}

/**
 * Creates an item from an RSS entry
 * @param {Object} entry - The RSS entry
 * @param {RegExp} imageRegex - Regular expression to extract image data
 * @returns {Object|null} Processed item or null if invalid
 */
function createItemFromEntry(entry, imageRegex) {
  const match = entry.description.match(imageRegex);

  if (!match) return null;

  const [, width, height, altText, imageURL, author] = match;
  const date = new Date(entry.pubDate);

  // Create item
  const item = Item.createWithUriDate(entry.guid, date);

  // Add description if enabled
  if (inputShowDescriptions === "on") {
    item.body = entry.title;
  }

  // Set author
  item.author = createIdentity(author);

  // Add media attachment
  item.attachments = [createMediaAttachment(imageURL, width, height, altText)];

  return item;
}

/**
 * Creates an identity object for the author
 * @param {string} username - The author's username
 * @returns {Object} Identity object
 */
function createIdentity(username) {
  const identity = Identity.createWithName(username);

  identity.name = `@${username}`;
  identity.uri = `https://${username}.omg.lol`;
  identity.avatar = `https://profiles.cache.lol/${username}/picture`;

  return identity;
}

/**
 * Creates a media attachment object
 * @param {string} url - The image URL
 * @param {string|number} width - The image width
 * @param {string|number} height - The image height
 * @param {string} altText - The image alt text
 * @returns {Object} Media attachment object
 */
function createMediaAttachment(url, width, height, altText) {
  const attachment = MediaAttachment.createWithUrl(url);

  attachment.mimeType = "image";
  attachment.aspectSize = { width, height };
  attachment.text = altText;

  return attachment;
}
