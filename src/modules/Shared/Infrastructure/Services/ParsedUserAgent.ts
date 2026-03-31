export interface ParsedUserAgent {
  raw: string
  browser: {
    name: string | null
    version: string | null
  }
  os: {
    name: string | null
    version: string | null
  }
  hardware: {
    type: string | null
    vendor: string | null
    model: string | null
  }
}
