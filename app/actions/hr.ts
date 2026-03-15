'use server'

import { createAdminClient } from '@/lib/supabase/admin'

// --- 1. CREATE ACCOUNT FUNCTION ---
export async function createPortalAccount(employeeId: string, email: string, tempPass: string, firstName: string) {
  const supabaseAdmin = createAdminClient()

  // 1. Create the Auth User
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: email,
    password: tempPass,
    email_confirm: true,
    user_metadata: { 
      display_name: firstName,
      role: 'employee' 
    }
  })

  if (authError) {
    console.error("Auth Error:", authError.message)
    return { error: `Auth Error: ${authError.message}` }
  }

  const userId = authData.user.id

  // 2. MANUALLY CREATE THE PROFILE (This replaces the SQL Trigger!)
  const { error: profileError } = await supabaseAdmin
    .from('profiles')
    .insert({
      id: userId,
      display_name: firstName,
      role: 'employee'
    })

  if (profileError) {
    console.error("Profile Error:", profileError.message)
    // Clean up the auth user if profile creation fails so we don't get stuck
    await supabaseAdmin.auth.admin.deleteUser(userId)
    return { error: `Profile Creation Error: ${profileError.message}` }
  }

  // 3. Link the new Auth ID to the Employee table
  const { error: dbError } = await supabaseAdmin
    .from('employees')
    .update({ 
      user_id: userId,
      status: 'probation' 
    })
    .eq('id', employeeId)

  if (dbError) {
    console.error("DB Link Error:", dbError.message)
    return { error: `Database Link Error: ${dbError.message}` }
  }

  return { success: true }
}

// --- 2. TERMINATE ACCOUNT FUNCTION ---
export async function terminatePortalAccount(employeeId: string, userId: string | null) {
  const supabaseAdmin = createAdminClient()

  // If they have a linked Auth account, delete it so they can't log in anymore
  if (userId) {
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId)
    if (authError) {
      console.error("Delete Auth Error:", authError.message)
      return { error: authError.message }
    }
  }

  // Update their status in the HR database
  const { error: dbError } = await supabaseAdmin
    .from('employees')
    .update({ 
      status: 'resigning',
      user_id: null 
    })
    .eq('id', employeeId)

  if (dbError) {
    console.error("DB Update Error:", dbError.message)
    return { error: dbError.message }
  }

  return { success: true }
}