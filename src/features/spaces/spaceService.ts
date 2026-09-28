import { supabase } from '../../lib/supabase'
import type {
  Space,
  SpaceMember,
  SpaceMemberProfile,
} from './types'

export async function createSpace(
  name: string,
  userId: string,
): Promise<Space> {
  const trimmedName = name.trim()

  if (!trimmedName) {
    throw new Error('Space name cannot be empty.')
  }

  const { data: spaceData, error: spaceError } = await supabase
    .from('spaces')
    .insert({
      name: trimmedName,
      created_by: userId,
    })
    .select()
    .single()

  if (spaceError) {
    throw spaceError
  }

  const space = spaceData as Space

  const { error: memberError } = await supabase
    .from('space_members')
    .insert({
      space_id: space.id,
      user_id: userId,
      role: 'owner',
    })

  if (memberError) {
    throw memberError
  }

  return space
}

export async function getMySpaces(): Promise<Space[]> {
  const { data, error } = await supabase
    .from('space_members')
    .select('spaces(id, name, created_by, created_at, invite_code)')
    .order('joined_at', { ascending: false })

  if (error) {
    throw error
  }

  return (data ?? []).flatMap((membership) => membership.spaces)
}

export async function joinSpaceByInviteCode(
  inputCode: string,
): Promise<Space> {
  const code = inputCode.trim().toLowerCase()

  if (!code) {
    throw new Error('Invite code cannot be empty.')
  }

  const { data, error } = await supabase.rpc(
    'join_space_by_invite_code',
    {
      input_code: code,
    },
  )

  if (error) {
    throw error
  }

  const joinedSpace = Array.isArray(data) ? data[0] : data

  if (!joinedSpace) {
    throw new Error('The Space could not be found.')
  }

  return joinedSpace as Space
}

export async function getSpaceMembers(
  spaceId: string,
): Promise<SpaceMemberProfile[]> {
  const { data: membershipData, error: membershipError } =
    await supabase
      .from('space_members')
      .select('id, space_id, user_id, role, joined_at')
      .eq('space_id', spaceId)
      .order('joined_at', { ascending: true })

  if (membershipError) {
    throw membershipError
  }

  const memberships = (membershipData ?? []) as SpaceMember[]
  const userIds = memberships.map((member) => member.user_id)

  if (userIds.length === 0) {
    return []
  }

  const { data: profileData, error: profileError } = await supabase
    .from('profiles')
    .select('id, username, display_name, avatar_url')
    .in('id', userIds)

  if (profileError) {
    throw profileError
  }

  const profiles = (profileData ?? []) as Array<{
    id: string
    username: string | null
    display_name: string | null
    avatar_url: string | null
  }>

  const profilesById = new Map(
    profiles.map((profile) => [profile.id, profile]),
  )

  return memberships.map((member) => {
    const profile = profilesById.get(member.user_id)

    return {
      ...member,
      username: profile?.username ?? null,
      display_name: profile?.display_name ?? null,
      avatar_url: profile?.avatar_url ?? null,
    }
  })
}