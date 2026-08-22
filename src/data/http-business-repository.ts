import type { Attraction, Business } from '../domain/types'

export interface AsyncBusinessRepository {
  findById(id: string): Promise<Business | undefined>
  findAttraction(business: Business, attractionId: string): Promise<Attraction | undefined>
}

export class HttpBusinessRepository implements AsyncBusinessRepository {
  private readonly baseUrl: string
  private readonly request: typeof fetch

  constructor(baseUrl: string, request: typeof fetch = fetch) {
    this.baseUrl = baseUrl
    this.request = request
  }

  async findById(id: string) {
    const response = await this.request(`${this.baseUrl}/businesses/${encodeURIComponent(id)}`)
    if (response.status === 404) return undefined
    if (!response.ok) throw new Error(`Business request failed: ${response.status}`)
    return (await response.json()) as Business
  }

  async findAttraction(business: Business, attractionId: string) {
    const attraction = business.attractions.find((item) => item.id === attractionId)
    if (attraction) return attraction
    const response = await this.request(
      `${this.baseUrl}/businesses/${encodeURIComponent(business.id)}/attractions/${encodeURIComponent(attractionId)}`,
    )
    if (response.status === 404) return undefined
    if (!response.ok) throw new Error(`Attraction request failed: ${response.status}`)
    return (await response.json()) as Attraction
  }
}
