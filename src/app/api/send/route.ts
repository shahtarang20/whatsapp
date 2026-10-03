import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import User from '@/models/User';

export async function POST(req: Request) {
  try {
    const { contacts, message, serviceCode } = await req.json();

    if (!contacts || contacts.length === 0) {
      return NextResponse.json({ success: false, error: 'No contacts provided' }, { status: 400 });
    }

    if (!message) {
      return NextResponse.json({ success: false, error: 'Message cannot be empty' }, { status: 400 });
    }

    type UserProfile = {
      messagesSent: number;
      messageCap: number;
      metaPhoneId?: string;
      save: () => Promise<unknown>;
    };

    // Check DB limits for this client
    let user: UserProfile | null = null;
    try {
      await connectToDatabase();
      if (serviceCode) {
        const foundUser = await User.findOne({ serviceCode });
        if (foundUser) {
          user = {
            messagesSent: foundUser.messagesSent ?? 0,
            messageCap: foundUser.messageCap ?? 0,
            metaPhoneId: foundUser.metaPhoneId || undefined,
            save: () => foundUser.save()
          };

          if (user.messagesSent + contacts.length > user.messageCap) {
            return NextResponse.json({
              success: false,
              error: `Sending this will exceed your cap of ${user.messageCap} messages.`
            }, { status: 403 });
          }
        }
      }
    } catch {
      console.warn('DB check skipped.');
    }

    // Use the client's custom Meta Phone ID if they have one, otherwise fallback to the central one
    const PHONE_ID = (user && user.metaPhoneId) ? user.metaPhoneId : process.env.META_PHONE_ID;
    const ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;

    if (!PHONE_ID || !ACCESS_TOKEN) {
      return NextResponse.json({ success: false, error: 'Meta API keys are missing' }, { status: 500 });
    }

    const url = `https://graph.facebook.com/v17.0/${PHONE_ID}/messages`;
    let sentCount = 0;
    let failCount = 0;

    for (const phone of contacts) {
      // Clean phone number
      const formattedPhone = phone.toString().replace(/\D/g, '');

      // Send the custom text message to WhatsApp!
      const payload = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: formattedPhone,
        type: 'text',
        text: {
          preview_url: false,
          body: message
        }
      };

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        sentCount++;
      } else {
        const errText = await res.text();
        console.error('Meta API Error:', errText);
        failCount++;
      }
    }

    // Add to their total usage count
    if (user) {
      user.messagesSent += sentCount;
      await user.save();
    }

    return NextResponse.json({
      success: true,
      sent: sentCount,
      failed: failCount
    });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
