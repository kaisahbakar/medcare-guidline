/**
 * Returns a debounced version of `fn` that delays invoking until after
 * `delay` ms have elapsed since the last call.
 *
 * @param {Function} fn
 * @param {number}   delay  milliseconds
 * @returns {{ call: Function, cancel: Function }}
 */
export function debounce(fn, delay) {
  let timer = null

  function call(...args) {
    clearTimeout(timer)
    timer = setTimeout(() => {
      timer = null
      fn(...args)
    }, delay)
  }

  function cancel() {
    clearTimeout(timer)
    timer = null
  }

  return { call, cancel }
}
