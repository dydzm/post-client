import type { ApiRequest } from '../stores/types'
import yaml from 'js-yaml'

export interface OpenApiMetadata {
  title: string
  version: string
  servers: string[]
  endpoints: {
    path: string
    method: string
    summary?: string
    operationId?: string
  }[]
  rawContent: any
}

export const parseOpenApi = (content: string): OpenApiMetadata | null => {
  try {
    let data: any
    try {
      data = JSON.parse(content)
    } catch (e) {
      data = yaml.load(content)
    }
    
    if (!data) return null

    // Check if it's OpenAPI 2.0 (Swagger) or 3.x
    const isOpenApi3 = data.openapi && (String(data.openapi).startsWith('3.0') || String(data.openapi).startsWith('3.1'))
    const isSwagger2 = data.swagger === '2.0'

    if (!isOpenApi3 && !isSwagger2) return null

    const metadata: OpenApiMetadata = {
      title: data.info?.title || 'Imported API',
      version: data.info?.version || '1.0.0',
      servers: [],
      endpoints: [],
      rawContent: data
    }

    // Extract Servers
    if (isOpenApi3) {
      metadata.servers = data.servers?.map((s: any) => s.url) || []
    } else if (isSwagger2) {
      const schemes = data.schemes || ['http']
      const host = data.host || ''
      const basePath = data.basePath || ''
      metadata.servers = schemes.map((s: string) => `${s}://${host}${basePath}`)
    }

    // Extract Endpoints
    if (data.paths) {
      Object.keys(data.paths).forEach(path => {
        const methods = data.paths[path]
        Object.keys(methods).forEach(method => {
          if (['get', 'post', 'put', 'delete', 'patch', 'options', 'head'].includes(method.toLowerCase())) {
            const op = methods[method]
            metadata.endpoints.push({
              path,
              method: method.toUpperCase(),
              summary: op.summary || op.description,
              operationId: op.operationId
            })
          }
        })
      })
    }

    return metadata
  } catch (e) {
    console.error('Failed to parse OpenAPI:', e)
    return null
  }
}

export const convertToApiRequests = (data: any, selectedServer: string): { name: string, request: ApiRequest }[] => {
  const requests: { name: string, request: ApiRequest }[] = []
  
  if (data.paths) {
    Object.keys(data.paths).forEach(path => {
      const methods = data.paths[path]
      Object.keys(methods).forEach(method => {
        if (['get', 'post', 'put', 'delete', 'patch'].includes(method.toLowerCase())) {
          const op = methods[method]
          
          // Basic request template
          const request: ApiRequest = {
            method: method.toUpperCase(),
            url: `{baseUrl}${path}`,
            headers: {},
            query: {},
            body: '',
            bodyType: 'json',
            files: [],
            auth: { type: 'none' }
          }

          // Try to extract some headers (like Content-Type)
          if (op.consumes && Array.isArray(op.consumes) && op.consumes.length > 0) {
            request.headers['Content-Type'] = op.consumes[0]
          } else if (op.requestBody?.content) {
            const types = Object.keys(op.requestBody.content)
            if (types.length > 0) {
              request.headers['Content-Type'] = types[0]
            }
          }

          requests.push({
            name: op.summary || op.operationId || `${method.toUpperCase()} ${path}`,
            request
          })
        }
      })
    })
  }

  return requests
}
