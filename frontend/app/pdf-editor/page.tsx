import React from 'react';
import dynamic from 'next/dynamic';
import '../../styles/pdf-editor.css';
import PageContentRenderer from '../../components/PageContentRenderer';

const PdfEditorComponent = dynamic(() => import('../../components/PdfEditorComponent'), {
  ssr: false,
});

export default function PdfEditorPage() {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <PageContentRenderer pageKey="pdf-editor-page" fallbackTitle="PDF Editor" fallbackSubtitle="Edit PDFs directly in the browser." fallbackBody="" />
      <PdfEditorComponent />
    </div>
  );
}
