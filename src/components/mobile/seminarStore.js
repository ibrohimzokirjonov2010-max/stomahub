import { useSyncExternalStore } from 'react'

const KEY = 'stomahub-seminars'
const SEED_SAVED = ['mikroskop-endo', 'aligner']
const listeners = new Set()

function read() {
  try {
    const v = JSON.parse(localStorage.getItem(KEY))
    return { saved: v?.saved || SEED_SAVED, registered: v?.registered || {} }
  } catch {
    return { saved: SEED_SAVED, registered: {} }
  }
}

let state = read()

function write(next) {
  state = next
  localStorage.setItem(KEY, JSON.stringify(next))
  listeners.forEach((l) => l())
}

const subscribe = (l) => {
  listeners.add(l)
  return () => listeners.delete(l)
}

export function toggleSaved(id) {
  const on = state.saved.includes(id)
  write({ ...state, saved: on ? state.saved.filter((x) => x !== id) : [...state.saved, id] })
  return !on
}

export function register(id, info) {
  write({ ...state, registered: { ...state.registered, [id]: info } })
}

export function useSeminarStore() {
  return useSyncExternalStore(subscribe, () => state)
}
