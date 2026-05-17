
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { convertFileToLatex } from './services/geminiService';
import { AppStatus } from './types';
import LatexRenderer from './components/LatexRenderer';

// Pre-filled initial content from the user's provided image
const INITIAL_CONTENT = `
# ĐỀ THI HỌC SINH GIỎI GIẢI TOÁN LỚP 9 TRÊN MÁY TÍNH CẦM TAY
## Ở Thành phố Hồ Chí Minh (2024-2025)

**Bài 1:** Cho hai số $a, b$ thỏa mãn $\\overline{72a767b5}$ chia hết cho 2025, tính $a^2 + b^2$.

**Bài 2:** Tính tổng các ước nguyên tố của số $1994096512$.

**Bài 3:** Gọi $S$ là tập hợp các số lẻ có ba chữ số không chia hết cho ba.
a) Tập hợp $S$ có bao nhiêu số?
b) Tính tổng các chữ số của tập hợp.

**Bài 4:** Cho $g(x) = 8x^3 - 23x^2 + 19x + 43$ và $f(x)$ bậc ba. Tính $f(5)$ biết $f(x)$ thỏa mãn:
$f(1) = g(1); \\quad f(2) = \\frac{1}{2} \\cdot g(2); \\quad f(3) = \\frac{1}{3} \\cdot g(3); \\quad f(4) = \\frac{1}{4} \\cdot g(4)$.

**Bài 5:** Cho phương trình: $\\frac{0,19x + 3,41}{2,9 - 5,7x} = \\frac{0,23x - 2,35}{3,7 - 6,9x}$ có nghiệm $x = \\frac{m}{n}$ ($m, n \\in \\mathbb{N}^*$). Tính $m + n$.

**Bài 6:** Tính $A = \\lceil \\sqrt[3]{1} \\rceil + \\lceil \\sqrt[3]{2} \\rceil + \\lceil \\sqrt[3]{3} \\rceil + \\dots + \\lceil \\sqrt[3]{2025} \\rceil$. Với $\\lceil x \\rceil$ là số nguyên nhỏ nhất có giá trị lớn hơn hoặc bằng $x$. Ví dụ: $\\lceil 1,2 \\rceil = 2; \\lceil 1,4 \\rceil = 2; \\lceil 2,3 \\rceil = 3; \\lceil 3 \\rceil = 3$.

**Bài 7:** Cho $\\triangle ABC$, có $AB = 4,9; BC = 7,2; AC = 6,8$. Biết đường cao $BH$ và đường phân giác trong $AD$ cắt nhau tại $F$.
a) Tính độ dài đoạn $BH, AD, HD$.
b) Tính diện tích của $\\triangle BFD$.

**Bài 8:** Cho tam giác đều có cạnh bằng 6. Mỗi góc, vẽ hình quạt tròn lớn có bán kính bằng 3 đi qua trung điểm của hai cạnh. Vẽ một đường tròn nhỏ nằm trong tam giác đều có tiếp xúc 3 điểm của các hình quạt tròn lớn đó (Như hình vẽ). Tính chính xác hai chữ số thập phân của:
a) Diện tích hình phẳng giới hạn trong tam giác đều và ngoài 3 hình quạt lớn.
b) Diện tích hình tròn nhỏ.
`;

const App: React.FC = () => {
  const [content, setContent] = useState<string>(INITIAL_CONTENT);
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  const processFile = useCallback(async (file: File) => {
    setStatus(AppStatus.PROCESSING);
    setError(null);

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64Data = e.target?.result as string;
        const base64String = base64Data.split(',')[1];
        const mimeType = file.type;

        try {
          const result = await convertFileToLatex(base64String, mimeType);
          setContent(result);
          setStatus(AppStatus.SUCCESS);
        } catch (err) {
          setError("Không thể chuyển đổi tài liệu. Vui lòng kiểm tra kết nối hoặc thử lại.");
          setStatus(AppStatus.ERROR);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setError("Lỗi khi đọc tệp tin.");
      setStatus(AppStatus.ERROR);
    }
  }, []);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    processFile(file);
    if (event.target) {
      event.target.value = '';
    }
  };

  const handlePaste = useCallback(async () => {
    try {
      const clipboardItems = await navigator.clipboard.read();
      for (const item of clipboardItems) {
        for (const type of item.types) {
          if (type.startsWith('image/')) {
            const blob = await item.getType(type);
            const file = new File([blob], 'pasted_image.png', { type });
            processFile(file);
            return;
          }
        }
      }
      alert("Không tìm thấy ảnh trong bộ nhớ tạm (clipboard). Hãy copy một ảnh trước.");
    } catch (err) {
      console.error("Paste error:", err);
      setError("Không thể truy cập bộ nhớ tạm. Vui lòng thử lại hoặc tải ảnh lên.");
    }
  }, [processFile]);

  // Handle global paste event (Ctrl+V)
  useEffect(() => {
    const onGlobalPaste = (event: ClipboardEvent) => {
      const items = event.clipboardData?.items;
      if (items) {
        for (let i = 0; i < items.length; i++) {
          if (items[i].type.indexOf('image') !== -1) {
            const blob = items[i].getAsFile();
            if (blob) {
              processFile(blob);
              break;
            }
          }
        }
      }
    };

    window.addEventListener('paste', onGlobalPaste);
    return () => window.removeEventListener('paste', onGlobalPaste);
  }, [processFile]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(content);
    alert("Đã sao chép vào bộ nhớ tạm!");
  };

  const downloadAsMarkdown = () => {
    const element = document.createElement("a");
    const file = new Blob([content], { type: 'text/markdown' });
    element.href = URL.createObjectURL(file);
    element.download = "tai_lieu_toan.md";
    document.body.appendChild(element);
    element.click();
  };

  const exportToPDF = useCallback(() => {
    if (!previewRef.current) return;

    const opt = {
      margin: 1,
      filename: 'tai_lieu_toan.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    };

    // @ts-ignore
    window.html2pdf().from(previewRef.current).set(opt).save();
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10 px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="bg-indigo-600 p-2 rounded-lg shadow-sm">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 leading-tight">MathLaTeX OCR</h1>
              <p className="text-sm text-gray-500">Đánh máy tài liệu toán học (Ảnh/PDF) sang LaTeX</p>
            </div>
          </div>

          <div className="flex items-center flex-wrap gap-2">
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*,application/pdf"
              onChange={handleFileUpload}
            />
            <button
              onClick={() => {
                fileInputRef.current!.value = '';
                setStatus(AppStatus.IDLE);
                setError(null);
                alert("Đã reset trạng thái xử lý ảnh.");
              }}
              disabled={status === AppStatus.IDLE}
              className="flex items-center px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition font-medium shadow-sm disabled:opacity-50"
              title="Xóa trạng thái ảnh hiện tại"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Xóa ảnh
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={status === AppStatus.PROCESSING}
              className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium shadow-sm disabled:opacity-50"
              title="Tải ảnh hoặc file PDF lên"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              Tải Tệp
            </button>
            <button
              onClick={handlePaste}
              disabled={status === AppStatus.PROCESSING}
              className="flex items-center px-4 py-2 bg-white border border-indigo-600 text-indigo-600 rounded-lg hover:bg-indigo-50 transition font-medium shadow-sm disabled:opacity-50"
              title="Dán ảnh từ bộ nhớ tạm (Ctrl+V)"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              Dán Ảnh
            </button>
            <button
              onClick={exportToPDF}
              className="flex items-center px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium shadow-sm"
              title="Xuất nội dung ra file PDF"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Xuất PDF
            </button>
            <button
              onClick={copyToClipboard}
              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium shadow-sm"
            >
              Sao chép
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow max-w-7xl mx-auto w-full p-6 flex flex-col lg:flex-row gap-6 overflow-hidden">
        {/* Editor Area */}
        <div className="flex-1 flex flex-col bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Trình soạn thảo</span>
              <span className="text-[10px] bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded font-mono">MD + LaTeX</span>
            </div>
            <button 
              onClick={() => {
                if (confirm("Bạn có chắc chắn muốn xóa nội dung đề bài hiện tại?")) {
                  setContent("");
                  setStatus(AppStatus.IDLE);
                  setError(null);
                }
              }}
              className="text-xs text-red-600 hover:underline font-medium mr-3"
            >
              Xóa đề
            </button>
            <button 
              onClick={downloadAsMarkdown}
              className="text-xs text-indigo-600 hover:underline font-medium"
            >
              Tải .md
            </button>
          </div>
          <textarea
            className="flex-grow p-4 font-mono text-sm focus:outline-none resize-none bg-gray-50/50"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Nội dung LaTeX sẽ hiển thị tại đây... Bạn có thể nhấn Ctrl+V để dán ảnh."
          />
        </div>

        {/* Preview Area */}
        <div className="flex-1 flex flex-col bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden min-h-[500px]">
          <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Xem trước</span>
            {status === AppStatus.PROCESSING && (
              <span className="flex items-center text-xs text-indigo-600 font-medium animate-pulse">
                <svg className="animate-spin h-3 w-3 mr-2" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                AI đang xử lý...
              </span>
            )}
          </div>
          <div ref={previewRef} className="flex-grow overflow-auto p-8 bg-white">
            {error ? (
              <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg flex items-center">
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            ) : (
              <LatexRenderer content={content} />
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-4 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-500">
          <p>© 2024 MathLaTeX OCR - Hỗ trợ bởi Gemini Flash</p>
          <div className="flex gap-6">
            <span className="italic">Gợi ý: Nhấn <b>Ctrl+V</b> để dán ảnh nhanh</span>
            <a href="#" className="hover:text-indigo-600 transition">Hướng dẫn</a>
            <a href="#" className="hover:text-indigo-600 transition">Góp ý</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
