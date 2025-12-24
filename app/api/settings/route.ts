import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'
import { keysToSnake, keysToCamel } from '@/lib/utils'

export async function GET() {
    const { data, error } = await supabase
        .from('organization_settings')
        .select('*')
        .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows found"
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data: keysToCamel(data) || {} })
}

export async function POST(request: Request) {
    const body = await request.json()

    // Upsert settings (assuming single row for now)
    const { data, error } = await supabase
        .from('organization_settings')
        .upsert(keysToSnake({ id: 1, ...body })) // Hardcoded ID 1 for single org
        .select()
        .single()

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data: keysToCamel(data) })
}
