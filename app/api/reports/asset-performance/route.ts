import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

export async function POST(request: Request) {
    const body = await request.json()
    const { startDate, endDate } = body

    // Fetch all assets
    const { data: assets, error } = await supabase
        .from('assets')
        .select('*')
        .order('created_at', { ascending: false })

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Calculate asset performance metrics
    const totalPurchasePrice = (assets || []).reduce((sum, a) => sum + Number(a.purchase_price || 0), 0)
    const totalCurrentValue = (assets || []).reduce((sum, a) => sum + Number(a.current_value || 0), 0)
    const totalDepreciation = totalPurchasePrice - totalCurrentValue
    const depreciationRate = totalPurchasePrice > 0 ? (totalDepreciation / totalPurchasePrice) * 100 : 0

    // Group by category
    const byCategory = (assets || []).reduce((acc, asset) => {
        const category = asset.category || 'Uncategorized'
        if (!acc[category]) {
            acc[category] = {
                count: 0,
                purchasePrice: 0,
                currentValue: 0,
                depreciation: 0
            }
        }
        acc[category].count++
        acc[category].purchasePrice += Number(asset.purchase_price || 0)
        acc[category].currentValue += Number(asset.current_value || 0)
        acc[category].depreciation += Number(asset.purchase_price || 0) - Number(asset.current_value || 0)
        return acc
    }, {} as Record<string, any>)

    // Group by status
    const byStatus = (assets || []).reduce((acc, asset) => {
        const status = asset.status || 'Unknown'
        acc[status] = (acc[status] || 0) + 1
        return acc
    }, {} as Record<string, number>)

    return NextResponse.json({
        data: {
            period: { startDate, endDate },
            summary: {
                totalAssets: assets?.length || 0,
                totalPurchasePrice,
                totalCurrentValue,
                totalDepreciation,
                depreciationRate: depreciationRate.toFixed(2)
            },
            byCategory,
            byStatus
        }
    })
}
