import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

export async function POST(request: Request) {
    const body = await request.json()
    const { startDate, endDate } = body

    if (!startDate || !endDate) {
        return NextResponse.json({ error: 'Start date and end date are required' }, { status: 400 })
    }

    try {
        // Fetch revenue accounts
        const { data: revenueAccounts, error: revenueError } = await supabase
            .from('accounts')
            .select('id, name, balance')
            .eq('type', 'revenue')
            .eq('is_active', true)

        if (revenueError) throw revenueError

        // Fetch expense accounts
        const { data: expenseAccounts, error: expenseError } = await supabase
            .from('accounts')
            .select('id, name, balance')
            .eq('type', 'expense')
            .eq('is_active', true)

        if (expenseError) throw expenseError

        // Fetch transactions for the period to get actual revenue and expenses
        const { data: transactions, error: transactionsError } = await supabase
            .from('transactions')
            .select('account_id, amount, type, category')
            .gte('date', startDate)
            .lte('date', endDate)

        if (transactionsError) throw transactionsError

        // Calculate revenue by category
        const revenueByCategory: { [key: string]: number } = {}
        const expenseByCategory: { [key: string]: number } = {}

        transactions?.forEach((tx: any) => {
            const amount = Number(tx.amount || 0)
            const category = tx.category || 'Other'

            if (tx.type === 'income') {
                revenueByCategory[category] = (revenueByCategory[category] || 0) + amount
            } else if (tx.type === 'expense') {
                expenseByCategory[category] = (expenseByCategory[category] || 0) + amount
            }
        })

        // Convert to array format
        const revenue = Object.entries(revenueByCategory).map(([name, amount]) => ({ name, amount }))
        const expenses = Object.entries(expenseByCategory).map(([name, amount]) => ({ name, amount }))

        // If no transactions, use account balances as fallback
        if (revenue.length === 0 && revenueAccounts) {
            revenueAccounts.forEach((acc: any) => {
                revenue.push({ name: acc.name, amount: Number(acc.balance || 0) })
            })
        }

        if (expenses.length === 0 && expenseAccounts) {
            expenseAccounts.forEach((acc: any) => {
                expenses.push({ name: acc.name, amount: Number(acc.balance || 0) })
            })
        }

        // Calculate totals
        const totalRevenue = revenue.reduce((sum, item) => sum + item.amount, 0)
        const totalExpenses = expenses.reduce((sum, item) => sum + item.amount, 0)
        const netIncome = totalRevenue - totalExpenses

        return NextResponse.json({
            data: {
                period: { startDate, endDate },
                revenue: {
                    items: revenue,
                    total: totalRevenue
                },
                expenses: {
                    items: expenses,
                    total: totalExpenses
                },
                netIncome,
                netIncomePercentage: totalRevenue > 0 ? (netIncome / totalRevenue) * 100 : 0
            }
        })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
