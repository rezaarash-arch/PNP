import { supabase } from './client'
import type { Program, ProgramRule, ProgramWithRules } from './types'

/**
 * Fetch all programs with their current (active) rules.
 * Current rules are those where effective_until IS NULL.
 */
export async function getAllPrograms(): Promise<ProgramWithRules[]> {
  const { data: programs, error: progError } = await supabase
    .from('programs')
    .select('*')
    .order('province_code')

  if (progError) {
    throw new Error(`Failed to fetch programs: ${progError.message}`)
  }

  if (!programs || programs.length === 0) {
    return []
  }

  // Fetch current rules for all programs in one query
  const { data: rules, error: rulesError } = await supabase
    .from('program_rules')
    .select('*')
    .is('effective_until', null)

  if (rulesError) {
    throw new Error(`Failed to fetch program rules: ${rulesError.message}`)
  }

  // Build a map of program_id -> current rules
  const rulesMap = new Map<string, ProgramRule>()
  if (rules) {
    for (const rule of rules) {
      rulesMap.set(rule.program_id, rule as ProgramRule)
    }
  }

  return (programs as Program[]).map((program) => ({
    ...program,
    current_rules: rulesMap.get(program.id) ?? null,
  }))
}

/**
 * Fetch a single program by ID with its current rules.
 */
export async function getProgramById(id: string): Promise<ProgramWithRules | null> {
  const { data: program, error: progError } = await supabase
    .from('programs')
    .select('*')
    .eq('id', id)
    .single()

  if (progError) {
    if (progError.code === 'PGRST116') {
      // Row not found
      return null
    }
    throw new Error(`Failed to fetch program ${id}: ${progError.message}`)
  }

  const currentRules = await getCurrentRules(id)

  return {
    ...(program as Program),
    current_rules: currentRules,
  }
}

/**
 * Fetch the current (effective_until IS NULL) rules for a given program.
 */
export async function getCurrentRules(programId: string): Promise<ProgramRule | null> {
  const { data, error } = await supabase
    .from('program_rules')
    .select('*')
    .eq('program_id', programId)
    .is('effective_until', null)
    .order('version', { ascending: false })
    .limit(1)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      // No current rules found
      return null
    }
    throw new Error(`Failed to fetch rules for ${programId}: ${error.message}`)
  }

  return data as ProgramRule
}
