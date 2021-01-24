import React from 'react'

export function usePersistedState(key, defaultValue) {
  const [state, setState] = React.useState(() => {
    try {
      return JSON.parse(localStorage.getItem(key)) || defaultValue
    } catch {
      return defaultValue
    }
  })
  React.useEffect(() => {
    localStorage.setItem(key, JSON.stringify(state))
  }, [key, state])
  return [state, setState]
}
