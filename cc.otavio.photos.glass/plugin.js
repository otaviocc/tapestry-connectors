/*
MIT License

Copyright (c) 2025 Otávio

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

/**
 * Clears any existing identifier
 */
function identify() {
  setIdentifier(null);
}

/**
 * Verifies if the provided username exists on Glass
 */
function verify() {
  const userUrl = `https://glass.photo/${inputUsername}/rss`;

  sendRequest(userUrl)
    .then(() => {
      processVerification({
        displayName: `Glass @${inputUsername}`
      });
    })
    .catch(() => {
      processError(`No user ${inputUsername} found on Glass.`);
    });
}

/**
 * Loads user content from Glass
 */
function load() {
  loadAsync()
    .then(processResults)
    .catch(processError);
}

/**
 * Fetches and processes the RSS feed from Glass
 * @returns {Promise<Array>} Array of processed items
 */
async function loadAsync() {
  try {
    const userURL = `https://glass.photo/${inputUsername}/rss`;
    const text = await sendRequest(userURL);
    const parsedXML = xmlParse(text);

    return processRSSFeed(parsedXML);
  } catch (error) {
    throw error;
  }
}

/**
 * Processes the RSS feed data into structured items
 * @param {Object} parsedXML - The parsed XML data
 * @returns {Array} Array of processed items
 */
function processRSSFeed(parsedXML) {
  const results = [];
  const channel = parsedXML.rss.channel;
  const items = channel.item || [];

  // Extract author name from channel title
  const nameRegex = /Photo feed of (.*?) on Glass/;
  const nameMatch = channel.title.match(nameRegex);
  const authorName = nameMatch?.[1] || inputUsername;

  // Create identity object
  const identity = createIdentity(authorName, channel.link);

  // Process each item in the feed
  for (const entry of items) {
    const item = processRSSItem(entry, identity);
    if (item) {
      results.push(item);
    }
  }

  return results;
}

/**
 * Creates an identity object for the author
 * @param {string} name - The author's name
 * @param {string} uri - The author's URI
 * @returns {Object} Identity object
 */
function createIdentity(name, uri) {
  const identity = Identity.createWithName(inputUsername);

  identity.name = name;
  identity.username = `@${inputUsername}`;
  identity.uri = uri;
  identity.avatar = `https://raw.githubusercontent.com/otaviocc/tapestry-connectors/refs/heads/main/cc.otavio.photos.glass/icon.png`;

  return identity;
}

/**
 * Processes a single RSS item
 * @param {Object} entry - The RSS item
 * @param {Object} identity - The author's identity
 * @returns {Object|null} Processed item or null if invalid
 */
function processRSSItem(entry, identity) {
  const imageRegex = /<img\s+src="([^"]+)"\s+width="(\d+)"\s+height="(\d+)"/;
  const match = entry["content:encoded"]?.match(imageRegex);

  if (!match) return null;

  const [, imageURL, width, height] = match;
  const date = new Date(entry.pubDate);

  // Create item
  const item = Item.createWithUriDate(entry.guid, date);

  // Add description if enabled
  if (inputShowDescriptions === "on") {
    item.body = entry.title;
  }

  // Set author
  item.author = identity;

  // Add media attachment
  const attachment = createMediaAttachment(imageURL, width, height);
  item.attachments = [attachment];

  return item;
}

/**
 * Creates a media attachment object
 * @param {string} url - The image URL
 * @param {number} width - The image width
 * @param {number} height - The image height
 * @returns {Object} Media attachment object
 */
function createMediaAttachment(url, width, height) {
  const attachment = MediaAttachment.createWithUrl(url);

  attachment.mimeType = "image/jpg";
  attachment.aspectSize = { width, height };

  return attachment;
}
