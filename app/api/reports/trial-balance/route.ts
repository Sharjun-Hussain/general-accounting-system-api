import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'
import { keysToCamel } from '@/lib/utils'

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0]

    try {
        // Fetch all active accounts with their balances
        const { data: accounts, error } = await supabase
            .from('accounts')
            .select('*')
            .eq('is_active', true)
            .order('code', { ascending: true })

        if (error) throw error

        // Format accounts for trial balance
        const trialBalanceData = accounts.map((account: any) => {
            const balance = Number(account.balance || 0)

            // Determine debit or credit based on account type and balance
            let debit = 0
            let credit = 0

            if (account.type === 'asset' || account.type === 'expense') {
                // Assets and expenses have debit balances
                if (balance >= 0) {
                    debit = balance
                } else {
                    credit = Math.abs(balance)
                }
            } else {
                // Liabilities, equity, and revenue have credit balances
                if (balance >= 0) {
                    credit = balance
                } else {
                    debit = Math.abs(balance)
                }
            }

            return {
                accountCode: account.code,
                accountName: account.name,
                accountType: account.type,
                debit,
                credit
            }
        })

        // Calculate totals
        const totalDebit = trialBalanceData.reduce((sum, item) => sum + item.debit, 0)
        const totalCredit = trialBalanceData.reduce((sum, item) => sum + item.credit, 0)
        const isBalanced = Math.abs(totalDebit - totalCredit) < 1

        return NextResponse.json({
            data: {
                date,
                accounts: keysToCamel(trialBalanceData),
                totals: {
                    debit: totalDebit,
                    credit: totalCredit
                },
                isBalanced,
                difference: totalDebit - totalCredit
            }
        })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
