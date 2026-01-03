export type QuestionStatus = 'pending' | 'visible' | 'hidden'

export interface Question {
  id: number
  projectId: string
  viewerId: string | null
  displayName: string
  content: string
  status: QuestionStatus
  isHiddenByStreamer: boolean
  createdAt: Date | string
  updatedAt: Date | string
}

export interface QuestionWithProject extends Question {
  project: { id: string, name: string }
}

export interface InboxResponse {
  questions: QuestionWithProject[]
  nextCursor: string | null
}
