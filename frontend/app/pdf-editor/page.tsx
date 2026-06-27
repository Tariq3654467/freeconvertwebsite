import React from 'react';
import dynamic from 'next/dynamic';

const PdfEditorComponent = dynamic(() => import('../../components/PdfEditorComponent'), {
  ssr: false,
});

export default function PdfEditorPage() {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <PdfEditorComponent />
    </div>
  );
}
