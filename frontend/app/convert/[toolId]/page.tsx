"use client";

import { useParams } from 'next/navigation';
import Link from 'next/link';
import Home from '../../page';
import { getToolById, TOOLS_DATA } from '../../../constants/tools';

export default function ToolPage() {
  const params = useParams();
  const toolId = typeof params?.toolId === 'string' ? params.toolId : '';
  const tool = getToolById(toolId);
  const heading = tool?.name ?? 'File Converter';
  const isCompress = toolId.includes('compress');
  const noun = isCompress ? 'file' : 'file';
  const actionVerb = isCompress ? 'Compress' : 'Convert';

  const related = Object.values(TOOLS_DATA)
    .flatMap((cats) => cats)
    .flatMap((cat) => cat.items)
    .filter((item) => item.id !== toolId)
    .slice(0, 10);

  return (
    <>
      <Home initialToolId={toolId} />
      <section className="tool-info-wrap">
        <div className="tool-info-card">
          <h1 className="tool-info-title">How to {actionVerb} {heading}?</h1>
          <ol className="tool-steps">
            <li>Click the <strong>Choose File</strong> button and upload your {noun}.</li>
            <li>Adjust format or compression settings based on your tool.</li>
            <li>Click the blue <strong>{isCompress ? 'Compress' : 'Convert'}</strong> button to process.</li>
            <li>Download the final result once processing is complete.</li>
          </ol>

          <div className="tool-feature-grid">
            <article className="tool-feature-item">
              <h3>{isCompress ? 'Optimize Any File' : 'Convert Any File'}</h3>
              <p>
                Works across image, document, audio, and video formats with one
                consistent workflow.
              </p>
            </article>
            <article className="tool-feature-item">
              <h3>Best Quality Output</h3>
              <p>
                Processing presets are tuned for clean output quality and efficient
                file size handling.
              </p>
            </article>
            <article className="tool-feature-item">
              <h3>Free & Secure</h3>
              <p>
                Files are transferred via encrypted channels and processed quickly
                with automatic cleanup.
              </p>
            </article>
          </div>
        </div>

        <div className="tool-related">
          <h2>Useful Related Tools</h2>
          <p>Explore other popular tools you can use next.</p>
          <div className="tool-related-links">
            {related.map((item) => (
              <Link key={item.id} href={`/convert/${item.id}`}>
                {item.name}
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
