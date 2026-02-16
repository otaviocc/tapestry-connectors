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
 * Loads content from the feed
 */
function load() {
  loadAsync()
    .then(processResults)
    .catch(processError);
}

/**
 * Fetches and processes the feed
 * @returns {Promise<Array>} Array of processed items
 */
async function loadAsync() {
  try {
    const feedURL = `${site}/public-tracks/feed.json`;
    const text = await sendRequest(feedURL);
    const feed = JSON.parse(text);

    return processFeedItems(feed.items || []);
  } catch (error) {
    throw error;
  }
}

/**
 * Processes feed items into structured items
 * @param {Array} items - The feed items to process
 * @returns {Array} Array of processed items
 */
function processFeedItems(items) {
  return items.map(createItemFromEntry);
}

/**
 * Creates an item from a feed entry
 * @param {Object} entry - The feed entry
 * @returns {Object} Processed item
 */
function createItemFromEntry(entry) {
  const date = new Date(entry.date_published);
  const songDetails = entry._song_details || {};
  const author = entry.authors?.[0] || {};

  const item = Item.createWithUriDate(entry.url || entry.id, date);

  item.body = buildItemBody(songDetails, entry.content_html);
  item.author = createIdentity(author);

  if (songDetails.artwork_url) {
    item.attachments = [createMediaAttachment(songDetails.artwork_url)];
  }

  return item;
}

/**
 * Builds the item body with artist, song, and user commentary
 * @param {Object} songDetails - The song details object
 * @param {string} contentHtml - The HTML content from the feed
 * @returns {string} Formatted body text
 */
function buildItemBody(songDetails, contentHtml) {
  const artist = songDetails.artist || "Unknown Artist";
  const song = songDetails.song || "Unknown Track";
  const trackLine = `<div><p>${song} by ${artist}</p></div>`;

  if (inputShowCommentary === "on") {
    const userContent = extractUserContent(contentHtml);

    if (userContent) {
      return `${trackLine}<div>${userContent}</div>`;
    }
  }

  return trackLine;
}

/**
 * Extracts user-generated content from the HTML
 * @param {string} html - The content_html from the feed
 * @returns {string|null} User content or null if not present
 */
function extractUserContent(html) {
  if (!html) return null;

  const divMatch = html.match(/<div>([^]*?)<\/div>\s*<p>Posted by/);

  if (!divMatch) return null;

  let content = divMatch[1];

  content = content
    .replace(/<(?!\/?(em|p))[^>]+>/g, "")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .trim();

  return content || null;
}

/**
 * Creates an identity object for the author
 * @param {Object} author - The author information
 * @returns {Object} Identity object
 */
function createIdentity(author) {
  const name = author.name || "Crucial Tracks User";
  const identity = Identity.createWithName(name);

  identity.name = name;
  identity.uri = author.url || "https://app.crucialtracks.org";
  identity.avatar = author.avatar;

  return identity;
}

/**
 * Creates a media attachment for album artwork
 * @param {string} url - The artwork URL
 * @returns {Object} Media attachment object
 */
function createMediaAttachment(url) {
  const attachment = MediaAttachment.createWithUrl(url);

  attachment.mimeType = "image/jpeg";
  attachment.aspectSize = { width: 600, height: 600 };

  return attachment;
}
