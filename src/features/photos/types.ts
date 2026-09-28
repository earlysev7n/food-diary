// Purpose: Define photo metadata and signed display URLs.

export interface Photo {
  id: string
  space_id: string
  visit_id: string
  dish_id: string | null
  storage_path: string
  uploaded_by: string
  created_at: string
}

export interface PhotoWithUrl extends Photo {
  signedUrl: string
}