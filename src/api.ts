import PocketBase from 'pocketbase'

export const pb = new PocketBase('http://localhost:8090')

export function isLoggedIn(): boolean {
  return !!pb.authStore.record
}
