"use client";

import { useState } from 'react';
import axios from 'axios';

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [targetFormat, setTargetFormat] = useState('png');
  const [jobId, setJobId] = useState<number | null>(null);
  const [status, setStatus] = useState<string>('');
  const [downloadLink, setDownloadLink] = useState<string>('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    try {
      setStatus('Uploading...');
      const formData = new FormData();
      formData.append('file', file);
      formData.append('target_format', targetFormat);
      
      // Assume backend is on port 5000
      const response = await axios.post('http://127.0.0.1:5000/api/convert/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setJobId(response.data.job_id);
      processFile(response.data.job_id);
    } catch (err) {
      console.error(err);
      setStatus('Upload failed.');
    }
  };

  const processFile = async (id: number) => {
    try {
      setStatus('Processing...');
      await axios.post(`http://127.0.0.1:5000/api/convert/process/${id}`);
      checkStatus(id);
    } catch (err) {
      console.error(err);
      setStatus('Processing failed.');
    }
  };

  const checkStatus = async (id: number) => {
    try {
      const response = await axios.get(`http://127.0.0.1:5000/api/convert/status/${id}`);
      if (response.data.status === 'done') {
        setStatus('Ready!');
        setDownloadLink(`http://127.0.0.1:5000/api/convert/download/${id}`);
      } else if (response.data.status === 'failed') {
        setStatus('Conversion failed.');
      } else {
        setTimeout(() => checkStatus(id), 2000);
      }
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <main className="main-container">
      <h1>Convert your Files</h1>
      <p>A fast, free, and secure way to convert files</p>
      
      <div className="upload-zone">
        <h2>Choose a File</h2>
        <input type="file" onChange={handleFileChange} accept="image/*" />
        {file && (
          <div style={{ marginTop: '2rem' }}>
            <p>Selected: {file.name}</p>
            <div style={{ margin: '1rem 0' }}>
              <label>Convert to: </label>
              <select value={targetFormat} onChange={(e) => setTargetFormat(e.target.value)}>
                <option value="png">PNG</option>
                <option value="jpg">JPG</option>
                <option value="webp">WEBP</option>
              </select>
            </div>
            <button className="btn-primary" onClick={handleUpload}>Convert</button>
          </div>
        )}
      </div>

      {status && <p style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>Status: {status}</p>}
      
      {downloadLink && (
        <a href={downloadLink} className="btn-primary" style={{ display: 'inline-block', marginTop: '1rem' }}>
          Download Result
        </a>
      )}
    </main>
  );
}
