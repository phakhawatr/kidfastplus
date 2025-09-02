import React, { useState, useEffect, useRef } from 'react';

const AdditionApp = () => {
  // State management
  const [count, setCount] = useState(10);
  const [level, setLevel] = useState('easy');
  const [digits, setDigits] = useState(1);
  const [carry, setCarry] = useState('none'); // เปลี่ยนจาก borrow เป็น carry
  const [numberSet, setNumberSet] = useState(2); // 2 = show 2 numbers (A + B = ?), 3 = show 3 numbers (A + B + C = ?)
  const [problems, setProblems] = useState<any[]>([]);
  const [answers, setAnswers] = useState<string[][]>([]);
  const [carryInputs, setCarryInputs] = useState<string[][]>([]); // เพิ่มสำหรับช่องทดเลข
  const [results, setResults] = useState<string[]>([]);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [finishedAt, setFinishedAt] = useState<number | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [showAnswers, setShowAnswers] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [statistics, setStatistics] = useState<any[]>([]);
  
  const inputRefs = useRef<any[]>([]);
  const carryInputRefs = useRef<any[]>([]); // เพิ่ม ref สำหรับช่องทดเลข

  // Timer effect
  useEffect(() => {
    let interval;
    if (startedAt && !finishedAt) {
      interval = setInterval(() => {
        setElapsedMs(Date.now() - startedAt);
      }, 100);
    }
    return () => clearInterval(interval);
  }, [startedAt, finishedAt]);

  // Load statistics from localStorage
  useEffect(() => {
    const savedStats = localStorage.getItem('addition-stats');
    if (savedStats) {
      setStatistics(JSON.parse(savedStats));
    }
  }, []);

  // Format time display
  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Generate addition problems based on settings
  const generateAdditionProblems = (count: number, level: string, digits: number, carry: string, numberSet: number) => {
    const problems = [];
    const maxAttempts = count * 10; // Prevent infinite loops
    let attempts = 0;

    while (problems.length < count && attempts < maxAttempts) {
      attempts++;
      
      // Generate numbers based on digit count
      const min = digits === 1 ? 1 : Math.pow(10, digits - 1);
      const max = Math.pow(10, digits) - 1;
      
      let addend1, addend2, addend3;
      
      if (numberSet === 2) {
        // Regular A + B = ? problem
        if (carry === 'none') {
          // No carrying - sum of each digit position should be < 10
          addend1 = Math.floor(Math.random() * (max - min + 1)) + min;
          const addend1Digits = addend1.toString().split('').map(Number);
          const addend2Digits = [];
          
          for (let i = 0; i < addend1Digits.length; i++) {
            const maxDigit = Math.min(9 - addend1Digits[i], 
              level === 'easy' ? 3 : 
              level === 'medium' ? 5 : 
              9 - addend1Digits[i]);
            addend2Digits.push(Math.floor(Math.random() * (maxDigit + 1)));
          }
          addend2 = parseInt(addend2Digits.join(''));
        } else {
          // Allow carrying
          const maxSum = Math.pow(10, digits + 1) - 1; // Allow one extra digit for result
          addend1 = Math.floor(Math.random() * (max - min + 1)) + min;
          const maxAddend2 = Math.min(max, maxSum - addend1);
          const minAddend2 = level === 'easy' ? Math.floor(max * 0.1) :
                            level === 'medium' ? Math.floor(max * 0.3) :
                            Math.floor(max * 0.5);
          
          addend2 = Math.floor(Math.random() * (maxAddend2 - minAddend2 + 1)) + minAddend2;
        }

        const result = addend1 + addend2;
        
        if (result <= 1000 && addend1 > 0 && addend2 > 0) {
          const resultStr = result.toString();
          const resultDigits = resultStr.split('').map(Number);
          
          problems.push({
            addend1,
            addend2,
            addend3: null,
            result,
            resultDigits,
            numberSet: 2
          });
        }
      } else {
        // A + B + C = ? problem
        const maxSum = Math.pow(10, digits + 1) - 1;
        addend1 = Math.floor(Math.random() * (max - min + 1)) + min;
        addend2 = Math.floor(Math.random() * (max - min + 1)) + min;
        
        const remainingSum = maxSum - addend1 - addend2;
        if (remainingSum >= min) {
          addend3 = Math.floor(Math.random() * Math.min(remainingSum - min + 1, max - min + 1)) + min;
          
          const result = addend1 + addend2 + addend3;
          
          if (result <= 1000 && addend1 > 0 && addend2 > 0 && addend3 > 0) {
            const resultStr = result.toString();
            const resultDigits = resultStr.split('').map(Number);
            
            problems.push({
              addend1,
              addend2,
              addend3,
              result,
              resultDigits,
              numberSet: 3
            });
          }
        }
      }
    }

    return problems;
  };

  // Initialize new problem set
  const generateNewSet = () => {
    const newProblems = generateAdditionProblems(count, level, digits, carry, numberSet);
    setProblems(newProblems);
    setAnswers(new Array(count).fill(null).map(() => []));
    setCarryInputs(new Array(count).fill(null).map(() => [])); // เพิ่มการรีเซ็ต carry inputs
    setResults(new Array(count).fill('pending'));
    setShowAnswers(false);
    setShowResultModal(false);
    setStartedAt(null);
    setFinishedAt(null);
    setElapsedMs(0);
    
    // Clear input refs
    setTimeout(() => {
      inputRefs.current = [];
      carryInputRefs.current = [];
    }, 100);
  };

  // Handle input change
  const handleInputChange = (problemIndex: number, digitIndex: number, value: string) => {
    if (!startedAt) {
      setStartedAt(Date.now());
    }

    if (/^\d$/.test(value) || value === '') {
      const newAnswers = [...answers];
      if (!newAnswers[problemIndex]) {
        newAnswers[problemIndex] = [];
      }
      newAnswers[problemIndex][digitIndex] = value;
      setAnswers(newAnswers);

      // Auto-advance to next input
      if (value !== '' && digitIndex < problems[problemIndex].resultDigits.length - 1) {
        const nextInput = inputRefs.current[problemIndex]?.[digitIndex + 1];
        if (nextInput) {
          nextInput.focus();
        }
      }
    }
  };

  // Handle carry input change
  const handleCarryInputChange = (problemIndex: number, digitIndex: number, value: string) => {
    if (/^\d$/.test(value) || value === '') {
      const newCarryInputs = [...carryInputs];
      if (!newCarryInputs[problemIndex]) {
        newCarryInputs[problemIndex] = [];
      }
      newCarryInputs[problemIndex][digitIndex] = value;
      setCarryInputs(newCarryInputs);
    }
  };

  // Handle backspace navigation
  const handleKeyDown = (problemIndex: number, digitIndex: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !answers[problemIndex]?.[digitIndex] && digitIndex > 0) {
      const prevInput = inputRefs.current[problemIndex]?.[digitIndex - 1];
      if (prevInput) {
        prevInput.focus();
      }
    } else if (e.key === 'Enter') {
      // Check if this is the last input of the last problem
      const isLastProblem = problemIndex === problems.length - 1;
      const isLastDigit = digitIndex === problems[problemIndex].resultDigits.length - 1;
      
      if (isLastProblem && isLastDigit) {
        checkAnswers();
      }
    }
  };

  // Handle paste
  const handlePaste = (problemIndex: number, digitIndex: number, e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text');
    const digits = pastedText.replace(/\D/g, '').split('');
    
    const newAnswers = [...answers];
    if (!newAnswers[problemIndex]) {
      newAnswers[problemIndex] = [];
    }

    digits.forEach((digit, index) => {
      const targetIndex = digitIndex + index;
      if (targetIndex < problems[problemIndex].resultDigits.length) {
        newAnswers[problemIndex][targetIndex] = digit;
      }
    });

    setAnswers(newAnswers);
  };

  // Check answers
  const checkAnswers = () => {
    if (!startedAt) return;
    
    setFinishedAt(Date.now());
    const newResults = problems.map((problem, problemIndex) => {
      const userAnswer = answers[problemIndex] || [];
      const correctDigits = problem.resultDigits;
      
      // Check if all digits are correct
      if (userAnswer.length === correctDigits.length) {
        const isCorrect = correctDigits.every((digit, index) => 
          parseInt(userAnswer[index]) === digit
        );
        return isCorrect ? 'correct' : 'incorrect';
      }
      return 'incorrect';
    });

    setResults(newResults);
    
    // Save statistics
    const correctCount = newResults.filter(r => r === 'correct').length;
    const finalTime = Date.now() - startedAt;
    
    const newStat = {
      timestamp: Date.now(),
      count,
      level,
      digits,
      carry, // เปลี่ยนจาก borrow
      numberSet,
      correct: correctCount,
      total: count,
      durationMs: finalTime
    };

    const updatedStats = [newStat, ...statistics].slice(0, 10);
    setStatistics(updatedStats);
    localStorage.setItem('addition-stats', JSON.stringify(updatedStats));
    
    setShowResultModal(true);
  };

  // Show all answers
  const showAllAnswers = () => {
    const correctAnswers = problems.map(problem => problem.resultDigits.map(d => d.toString()));
    setAnswers(correctAnswers);
    setShowAnswers(true);
  };

  // Open print window
  const openPrintWindow = () => {
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (!printWindow) return;

    const printContent = generatePrintContent();
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
  };

  // Generate print content
  const generatePrintContent = () => {
    const levelText = level === 'easy' ? 'ง่าย' : level === 'medium' ? 'ปานกลาง' : 'ยาก';
    const carryText = carry === 'none' ? 'ไม่มี' : 'มี'; // เปลี่ยนจาก borrowText
    
    return `
<!DOCTYPE html>
<html>
<head>
    <title>ใบงานการบวก</title>
    <meta charset="UTF-8">
    <style>
        @page {
            size: A4;
            margin: 1cm;
        }
        
        body {
            font-family: 'Sarabun', Arial, sans-serif;
            margin: 0;
            padding: 0;
            background: white;
        }
        
        .header {
            text-align: center;
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 2px solid #333;
        }
        
        .title {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 5px;
        }
        
        .subtitle {
            font-size: 16px;
            color: #666;
            margin-bottom: 10px;
        }
        
        .info {
            font-size: 14px;
            margin-bottom: 5px;
        }
        
        .controls {
            text-align: center;
            margin-bottom: 20px;
            padding: 10px;
            background: #f5f5f5;
            border-radius: 8px;
        }
        
        .btn {
            background: #4CAF50;
            color: white;
            border: none;
            padding: 10px 20px;
            margin: 0 5px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 14px;
            font-weight: bold;
        }
        
        .btn:hover {
            background: #45a049;
        }
        
        .btn-secondary {
            background: #2196F3;
        }
        
        .btn-secondary:hover {
            background: #1976D2;
        }
        
        .problems-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 15px;
            margin-top: 20px;
        }
        
        .problem-card {
            border: 1px solid #ddd;
            border-radius: 8px;
            padding: 15px;
            background: #fafafa;
            break-inside: avoid;
            position: relative;
        }
        
        .problem-header {
            font-weight: bold;
            margin-bottom: 10px;
            font-size: 14px;
            text-align: left !important;
            padding-left: 0px !important;
            margin-left: 0px !important;
            position: absolute;
            top: 10px;
            left: 15px;
            width: auto;
        }
        
        .problem-display {
            font-family: 'Courier New', monospace;
            font-size: 18px;
            line-height: 1.2;
            text-align: center;
            margin-top: 25px;
        }
        
        .problem-row {
            display: flex;
            justify-content: center;
            margin-bottom: 3px;
        }
        
        .digit-cell {
            width: 24px;
            height: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
        }
        
        .carry-row {
            margin-bottom: 5px;
            font-size: 14px;
            color: #666;
        }
        
        .carry-box {
            width: 16px;
            height: 16px;
            border: 1px solid #999;
            border-radius: 2px;
            margin: 0 4px;
            display: inline-block;
        }
        
        .answer-row {
            margin-top: 8px;
        }
        
        .answer-box {
            width: 24px;
            height: 24px;
            border: 2px solid #333;
            border-radius: 4px;
            margin: 0 0px;
            display: inline-block;
        }
        
        .horizontal-line {
            border-top: 2px solid #333;
            margin: 5px auto;
        }
        
        @media print {
            .controls {
                display: none;
            }
            .problems-grid {
                grid-template-columns: repeat(4, 1fr);
            }
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="title">การบวกที่ผลลัพธ์ไม่เกิน 1,000</div>
        <div class="subtitle">ใบงานฝึกหัด</div>
        <div class="info">จำนวนข้อ: ${count} | ระดับ: ${levelText} | จำนวนหลัก: ${digits} หลัก | จำนวนชุดตัวเลข: ${numberSet} จำนวน | การทด: ${carryText}</div>
        <div class="info">ชื่อ: _________________________ วันที่: _____________</div>
    </div>
    
    <div class="controls">
        <button class="btn" onclick="window.print()">🖨️ พิมพ์ PDF</button>
        <button class="btn btn-secondary" onclick="shareAsPDF()">📤 แชร์ PDF</button>
        <button class="btn btn-secondary" onclick="window.close()">❌ ปิดหน้าต่าง</button>
    </div>
    
    <div class="problems-grid">
        ${problems.map((problem, index) => {
          const addend1Str = problem.addend1.toString();
          const addend2Str = problem.addend2.toString();
          const addend3Str = problem.addend3 ? problem.addend3.toString() : '';
          
          // Calculate the maximum width needed
          const maxLength = numberSet === 2 
            ? Math.max(addend1Str.length, addend2Str.length + 1, problem.resultDigits.length)
            : Math.max(addend1Str.length, addend2Str.length + 1, addend3Str.length + 1, problem.resultDigits.length);
          
          // Generate carry row (small boxes above)
          const carryBoxes = Array.from({ length: maxLength }, (_, i) => {
            return i === 0 ? '<span style="width: 16px; display: inline-block;"></span>' : '<span class="carry-box"></span>';
          });
          
          // Generate addend1 row
          const addend1Row = Array.from({ length: maxLength }, (_, i) => {
            const digitPos = maxLength - 1 - i;
            const addend1DigitIndex = addend1Str.length - 1 - digitPos;
            return addend1DigitIndex >= 0 ? addend1Str[addend1DigitIndex] : '';
          });
          
          // Generate addend2 row
          const addend2Row = Array.from({ length: maxLength }, (_, i) => {
            if (i === 0) return '+';
            const digitPos = maxLength - 1 - i;
            const addend2DigitIndex = addend2Str.length - 1 - digitPos;
            return addend2DigitIndex >= 0 ? addend2Str[addend2DigitIndex] : '';
          });
          
          // Generate addend3 row (for 3-number mode)
          const addend3Row = numberSet === 3 ? Array.from({ length: maxLength }, (_, i) => {
            if (i === 0) return '+';
            const digitPos = maxLength - 1 - i;
            const addend3DigitIndex = addend3Str.length - 1 - digitPos;
            return addend3DigitIndex >= 0 ? addend3Str[addend3DigitIndex] : '';
          }) : [];
          
          // Generate answer boxes
          const answerBoxes = Array.from({ length: maxLength }, (_, i) => {
            const digitPos = maxLength - 1 - i;
            const resultDigitIndex = problem.resultDigits.length - 1 - digitPos;
            return resultDigitIndex >= 0 ? '<span class="answer-box"></span>' : '<span style="width: 24px; display: inline-block;"></span>';
          });
          
          return `
            <div class="problem-card">
                <div class="problem-header">⭐ ข้อ ${index + 1}</div>
                <div class="problem-display">
                    <div class="problem-row carry-row">
                        ${carryBoxes.join('')}
                    </div>
                    <div class="problem-row">
                        ${addend1Row.map(digit => `<div class="digit-cell">${digit}</div>`).join('')}
                    </div>
                    <div class="problem-row">
                        ${addend2Row.map(digit => `<div class="digit-cell">${digit}</div>`).join('')}
                    </div>
                    ${numberSet === 3 ? `<div class="problem-row">
                        ${addend3Row.map(digit => `<div class="digit-cell">${digit}</div>`).join('')}
                    </div>` : ''}
                    <div class="horizontal-line" style="width: ${maxLength * 24}px;"></div>
                    <div class="problem-row answer-row">
                        ${answerBoxes.join('')}
                    </div>
                </div>
            </div>
          `;
        }).join('')}
    </div>
    
    <script>
        async function shareAsPDF() {
            try {
                if (navigator.share) {
                    const title = 'ใบงานการบวก';
                    const text = 'ใบงานฝึกหัดการบวก';
                    const url = window.location.href;
                    
                    await navigator.share({
                        title: title,
                        text: text,
                        url: url
                    });
                } else {
                    // Fallback: copy URL to clipboard
                    await navigator.clipboard.writeText(window.location.href);
                    alert('ลิงค์ได้ถูกคัดลอกไปยังคลิปบอร์ดแล้ว');
                }
            } catch (err) {
                console.error('Error sharing:', err);
                // Fallback: copy URL to clipboard
                try {
                    await navigator.clipboard.writeText(window.location.href);
                    alert('ลิงค์ได้ถูกคัดลอกไปยังคลิปบอร์ดแล้ว');
                } catch (clipboardErr) {
                    console.error('Clipboard error:', clipboardErr);
                    alert('ไม่สามารถแชร์ได้ กรุณาคัดลอกลิงค์จากแถบที่อยู่');
                }
            }
        }
    </script>
</body>
</html>
    `;
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            🧮 การบวกที่ผลลัพธ์ไม่เกิน 1,000
          </h1>
          <p className="text-gray-600">ฝึกหัดการบวกแบบตั้งกระดาน</p>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="space-y-6">
            {/* จำนวนข้อ */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                จำนวนข้อ
              </label>
              <div className="flex flex-wrap gap-2">
                {[10, 15, 20, 30].map((num) => (
                  <button
                    key={num}
                    onClick={() => setCount(num)}
                    className={`px-4 py-2 rounded-full border-2 font-medium transition-all ${
                      count === num
                        ? 'bg-blue-100 border-blue-500 text-blue-700'
                        : 'bg-gray-100 border-gray-300 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>

            {/* ระดับ */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                ระดับ
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setLevel('easy')}
                  className={`px-4 py-2 rounded-full border-2 font-medium transition-all ${
                    level === 'easy'
                      ? 'bg-green-100 border-green-500 text-green-700'
                      : 'bg-gray-100 border-gray-300 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  ง่าย
                </button>
                <button
                  onClick={() => setLevel('medium')}
                  className={`px-4 py-2 rounded-full border-2 font-medium transition-all ${
                    level === 'medium'
                      ? 'bg-purple-100 border-purple-500 text-purple-700'
                      : 'bg-gray-100 border-gray-300 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  ปานกลาง
                </button>
                <button
                  onClick={() => setLevel('hard')}
                  className={`px-4 py-2 rounded-full border-2 font-medium transition-all ${
                    level === 'hard'
                      ? 'bg-red-100 border-red-500 text-red-700'
                      : 'bg-gray-100 border-gray-300 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  ยาก
                </button>
              </div>
            </div>

            {/* จำนวนหลัก */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                จำนวนหลัก
              </label>
              <div className="flex flex-wrap gap-2">
                {[1, 2, 3].map((num) => (
                  <button
                    key={num}
                    onClick={() => setDigits(num)}
                    className={`px-4 py-2 rounded-full border-2 font-medium transition-all ${
                      digits === num
                        ? 'bg-cyan-100 border-cyan-500 text-cyan-700'
                        : 'bg-gray-100 border-gray-300 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {num} หลัก
                  </button>
                ))}
              </div>
            </div>

            {/* จำนวนชุดต่อเลข */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                จำนวนชุดต่อเลข
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setNumberSet(2)}
                  className={`px-4 py-2 rounded-full border-2 font-medium transition-all ${
                    numberSet === 2
                      ? 'bg-emerald-100 border-emerald-500 text-emerald-700'
                      : 'bg-gray-100 border-gray-300 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  2 จำนวน
                </button>
                <button
                  onClick={() => setNumberSet(3)}
                  className={`px-4 py-2 rounded-full border-2 font-medium transition-all ${
                    numberSet === 3
                      ? 'bg-emerald-100 border-emerald-500 text-emerald-700'
                      : 'bg-gray-100 border-gray-300 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  3 จำนวน
                </button>
              </div>
            </div>

            {/* การยืม */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                การทด
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setCarry('none')}
                  className={`px-4 py-2 rounded-full border-2 font-medium transition-all ${
                    carry === 'none'
                      ? 'bg-pink-100 border-pink-500 text-pink-700'
                      : 'bg-gray-100 border-gray-300 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  ไม่มี
                </button>
                <button
                  onClick={() => setCarry('with')}
                  className={`px-4 py-2 rounded-full border-2 font-medium transition-all ${
                    carry === 'with'
                      ? 'bg-orange-100 border-orange-500 text-orange-700'
                      : 'bg-gray-100 border-gray-300 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  มี
                </button>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex flex-wrap gap-3 justify-center">
            <button
              onClick={generateNewSet}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-xl font-medium transition-colors shadow-lg hover:shadow-xl"
            >
              สุ่มชุดใหม่
            </button>
            
            <button
              onClick={checkAnswers}
              disabled={!startedAt || !!finishedAt}
              className="bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white px-6 py-3 rounded-xl font-medium transition-colors shadow-lg hover:shadow-xl disabled:shadow-none"
            >
              ตรวจคำตอบ
            </button>
            
            <button
              onClick={showAllAnswers}
              className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-xl font-medium transition-colors shadow-lg hover:shadow-xl"
            >
              เฉลยทั้งหมด
            </button>
          </div>

          {/* Timer */}
          {startedAt && (
            <div className="text-center mt-4">
              <span className="text-2xl font-mono font-bold text-blue-600">
                ⏱️ {formatTime(elapsedMs)}
              </span>
            </div>
          )}
        </div>

        {/* Problems Grid */}
        {problems.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {problems.map((problem, problemIndex) => {
              const addend1Str = problem.addend1.toString();
              const addend2Str = problem.addend2.toString();
              const addend3Str = problem.addend3 ? problem.addend3.toString() : '';
              
              // Calculate the maximum width needed
              const maxLength = numberSet === 2 
                ? Math.max(addend1Str.length, addend2Str.length + 1, problem.resultDigits.length)
                : Math.max(addend1Str.length, addend2Str.length + 1, addend3Str.length + 1, problem.resultDigits.length);

              return (
                <div
                  key={problemIndex}
                  className={`bg-white rounded-xl shadow-md p-6 transition-all duration-300 ${
                    results[problemIndex] === 'correct' 
                      ? 'ring-4 ring-green-300 bg-green-50' 
                      : results[problemIndex] === 'incorrect' 
                      ? 'ring-4 ring-red-300 bg-red-50' 
                      : 'hover:shadow-lg'
                  }`}
                >
                  <div className="text-center">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">
                      ⭐ ข้อ {problemIndex + 1}
                      {results[problemIndex] === 'correct' && <span className="text-green-600 ml-2">✅</span>}
                      {results[problemIndex] === 'incorrect' && <span className="text-red-600 ml-2">❌</span>}
                    </h3>
                    
                    <div className="font-mono text-xl space-y-1">
                      {/* Carry Row */}
                      <div className="flex justify-center items-center h-8">
                        {Array.from({ length: maxLength }, (_, i) => {
                          if (i === 0) {
                            return <div key={i} className="w-8"></div>;
                          }
                          return (
                            <input
                              key={i}
                              type="text"
                               maxLength={1}
                              className="w-6 h-6 text-xs text-center border border-gray-300 rounded-sm mx-0.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              value={(carryInputs[problemIndex] as string[])?.[i as number] || ''}
                              onChange={(e) => handleCarryInputChange(Number(problemIndex), Number(i), e.target.value)}
                              ref={(el) => {
                                if (!carryInputRefs.current[problemIndex]) {
                                  carryInputRefs.current[problemIndex] = [];
                                }
                                carryInputRefs.current[problemIndex][i] = el;
                              }}
                            />
                          );
                        })}
                      </div>

                      {/* First addend */}
                      <div className="flex justify-center items-center">
                        {Array.from({ length: maxLength }, (_, i) => {
                          const digitPos = maxLength - 1 - i;
                          const addend1DigitIndex = addend1Str.length - 1 - digitPos;
                          const digit = addend1DigitIndex >= 0 ? addend1Str[addend1DigitIndex] : '';
                          return (
                            <div key={i} className="w-8 h-8 flex items-center justify-center font-bold">
                              {digit}
                            </div>
                          );
                        })}
                      </div>

                      {/* Second addend */}
                      <div className="flex justify-center items-center">
                        {Array.from({ length: maxLength }, (_, i) => {
                          if (i === 0) {
                            return (
                              <div key={i} className="w-8 h-8 flex items-center justify-center font-bold text-green-600">
                                +
                              </div>
                            );
                          }
                          const digitPos = maxLength - 1 - i;
                          const addend2DigitIndex = addend2Str.length - 1 - digitPos;
                          const digit = addend2DigitIndex >= 0 ? addend2Str[addend2DigitIndex] : '';
                          return (
                            <div key={i} className="w-8 h-8 flex items-center justify-center font-bold">
                              {digit}
                            </div>
                          );
                        })}
                      </div>

                      {/* Third addend (if 3-number mode) */}
                      {numberSet === 3 && (
                        <div className="flex justify-center items-center">
                          {Array.from({ length: maxLength }, (_, i) => {
                            if (i === 0) {
                              return (
                                <div key={i} className="w-8 h-8 flex items-center justify-center font-bold text-green-600">
                                  +
                                </div>
                              );
                            }
                            const digitPos = maxLength - 1 - i;
                            const addend3DigitIndex = addend3Str.length - 1 - digitPos;
                            const digit = addend3DigitIndex >= 0 ? addend3Str[addend3DigitIndex] : '';
                            return (
                              <div key={i} className="w-8 h-8 flex items-center justify-center font-bold">
                                {digit}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Horizontal line */}
                      <div className="flex justify-center">
                        <div 
                          className="border-t-2 border-gray-800" 
                          style={{ width: `${maxLength * 32}px` }}
                        ></div>
                      </div>

                      {/* Answer row */}
                      <div className="flex justify-center items-center">
                        {Array.from({ length: maxLength }, (_, i) => {
                          const digitPos = maxLength - 1 - i;
                          const resultDigitIndex = problem.resultDigits.length - 1 - digitPos;
                          
                          if (resultDigitIndex >= 0) {
                            return (
                              <input
                                key={i}
                                type="text"
                                maxLength={1}
                                className={`w-8 h-8 text-center border-2 rounded mx-0.5 font-bold focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                  showAnswers 
                                    ? 'bg-blue-100 border-blue-300' 
                                    : results[problemIndex] === 'correct'
                                    ? 'bg-green-100 border-green-300'
                                    : results[problemIndex] === 'incorrect'
                                    ? 'bg-red-100 border-red-300'
                                    : 'border-gray-300'
                                }`}
                                value={(answers[problemIndex] as string[])?.[resultDigitIndex as number] || ''}
                                onChange={(e) => handleInputChange(Number(problemIndex), Number(resultDigitIndex), e.target.value)}
                                 onKeyDown={(e) => handleKeyDown(Number(problemIndex), Number(resultDigitIndex), e)}
                                 onPaste={(e) => handlePaste(Number(problemIndex), Number(resultDigitIndex), e)}
                                ref={(el) => {
                                  if (!inputRefs.current[problemIndex]) {
                                    inputRefs.current[problemIndex] = [];
                                  }
                                  inputRefs.current[problemIndex][resultDigitIndex] = el;
                                }}
                              />
                            );
                          } else {
                            return <div key={i} className="w-8"></div>;
                          }
                        })}
                      </div>

                      {/* Show correct answer if incorrect */}
                      {results[problemIndex] === 'incorrect' && (
                        <div className="mt-2 text-sm text-red-600">
                          เฉลย: {problem.result}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Result Modal */}
        {showResultModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full mx-4">
              <div className="text-center">
                <div className="text-6xl mb-4">
                  {results.filter(r => r === 'correct').length === problems.length ? '🎉' : '💪'}
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-4">
                  ผลลัพธ์การทำงาน
                </h2>
                <div className="space-y-2 text-lg">
                  <p>ถูกต้อง: <span className="font-bold text-green-600">{results.filter(r => r === 'correct').length}</span> ข้อ</p>
                  <p>ผิด: <span className="font-bold text-red-600">{results.filter(r => r === 'incorrect').length}</span> ข้อ</p>
                  <p>เวลาที่ใช้: <span className="font-bold text-blue-600">{formatTime(elapsedMs)}</span></p>
                  <p>คะแนน: <span className="font-bold text-purple-600">
                    {Math.round((results.filter(r => r === 'correct').length / problems.length) * 100)}%
                  </span></p>
                </div>
                <button
                  onClick={() => setShowResultModal(false)}
                  className="mt-6 bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                >
                  ตกลง
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Statistics Modal */}
        {showStatsModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-2xl p-8 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">📊 สถิติการทำงาน</h2>
                <button
                  onClick={() => setShowStatsModal(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>
              
              {statistics.length === 0 ? (
                <p className="text-center text-gray-500 py-8">ยังไม่มีข้อมูลสถิติ</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="p-2 text-left">วันที่</th>
                        <th className="p-2 text-center">จำนวนข้อ</th>
                        <th className="p-2 text-center">ระดับ</th>
                        <th className="p-2 text-center">หลัก</th>
                        <th className="p-2 text-center">การทด</th>
                        <th className="p-2 text-center">ชุด</th>
                        <th className="p-2 text-center">ถูก/ทั้งหมด</th>
                        <th className="p-2 text-center">คะแนน</th>
                        <th className="p-2 text-center">เวลา</th>
                      </tr>
                    </thead>
                    <tbody>
                      {statistics.map((stat, index) => (
                        <tr key={index} className="border-b">
                          <td className="p-2">
                            {new Date(stat.timestamp).toLocaleDateString('th-TH', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </td>
                          <td className="p-2 text-center">{stat.count}</td>
                          <td className="p-2 text-center">
                            {stat.level === 'easy' ? 'ง่าย' : stat.level === 'medium' ? 'ปานกลาง' : 'ยาก'}
                          </td>
                          <td className="p-2 text-center">{stat.digits}</td>
                          <td className="p-2 text-center">{stat.carry === 'none' ? 'ไม่มี' : 'มี'}</td>
                          <td className="p-2 text-center">{stat.numberSet}</td>
                          <td className="p-2 text-center">
                            <span className="text-green-600 font-bold">{stat.correct}</span>
                            <span className="text-gray-500">/{stat.total}</span>
                          </td>
                          <td className="p-2 text-center">
                            <span className={`font-bold ${
                              Math.round((stat.correct / stat.total) * 100) >= 80 
                                ? 'text-green-600' 
                                : Math.round((stat.correct / stat.total) * 100) >= 60 
                                ? 'text-yellow-600' 
                                : 'text-red-600'
                            }`}>
                              {Math.round((stat.correct / stat.total) * 100)}%
                            </span>
                          </td>
                          <td className="p-2 text-center font-mono">
                            {formatTime(stat.durationMs)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdditionApp;