import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

export async function POST(request: Request) {
    const body = await request.json()
    const { startDate, endDate } = body

    // Fetch all transactions within the date range
    const { data: transactions, error } = await supabase
        .from('transactions')
        .select('*')
        .gte('date', startDate)
        .lte('date', endDate)

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Calculate income and expenses
    const income = transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + Number(t.amount), 0)

    const expenses = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + Number(t.amount), 0)

    const netProfit = income - expenses

    // Group by category
    const incomeByCategory = transactions
        .filter(t => t.type === 'income')
        .reduce((acc, t) => {
            const category = t.category || 'Uncategorized'
            acc[category] = (acc[category] || 0) + Number(t.amount)
            return acc
        }, {} as Record<string, number>)

    const expensesByCategory = transactions
        .filter(t => t.type === 'expense')
        .reduce((acc, t) => {
            const category = t.category || 'Uncategorized'
            acc[category] = (acc[category] || 0) + Number(t.amount)
            return acc
        }, {} as Record<string, number>)

    // Construct the report data array matching frontend expectations
    const reportData = [
        {
            item: 'Total Revenue',
            amount: income,
            category: 'revenue'
        },
        // Add individual expense categories
        ...Object.entries(expensesByCategory).map(([category, amount]) => ({
            item: category,
            amount: -Number(amount), // Expenses are negative
            category: 'expenses'
        })),
        {
            item: 'Total Expenses',
            amount: -expenses,
            category: 'total-expenses'
        },
        {
            item: 'Net Profit',
            amount: netProfit,
            category: 'net-income'
        }
    ]

    return NextResponse.json({ data: reportData })
}
