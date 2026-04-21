export class ResourceUrlMother {
  static readonly INVALID_FORMAT_CASES = [
    '',
    'not-a-url',
    'http://',
    'ftp://my-server.com/icon.png',
    'file:///etc/passwd',
    'https://' + 'a'.repeat(2049),
  ]

  static randomString(): string {
    const protocols = ['http', 'https']
    const domain = 'example.com'
    const asset = 'dog.jpg'

    const folders = ['assets', 'icons', 'uploads', 'sports', 'v1', 'media']
    const randomFolder = folders[Math.floor(Math.random() * folders.length)]
    const randomSubFolder = Math.random() > 0.5 ? `${Math.random().toString(36).substring(7)}/` : ''

    const protocol = protocols[Math.floor(Math.random() * protocols.length)]
    const path = `${randomFolder}/${randomSubFolder}${asset}`

    return `${protocol}://${domain}/${path}`
  }

  static validString(): string {
    return 'https://example.com/assets/dog.png'
  }
}
