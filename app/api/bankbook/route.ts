import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'
import { keysToCamel } from '@/lib/utils'

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const bankAccountId = searchParams.get('bankAccountId')

    // Fetch bank transactions
    let query = supabase
        .from('transactions')
        .select(`
            *,
            accounts!inner(name, type)
        `)
        .order('date', { ascending: false })

    if (bankAccountId) {
        query = query.eq('account_id', bankAccountId)
    }
    if (startDate) query = query.gte('date', startDate)
    if (endDate) query = query.lte('date', endDate)

    const { data: transactions, error: transError } = await query

    if (transError) {
        return NextResponse.json({ error: transError.message }, { status: 500 })
    }

    // Fetch issued cheques
    let chequeQuery = supabase
        .from('issued_cheques')
        .select('*')
        .order('issue_date', { ascending: false })

    if (startDate) chequeQuery = chequeQuery.gte('issue_date', startDate)
    if (endDate) chequeQuery = chequeQuery.lte('issue_date', endDate)

    const { data: cheques, error: chequeError } = await chequeQuery

    if (chequeError) {
        return NextResponse.json({ error: chequeError.message }, { status: 500 })
    }

    // Calculate running balance
    let runningBalance = 0
    const allEntries = [
        ...(transactions || []).map(t => ({
            ...keysToCamel(t),
            entryType: 'transaction',
            date: t.date
        })),
        ...(cheques || []).map(c => ({
            ...keysToCamel(c),
            entryType: 'cheque',
            date: c.issue_date
        }))
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    const bankBookData = allEntries.map(entry => {
        if (entry.entryType === 'transaction') {
            const amount = Number(entry.amount)
            if (entry.type === 'income') {
                runningBalance += amount
            } else {
                runningBalance -= amount
            }
        } else {
            runningBalance -= Number(entry.amount)
        }
        return {
            ...entry,
            balance: runningBalance
        }
    })

    return NextResponse.json({ data: bankBookData })
}
