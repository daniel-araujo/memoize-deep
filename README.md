# memoize-deep

This might be the best memoize library for JavaScript but do be aware
that as the author I am very biased.

Here are a couple of examples.

**Remember value:**

```js
// Defines memoized function.
let calculateYourMomsWeight = memoizeDeep({
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
let getTwitchProfilePicture = memoizeDeep({
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
let getStreamStatus = memoizeDeep({
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
npm install memoize-deep
```


## Contributing

The easiest way to contribute is by starring this project on GitHub!

https://github.com/chadium/memoize-deep

Found a bug or want to contribute code? Feel free to create an issue or send a pull request on GitHub:

https://github.com/chadium/memoize-deep/issues
