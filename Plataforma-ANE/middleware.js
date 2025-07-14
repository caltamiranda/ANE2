import { auth } from './auth';

export default auth;

export const config = {
  // Matcher ignoring `/_next/` and `/api/`
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|auth|.swa).*)'],
}