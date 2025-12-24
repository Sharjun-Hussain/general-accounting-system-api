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

    // Fetch book balance (from transactions)
    let transQuery = supabase
        .from('transactions')
        .select('*')
        .eq('account_id', bankAccountId)

    if (startDate) transQuery = transQuery.gte('date', startDate)
    if (endDate) transQuery = transQuery.lte('date', endDate)

    const { data: transactions, error: transError } = await transQuery

    if (transError) {
        return NextResponse.json({ error: transError.message }, { status: 500 })
    }

    // Calculate book balance
    const bookBalance = (transactions || []).reduce((sum, t) => {
        return sum + (t.type === 'income' ? Number(t.amount) : -Number(t.amount))
    }, 0)

    // Fetch uncleared cheques
    const { data: unclearedCheques, error: chequeError } = await supabase
        .from('issued_cheques')
        .select('*')
        .eq('bank_account_id', bankAccountId)
        .in('status', ['issued', 'presented'])

    if (chequeError) {
        return NextResponse.json({ error: chequeError.message }, { status: 500 })
    }

    const unclearedAmount = (unclearedCheques || []).reduce((sum, c) => sum + Number(c.amount), 0)

    // Calculate adjusted bank balance
    const adjustedBankBalance = bookBalance - unclearedAmount

    return NextResponse.json({
        data: {
            bookBalance,
            unclearedCheques: keysToCamel(unclearedCheques || []),
            unclearedAmount,
            adjustedBankBalance,
            transactions: keysToCamel(transactions || [])
        }
    })
}

export async function POST(request: Request) {
    const body = await request.json()
    const { bankAccountId, statementBalance, reconciliationDate } = body

    if (!bankAccountId || statementBalance === undefined) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Get current reconciliation data
    const { data: reconciliationData } = await supabase
        .from('transactions')
        .select('*')
        .eq('account_id', bankAccountId)
        .lte('date', reconciliationDate || new Date().toISOString())

    const bookBalance = (reconciliationData || []).reduce((sum, t) => {
        return sum + (t.type === 'income' ? Number(t.amount) : -Number(t.amount))
    }, 0)

    const difference = Number(statementBalance) - bookBalance

    return NextResponse.json({
        data: {
            bookBalance,
            statementBalance: Number(statementBalance),
            difference,
            isReconciled: Math.abs(difference) < 0.01
        }
    })
}
