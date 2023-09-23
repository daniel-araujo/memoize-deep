function promiseMe(fn) {
  return function(...args) {
    return new Promise(function(resolve, reject) {
      try {
        const result = fn(...args)
        if (result instanceof Promise) {
          result.then(resolve).catch(reject)
        } else {
          resolve(result)
        }
      } catch (error) {
        reject(error)
      }
    })
  }
}

function sortedJsonStringify(value) {
  const replacer = (key, value) => {
    if (value instanceof Object) {
      const sortedObj = {}
      Object.keys(value)
        .sort()
        .forEach((k) => {
          sortedObj[k] = value[k]
        })
      return sortedObj
    }
    return value
  }
  return JSON.stringify(value, replacer)
}

class MemoryEntry {
  constructor(defaultValue) {
    this.first = true
    this.value = defaultValue
    this.performPromise = null
    this.fetchPromise = null
    this.timestamp = null
  }

  async perform(fetch, maxAge, args, wait, onError) {
    if (this.performPromise !== null) {
      return this.performPromise
    }

    if (this.timestamp !== null) {
      const diff = Date.now() - this.timestamp

      if (diff <= maxAge) {
        return this.value
      }
    }

    this.performPromise = (async () => {
      if (this.fetchPromise === null) {
        this.fetchPromise = promiseMe(fetch)(...args)
          .then((v) => {
            this.value = v
          })

        if (!wait) {
          this.fetchPromise = this.fetchPromise
            .catch((e) => {
              if (onError) {
                try {
                  onError(e)
                } catch (e) {
                  console.error(e)
                }
              }
            })
        }

        this.fetchPromise = this.fetchPromise
          .finally(() => this.fetchPromise = null)
      }

      if (this.first) {
        this.first = false

        if (this.value === undefined) {
          await this.fetchPromise
        }
      } else if (wait) {
        await this.fetchPromise
      }

      return this.value
    })()

    this.performPromise.finally(() => {
      this.timestamp = Date.now()
      this.performPromise = null
    })

    return await this.performPromise
  }
}

/**
 * Creates memoized functions.
 *
 * @param {object} options
 * @param {*=} options.defaultValue The default value. If set, will immediately
 * return this value the first time that fetch is called if the wait option
 * is set to false.
 * @param {function} options.fetch Responsible for retrieving the value.
 * @param {number|infinity=} options.maxAge For how long a value should be
 * cached. Default: Infinity
 * @param {boolean=} options.wait Whether to wait for fetch. If set to false,
 * will instantly return the previous value while fetch is running. When
 * calling the first time, will only wait if defaultValue is not defined.
 * Errors will not be thrown. Take a look at the onError option. Default: true
 * @param {function=} options.onError Will be called when wait is set to false
 * and fetch throws an error. This is optional.
 * @returns {function}
 */
export function memoizeDeep({
  fetch,
  defaultValue = undefined,
  wait = true,
  maxAge = Infinity,
  onError,
}) {
  let memory = {}

  return async (...args) => {
    let key = sortedJsonStringify(args)

    if (!(key in memory)) {
      memory[key] = new MemoryEntry(defaultValue)
    }

    return await memory[key].perform(fetch, maxAge, args, wait, onError)
  }
}
