export interface SavedLocation {
  id: string;
  label: string;
  address: string;
  lat: number;
  lng: number;
  is_favorite: boolean;
  last_used_at: string;
  use_count: number;
}
