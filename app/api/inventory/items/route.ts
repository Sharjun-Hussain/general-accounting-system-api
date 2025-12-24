import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const status = searchParams.get('status')

    let query = supabase
        .from('inventory_items')
        .select('*')
        .order('name', { ascending: true })

    if (category) query = query.eq('category', category)
    if (status) query = query.eq('status', status)

    const { data, error } = await query

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data })
}

export async function POST(request: Request) {
    const body = await request.json()
    const { data, error } = await supabase
        .from('inventory_items')
        .insert(body)
        .select()
        .single()

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data })
}
