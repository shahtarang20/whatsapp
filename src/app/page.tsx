"use client";

import React, { useState, useRef } from 'react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

export default function Home() {
  const [contacts, setContacts] = useState<string[]>([]);
  const [fileName, setFileName] = useState('');
  const [message, setMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);

    if (file.name.endsWith('.csv')) {
      Papa.parse(file, {
        complete: (result) => {
          extractNumbers(result.data as any[][]);
        }
      });
    } else if (file.name.match(/\.xls(x)?$/)) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
        extractNumbers(data as any[][]);
      };
      reader.readAsBinaryString(file);
    } else {
      alert('Please upload a valid CSV or Excel file.');
    }
  };

  const extractNumbers = (data: any[][]) => {
    const numbers: string[] = [];
    data.forEach(row => {
      if(Array.isArray(row)) {
        row.forEach(cell => {
           if (cell) {
             const str = String(cell).replace(/\D/g, ''); // keep only digits
             // Basic check: length 10-15 usually indicates a valid phone number
             if (str.length >= 10 && str.length <= 15) {
               numbers.push(str);
             }
           }
        });
      }
    });
    // Remove duplicates
    const uniqueNumbers = [...new Set(numbers)];
    setContacts(uniqueNumbers);
  };

  return (
    <main style={{ padding: '60px 24px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
        <button 
          onClick={() => {
            document.cookie = "user_role=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
            localStorage.removeItem('client_user');
            window.location.href = '/login';
          }}
          style={{ background: 'rgba(255, 60, 60, 0.1)', color: '#ff4d4d', border: '1px solid rgba(255, 60, 60, 0.3)', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, transition: 'all 0.2s ease' }}
        >
          Logout
        </button>
      </div>

      <header style={{ marginBottom: '48px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '3.5rem', marginBottom: '16px' }}>Bulk WhatsApp Sender</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto' }}>
          Instantly dispatch personalized messages to hundreds of contacts via the official Meta Cloud API.
        </p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '32px' }}>
        
        {/* Left Column: Upload */}
        <section className="glass-panel">
          <h2 style={{ fontSize: '1.8rem', marginBottom: '8px' }}>1. Upload Contacts</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>Upload a CSV or Excel file containing your phone numbers.</p>
          
          <label className="file-drop-area" style={{ display: 'block', borderColor: contacts.length > 0 ? 'var(--primary)' : 'var(--glass-border)' }}>
            <input 
              type="file" 
              accept=".csv, .xlsx, .xls" 
              style={{ display: 'none' }} 
              ref={fileInputRef}
              onChange={handleFileUpload}
            />
            <svg className="icon" style={{ width: '48px', height: '48px', margin: '0 auto 16px', color: 'var(--primary)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            
            {fileName ? (
              <>
                <h3 style={{ fontSize: '1.2rem', marginBottom: '8px', WebkitTextFillColor: 'var(--text-main)' }}>{fileName}</h3>
                <p style={{ color: 'var(--primary)', fontSize: '0.9rem', fontWeight: 600 }}>{contacts.length} valid phone numbers extracted successfully!</p>
              </>
            ) : (
              <>
                <h3 style={{ fontSize: '1.2rem', marginBottom: '8px', WebkitTextFillColor: 'var(--text-main)' }}>Drag & Drop your CSV or Excel file here</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>or click to browse from your computer</p>
              </>
            )}
          </label>
          
          <div style={{ marginTop: '24px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Bucket Name</label>
            <input type="text" className="input-field" placeholder="e.g. October Promotions" />
          </div>
        </section>

        {/* Right Column: Message & Send */}
        <section className="glass-panel" style={{ display: 'flex', flexDirection: 'column' }}>
          <h2 style={{ fontSize: '1.8rem', marginBottom: '8px' }}>2. Compose & Send</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>Type your message below.</p>

          <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Your Custom Message</label>
            <textarea 
              className="input-field" 
              style={{ flexGrow: 1, minHeight: '200px', resize: 'vertical', fontFamily: 'inherit' }} 
              placeholder="Type your custom message here... (e.g., Hi, we have a special offer for you today!)"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            ></textarea>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '12px', lineHeight: '1.5' }}>
              <strong>Important WhatsApp Rule:</strong> Meta does not allow sending completely free-form messages as the first message. We will automatically inject what you type here into an approved template (like <em>"Update: [Your Message Here]"</em>) to bypass this restriction!
            </p>
          </div>

          <button className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '18px', opacity: contacts.length === 0 ? 0.5 : 1, cursor: contacts.length === 0 ? 'not-allowed' : 'pointer' }} disabled={contacts.length === 0}>
            <svg className="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
            Send to {contacts.length} Contacts
          </button>
        </section>

      </div>
    </main>
  );
}
