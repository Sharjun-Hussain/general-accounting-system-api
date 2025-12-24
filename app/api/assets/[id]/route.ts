import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

export async function GET(request: Request, { params }: { params: { id: string } }) {
    const { data, error } = await supabase
        .from('assets')
        .select('*')
        .eq('id', params.id)
        .single()

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data })
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
    const body = await request.json()
    const { data, error } = await supabase
        .from('assets')
        .update(body)
        .eq('id', params.id)
        .select()
        .single()

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data })
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
    const { error } = await supabase
        .from('assets')
        .delete()
        .eq('id', params.id)

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
}
