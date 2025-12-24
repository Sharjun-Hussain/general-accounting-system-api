import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'
import { keysToCamel } from '@/lib/utils'

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const accountId = searchParams.get('accountId')

    // Fetch all transactions with account details
    let query = supabase
        .from('transactions')
        .select(`
            *,
            accounts!inner(id, name, code, type)
        `)
        .order('date', { ascending: true })

    if (startDate) query = query.gte('date', startDate)
    if (endDate) query = query.lte('date', endDate)
    if (accountId) query = query.eq('account_id', accountId)

    const { data: transactions, error } = await query

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Group by account and calculate running balances
    const ledgerByAccount: Record<string, any[]> = {}

    transactions?.forEach(transaction => {
        const accountKey = transaction.account_id
        if (!ledgerByAccount[accountKey]) {
            ledgerByAccount[accountKey] = []
        }

        const isDebit = transaction.type === 'expense'
        const amount = Number(transaction.amount)

        // Calculate running balance
        const previousBalance = ledgerByAccount[accountKey].length > 0
            ? ledgerByAccount[accountKey][ledgerByAccount[accountKey].length - 1].balance
            : 0

        const newBalance = isDebit
            ? previousBalance + amount
            : previousBalance - amount

        ledgerByAccount[accountKey].push({
            ...keysToCamel(transaction),
            debit: isDebit ? amount : 0,
            credit: !isDebit ? amount : 0,
            balance: newBalance,
            account: transaction.accounts
        })
    })

    // Flatten to single array
    const ledgerEntries = Object.values(ledgerByAccount).flat()

    return NextResponse.json({ data: ledgerEntries })
}
