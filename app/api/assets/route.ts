import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const status = searchParams.get('status')
    const location = searchParams.get('location')

    let query = supabase
        .from('assets')
        .select('*')
        .order('created_at', { ascending: false })

    if (category) query = query.eq('category', category)
    if (status) query = query.eq('status', status)
    if (location) query = query.eq('location', location)

    const { data, error } = await query

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data })
}

export async function POST(request: Request) {
    const body = await request.json()
    const { data, error } = await supabase
        .from('assets')
        .insert(body)
        .select()
        .single()

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data })
}
