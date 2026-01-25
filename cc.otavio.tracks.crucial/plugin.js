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

  item.body = buildItemBody(songDetails);
  item.author = createIdentity(author);

  if (songDetails.artwork_url) {
    item.attachments = [createMediaAttachment(songDetails.artwork_url)];
  }

  return item;
}

/**
 * Builds the item body with artist and song info
 * @param {Object} songDetails - The song details object
 * @returns {string} Formatted body text
 */
function buildItemBody(songDetails) {
  const artist = songDetails.artist || "Unknown Artist";
  const song = songDetails.song || "Unknown Track";

  return `${artist} - ${song}`;
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
