import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

export async function POST(request: Request) {
    const body = await request.json()
    const { password, accessToken, refreshToken } = body

    // Set the session first using the tokens from the reset link (handled on frontend, passed here? 
    // Actually, standard flow: Frontend gets code, exchanges for session, then calls update.
    // OR Frontend sends new password + code to backend? 
    // Supabase 'updateUser' requires an active session.

    // Alternative: If we are proxying, we might need to set the session on the server side using the tokens provided.

    if (accessToken && refreshToken) {
        const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
        })
        if (sessionError) {
            return NextResponse.json({ error: sessionError.message }, { status: 401 })
        }
    }

    const { data, error } = await supabase.auth.updateUser({
        password: password
    })

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ message: 'Password updated successfully', user: data.user })
}
