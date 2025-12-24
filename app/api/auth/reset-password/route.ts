import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

export async function POST(request: Request) {
    const body = await request.json()
    const { email, redirectTo } = body

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectTo || 'https://accounting.inzeedo.com/reset-password', // Default or from body
    })

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ message: 'Password reset email sent' })
}
