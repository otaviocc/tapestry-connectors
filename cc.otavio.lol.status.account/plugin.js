/*
MIT License

Copyright (c) 2026 Otávio

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

const API_URL = "https://api.omg.lol";
// A single emoji: a flag, a keycap, or a pictograph (text-style symbols like © only with U+FE0F),
// with an optional skin tone or tag sequence, joined to more pictographs by U+200D
const EMOJI_ELEMENT = String.raw`(?:\p{Emoji_Presentation}|\p{Extended_Pictographic}\uFE0F)(?:\p{Emoji_Modifier}|[\u{E0020}-\u{E007E}]+\u{E007F})?`;
const EMOJI_JOINED = String.raw`\p{Extended_Pictographic}\uFE0F?\p{Emoji_Modifier}?`;
const LEADING_EMOJI = new RegExp(
  String.raw`^(\p{Regional_Indicator}{2}|[0-9#*]\uFE0F?\u20E3|${EMOJI_ELEMENT}(?:\u200D${EMOJI_JOINED})*)\s*`,
  "u"
);

/**
 * Verifies the omg.lol address and API key
 * @returns {Promise<Object>} Verification result
 */
async function verify() {
  const { address, apiKey } = requireCredentials();

  try {
    const result = await fetch(`${addressAPI(address)}/info`, {
      headers: authHeaders(apiKey)
    }).json();

    if (!result.response?.owner) {
      throw userError(`The API key doesn't belong to @${address}.`);
    }
  } catch (error) {
    throw await toUserError(error, `Couldn't verify @${address} with omg.lol.`);
  }

  // Tapestry takes the feed's name and icon from the account identity
  return { accountIdentity: createIdentity({ name: address }) };
}

/**
 * Loads the address's statuses from its feed
 * @returns {Promise<Array>} Array of processed items
 */
async function load() {
  const { address } = requireCredentials();
  const feedURL = `${statusURL(address)}/feed`;
  const text = await fetch.conditional(feedURL).text();

  // 304 Not Modified: nothing new since the last load
  if (text === null) {
    return [];
  }

  const parsedXML = await xmlParse(text);

  // xmlParse returns a single entry as an object rather than an array
  return processFeedEntries([].concat(parsedXML.feed.entry ?? []));
}

/**
 * Performs a connector action
 * @param {String} actionId - The action identifier
 * @param {Object} target - The draft for submit actions, null for feed actions
 * @returns {Promise<Object>} A draft for compose actions, or the created items
 */
async function performAction(actionId, target) {
  if (actionId == "newStatus") {
    return composeStatus();
  } else if (actionId == "send") {
    return sendStatus(target);
  }

  throw new Error(`actionId "${actionId}" not implemented`);
}

/**
 * Creates a draft for a new status
 * @returns {Object} Draft opened in the composer
 */
function composeStatus() {
  const { address } = requireCredentials();
  const draft = Draft.create();

  draft.header = `New status as @${address}`;
  draft.rules = {
    fields: {
      body: { placeholder: "🙂 What's up?" }
    },
    attributes: [
      {
        name: "mastodon",
        label: "Mastodon",
        defaultValue: "post",
        choices: [
          { value: "post", label: "Cross-post to Mastodon", icon: "arrow.triangle.branch" },
          { value: "skip", label: "Don't cross-post", icon: "nosign" }
        ]
      }
    ]
  };
  draft.actions.add("send");

  return draft;
}

/**
 * Posts a draft to status.lol
 * @param {Object} draft - The draft to post
 * @returns {Promise<Array>} Array with the created item
 */
async function sendStatus(draft) {
  const { address, apiKey } = requireCredentials();
  const { emoji, content } = splitLeadingEmoji(trimmed(draft.body));

  if (!content) {
    throw userError(emoji ? "Add some text after the emoji." : "Write something to post.");
  }

  const body = {
    content: content,
    skip_mastodon_post: draft.attributeValues?.mastodon === "skip"
  };

  if (emoji) {
    body.emoji = emoji;
  }

  let result;

  try {
    result = await fetch.post(`${addressAPI(address)}/statuses/`, {
      json: body,
      headers: authHeaders(apiKey)
    }).json();
  } catch (error) {
    throw await toUserError(error, "status.lol didn't accept the post.");
  }

  // Matches the entry id in the address's feed, so the next load doesn't duplicate it
  const uri = `${statusURL(address)}/${address}/${result.response.id}`;
  const item = Item.createWithUriDate(uri, new Date());

  item.body = result.response.status;
  item.author = createIdentity({ name: address });

  return [item];
}

/**
 * Splits a leading emoji from the status text
 * @param {String} text - The status text
 * @returns {Object} The emoji (if any) and the remaining content
 */
function splitLeadingEmoji(text) {
  const match = text.match(LEADING_EMOJI);

  if (!match) {
    return { emoji: null, content: text };
  }

  return { emoji: match[1], content: text.slice(match[0].length) };
}

/**
 * Returns the omg.lol credentials or throws if they're missing
 * @returns {Object} The address and API key
 */
function requireCredentials() {
  // Feed entry ids use the lowercase address
  const address = trimmed(inputAddress).toLowerCase().replace(/^@/, "").replace(/\.omg\.lol$/, "");
  const apiKey = trimmed(inputApiKey);

  if (!address || !apiKey) {
    throw userError("Enter your omg.lol address and API key in this feed's settings.");
  }

  return { address, apiKey };
}

/**
 * Builds the omg.lol API URL for an address
 * @param {String} address - The omg.lol address
 * @returns {String} The address's API URL
 */
function addressAPI(address) {
  return `${API_URL}/address/${encodeURIComponent(address)}`;
}

/**
 * Builds the status.lol URL for an address
 * @param {String} address - The omg.lol address
 * @returns {String} The address's status.lol URL
 */
function statusURL(address) {
  return `https://${address}.status.lol`;
}

/**
 * Builds the headers for authenticated omg.lol requests
 * @param {String} apiKey - The omg.lol API key
 * @returns {Object} Request headers
 */
function authHeaders(apiKey) {
  return { Authorization: `Bearer ${apiKey}` };
}

/**
 * Creates an error with a message shown to the user
 * @param {String} message - The message
 * @returns {Error} The error
 */
function userError(message) {
  const error = new Error(message);

  error.userMessage = message;

  return error;
}

/**
 * Converts a failure into an error with a user-facing message
 * @param {Error} error - The original error
 * @param {String} fallback - Message used when the server provides none
 * @returns {Promise<Error>} The error
 */
async function toUserError(error, fallback) {
  if (error.name != "HTTPError") {
    return error.userMessage ? error : userError(fallback);
  }

  // omg.lol nests its explanation in response.message (e.g. for a wrong API key),
  // which HTTPError.userMessage isn't documented to extract
  const message = await error.response.json()
    .then((body) => body.response?.message)
    .catch(() => null);

  return userError(message ?? error.userMessage ?? `${fallback} (HTTP ${error.status})`);
}

/**
 * Trims a possibly undefined string
 * @param {String} value - The value
 * @returns {String} The trimmed value
 */
function trimmed(value) {
  return (value ?? "").trim();
}

/**
 * Processes feed entries into structured items
 * @param {Array} entries - The feed entries to process
 * @returns {Array} Array of processed items
 */
function processFeedEntries(entries) {
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
