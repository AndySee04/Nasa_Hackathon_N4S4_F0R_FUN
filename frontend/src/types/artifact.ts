/**
 * Data model for every spacecraft, lander, rover or probe in the museum.
 * The same JSON file is copied to backend/app/data/artifacts.json so that
 * Astro AI answers from exactly the facts the website shows.
 */

export type World = 'moon' | 'mars' | 'deep-space'

/** Clearly separated statuses, as required by the project brief. */
export type ArtifactStatus =
  | 'operational' // still working and sending data
  | 'inactive' // left in place, no longer working (e.g. Apollo hardware)
  | 'decommissioned' // mission ended on purpose (e.g. Cassini's final plunge)
  | 'lost-contact' // stopped answering Earth
  | 'unknown'

export type HardwareType =
  | 'descent-stage'
  | 'lander'
  | 'rover'
  | 'impactor'
  | 'probe'
  | 'orbiter'
  | 'helicopter'

export type TimelineKind =
  | 'launch'
  | 'journey'
  | 'arrival'
  | 'operations'
  | 'discovery'
  | 'end'
  | 'status'

export interface TimelineEvent {
  /** ISO date (YYYY-MM-DD) or month precision (YYYY-MM) when the exact day is uncertain. */
  date: string
  label: string
  kind: TimelineKind
}

export interface Instrument {
  name: string
  purpose: string
}

export interface Source {
  title: string
  url: string
}

export interface ArtifactLocation {
  description: string
  /** Latitude in degrees, north positive. Approximate. */
  lat?: number
  /** Longitude in degrees, east positive (-180 to 180). Approximate. */
  lon?: number
}

export interface Artifact {
  id: string
  name: string
  missionName: string
  agency: string
  world: World
  hardwareType: HardwareType
  status: ArtifactStatus
  statusNote: string
  launchDate: string
  arrivalDate?: string
  endDate?: string
  location: ArtifactLocation
  /** For spacecraft that are still travelling: where they are heading. */
  trajectory?: string
  /** One-line, child-friendly hook shown on cards. */
  tagline: string
  /** Story paragraphs, told for curious 8–12-year-olds. */
  story: string[]
  objectives: string[]
  instruments: Instrument[]
  discoveries: string[]
  timeline: TimelineEvent[]
  funFact: string
  /** Search phrase for the NASA Image and Video Library. */
  imageQuery: string
  sources: Source[]
  /** Date (YYYY-MM-DD) the facts were last checked against the NASA sources. */
  lastVerified?: string
}

export const STATUS_LABELS: Record<ArtifactStatus, string> = {
  operational: 'Still working',
  inactive: 'Inactive',
  decommissioned: 'Decommissioned',
  'lost-contact': 'Lost contact',
  unknown: 'Unknown',
}

export const HARDWARE_LABELS: Record<HardwareType, string> = {
  'descent-stage': 'Descent stage',
  lander: 'Lander',
  rover: 'Rover',
  impactor: 'Impactor',
  probe: 'Probe',
  orbiter: 'Orbiter',
  helicopter: 'Helicopter',
}

export const WORLD_LABELS: Record<World, string> = {
  moon: 'Moon',
  mars: 'Mars',
  'deep-space': 'Deep space',
}
