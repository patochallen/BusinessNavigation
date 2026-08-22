import { businesses } from "./demo-data";
import type { Business } from "./types";

export interface BusinessRepository {
  findById(id: string): Business | undefined;
  findAttraction(
    business: Business,
    attractionId: string,
  ): Business["attractions"][number] | undefined;
}

export const demoBusinessRepository: BusinessRepository = {
  findById: (id) => businesses.find((business) => business.id === id),
  findAttraction: (business, attractionId) =>
    business.attractions.find((attraction) => attraction.id === attractionId),
};
