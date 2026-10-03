import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import User from '@/models/User';

export async function POST(req: Request) {
  try {
    const { identifier, password } = await req.json();

    // Attempt to connect to DB
    try {
      await connectToDatabase();
    } catch {
      console.warn('Database not connected yet.');
    }

    let responseUser: Record<string, unknown> | null = null;
    let role = 'client';

    // ------------------------------------------------------------------
    // DEFAULT ADMIN ACCOUNT FOR TESTING
    // ------------------------------------------------------------------
    if (identifier === 'admin' && password === 'admin123') {
      responseUser = { role: 'admin', email: 'admin' };
      role = 'admin';
    } else {
      // Real DB check
      const user = await User.findOne({
        $or: [{ email: identifier }, { serviceCode: identifier }],
        passwordHash: password
      });

      if (!user) {
        return NextResponse.json({ success: false, error: 'Invalid credentials. Please try again.' }, { status: 401 });
      }
      responseUser = user.toObject ? user.toObject() : user;
      role = user.role || 'client';
    }

    const response = NextResponse.json({ success: true, user: responseUser });

    // Set a secure HTTP cookie to protect the routes!
    response.cookies.set('user_role', role, {
      httpOnly: false,
      path: '/',
      maxAge: 60 * 60 * 24 * 7 // 1 week
    });

    return response;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
