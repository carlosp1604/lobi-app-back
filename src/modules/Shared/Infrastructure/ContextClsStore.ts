import { ClsStore } from 'nestjs-cls'

export interface ContextClsStore extends ClsStore {
  requestId: string
  ip: string
  ua: string
}
