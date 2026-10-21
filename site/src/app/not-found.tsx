import type { Metadata } from 'next';
import './not-found.css';

export const metadata: Metadata = { title: 'Randy Ren' };

export default function NotFound() {
  return (
    <main className="not-found">
      <div>
        <h1>404</h1>
        <h2>This page could not be found.</h2>
      </div>
    </main>
  );
}
