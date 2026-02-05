
import React, { useState, useEffect } from 'react';
import { WebAnalysis, YoutubeAnalysis, FaceAnalysis, TreatmentPlan, DocumentAnalysis } from '../types';
import { jsPDF } from 'jspdf';
import { Document, Packer, Paragraph, TextRun, AlignmentType } from 'docx';

interface MediaLabProps {
  webAnalysis?: WebAnalysis;
  youtubeAnalysis?: YoutubeAnalysis;
  faceAnalysis?: FaceAnalysis;
  treatmentPlan?: TreatmentPlan;
  documentAnalysis?: DocumentAnalysis;
  onClose: () => void;
}

type MediaTab = 'document' | 'treatment' | 'face' | 'youtube' | 'web';

const MediaLab: React.FC<MediaLabProps> = ({ webAnalysis, youtubeAnalysis, faceAnalysis, treatmentPlan, documentAnalysis, onClose }) => {
  const [editableText, setEditableText] = useState(documentAnalysis?.cleanedHindiText || '');
  const [activeTab, setActiveTab] = useState<MediaTab | null>(null);

  useEffect(() => {
    const tabs: MediaTab[] = [];
    if (documentAnalysis) tabs.push('document');
    if (treatmentPlan) tabs.push('treatment');
    if (faceAnalysis) tabs.push('face');
    if (youtubeAnalysis) tabs.push('youtube');
    if (webAnalysis) tabs.push('web');
    setActiveTab((prev) => (prev && tabs.includes(prev) ? prev : tabs[0] ?? null));
  }, [webAnalysis, youtubeAnalysis, faceAnalysis, treatmentPlan, documentAnalysis]);

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(documentAnalysis?.title || 'Converted Hindi Document', 20, 20);
    doc.setFontSize(12);
    // Basic text wrap for long Hindi content
    const splitText = doc.splitTextToSize(editableText, 170);
    doc.text(splitText, 20, 35);
    doc.save("Converted_Hindi_Document.pdf");
  };

  const exportDOCX = async () => {
    try {
      const doc = new Document({
        sections: [
          {
            properties: {},
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: documentAnalysis?.title || 'Converted Hindi Document',
                    bold: true,
                    size: 32,
                    font: 'Mangal',
                  }),
                ],
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: '\n',
                  }),
                ],
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: editableText,
                    font: 'Mangal',
                    size: 24,
                  }),
                ],
              }),
            ],
          },
        ],
      });

      const blob = await Packer.toBlob(doc);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = "Converted_Hindi_Document.docx";
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("DOCX Export Error:", err);
      alert("Maafi chahti hoon Boss Jaan, Word file banane me thodi thakaan ho gayi!");
    }
  };

  if (!webAnalysis && !youtubeAnalysis && !faceAnalysis && !treatmentPlan && !documentAnalysis) return null;

  return (
    <div className="flex flex-col h-full cyber-glass bg-slate-900/90 rounded-[1.5rem] md:rounded-[2.5rem] overflow-hidden border-sky-500/30 shadow-2xl animate-in slide-in-from-right-10">
      <div className="p-5 md:p-8 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/40 flex items-center justify-center">
             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 text-sky-400"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75" /></svg>
          </div>
          <div>
            <h2 className="text-white font-black text-lg md:text-xl uppercase tracking-tighter">Analysis Hub</h2>
            <p className="text-[8px] md:text-[10px] text-sky-400 font-bold uppercase tracking-[0.2em]">Dr. Chinki Intelligence</p>
          </div>
        </div>
        <button onClick={onClose} className="p-2 text-slate-500 hover:text-white transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
        </button>
      </div>

      <div className="px-5 md:px-8 pt-3 md:pt-4 border-b border-slate-800">
        <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-2">
          {documentAnalysis && (
            <button
              onClick={() => setActiveTab('document')}
              className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] border transition-all ${
                activeTab === 'document'
                  ? 'bg-emerald-500/20 border-emerald-500/60 text-emerald-300'
                  : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-emerald-500/40'
              }`}
            >
              Document
            </button>
          )}
          {treatmentPlan && (
            <button
              onClick={() => setActiveTab('treatment')}
              className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] border transition-all ${
                activeTab === 'treatment'
                  ? 'bg-red-500/15 border-red-500/60 text-red-300'
                  : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-red-500/40'
              }`}
            >
              Treatment
            </button>
          )}
          {faceAnalysis && (
            <button
              onClick={() => setActiveTab('face')}
              className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] border transition-all ${
                activeTab === 'face'
                  ? 'bg-purple-500/20 border-purple-500/60 text-purple-300'
                  : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-purple-500/40'
              }`}
            >
              Face Reading
            </button>
          )}
          {youtubeAnalysis && (
            <button
              onClick={() => setActiveTab('youtube')}
              className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] border transition-all ${
                activeTab === 'youtube'
                  ? 'bg-pink-500/20 border-pink-500/60 text-pink-200'
                  : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-pink-500/40'
              }`}
            >
              YouTube
            </button>
          )}
          {webAnalysis && (
            <button
              onClick={() => setActiveTab('web')}
              className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] border transition-all ${
                activeTab === 'web'
                  ? 'bg-sky-500/20 border-sky-500/60 text-sky-200'
                  : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-sky-500/40'
              }`}
            >
              Website
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5 md:p-8 space-y-8 custom-scrollbar">
        {documentAnalysis && activeTab === 'document' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-top-4">
                <div className="bg-emerald-950/20 p-6 rounded-3xl border border-emerald-500/30 shadow-[inset_0_0_20px_rgba(16,185,129,0.1)]">
                   <div className="flex justify-between items-start mb-2">
                      <span className="text-emerald-400 font-black text-[9px] uppercase tracking-widest block">Doc Wizard Process Complete</span>
                      <span className="text-[8px] font-black text-slate-500 uppercase px-2 py-0.5 bg-slate-900 rounded-md">100% Neural Accuracy</span>
                   </div>
                   <h3 className="text-xl font-black text-white glow-text uppercase leading-tight mb-3">
                    {documentAnalysis.title || 'Processed Hindi Asset'}
                   </h3>
                   <p className="text-[10px] text-slate-400 leading-relaxed italic">
                    {documentAnalysis.summary}
                   </p>
                </div>

                <div className="space-y-3">
                    <div className="flex justify-between items-center px-1">
                        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                           <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span> Editable Digital Output:
                        </h4>
                        <button 
                            onClick={() => {
                                navigator.clipboard.writeText(editableText);
                                alert("Text Copied Boss Jaan!");
                            }}
                            className="text-[8px] font-black text-sky-400 uppercase tracking-widest hover:text-white transition-colors"
                        >
                            Copy to Clipboard
                        </button>
                    </div>
                    <textarea 
                        value={editableText}
                        onChange={(e) => setEditableText(e.target.value)}
                        className="w-full h-80 bg-slate-950 p-6 rounded-3xl border border-slate-800 text-slate-200 text-sm leading-relaxed focus:outline-none focus:border-emerald-500/50 resize-none font-hindi custom-scrollbar shadow-inner"
                        placeholder="Hindi text yahan dikhega..."
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <button 
                        onClick={exportPDF}
                        className="py-4 bg-emerald-600/10 text-emerald-400 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] hover:bg-emerald-600 hover:text-white border border-emerald-500/30 transition-all flex items-center justify-center gap-2"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m.75 12 3 3m0 0 3-3m-3 3v-6m-1.5-9H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" /></svg>
                        Export PDF
                    </button>
                    <button 
                        onClick={exportDOCX}
                        className="py-4 bg-sky-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] hover:bg-sky-500 shadow-lg glow-cyan transition-all flex items-center justify-center gap-2"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" /></svg>
                        Download Word
                    </button>
                </div>
            </div>
        )}

        {treatmentPlan && activeTab === 'treatment' && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="bg-emerald-900/20 p-6 rounded-3xl border border-emerald-500/30 shadow-inner">
               <span className="text-emerald-400 font-black text-[9px] uppercase tracking-widest mb-2 block">Doctor's Final Verdict</span>
               <h3 className="text-2xl font-black text-white glow-text mb-2 uppercase leading-tight">{treatmentPlan.diagnosis}</h3>
            </div>

            {treatmentPlan.reportAnalysis && treatmentPlan.reportAnalysis.length > 0 && (
              <div className="space-y-3">
                 <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Detected Report Markings:</h4>
                 {treatmentPlan.reportAnalysis.map((item, i) => (
                    <div key={i} className={`p-4 rounded-2xl border flex flex-col gap-1 transition-all ${
                        item.status === 'Critical' ? 'bg-red-950/20 border-red-500/40' : 
                        item.status === 'Warning' ? 'bg-yellow-900/10 border-yellow-500/40' : 
                        'bg-slate-800 border-slate-700'
                    }`}>
                        <div className="flex justify-between items-center">
                            <span className="text-[10px] font-black text-slate-400 uppercase">{item.parameter}</span>
                            {item.symbolDetected && (
                                <span className="bg-sky-500/20 text-sky-400 text-[9px] font-black px-2 py-1 rounded-lg border border-sky-500/30">
                                   SYMBOL: {item.symbolDetected}
                                </span>
                            )}
                        </div>
                        <div className="text-xl font-black text-white">{item.value}</div>
                        <p className="text-[10px] text-slate-500 italic mt-1">"{item.insight}"</p>
                    </div>
                 ))}
              </div>
            )}

            {(treatmentPlan.spiritualCure || treatmentPlan.scripturalReference) && (
              <div className="p-6 bg-purple-500/5 border border-purple-500/20 rounded-[2rem] shadow-xl">
                 <div className="flex items-center gap-3 mb-4">
                    <span className="text-2xl">📜</span>
                    <h4 className="text-[10px] font-black text-purple-400 uppercase tracking-widest">Divine Library Revelation</h4>
                 </div>
                 {treatmentPlan.scripturalReference && (
                    <div className="mb-4 p-4 bg-slate-950/40 rounded-2xl border border-purple-500/10">
                        <p className="text-xs text-slate-300 italic leading-relaxed">"{treatmentPlan.scripturalReference}"</p>
                    </div>
                 )}
                 {treatmentPlan.spiritualCure && (
                    <div className="p-4 bg-emerald-500/5 rounded-2xl border border-emerald-500/10">
                        <span className="text-[9px] font-black text-emerald-400 uppercase block mb-1">Recommended Wazifa/Spiritual Remedy:</span>
                        <p className="text-sm text-emerald-100 font-bold">{treatmentPlan.spiritualCure}</p>
                    </div>
                 )}
              </div>
            )}

            <div className="space-y-4">
              <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Prescription Details:</h4>
              <div className="space-y-2">
                {treatmentPlan.recommendedMedicine.map((med, i) => (
                  <div key={i} className="flex items-center gap-3 p-4 bg-slate-800/40 rounded-2xl border border-slate-700">
                    <div className="w-2.5 h-2.5 rounded-full bg-sky-500 animate-pulse shadow-glow"></div>
                    <span className="text-xs text-slate-200 font-bold">{med}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {faceAnalysis && activeTab === 'face' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="bg-purple-900/20 p-6 rounded-3xl border border-purple-500/30">
               <span className="text-purple-400 font-black text-[9px] uppercase tracking-widest mb-2 block">Physiognomy Reading</span>
               <h3 className="text-xl font-black text-white glow-text mb-4">DESTINY REVEALED</h3>
               <p className="text-sm text-slate-300 italic">"{faceAnalysis.destinyReading}"</p>
            </div>
          </div>
        )}

        {youtubeAnalysis && activeTab === 'youtube' && (
            <div className="bg-pink-950/10 p-6 rounded-3xl border border-pink-500/30 space-y-4">
                <span className="text-pink-400 font-black text-[9px] uppercase tracking-widest">Viral Predictor</span>
                <div className="text-center">
                    <div className="text-3xl font-black text-white glow-text">{youtubeAnalysis.predictedViews}</div>
                    <p className="text-[8px] text-slate-500 uppercase mt-1">Estimated Reach</p>
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-pink-500" style={{ width: `${youtubeAnalysis.viralIndex}%` }}></div>
                </div>
            </div>
        )}
        {webAnalysis && activeTab === 'web' && (
          <div className="bg-sky-950/20 p-6 rounded-3xl border border-sky-500/30 space-y-4 animate-in fade-in slide-in-from-top-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sky-400 font-black text-[9px] uppercase tracking-widest block mb-1">
                  Website Intelligence
                </span>
                <h3 className="text-lg font-black text-white glow-text">{webAnalysis.siteName}</h3>
              </div>
            </div>
            <p className="text-[10px] text-slate-300 leading-relaxed">
              {webAnalysis.logicDescription}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[10px] text-slate-300">
              <div className="p-3 bg-slate-950/60 rounded-2xl border border-slate-800">
                <span className="text-[8px] text-sky-400 font-black uppercase tracking-widest block mb-1">
                  Primary Function
                </span>
                <p>{webAnalysis.primaryFunction}</p>
              </div>
              <div className="p-3 bg-slate-950/60 rounded-2xl border border-slate-800">
                <span className="text-[8px] text-sky-400 font-black uppercase tracking-widest block mb-1">
                  Tech Stack Highlights
                </span>
                <ul className="list-disc list-inside space-y-1">
                  {webAnalysis.technicalStructure.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="p-3 bg-emerald-950/30 rounded-2xl border border-emerald-500/30">
              <span className="text-[8px] text-emerald-400 font-black uppercase tracking-widest block mb-1">
                Business Logic
              </span>
              <p className="text-[10px] text-emerald-100 leading-relaxed">
                {webAnalysis.businessLogic}
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="p-6 bg-slate-900/80 border-t border-slate-800 text-center">
        <p className="text-[8px] text-slate-600 font-black uppercase tracking-[0.4em]">Proprietary Chinki Oracle Logic Active</p>
      </div>
    </div>
  );
};

export default MediaLab;
