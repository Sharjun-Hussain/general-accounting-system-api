import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'
import { keysToCamel } from '@/lib/utils'

export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    const { id } = params

    try {
        // Fetch vendor details
        const { data: vendor, error: vendorError } = await supabase
            .from('vendors')
            .select('*')
            .eq('id', id)
            .single()

        if (vendorError) throw vendorError

        // Fetch vendor's bills
        const { data: bills, error: billsError } = await supabase
            .from('bills')
            .select('*')
            .eq('vendor_id', id)
            .order('date', { ascending: false })

        if (billsError) throw billsError

        // Calculate statistics
        const totalBills = bills?.length || 0
        const totalAmount = bills?.reduce((sum, bill) => sum + Number(bill.amount || 0), 0) || 0
        const paidAmount = bills?.reduce((sum, bill) =>
            bill.status === 'paid' ? sum + Number(bill.amount || 0) : sum, 0) || 0
        const outstandingAmount = totalAmount - paidAmount

        return NextResponse.json({
            data: {
                ...keysToCamel(vendor),
                bills: keysToCamel(bills),
                statistics: {
                    totalBills,
                    totalAmount,
                    paidAmount,
                    outstandingAmount
                }
            }
        })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

export async function PATCH(
    request: Request,
    { params }: { params: { id: string } }
) {
    const { id } = params
    const body = await request.json()

    try {
        const { data, error } = await supabase
            .from('vendors')
            .update({
                name: body.name,
                email: body.email,
                phone: body.phone,
                address: body.address,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single()

        if (error) throw error

        return NextResponse.json({ data: keysToCamel(data) })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    const { id } = params

    try {
        // Soft delete by setting is_active to false
        const { data, error } = await supabase
            .from('vendors')
            .update({ is_active: false })
            .eq('id', id)
            .select()
            .single()

        if (error) throw error

        return NextResponse.json({ data: keysToCamel(data) })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
