"use client";

import { useEffect, useState } from 'react';
import axios from 'axios';

const API = 'http://127.0.0.1:5000';

interface PageContentRendererProps {
  pageKey: string;
  fallbackTitle?: string;
  fallbackSubtitle?: string;
  fallbackBody?: string;
  className?: string;
}

export default function PageContentRenderer({ pageKey, fallbackTitle, fallbackSubtitle, fallbackBody, className }: PageContentRendererProps) {
  const [content, setContent] = useState<{ title?: string; subtitle?: string; body?: string }>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await axios.get(`${API}/api/pages/${pageKey}`);
        setContent({ title: res.data.title || '', subtitle: res.data.subtitle || '', body: res.data.body || '' });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [pageKey]);

  if (loading) return null;

  const title = content.title || fallbackTitle || '';
  const subtitle = content.subtitle || fallbackSubtitle || '';
  const body = content.body || fallbackBody || '';

  return (
    <div className={className}>
      {title ? <h1>{title}</h1> : null}
      {subtitle ? <p>{subtitle}</p> : null}
      {body ? <div dangerouslySetInnerHTML={{ __html: body.replace(/\n/g, '<br />') }} /> : null}
    </div>
  );
}
