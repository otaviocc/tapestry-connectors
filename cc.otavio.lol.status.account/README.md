This connector enables Tapestry to display your own [status.lol](https://status.lol) statuses and to post new ones from Tapestry's composer. It requires Tapestry 2.0 or later. To display everyone's statuses without an account, use the status.lol connector instead.

## Setup

When adding the feed, fill in:

- **omg.lol Address**: your address without `@` or `.omg.lol` (e.g. `tom`).
- **API Key**: copy it from the API Key section of your [omg.lol account page](https://home.omg.lol/account).

## Posting

Use the feed's **New Status** action. If the status starts with an emoji, it's used as the status emoji. Otherwise status.lol picks its default. The composer also lets you skip cross-posting to Mastodon.

**Keep your API key safe.** It gives full access to your omg.lol account. Tapestry stores it in the feed's settings as plain text, not in the keychain. If it's ever exposed, regenerate it on your account page.

I, [Otávio](https://otavio.cc), am not affiliated with, nor do I work for, status.lol or its creators. This connector is independently developed as part of [my connectors open-source project](https://github.com/otaviocc/tapestry-connectors).
