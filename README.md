# memoize-deeper

This might be the best memoize library for JavaScript but do be aware
that as the author I am very biased. Features:

- Argument specific cache. Works with any number of arguments as long as they can be converted to JSON.
- Infinite or finite max age. Cache for 1 hour or forever. It's up to you.
- When invalidating cache, return the previous value while simultaneously fetching the new value. What an innovative concept!
- Error mitigation. The API that you're caching succeded in the first call but then failed in the second call? You'll be getting the value from the first call while the memoize function attempts to make a new successful call! Unreliable backends and APIs will no longer ruin the user experience.

This was developed for my frontends and backends that relied on APIs that were unreliable. Now my web apps are highly responsive and users don't even notice the downtime.

Here are a couple of examples.

**Remember value:**

```js
// Defines memoized function.
let calculateYourMomsWeight = memoizeDeeper({
  // The fetch option specifies the function that will be called to retrieve
  // the value.
  fetch() {
    // Perform heavy operation here.
  }
})

// Takes a while.
const weight = await calculateYourMomsWeight()

[...]

// Instant because it cached the value.
const weight = await calculateYourMomsWeight()
```

**Cache by arguments:**

```js
let getTwitchProfilePicture = memoizeDeeper({
  // The fetch function can take arguments.
  async fetch(username) {
    const apiUrl = `https://api.twitch.tv/helix/users?login=${username}`
    const options = {
      method: 'GET',
      headers: {
        'Client-ID': 'YOUR_CLIENT_ID',
        'Authorization': 'Bearer YOUR_ACCESS_TOKEN',
      },
    }
    const response = await fetch(apiUrl, options)
    const data = await response.json()
    const profilePictureUrl = data.data[0].profile_image_url
    return profilePictureUrl
  }
})

// Takes a while.
const imageUrl = await getTwitchProfilePicture('helpium')

[...]

// Returns isntantly
const imageUrl = await getTwitchProfilePicture('helpium')

[...]

// Takes a while again because it received a different argument therefore
// it runs fetch again.
const imageUrl = await getTwitchProfilePicture('theprimeagen')
```

**Return instantly with default value while fetch is running:**

```js
let getStreamStatus = memoizeDeeper({
  async fetch(username) {
    // Make HTTP request that can take a while to respond.
  },
  wait: false,
  defaultValue: {
    online: false
  }
})

// Returns instantly.
const { online } = await getStreamStatus('chadium')
```


## Installation

```
npm install memoize-deeper
```


## Contributing

The easiest way to contribute is by starring this project on GitHub!

https://github.com/daniel-araujo/memoize-deeper

Found a bug or want to contribute code? Feel free to create an issue or send a pull request on GitHub:

https://github.com/daniel-araujo/memoize-deeper/issues
