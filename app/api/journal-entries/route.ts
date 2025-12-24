import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'
import { keysToSnake, keysToCamel } from '@/lib/utils'

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const accountId = searchParams.get('accountId')

    let query = supabase
        .from('transactions')
        .select(`
            *,
            accounts!inner(id, name, code, type)
        `)
        .order('date', { ascending: false })

    if (startDate) query = query.gte('date', startDate)
    if (endDate) query = query.lte('date', endDate)
    if (accountId) query = query.eq('account_id', accountId)

    const { data, error } = await query

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Format as journal entries with debit/credit
    const journalEntries = (data || []).map(transaction => {
        const isDebit = transaction.type === 'expense'
        return {
            ...keysToCamel(transaction),
            debit: isDebit ? transaction.amount : 0,
            credit: !isDebit ? transaction.amount : 0,
            account: transaction.accounts
        }
    })

    return NextResponse.json({ data: journalEntries })
}

export async function POST(request: Request) {
    const body = await request.json()
    const snakeBody = keysToSnake(body)

    // Create transaction entry
    const { data, error } = await supabase
        .from('transactions')
        .insert(snakeBody)
        .select()
        .single()

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data: keysToCamel(data) })
}
