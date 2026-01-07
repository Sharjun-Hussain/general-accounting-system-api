import { NextResponse } from 'next/server'
import { createAuthenticatedClient, supabase as supabaseAdmin } from '@/lib/supabaseClient'

export async function GET(request: Request) {
    try {
        // Get auth token from request headers
        const authHeader = request.headers.get('authorization')
        const supabase = authHeader
            ? createAuthenticatedClient(authHeader)
            : supabaseAdmin

        // Fetch all transactions for the current month
        const currentDate = new Date()
        const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString()

        const { data: transactions } = await supabase
            .from('transactions')
            .select('*')
            .gte('date', firstDayOfMonth)
            .order('created_at', { ascending: false })

        // Fetch all accounts
        const { data: accounts } = await supabase
            .from('accounts')
            .select('*')
            .eq('is_active', true)

        // Fetch all assets
        const { data: assets } = await supabase
            .from('assets')
            .select('*')
            .eq('status', 'Active')

        // Fetch invoices
        const { data: invoices } = await supabase
            .from('invoices')
            .select('*')

        // Fetch bills
        const { data: bills } = await supabase
            .from('bills')
            .select('*')

        // Fetch customers
        const { data: customers } = await supabase
            .from('customers')
            .select('*')
            .eq('is_active', true)

        // Fetch vendors
        const { data: vendors } = await supabase
            .from('vendors')
            .select('*')
            .eq('is_active', true)

        // Calculate metrics
        const totalRevenue = (transactions || [])
            .filter((t: any) => t.type === 'income')
            .reduce((sum: number, t: any) => sum + Number(t.amount || 0), 0)

        const totalExpenses = (transactions || [])
            .filter((t: any) => t.type === 'expense')
            .reduce((sum: number, t: any) => sum + Number(t.amount || 0), 0)

        const netProfit = totalRevenue - totalExpenses

        const totalAssets = (assets || []).reduce((sum: number, a: any) => sum + Number(a.current_value || 0), 0)

        const cashBalance = (accounts || [])
            .filter((a: any) => a.type === 'asset' && (a.name.toLowerCase().includes('cash') || a.name.toLowerCase().includes('bank')))
            .reduce((sum: number, a: any) => sum + Number(a.balance || 0), 0)

        const accountsReceivable = (invoices || [])
            .filter((i: any) => i.status !== 'paid')
            .reduce((sum: number, i: any) => sum + Number(i.amount || 0) - Number(i.amount_paid || 0), 0)

        const accountsPayable = (bills || [])
            .filter((b: any) => b.status !== 'paid')
            .reduce((sum: number, b: any) => sum + Number(b.amount || 0) - Number(b.amount_paid || 0), 0)

        // Recent transactions (last 10)
        const { data: recentTransactions } = await supabase
            .from('transactions')
            .select('*')
            .order('date', { ascending: false })
            .limit(10)

        // Upcoming bills (next 30 days)
        const thirtyDaysFromNow = new Date()
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)

        const { data: upcomingBills } = await supabase
            .from('bills')
            .select('*')
            .lte('due_date', thirtyDaysFromNow.toISOString())
            .neq('status', 'paid')
            .order('due_date', { ascending: true })
            .limit(5)

        return NextResponse.json({
            data: {
                metrics: {
                    totalRevenue,
                    totalExpenses,
                    netProfit,
                    totalAssets,
                    cashBalance,
                    accountsReceivable,
                    accountsPayable,
                    activeAccounts: accounts?.length || 0,
                    totalCustomers: customers?.length || 0,
                    totalVendors: vendors?.length || 0,
                    totalInvoices: invoices?.length || 0,
                    totalBills: bills?.length || 0
                },
                recentTransactions: recentTransactions || [],
                upcomingBills: upcomingBills || []
            }
        })
    } catch (error: any) {
        console.error('Dashboard API Error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
