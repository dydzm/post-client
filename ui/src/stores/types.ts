export interface ApiRequest {
  method: string
  url: string
  headers: Record<string, string>
  query: Record<string, string>
  body: string
  bodyType: 'json' | 'multipart' | 'raw'
  files: { key: string; name: string; content: string; type: string }[]
  auth: {
    type: 'none' | 'bearer' | 'basic'
    token?: string
    username?: string
    password?: string
  }
}

export interface ApiResponse {
  status: number
  headers: Record<string, string>
  body: string
  time_ms: number
}
