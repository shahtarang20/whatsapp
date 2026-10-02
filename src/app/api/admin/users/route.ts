import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import User from '@/models/User';
import crypto from 'crypto';

export async function GET() {
  try {
    await connectToDatabase();
    const users = await User.find({ role: 'client' }).sort({ createdAt: -1 });
    return NextResponse.json({ success: true, users });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to fetch users' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { email, phone, password, messageCap, metaPhoneId } = await req.json();
    await connectToDatabase();
    
    // Generate a unique 6-character alphanumeric service code
    const serviceCode = 'SP-' + crypto.randomBytes(3).toString('hex').toUpperCase();

    // In a real app, hash the password using bcrypt. For now, we'll store it directly for testing.
    const newUser = await User.create({
      email,
      phone,
      passwordHash: password, // TODO: Hash this
      serviceCode,
      messageCap: Number(messageCap),
      metaPhoneId: metaPhoneId || '',
      role: 'client'
    });

    return NextResponse.json({ success: true, user: newUser });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

export async function PATCH(req: Request) {
  try {
    const { userId, newCap } = await req.json();
    await connectToDatabase();
    
    const updatedUser = await User.findByIdAndUpdate(
      userId, 
      { messageCap: Number(newCap) }, 
      { new: true }
    );

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
