import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

export async function GET() {
    // Fetch recent transactions
    const { data: recentTransactions } = await supabase
        .from('transactions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10)

    // Fetch accounts summary
    const { data: accounts } = await supabase
        .from('accounts')
        .select('*')
        .eq('is_active', true)

    // Fetch assets summary
    const { data: assets } = await supabase
        .from('assets')
        .select('*')
        .eq('status', 'Active')

    // Calculate metrics
    const totalIncome = (recentTransactions || [])
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + Number(t.amount), 0)

    const totalExpenses = (recentTransactions || [])
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + Number(t.amount), 0)

    const totalAssets = (assets || []).reduce((sum, a) => sum + Number(a.current_value || 0), 0)

    const totalAccountBalance = (accounts || []).reduce((sum, a) => sum + Number(a.balance || 0), 0)

    return NextResponse.json({
        data: {
            totalRevenue: totalIncome,
            totalExpenses,
            netProfit: totalIncome - totalExpenses,
            totalAssets,
            totalAccountBalance,
            activeAccounts: accounts?.length || 0,
            recentTransactionCount: recentTransactions?.length || 0,
            assetCount: assets?.length || 0
        }
    })
}
