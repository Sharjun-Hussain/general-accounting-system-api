import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'
import { keysToCamel } from '@/lib/utils'

export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    const { id } = params

    try {
        // Fetch customer details
        const { data: customer, error: customerError } = await supabase
            .from('customers')
            .select('*')
            .eq('id', id)
            .single()

        if (customerError) throw customerError

        // Fetch customer's invoices
        const { data: invoices, error: invoicesError } = await supabase
            .from('invoices')
            .select('*')
            .eq('customer_id', id)
            .order('date', { ascending: false })

        if (invoicesError) throw invoicesError

        // Calculate statistics
        const totalInvoices = invoices?.length || 0
        const totalAmount = invoices?.reduce((sum, inv) => sum + Number(inv.amount || 0), 0) || 0
        const paidAmount = invoices?.reduce((sum, inv) =>
            inv.status === 'paid' ? sum + Number(inv.amount || 0) : sum, 0) || 0
        const outstandingAmount = totalAmount - paidAmount

        return NextResponse.json({
            data: {
                ...keysToCamel(customer),
                invoices: keysToCamel(invoices),
                statistics: {
                    totalInvoices,
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
            .from('customers')
            .update({
                name: body.name,
                email: body.email,
                phone: body.phone,
                address: body.address,
                credit_limit: body.creditLimit,
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
            .from('customers')
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
