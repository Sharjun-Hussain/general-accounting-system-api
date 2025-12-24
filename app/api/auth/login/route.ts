import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

export async function POST(request: Request) {
    const body = await request.json()
    const { email, password } = body

    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    })

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 401 })
    }

    // Also fetch user profile if needed
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single()

    return NextResponse.json({
        user: { ...data.user, ...profile },
        session: data.session
    })
}
