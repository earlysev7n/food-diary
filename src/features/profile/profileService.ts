// Purpose: Read and save the signed-in user's private profile.

import { supabase } from '../../lib/supabase'

const AVATAR_BUCKET = 'avatars'
const MAX_AVATAR_SIZE = 5 * 1024 * 1024

export interface UserProfile {
  id: string
  display_name: string | null
  avatar_url: string | null
  created_at: string
}

export type SaveProfileInput = {
  userId: string
  displayName: string
  currentAvatarUrl?: string | null
  avatarFile?: File | null
}

export async function getOwnProfile(
  userId: string,
): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, display_name, avatar_url, created_at')
    .eq('id', userId)
    .maybeSingle()

  if (error) {
    throw error
  }

  return data as UserProfile | null
}

export async function saveOwnProfile(
  input: SaveProfileInput,
): Promise<UserProfile> {
  const displayName = input.displayName.trim()

  if (!displayName) {
    throw new Error('Please enter your name.')
  }

  if (displayName.length > 60) {
    throw new Error('Your name must be 60 characters or fewer.')
  }

  let avatarUrl = input.currentAvatarUrl ?? null
  let uploadedPath: string | null = null

  if (input.avatarFile) {
    if (!input.avatarFile.type.startsWith('image/')) {
      throw new Error('Please choose an image file for your profile photo.')
    }

    if (input.avatarFile.size > MAX_AVATAR_SIZE) {
      throw new Error('Profile photos must be smaller than 5 MB.')
    }

    const extension =
      input.avatarFile.name.split('.').pop()?.toLowerCase() ?? 'jpg'
    uploadedPath = `${input.userId}/${crypto.randomUUID()}.${extension}`

    const { error: uploadError } = await supabase.storage
      .from(AVATAR_BUCKET)
      .upload(uploadedPath, input.avatarFile, {
        cacheControl: '3600',
        contentType: input.avatarFile.type,
        upsert: false,
      })

    if (uploadError) {
      throw uploadError
    }

    avatarUrl = supabase.storage
      .from(AVATAR_BUCKET)
      .getPublicUrl(uploadedPath).data.publicUrl
  }

  const { data, error } = await supabase
    .from('profiles')
    .upsert(
      {
        id: input.userId,
        display_name: displayName,
        avatar_url: avatarUrl,
      },
      { onConflict: 'id' },
    )
    .select('id, display_name, avatar_url, created_at')
    .single()

  if (error) {
    if (uploadedPath) {
      await supabase.storage.from(AVATAR_BUCKET).remove([uploadedPath])
    }

    throw error
  }

  return data as UserProfile
}
