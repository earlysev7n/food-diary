export interface Space {
  id: string
  name: string
  created_by: string
  created_at: string
  invite_code: string
}

export interface SpaceMember {
  id: string
  space_id: string
  user_id: string
  role: 'owner' | 'member'
  joined_at: string
}

export interface SpaceMemberProfile extends SpaceMember {
  display_name: string | null
  avatar_url: string | null
}
