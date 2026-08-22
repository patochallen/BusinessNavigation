import { businesses } from './demo-data'
import type { Business } from './types'
import { findAttraction, findBusiness } from './use-cases'

export interface BusinessRepository {
  findById(id: string): Business | undefined
  findAttraction(
    business: Business,
    attractionId: string,
  ): Business['attractions'][number] | undefined
}

export const demoBusinessRepository: BusinessRepository = {
  findById: (id) => findBusiness(businesses, id),
  findAttraction: (business, attractionId) => findAttraction(business, attractionId),
}
