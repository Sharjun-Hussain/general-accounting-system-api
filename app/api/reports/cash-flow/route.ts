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
        .order('date', { ascending: true })

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Calculate cash inflows and outflows
    const cashInflows = transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + Number(t.amount), 0)

    const cashOutflows = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + Number(t.amount), 0)

    const netCashFlow = cashInflows - cashOutflows

    // Group by month
    const monthlyData = transactions.reduce((acc, t) => {
        const month = new Date(t.date).toISOString().slice(0, 7) // YYYY-MM
        if (!acc[month]) {
            acc[month] = { inflows: 0, outflows: 0, net: 0 }
        }
        if (t.type === 'income') {
            acc[month].inflows += Number(t.amount)
        } else {
            acc[month].outflows += Number(t.amount)
        }
        acc[month].net = acc[month].inflows - acc[month].outflows
        return acc
    }, {} as Record<string, { inflows: number; outflows: number; net: number }>)

    // Construct the report data array matching frontend expectations
    const reportData = [
        {
            activity: 'Total Cash Inflows',
            amount: cashInflows,
            category: 'operating'
        },
        {
            activity: 'Total Cash Outflows',
            amount: -cashOutflows,
            category: 'operating'
        },
        {
            activity: 'Net Cash Flow',
            amount: netCashFlow,
            category: 'net'
        }
    ]

    return NextResponse.json({ data: reportData })
}
