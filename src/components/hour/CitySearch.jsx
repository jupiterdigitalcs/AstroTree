'use client'

import { useEffect, useRef, useState } from 'react'
import { apiUrl } from '../../utils/apiBase.js'

export default function CitySearch({ value, onSelect }) {
  const [query,   setQuery]   = useState('')
  const [results, setResults] = useState([])
  const [open,    setOpen]    = useState(false)
  const debounceRef = useRef(null)

  useEffect(() => () => clearTimeout(debounceRef.current), [])

  function handleChange(e) {
    const q = e.target.value
    setQuery(q)
    if (value) onSelect(null)
    clearTimeout(debounceRef.current)
    if (q.trim().length < 2) {
      setResults([])
      setOpen(false)
      return
    }
    debounceRef.current = setTimeout(async () => {
      try {
        const res  = await fetch(apiUrl(`/api/hour/cities?q=${encodeURIComponent(q)}`))
        const data = await res.json()
        setResults(data.results ?? [])
        setOpen(true)
      } catch {
        setResults([])
      }
    }, 200)
  }

  function handlePick(city) {
    onSelect(city)
    setQuery('')
    setResults([])
    setOpen(false)
  }

  if (value) {
    return (
      <div className="hour-city-selected">
        <span>{value.name}{value.region ? `, ${value.region}` : ''}, {value.country}</span>
        <button type="button" className="hour-city-clear" onClick={() => onSelect(null)}>
          Change
        </button>
      </div>
    )
  }

  return (
    <div className="hour-city-search">
      <input
        className="hour-input"
        type="text"
        placeholder="Start typing a city"
        value={query}
        onChange={handleChange}
        onFocus={() => results.length && setOpen(true)}
        autoComplete="off"
      />
      {open && results.length > 0 && (
        <ul className="hour-city-results">
          {results.map((city, i) => (
            <li key={`${city.name}-${city.lat}-${i}`}>
              <button type="button" className="hour-city-option" onClick={() => handlePick(city)}>
                <span className="hour-city-name">{city.name}</span>
                <span className="hour-city-detail">
                  {city.region ? `${city.region}, ` : ''}{city.country}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
