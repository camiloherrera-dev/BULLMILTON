import { supabase } from '../lib/supabase/client'
import { assertOk, unwrap, unwrapMaybe } from '../lib/errors'
import type { Category, CategoryKind, Household, Member, Role } from '../types/domain'

export interface HouseholdContextData {
  household: Household
  members: Member[]
}

/** Household activo del usuario actual (o null si todavía no pertenece a ninguno). */
export async function fetchMyHousehold(userId: string): Promise<HouseholdContextData | null> {
  const membership = unwrapMaybe(
    await supabase
      .from('household_members')
      .select('household_id, left_at')
      .eq('user_id', userId)
      .is('left_at', null)
      .maybeSingle(),
  )
  if (!membership) return null

  const household = unwrap(
    await supabase
      .from('households')
      .select('id, name, currency')
      .eq('id', membership.household_id)
      .single(),
  )

  const rows = unwrap(
    await supabase
      .from('household_members')
      .select('user_id, role, joined_at, left_at, profiles(display_name)')
      .eq('household_id', household.id)
      .order('joined_at'),
  )

  const members: Member[] = rows.map((row) => ({
    userId: row.user_id,
    displayName: row.profiles?.display_name ?? 'Sin nombre',
    role: row.role as Role,
    joinedAt: row.joined_at,
    active: row.left_at === null,
  }))

  return { household, members }
}

export async function fetchMyProfile(userId: string): Promise<{ displayName: string }> {
  const profile = unwrap(
    await supabase.from('profiles').select('display_name').eq('id', userId).single(),
  )
  return { displayName: profile.display_name }
}

export async function updateDisplayName(userId: string, displayName: string): Promise<void> {
  assertOk(
    await supabase.from('profiles').update({ display_name: displayName.trim() }).eq('id', userId),
  )
}

export async function createHousehold(name: string): Promise<string> {
  return unwrap(await supabase.rpc('create_household', { p_name: name }))
}

export async function renameHousehold(householdId: string, name: string): Promise<void> {
  assertOk(await supabase.from('households').update({ name: name.trim() }).eq('id', householdId))
}

export interface Invitation {
  id: string
  code: string
  expiresAt: string
  usedAt: string | null
}

export async function fetchInvitations(householdId: string): Promise<Invitation[]> {
  const rows = unwrap(
    await supabase
      .from('invitations')
      .select('id, code, expires_at, used_at')
      .eq('household_id', householdId)
      .order('created_at', { ascending: false }),
  )
  return rows.map((row) => ({
    id: row.id,
    code: row.code,
    expiresAt: row.expires_at,
    usedAt: row.used_at,
  }))
}

export async function createInvitation(
  householdId: string,
): Promise<{ code: string; expiresAt: string }> {
  const rows = unwrap(await supabase.rpc('create_invitation', { p_household_id: householdId }))
  const [row] = rows
  return { code: row.code, expiresAt: row.expires_at }
}

export async function revokeInvitation(invitationId: string): Promise<void> {
  assertOk(await supabase.from('invitations').delete().eq('id', invitationId))
}

export async function acceptInvitation(code: string): Promise<string> {
  return unwrap(await supabase.rpc('accept_invitation', { p_code: code }))
}

export async function leaveHousehold(householdId: string): Promise<void> {
  assertOk(await supabase.rpc('leave_household', { p_household_id: householdId }))
}

// ---------------------------------------------------------------------------
// Categorías
// ---------------------------------------------------------------------------

export async function fetchCategories(householdId: string): Promise<Category[]> {
  const rows = unwrap(
    await supabase
      .from('categories')
      .select('id, kind, name, icon, archived_at')
      .eq('household_id', householdId)
      .order('name'),
  )
  return rows.map((row) => ({
    id: row.id,
    kind: row.kind as CategoryKind,
    name: row.name,
    icon: row.icon,
    archivedAt: row.archived_at,
  }))
}

export async function createCategory(
  householdId: string,
  kind: CategoryKind,
  name: string,
  icon: string | null,
): Promise<void> {
  assertOk(
    await supabase
      .from('categories')
      .insert({ household_id: householdId, kind, name: name.trim(), icon }),
  )
}

export async function updateCategory(
  categoryId: string,
  changes: { name?: string; icon?: string | null; archived?: boolean },
): Promise<void> {
  assertOk(
    await supabase
      .from('categories')
      .update({
        ...(changes.name !== undefined && { name: changes.name.trim() }),
        ...(changes.icon !== undefined && { icon: changes.icon }),
        ...(changes.archived !== undefined && {
          archived_at: changes.archived ? new Date().toISOString() : null,
        }),
      })
      .eq('id', categoryId),
  )
}

export async function deleteCategory(categoryId: string): Promise<void> {
  assertOk(await supabase.from('categories').delete().eq('id', categoryId))
}
