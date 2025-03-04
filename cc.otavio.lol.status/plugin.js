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
    const feedURL = `${site}/feed`;
    const text = await sendRequest(feedURL);
    const parsedXML = xmlParse(text);

    return processFeedEntries(parsedXML.feed.entry);
  } catch (error) {
    throw error;
  }
}

/**
 * Processes feed entries into structured items
 * @param {Array} entries - The feed entries to process
 * @returns {Array} Array of processed items
 */
function processFeedEntries(entries = []) {
  return entries.map(createItemFromEntry);
}

/**
 * Creates an item from a feed entry
 * @param {Object} entry - The feed entry
 * @returns {Object} Processed item
 */
function createItemFromEntry(entry) {
  const date = new Date(entry.published);
  const identity = createIdentity(entry.author);
  const item = Item.createWithUriDate(entry.id, date);

  item.body = entry.content;
  item.author = identity;

  return item;
}

/**
 * Creates an identity object for the author
 * @param {Object} author - The author information
 * @returns {Object} Identity object
 */
function createIdentity(author) {
  const username = author.name;
  const identity = Identity.createWithName(username);

  identity.name = `@${username}`;
  identity.uri = `https://${username}.omg.lol`;
  identity.avatar = `https://profiles.cache.lol/${username}/picture`;

  return identity;
}
