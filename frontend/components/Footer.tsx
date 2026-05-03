"use client";

import Link from 'next/link';
import { TOOLS_DATA } from '../constants/tools';

export default function Footer() {
  const convertLinks = TOOLS_DATA.Convert.flatMap((category) => category.items).slice(0, 8);
  const compressLinks = TOOLS_DATA.Compress.flatMap((category) => category.items).slice(0, 6);

  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <div>
          <h3>PrismConvert</h3>
          <p>Fast file conversions for images, audio, video, and documents.</p>
        </div>

        <div>
          <h4>Convert</h4>
          {convertLinks.map((tool) => (
            <Link key={tool.id} href={`/convert/${tool.id}`}>{tool.name}</Link>
          ))}
        </div>

        <div>
          <h4>Compress</h4>
          {compressLinks.map((tool) => (
            <Link key={tool.id} href={`/convert/${tool.id}`}>{tool.name}</Link>
          ))}
        </div>

        <div>
          <h4>Company</h4>
          <Link href="/blog">Blog</Link>
          <Link href="/login">Log In</Link>
          <Link href="/signup">Sign Up</Link>
        </div>
      </div>
    </footer>
  );
}
