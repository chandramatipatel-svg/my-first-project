import { useState } from 'react';
import Editor from '@monaco-editor/react';
import { Play, CheckCircle, AlertTriangle, XCircle, Info, Code2, Sparkles, Activity } from 'lucide-react';

function App() {
  const [code, setCode] = useState('# Write your Python code here...\n\ndef hello_world():\n    print("Hello World")\n');
  const [language, setLanguage] = useState('python');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    try {
      const response = await fetch('http://localhost:5000/analyze-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code, language }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setAnalysisResult(data);
      } else {
        alert(data.error || 'An error occurred during analysis');
      }
    } catch (error) {
      console.error('Error calling analysis API:', error);
      alert('Failed to connect to the backend server. Is it running?');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const renderIssueIcon = (type) => {
    switch (type) {
      case 'error': return <XCircle className="w-5 h-5 text-red-500" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'info': return <Info className="w-5 h-5 text-blue-500" />;
      default: return <CheckCircle className="w-5 h-5 text-green-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 font-sans flex flex-col">
      {/* Navbar */}
      <header className="bg-slate-800 border-b border-slate-700 p-4 flex items-center justify-between shadow-md z-10">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 p-2 rounded-lg">
            <Code2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">AI Code Reviewer</h1>
            <p className="text-xs text-slate-400">Student Assistant & Bug Predictor</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <select 
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="bg-slate-700 border border-slate-600 text-sm rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
          >
            <option value="python">Python</option>
            <option value="javascript">JavaScript</option>
            <option value="java">Java</option>
            <option value="cpp">C++</option>
          </select>
          <button 
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-800 disabled:cursor-not-allowed text-white px-4 py-2 rounded-md text-sm font-medium transition-all shadow-lg shadow-indigo-900/50"
          >
            {isAnalyzing ? (
              <Activity className="w-4 h-4 animate-spin" />
            ) : (
              <Play className="w-4 h-4" />
            )}
            {isAnalyzing ? 'Analyzing...' : 'Analyze Code'}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex overflow-hidden">
        {/* Editor Pane */}
        <div className="w-1/2 flex flex-col border-r border-slate-700 bg-[#1e1e1e]">
          <div className="p-3 bg-slate-800/50 border-b border-slate-700 flex justify-between items-center text-sm">
            <span className="text-slate-300 font-medium">Editor</span>
            <span className="text-xs text-slate-500">{language}</span>
          </div>
          <div className="flex-1 w-full h-full relative">
            <Editor
              height="100%"
              defaultLanguage="python"
              language={language}
              theme="vs-dark"
              value={code}
              onChange={(value) => setCode(value)}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                padding: { top: 16 },
                smoothScrolling: true,
                cursorBlinking: "smooth",
              }}
            />
          </div>
        </div>

        {/* Results Pane */}
        <div className="w-1/2 flex flex-col bg-slate-900 overflow-y-auto">
          {analysisResult ? (
            <div className="p-6 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              
              {/* Score Card */}
              <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 shadow-xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Sparkles className="w-24 h-24 text-indigo-500" />
                </div>
                <h2 className="text-lg font-semibold mb-4 text-slate-200">Overall Score</h2>
                <div className="flex items-end gap-4">
                  <div className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">
                    {analysisResult.score}
                  </div>
                  <div className="text-slate-400 pb-2">/ 100</div>
                </div>
                
                {/* Category Bars */}
                <div className="mt-6 space-y-3">
                  {Object.entries(analysisResult.categories).map(([key, val]) => (
                    <div key={key} className="space-y-1">
                      <div className="flex justify-between text-xs text-slate-400 uppercase tracking-wider">
                        <span>{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                        <span>{val}%</span>
                      </div>
                      <div className="h-2 w-full bg-slate-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-indigo-500 rounded-full transition-all duration-1000 ease-out"
                          style={{ width: `${val}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Issues List */}
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-slate-200 flex items-center gap-2">
                  Feedback & Suggestions
                  <span className="bg-slate-700 text-slate-300 text-xs py-0.5 px-2 rounded-full">
                    {analysisResult.issues.length}
                  </span>
                </h2>
                
                <div className="space-y-3">
                  {analysisResult.issues.map((issue, idx) => (
                    <div 
                      key={idx}
                      className="bg-slate-800/80 border border-slate-700 rounded-lg p-4 flex gap-4 items-start hover:bg-slate-800 transition-colors"
                    >
                      <div className="mt-0.5">
                        {renderIssueIcon(issue.type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-1">
                          <h3 className="font-medium text-slate-200">{issue.message}</h3>
                          {issue.line && (
                            <span className="text-xs bg-slate-700 text-slate-400 px-2 py-1 rounded">
                              Line {issue.line}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-slate-400 mt-2">
                          {/* Placeholder for explanation logic */}
                          This is a beginner-friendly explanation of why this issue matters and how to fix it.
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-500 space-y-4 p-8 text-center">
              <div className="bg-slate-800/50 p-6 rounded-full border border-slate-700/50 shadow-inner">
                <Code2 className="w-12 h-12 opacity-50" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-slate-300 mb-1">Ready for Review</h3>
                <p className="text-sm">Write or paste your code in the editor, then click Analyze Code to get feedback.</p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
