import assert from 'assert'
import { memoizeDeep } from './index.mjs'

function createTrackingFunction(fetch = () => {}) {
  let f = async (...args) => {
    f.tracker.push(args)
    return await fetch(...args)
  }

  f.tracker = []

  return f
}

function asyncFail() {
  return new Promise((resolve, reject) => {
    setTimeout(() => reject(new Error('Error')), 1)
  })
}

it('memoizeDeep: do not call fetch while a call is still being performed', async () => {
  let fetch = createTrackingFunction(async () => {
    await new Promise(resolve => setTimeout(resolve, 10))
  })

  let f = memoizeDeep({
    defaultValue: 1,
    fetch,
    maxAge: 1
  })

  await f()

  assert.strict.deepEqual(fetch.tracker.length, 1)

  await new Promise(resolve => setTimeout(resolve, 2))

  await f()

  assert.strict.deepEqual(fetch.tracker.length, 1)
})

it('memoizeDeep: calls fetch again after maxAge time has passed', async () => {
  let fetch = createTrackingFunction()

  let f = memoizeDeep({
    defaultValue: 1,
    fetch,
    maxAge: 5
  })

  await f()

  assert.strict.deepEqual(fetch.tracker.length, 1)

  await new Promise(resolve => setTimeout(resolve, 2))

  await f()

  assert.strict.deepEqual(fetch.tracker.length, 1)

  await new Promise(resolve => setTimeout(resolve, 4))

  await f()

  assert.strict.deepEqual(fetch.tracker.length, 2)
})

it('memoizeDeep: it does not call fetch a second time with no arguments', async () => {
  let fetch = createTrackingFunction()

  let f = memoizeDeep({
    fetch
  })

  await f()

  assert.strict.deepEqual(fetch.tracker.length, 1)

  await f()

  assert.strict.deepEqual(fetch.tracker.length, 1)
})

it('memoizeDeep: it does call fetch any time a different set or arguments are passed', async () => {
  let fetch = createTrackingFunction()

  let f = memoizeDeep({
    fetch
  })

  await f()

  assert.strict.deepEqual(fetch.tracker, [[]])

  await f(1)

  assert.strict.deepEqual(fetch.tracker, [[], [1]])

  await f(1)

  assert.strict.deepEqual(fetch.tracker, [[], [1]])

  await f()

  assert.strict.deepEqual(fetch.tracker, [[], [1]])

  await f(2)

  assert.strict.deepEqual(fetch.tracker, [[], [1], [2]])

  await f(2)

  assert.strict.deepEqual(fetch.tracker, [[], [1], [2]])
})

it('memoizeDeep: defaultValue option: does not wait for fetch to finish. returns defaultValue', async () => {
  let fetch = memoizeDeep({
    defaultValue: false,
    fetch: () => true
  })

  {
    let result = await fetch()

    assert.strict.deepEqual(result, false)
  }

  {
    let result = await fetch()

    assert.strict.deepEqual(result, true)
  }
})

it('memoizeDeep: defaultValue option: returns immediately', async () => {
  let fetch = memoizeDeep({
    defaultValue: false,
    fetch: () => new Promise((resolve, reject) => {
      setTimeout(resolve, 1000)
    })
  })

  const before = Date.now()

  await fetch()

  const after = Date.now()

  assert((after - before) < 500)
})

it('memoizeDeep: it calls fetch once even when there is a default value', async () => {
  let fetch = createTrackingFunction()

  let f = memoizeDeep({
    defaultValue: 1,
    fetch
  })

  await f()

  assert.strict.deepEqual(fetch.tracker, [[]])

  await f()

  assert.strict.deepEqual(fetch.tracker, [[]])
})

it('memoizeDeep: it returns the default value on synchronous failure', async () => {
  let fetch = memoizeDeep({
    defaultValue: 1,
    fetch: () => { throw new Error('Error') }
  })

  {
    let result = await fetch()

    assert.strict.deepEqual(result, 1)
  }

  await new Promise((resolve) => setTimeout(resolve, 10))

  {
    let result = await fetch()

    assert.strict.deepEqual(result, 1)
  }
})

it('memoizeDeep: it calls onError in synchronous failure with previous value', async () => {
  const error = new Error('Error')

  const onError = createTrackingFunction()

  let fetch = memoizeDeep({
    wait: false,
    defaultValue: 1,
    fetch: () => { throw error },
    onError
  })

  await fetch()

  assert.strict.deepEqual(onError.tracker, [
    [
      error
    ]
  ])
})

it('memoizeDeep: it calls onError in synchronous failure without previous value', async () => {
  const error = new Error('Error')

  const onError = createTrackingFunction()

  let fetch = memoizeDeep({
    wait: false,
    fetch: () => { throw error },
    onError
  })

  await fetch()

  assert.strict.deepEqual(onError.tracker, [
    [
      error
    ]
  ])
})

it('memoizeDeep: it does not call onError in synchronous failure when wait is true', async () => {
  const error = new Error('Error')

  const onError = createTrackingFunction()

  let fetch = memoizeDeep({
    wait: true,
    fetch: () => { throw error },
    onError
  })

  try {
    await fetch()
  } catch (e) {
    // Ignore
  }

  assert.strict.deepEqual(onError.tracker, [])
})

it('memoizeDeep: it rejects with synchronous error when wait is true', async () => {
  const error = new Error('Error')

  const onError = createTrackingFunction()

  let fetch = memoizeDeep({
    wait: true,
    fetch: () => { throw error },
    onError
  })

  let promise = fetch()

  assert.strict.rejects(promise, error)
})

it('memoizeDeep: it returns the default value on an asynchronous failure', async () => {
  let fetch = memoizeDeep({
    wait: false,
    defaultValue: 1,
    fetch: asyncFail
  })

  {
    let result = await fetch()

    assert.strict.deepEqual(result, 1)
  }

  await new Promise((resolve) => setTimeout(resolve, 10))

  {
    let result = await fetch()

    assert.strict.deepEqual(result, 1)
  }
})

it('memoizeDeep: it calls onError in asynchronous failure with previous value', async () => {
  const error = new Error('Error')

  const onError = createTrackingFunction()

  let fetch = memoizeDeep({
    wait: false,
    defaultValue: 1,
    fetch: () => new Promise((resolve, reject) => {
      setTimeout(() => reject(error), 1)
    }),
    onError
  })

  await fetch()

  await new Promise(resolve => setTimeout(resolve, 2))

  assert.strict.deepEqual(onError.tracker, [
    [
      error
    ]
  ])
})

it('memoizeDeep: it calls onError in asynchronous failure without previous value', async () => {
  const error = new Error('Error')

  const onError = createTrackingFunction()

  let fetch = memoizeDeep({
    wait: false,
    fetch: () => new Promise((resolve, reject) => {
      setTimeout(() => reject(error), 1)
    }),
    onError
  })

  await fetch()

  await new Promise(resolve => setTimeout(resolve, 2))

  assert.strict.deepEqual(onError.tracker, [
    [
      error
    ]
  ])
})

it('memoizeDeep: it does not call onError in asynchronous failure when wait is set to true', async () => {
  const error = new Error('Error')

  const onError = createTrackingFunction()

  let fetch = memoizeDeep({
    wait: true,
    fetch: () => new Promise((resolve, reject) => {
      setTimeout(() => reject(error), 1)
    }),
    onError
  })

  try {
    await fetch()
  } catch (e) {
    // Ignore
  }

  await new Promise(resolve => setTimeout(resolve, 2))

  assert.strict.deepEqual(onError.tracker, [])
})

it('memoizeDeep: it rejects with asynchronous error when wait is true', async () => {
  const error = new Error('Error')

  const onError = createTrackingFunction()

  let fetch = memoizeDeep({
    wait: true,
    fetch: () => new Promise((resolve, reject) => {
      setTimeout(() => reject(error), 1)
    }),
    onError
  })

  let promise = fetch()

  assert.strict.rejects(promise, error)
})

it('memoizeDeep: fetch receives arguments', async () => {
  let fetch = memoizeDeep({
    fetch(...args) {
      return args
    }
  })

  let result = await fetch(1, "1")

  assert.strict.deepEqual(result, [1, "1"])
})

it('memoizeDeep: memorizes values based on arguments passed', async () => {
  let fetch = memoizeDeep({
    fetch(n) {
      return n
    }
  })

  await fetch(1)
  await fetch(2)

  {
    let result = await fetch(2)

    assert.strict.deepEqual(result, 2)
  }

  {
    let result = await fetch(1)

    assert.strict.deepEqual(result, 1)
  }
})
