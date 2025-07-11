import { NextResponse } from 'next/server';

export async function GET() {
  const url = 'http://multisocks.dark:1337/;csv';
  const res = await fetch(url);
  const text = await res.text();
  return NextResponse.json({ csv: text });
}