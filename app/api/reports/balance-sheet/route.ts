import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'
import { keysToCamel } from '@/lib/utils'

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0]

    try {
        // Fetch all accounts with their current balances
        const { data: accounts, error: accountsError } = await supabase
            .from('accounts')
            .select('*')
            .eq('is_active', true)

        if (accountsError) throw accountsError

        // Fetch all assets
        const { data: assets, error: assetsError } = await supabase
            .from('assets')
            .select('*')
            .eq('status', 'Active')

        if (assetsError) throw assetsError

        // Group accounts by type and classification
        const assetAccounts = accounts.filter((a: any) => a.type === 'asset')
        const liabilityAccounts = accounts.filter((a: any) => a.type === 'liability')
        const equityAccounts = accounts.filter((a: any) => a.type === 'equity')

        // Classify current vs non-current assets (simplified: cash/bank = current, others = non-current)
        const currentAssets = assetAccounts
            .filter((a: any) => a.name.toLowerCase().includes('cash') || a.name.toLowerCase().includes('bank') || a.name.toLowerCase().includes('receivable'))
            .map((a: any) => ({ name: a.name, amount: Number(a.balance || 0) }))

        const nonCurrentAssets = assetAccounts
            .filter((a: any) => !a.name.toLowerCase().includes('cash') && !a.name.toLowerCase().includes('bank') && !a.name.toLowerCase().includes('receivable'))
            .map((a: any) => ({ name: a.name, amount: Number(a.balance || 0) }))

        // Add fixed assets from assets table
        if (assets && assets.length > 0) {
            const totalFixedAssets = assets.reduce((sum: number, a: any) => sum + Number(a.current_value || 0), 0)
            const totalDepreciation = assets.reduce((sum: number, a: any) => {
                const purchaseValue = Number(a.purchase_price || 0)
                const currentValue = Number(a.current_value || 0)
                return sum + (purchaseValue - currentValue)
            }, 0)

            nonCurrentAssets.push({ name: 'Property, Plant & Equipment', amount: totalFixedAssets + totalDepreciation })
            if (totalDepreciation > 0) {
                nonCurrentAssets.push({ name: 'Less: Accumulated Depreciation', amount: -totalDepreciation })
            }
        }

        // Classify current vs non-current liabilities (simplified: payable = current)
        const currentLiabilities = liabilityAccounts
            .filter((a: any) => a.name.toLowerCase().includes('payable') || a.name.toLowerCase().includes('accrued'))
            .map((a: any) => ({ name: a.name, amount: Number(a.balance || 0) }))

        const nonCurrentLiabilities = liabilityAccounts
            .filter((a: any) => !a.name.toLowerCase().includes('payable') && !a.name.toLowerCase().includes('accrued'))
            .map((a: any) => ({ name: a.name, amount: Number(a.balance || 0) }))

        // Equity accounts
        const equity = equityAccounts.map((a: any) => ({ name: a.name, amount: Number(a.balance || 0) }))

        // Calculate totals
        const totalCurrentAssets = currentAssets.reduce((sum, item) => sum + item.amount, 0)
        const totalNonCurrentAssets = nonCurrentAssets.reduce((sum, item) => sum + item.amount, 0)
        const totalAssets = totalCurrentAssets + totalNonCurrentAssets

        const totalCurrentLiabilities = currentLiabilities.reduce((sum, item) => sum + item.amount, 0)
        const totalNonCurrentLiabilities = nonCurrentLiabilities.reduce((sum, item) => sum + item.amount, 0)
        const totalLiabilities = totalCurrentLiabilities + totalNonCurrentLiabilities

        const totalEquity = equity.reduce((sum, item) => sum + item.amount, 0)

        return NextResponse.json({
            data: {
                date,
                assets: {
                    current: currentAssets,
                    nonCurrent: nonCurrentAssets,
                    totalCurrent: totalCurrentAssets,
                    totalNonCurrent: totalNonCurrentAssets,
                    total: totalAssets
                },
                liabilities: {
                    current: currentLiabilities,
                    nonCurrent: nonCurrentLiabilities,
                    totalCurrent: totalCurrentLiabilities,
                    totalNonCurrent: totalNonCurrentLiabilities,
                    total: totalLiabilities
                },
                equity: {
                    items: equity,
                    total: totalEquity
                },
                totalLiabilitiesAndEquity: totalLiabilities + totalEquity,
                isBalanced: Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 1
            }
        })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
