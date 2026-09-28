// Purpose: Upload, load, and remove private visit photos.

import { supabase } from '../../lib/supabase'
import type { Photo, PhotoWithUrl } from './types'

const PHOTO_BUCKET = 'visit-photos'
const MAX_FILE_SIZE = 10 * 1024 * 1024

export type UploadVisitPhotoInput = {
  file: File
  spaceId: string
  visitId: string
  uploadedBy: string
}

export async function uploadVisitPhoto(
  input: UploadVisitPhotoInput,
): Promise<PhotoWithUrl> {
  if (!input.file.type.startsWith('image/')) {
    throw new Error('Please choose an image file.')
  }

  if (input.file.size > MAX_FILE_SIZE) {
    throw new Error('Images must be smaller than 10 MB.')
  }

  // TODO: Add browser-side resize/compression before upload later.
  const extension =
    input.file.name.split('.').pop()?.toLowerCase() ?? 'jpg'

  // The first folder is the Space ID used by Storage RLS policies.
  const storagePath =
    `${input.spaceId}/${input.visitId}/` +
    `${crypto.randomUUID()}.${extension}`

  const { error: uploadError } = await supabase.storage
    .from(PHOTO_BUCKET)
    .upload(storagePath, input.file, {
      cacheControl: '3600',
      contentType: input.file.type,
      upsert: false,
    })

  if (uploadError) {
    throw uploadError
  }

  const { data, error: photoError } = await supabase
    .from('photos')
    .insert({
      space_id: input.spaceId,
      visit_id: input.visitId,
      storage_path: storagePath,
      uploaded_by: input.uploadedBy,
    })
    .select()
    .single()

  if (photoError) {
    // Remove the Storage file if the database insert fails.
    await supabase.storage
      .from(PHOTO_BUCKET)
      .remove([storagePath])

    throw photoError
  }

  const photo = data as Photo

  const { data: signedData, error: signedError } =
    await supabase.storage
      .from(PHOTO_BUCKET)
      .createSignedUrl(storagePath, 3600)

  if (signedError) {
    throw signedError
  }

  return {
    ...photo,
    signedUrl: signedData.signedUrl,
  }
}

export async function getVisitPhotos(
  spaceId: string,
  visitId: string,
): Promise<PhotoWithUrl[]> {
  // Load only photo records belonging to this Space and visit.
  const { data, error } = await supabase
    .from('photos')
    .select('*')
    .eq('space_id', spaceId)
    .eq('visit_id', visitId)
    .order('created_at', { ascending: true })

  if (error) {
    throw error
  }

  const photos = (data ?? []) as Photo[]

  // Private files need temporary signed URLs for display.
  return Promise.all(
    photos.map(async (photo) => {
      const { data: signedData, error: signedError } =
        await supabase.storage
          .from(PHOTO_BUCKET)
          .createSignedUrl(photo.storage_path, 3600)

      if (signedError) {
        throw signedError
      }

      return {
        ...photo,
        signedUrl: signedData.signedUrl,
      }
    }),
  )
}