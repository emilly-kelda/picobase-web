import { openDB } from 'idb'

const DB_NAME = 'picobase-offline'
const STORE   = 'session-queue'

async function getDB() {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id' })
      }
    },
  })
}

export interface QueuedSession {
  id:           string
  token:        string
  checkin_id:   string
  duration_min: number
  price:        number
  queued_at:    string
  student_name: string
}

export async function enqueueSession(session: QueuedSession) {
  const db = await getDB()
  await db.put(STORE, session)
}

export async function getQueuedSessions(): Promise<QueuedSession[]> {
  const db = await getDB()
  return db.getAll(STORE)
}

export async function removeQueuedSession(id: string) {
  const db = await getDB()
  await db.delete(STORE, id)
}

export async function getQueueCount(): Promise<number> {
  const db = await getDB()
  return db.count(STORE)
}


