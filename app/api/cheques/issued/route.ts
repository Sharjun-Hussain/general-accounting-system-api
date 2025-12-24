import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'
import { keysToSnake, keysToCamel } from '@/lib/utils'

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    let query = supabase
        .from('issued_cheques')
        .select('*')
        .order('issue_date', { ascending: false })

    if (status) query = query.eq('status', status)

    const { data, error } = await query

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data: keysToCamel(data) })
}

export async function POST(request: Request) {
    const body = await request.json()
    const { data, error } = await supabase
        .from('issued_cheques')
        .insert(keysToSnake(body))
        .select()
        .single()

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data: keysToCamel(data) })
}
