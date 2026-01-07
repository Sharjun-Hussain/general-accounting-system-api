import { NextResponse } from 'next/server'
import { createAuthenticatedClient, supabase as supabaseAdmin } from '@/lib/supabaseClient'
import { keysToCamel } from '@/lib/utils'

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Get auth token from request headers
    const authHeader = request.headers.get('authorization')
    const supabase = authHeader
        ? createAuthenticatedClient(authHeader)
        : supabaseAdmin

    // Fetch cash transactions (transactions with cash accounts)
    let query = supabase
        .from('transactions')
        .select(`
            *,
            accounts!inner(name, type)
        `)
        .or('type.eq.income,type.eq.expense')
        .order('date', { ascending: false })

    if (startDate) query = query.gte('date', startDate)
    if (endDate) query = query.lte('date', endDate)

    const { data, error } = await query

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Calculate running balance
    let runningBalance = 0
    const cashBookData = (data || []).map(transaction => {
        const amount = Number(transaction.amount)
        if (transaction.type === 'income') {
            runningBalance += amount
        } else {
            runningBalance -= amount
        }
        return {
            ...keysToCamel(transaction),
            balance: runningBalance
        }
    })

    return NextResponse.json({ data: cashBookData })
}
