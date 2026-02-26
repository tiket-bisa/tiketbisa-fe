/**
 * EventDto — Raw shape returned by GET /event → data.event_list[]
 *
 * Per API contract, each event only has: id, name, brand, description.
 * Additional UI fields (image, date, location, price) will be added
 * once the backend extends the contract.
 */
export interface EventDto {
  id: string;
  name: string;
  brand: string;
  description: string;
}
