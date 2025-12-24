import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'
import { keysToSnake, keysToCamel } from '@/lib/utils'

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const bankAccountId = searchParams.get('bankAccountId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    if (!bankAccountId) {
        return NextResponse.json({ error: 'Bank account ID is required' }, { status: 400 })
    }

    try {
        // Fetch bank account details
        const { data: account, error: accountError } = await supabase
            .from('accounts')
            .select('*')
            .eq('id', bankAccountId)
            .single()

        if (accountError) throw accountError

        // Fetch transactions for this bank account
        let transactionsQuery = supabase
            .from('transactions')
            .select('*')
            .eq('account_id', bankAccountId)
            .order('date', { ascending: false })

        if (startDate) transactionsQuery = transactionsQuery.gte('date', startDate)
        if (endDate) transactionsQuery = transactionsQuery.lte('date', endDate)

        const { data: transactions, error: transactionsError } = await transactionsQuery

        if (transactionsError) throw transactionsError

        return NextResponse.json({
            data: {
                account: keysToCamel(account),
                transactions: keysToCamel(transactions)
            }
        })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

export async function POST(request: Request) {
    const body = await request.json()
    const { bankAccountId, statementBalance, reconciliationDate, matchedTransactions } = body

    if (!bankAccountId) {
        return NextResponse.json({ error: 'Bank account ID is required' }, { status: 400 })
    }

    try {
        // Update account with statement balance and last reconciled date
        const { error: updateError } = await supabase
            .from('accounts')
            .update({
                statement_balance: statementBalance,
                last_reconciled: reconciliationDate || new Date().toISOString().split('T')[0]
            })
            .eq('id', bankAccountId)

        if (updateError) throw updateError

        // Mark transactions as reconciled if provided
        if (matchedTransactions && matchedTransactions.length > 0) {
            const { error: txError } = await supabase
                .from('transactions')
                .update({ reconciled: true })
                .in('id', matchedTransactions)

            if (txError) throw txError
        }

        return NextResponse.json({
            data: {
                success: true,
                message: 'Reconciliation saved successfully'
            }
        })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
