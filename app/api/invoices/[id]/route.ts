import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

export async function GET(request: Request, { params }: { params: { id: string } }) {
    const { data, error } = await supabase
        .from('invoices')
        .select('*, invoice_items(*)')
        .eq('id', params.id)
        .single()

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data })
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
    const body = await request.json()
    const { items, ...invoiceData } = body

    // 1. Update Invoice
    const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .update(invoiceData)
        .eq('id', params.id)
        .select()
        .single()

    if (invoiceError) {
        return NextResponse.json({ error: invoiceError.message }, { status: 500 })
    }

    // 2. Update Items (Delete all and recreate for simplicity, or smart update)
    // For now, we'll assume items are handled separately or replaced entirely if sent
    if (items) {
        await supabase.from('invoice_items').delete().eq('invoice_id', params.id)

        const itemsWithInvoiceId = items.map((item: any) => ({
            ...item,
            invoice_id: params.id
        }))

        await supabase.from('invoice_items').insert(itemsWithInvoiceId)
    }

    return NextResponse.json({ data: invoice })
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
    const { error } = await supabase
        .from('invoices')
        .delete()
        .eq('id', params.id)

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
}
