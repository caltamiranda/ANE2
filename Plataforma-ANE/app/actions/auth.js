'use server';

import { signIn, signOut } from "@/auth";

export async function signInWithMicrosoft(FormData) {
    console.log('signing in with microsoft');
    await signIn('microsoft-entra-id', {
        redirectTo: '/platform',
    });
}

export async function signInWithCredentials(FormData) {
    console.log('signing in with credentials');
    const email = FormData.get('email');
    const password = FormData.get('password');
    await signIn('credentials', {
        redirectTo: '/platform',
        email,
        password,
    });
}

export async function signOutAction() {
    await signOut({ redirectTo: '/auth/signIn' });
}