import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'
import { keysToSnake, keysToCamel } from '@/lib/utils'

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const accountId = searchParams.get('accountId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    let query = supabase
        .from('transactions')
        .select('*, accounts(name)')
        .order('date', { ascending: false })

    if (type) query = query.eq('type', type)
    if (accountId) query = query.eq('account_id', accountId)
    if (startDate) query = query.gte('date', startDate)
    if (endDate) query = query.lte('date', endDate)

    const { data, error } = await query

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data: keysToCamel(data) })
}

export async function POST(request: Request) {
    const body = await request.json()
    const { data, error } = await supabase
        .from('transactions')
        .insert(keysToSnake(body))
        .select()
        .single()

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data: keysToCamel(data) })
}
