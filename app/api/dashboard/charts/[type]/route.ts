import { NextResponse } from 'next/server'
import { createAuthenticatedClient, supabase as supabaseAdmin } from '@/lib/supabaseClient'

export async function GET(request: Request, { params }: { params: Promise<{ type: string }> }) {
    try {
        const { type } = await params

        // Get auth token from request headers
        const authHeader = request.headers.get('authorization')
        const supabase = authHeader
            ? createAuthenticatedClient(authHeader)
            : supabaseAdmin

        const currentDate = new Date()
        const sixMonthsAgo = new Date(currentDate.getFullYear(), currentDate.getMonth() - 5, 1).toISOString()

        if (type === 'revenue') {
            const { data: transactions } = await supabase
                .from('transactions')
                .select('*')
                .gte('date', sixMonthsAgo)
                .order('date', { ascending: true })

            // Group by month
            const monthlyData = (transactions || []).reduce((acc: any, t: any) => {
                const date = new Date(t.date)
                const monthKey = date.toLocaleString('default', { month: 'short' })

                if (!acc[monthKey]) {
                    acc[monthKey] = { month: monthKey, revenue: 0, expenses: 0, profit: 0 }
                }

                const amount = Number(t.amount || 0)
                if (t.type === 'income') {
                    acc[monthKey].revenue += amount
                } else if (t.type === 'expense') {
                    acc[monthKey].expenses += amount
                }
                acc[monthKey].profit = acc[monthKey].revenue - acc[monthKey].expenses

                return acc
            }, {})

            // Ensure all 6 months are present
            const result = []
            for (let i = 5; i >= 0; i--) {
                const d = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1)
                const monthKey = d.toLocaleString('default', { month: 'short' })
                result.push(monthlyData[monthKey] || { month: monthKey, revenue: 0, expenses: 0, profit: 0 })
            }

            return NextResponse.json({ data: result })
        }

        if (type === 'cash-flow') {
            const { data: transactions } = await supabase
                .from('transactions')
                .select('*')
                .gte('date', sixMonthsAgo)
                .order('date', { ascending: true })

            // Group by month
            const monthlyData = (transactions || []).reduce((acc: any, t: any) => {
                const date = new Date(t.date)
                const monthKey = date.toLocaleString('default', { month: 'short' })

                if (!acc[monthKey]) {
                    acc[monthKey] = { month: monthKey, operating: 0, investing: 0, financing: 0 }
                }

                const amount = Number(t.amount || 0)
                // Simplified cash flow logic: Income is positive, Expense is negative
                // In a real system, you'd check transaction categories to classify into operating/investing/financing
                // For now, we'll map everything to 'operating' for simplicity unless we have category data

                // This is a placeholder logic. You might want to refine this based on your category structure.
                if (t.type === 'income') {
                    acc[monthKey].operating += amount
                } else {
                    acc[monthKey].operating -= amount
                }

                return acc
            }, {})

            // Ensure all 6 months are present
            const result = []
            for (let i = 5; i >= 0; i--) {
                const d = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1)
                const monthKey = d.toLocaleString('default', { month: 'short' })
                result.push(monthlyData[monthKey] || { month: monthKey, operating: 0, investing: 0, financing: 0 })
            }

            return NextResponse.json({ data: result })
        }

        return NextResponse.json({ error: 'Invalid chart type' }, { status: 400 })

    } catch (error: any) {
        console.error('Chart API Error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
