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

/**
 * Resolves a $ref pointer in the OpenAPI document
 */
const resolveRef = (data: any, ref: string): any => {
  if (!ref.startsWith('#/')) return null
  const parts = ref.split('/').slice(1)
  let current = data
  for (const part of parts) {
    if (current[part] === undefined) return null
    current = current[part]
  }
  return current
}

/**
 * Generates a sample JSON object from an OpenAPI schema
 */
const schemaToSampleJson = (data: any, schema: any, visited = new Set<string>()): any => {
  if (!schema) return null

  // Handle $ref
  if (schema.$ref) {
    const refPath = schema.$ref
    if (visited.has(refPath)) return {} // Avoid infinite recursion
    visited.add(refPath)
    const resolved = resolveRef(data, refPath)
    return schemaToSampleJson(data, resolved, visited)
  }

  // Use example or default if available
  if (schema.example !== undefined) return schema.example
  if (schema.default !== undefined) return schema.default

  // Handle combined schemas (just take the first one for simplicity)
  if (schema.allOf) {
    const combined = {}
    schema.allOf.forEach((s: any) => {
      Object.assign(combined, schemaToSampleJson(data, s, visited))
    })
    return combined
  }
  if (schema.oneOf || schema.anyOf) {
    return schemaToSampleJson(data, (schema.oneOf || schema.anyOf)[0], visited)
  }

  // Base types
  const type = schema.type
  if (type === 'string') {
    if (schema.format === 'date-time') return new Date().toISOString()
    if (schema.format === 'date') return new Date().toISOString().split('T')[0]
    return ""
  }
  if (type === 'number' || type === 'integer') return 0
  if (type === 'boolean') return false
  
  if (type === 'array') {
    return [schemaToSampleJson(data, schema.items, visited)]
  }

  if (type === 'object' || schema.properties) {
    const obj: any = {}
    if (schema.properties) {
      Object.keys(schema.properties).forEach(key => {
        obj[key] = schemaToSampleJson(data, schema.properties[key], visited)
      })
    }
    return obj
  }

  return null
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

          // 1. Extract Headers (Content-Type)
          let contentType = 'application/json'
          if (op.consumes && Array.isArray(op.consumes) && op.consumes.length > 0) {
            contentType = op.consumes[0]
          } else if (op.requestBody?.content) {
            const types = Object.keys(op.requestBody.content)
            if (types.length > 0) {
              contentType = types[0]
            }
          }
          
          if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
            request.headers['Content-Type'] = contentType
          }

          // 2. Generate Sample Body
          if (op.requestBody?.content?.[contentType]?.schema) {
            const schema = op.requestBody.content[contentType].schema
            const sampleObj = schemaToSampleJson(data, schema)
            request.body = JSON.stringify(sampleObj, null, 2)
          } else if (op.parameters) {
            // Swagger 2.0 / Legacy parameter in body
            const bodyParam = op.parameters.find((p: any) => p.in === 'body')
            if (bodyParam && bodyParam.schema) {
              const sampleObj = schemaToSampleJson(data, bodyParam.schema)
              request.body = JSON.stringify(sampleObj, null, 2)
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
