import type { ObjectId } from "mongodb"

export const SANGEET_PERFORMANCE_TYPES = [
  "male_group_dance",
  "female_group_dance",
  "mixed_group_dance",
  "couple_dance",
  "male_solo",
  "female_solo",
  "other_talent",
] as const

export type SangeetPerformanceType = (typeof SANGEET_PERFORMANCE_TYPES)[number]

export const SANGEET_GANGS = ["bride", "groom"] as const

export type SangeetGang = (typeof SANGEET_GANGS)[number]

export const SANGEET_DURATIONS = [1, 2, 3] as const

export type SangeetDurationMinutes = (typeof SANGEET_DURATIONS)[number]

export interface SangeetPerformance {
  _id?: ObjectId | string
  /** Secret token for public edit/delete from the submitting browser. */
  submissionToken?: string
  title: string
  performerCount: number
  performerNames: string
  performanceType: SangeetPerformanceType
  gang: SangeetGang
  songs: string
  durationMinutes: SangeetDurationMinutes
  createdAt: Date | string
  updatedAt: Date | string
}

export interface SangeetPerformancePublic {
  id: string
  title: string
  performerCount: number
  performerNames: string
  performanceType: SangeetPerformanceType
  gang: SangeetGang
  songs: string
  durationMinutes: SangeetDurationMinutes
  createdAt: string
  updatedAt: string
}

export interface CreateSangeetPerformanceRequest {
  title: string
  performerCount: number
  performerNames: string
  performanceType: SangeetPerformanceType
  gang: SangeetGang
  songs: string
  durationMinutes: SangeetDurationMinutes
}

export type UpdateSangeetPerformanceRequest = CreateSangeetPerformanceRequest

/** POST response only — includes token to store in localStorage. */
export interface SangeetPerformanceCreated extends SangeetPerformancePublic {
  submissionToken: string
}

export interface PublicSangeetPerformanceMutationRequest
  extends UpdateSangeetPerformanceRequest {
  submissionToken: string
}

export interface SangeetPerformanceListResponse {
  items: SangeetPerformancePublic[]
  page: number
  pageSize: number
  total: number
  totalPages: number
}
