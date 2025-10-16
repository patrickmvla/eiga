"use client"

import { useEffect, useMemo, useState } from "react"

const getNextMondayMidnight = (base = new Date()) => {
  const d = new Date(base)
  const day = d.getDay() // 0..6 (Sun..Sat)
  const diff = (8 - day) % 7 || 7 // days until next Monday
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + diff)
  return d
}

const formatTimeLeft = (ms: number) => {
  if (ms <= 0) return "Selection opens soon"
  const s = Math.floor(ms / 1000)
  const d = Math.floor(s / 86400)
  const h = Math.floor((s % 86400) / 3600)
  const m = Math.floor((s % 3600) / 60)
  return `${d}d ${h}h ${m}m`
}

export const HeroCountdown = () => {
  const target = useMemo(() => getNextMondayMidnight(), [])
  const [left, setLeft] = useState(() => target.getTime() - Date.now())

  useEffect(() => {
    const id = setInterval(() => setLeft(target.getTime() - Date.now()), 30_000)
    return () => clearInterval(id)
  }, [target])

  return <span>New selection in {formatTimeLeft(left)}</span>
}