import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'
import { keysToSnake, keysToCamel } from '@/lib/utils'

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

    return NextResponse.json({ data: keysToCamel(data) })
}

export async function POST(request: Request) {
    const body = await request.json()
    console.log('Received body:', JSON.stringify(body, null, 2))
    const convertedBody = keysToSnake(body)
    console.log('Converted body:', JSON.stringify(convertedBody, null, 2))

    const { data, error } = await supabase
        .from('assets')
        .insert(convertedBody)
        .select()
        .single()

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data: keysToCamel(data) })
}
