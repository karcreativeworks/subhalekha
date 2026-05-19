import type { ObjectId } from "mongodb"

/**
 * Site users (not admin accounts). Used for tagging people in media;
 * future sign-in will let users view/upload their own photos.
 */
export interface User {
  _id?: ObjectId
  id: string
  displayName: string
  clientId: string
  notes?: string
  createdAt: Date
  updatedAt: Date
}

export interface CreateUserRequest {
  id: string
  displayName: string
  notes?: string
}
