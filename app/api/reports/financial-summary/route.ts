import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

export async function POST(request: Request) {
    const body = await request.json()
    const { startDate, endDate } = body

    // Fetch transactions
    const { data: transactions, error: transError } = await supabase
        .from('transactions')
        .select('*')
        .gte('date', startDate)
        .lte('date', endDate)

    if (transError) {
        return NextResponse.json({ error: transError.message }, { status: 500 })
    }

    // Fetch accounts
    const { data: accounts, error: accError } = await supabase
        .from('accounts')
        .select('*')
        .eq('is_active', true)

    if (accError) {
        return NextResponse.json({ error: accError.message }, { status: 500 })
    }

    // Fetch assets
    const { data: assets, error: assetError } = await supabase
        .from('assets')
        .select('*')

    if (assetError) {
        return NextResponse.json({ error: assetError.message }, { status: 500 })
    }

    // Calculate summary
    const totalIncome = transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + Number(t.amount), 0)

    const totalExpenses = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + Number(t.amount), 0)

    const totalAssets = (assets || []).reduce((sum, a) => sum + Number(a.current_value || 0), 0)

    const totalAccountBalance = accounts.reduce((sum, a) => sum + Number(a.balance || 0), 0)

    return NextResponse.json({
        data: {
            period: { startDate, endDate },
            income: totalIncome,
            expenses: totalExpenses,
            netProfit: totalIncome - totalExpenses,
            totalAssets,
            totalAccountBalance,
            transactionCount: transactions.length
        }
    })
}
