import React, { useState, useEffect, useRef } from 'react';

const SubtractionApp = () => {
  // State management
  const [count, setCount] = useState(10);
  const [level, setLevel] = useState('easy');
  const [digits, setDigits] = useState(1);
  const [borrow, setBorrow] = useState('none');
  const [numberSet, setNumberSet] = useState(2); // 2 = show 2 numbers (A - B = ?), 3 = show 3 numbers (A - B = C)
  const [problems, setProblems] = useState([]);
  const [answers, setAnswers] = useState([]);
  const [results, setResults] = useState([]);
  const [startedAt, setStartedAt] = useState(null);
  const [finishedAt, setFinishedAt] = useState(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [showAnswers, setShowAnswers] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [statistics, setStatistics] = useState([]);
  
  const inputRefs = useRef([]);

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
    const savedStats = localStorage.getItem('subtraction-stats');
    if (savedStats) {
      setStatistics(JSON.parse(savedStats));
    }
  }, []);

  // Format time display
  const formatTime = (ms) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Generate subtraction problems based on settings
  const generateSubtractionProblems = (count, level, digits, borrow, numberSet) => {
    const problems = [];
    const maxAttempts = count * 10; // Prevent infinite loops
    let attempts = 0;

    while (problems.length < count && attempts < maxAttempts) {
      attempts++;
      
      // Generate numbers based on digit count
      const min = digits === 1 ? 1 : Math.pow(10, digits - 1);
      const max = Math.pow(10, digits) - 1;
      
      let minuend = Math.floor(Math.random() * (max - min + 1)) + min;
      let subtrahend1, subtrahend2;
      
      if (numberSet === 2) {
        // Regular A - B = ? problem
        if (borrow === 'none') {
          // No borrowing
          const minuendDigits = minuend.toString().split('').map(Number);
          const subtrahendDigits = [];
          
          for (let i = 0; i < minuendDigits.length; i++) {
            const maxDigit = level === 'easy' ? Math.min(minuendDigits[i], Math.floor(minuendDigits[i] * 0.7)) :
                             level === 'medium' ? minuendDigits[i] :
                             minuendDigits[i];
            subtrahendDigits.push(Math.floor(Math.random() * (maxDigit + 1)));
          }
          subtrahend1 = parseInt(subtrahendDigits.join(''));
        } else {
          // Allow borrowing
          const subtrahendMax = Math.min(minuend - 1, max);
          const subtrahendMin = level === 'easy' ? Math.floor(subtrahendMax * 0.3) :
                                level === 'medium' ? Math.floor(subtrahendMax * 0.5) :
                                Math.floor(subtrahendMax * 0.7);
          
          subtrahend1 = Math.floor(Math.random() * (subtrahendMax - subtrahendMin + 1)) + subtrahendMin;
        }

        const result = minuend - subtrahend1;
        
        if (result >= 0 && result <= 1000 && subtrahend1 > 0) {
          const resultStr = result.toString().padStart(1, '0');
          const resultDigits = resultStr.split('').map(Number);
          
          problems.push({
            minuend,
            subtrahend1,
            subtrahend2: null,
            result,
            resultDigits,
            numberSet: 2
          });
        }
      } else {
        // A - B - C = ? problem
        // First generate B
        const firstSubMax = Math.floor(minuend * 0.6);
        subtrahend1 = Math.floor(Math.random() * firstSubMax) + 1;
        
        // Then generate C, ensuring final result is positive
        const remainingAfterFirst = minuend - subtrahend1;
        const secondSubMax = Math.floor(remainingAfterFirst * 0.8);
        subtrahend2 = Math.floor(Math.random() * secondSubMax) + 1;
        
        const result = minuend - subtrahend1 - subtrahend2;
        
        if (result >= 0 && result <= 1000 && subtrahend1 > 0 && subtrahend2 > 0) {
          const resultStr = result.toString().padStart(1, '0');
          const resultDigits = resultStr.split('').map(Number);
          
          problems.push({
            minuend,
            subtrahend1,
            subtrahend2,
            result,
            resultDigits,
            numberSet: 3
          });
        }
      }
    }

    return problems;
  };

  // Initialize new problem set
  const generateNewSet = () => {
    const newProblems = generateSubtractionProblems(count, level, digits, borrow, numberSet);
    setProblems(newProblems);
    setAnswers(new Array(count).fill(null).map(() => []));
    setResults(new Array(count).fill('pending'));
    setShowAnswers(false);
    setShowResultModal(false);
    setStartedAt(null);
    setFinishedAt(null);
    setElapsedMs(0);
    
    // Clear input refs
    setTimeout(() => {
      inputRefs.current = [];
    }, 100);
  };

  // Handle input change
  const handleInputChange = (problemIndex, digitIndex, value) => {
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

  // Handle backspace navigation
  const handleKeyDown = (problemIndex, digitIndex, e) => {
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
  const handlePaste = (problemIndex, digitIndex, e) => {
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
      borrow,
      numberSet,
      correct: correctCount,
      total: count,
      durationMs: finalTime
    };

    const updatedStats = [newStat, ...statistics].slice(0, 10);
    setStatistics(updatedStats);
    localStorage.setItem('subtraction-stats', JSON.stringify(updatedStats));
    
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
    const borrowText = borrow === 'none' ? 'ไม่มี' : 'มี';
    
    return `
<!DOCTYPE html>
<html>
<head>
    <title>ใบงานการลบ</title>
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
        <div class="title">การลบที่ผลลัพธ์ไม่เกิน 1,000</div>
        <div class="subtitle">ใบงานฝึกหัด</div>
        <div class="info">จำนวนข้อ: ${count} | ระดับ: ${levelText} | จำนวนหลัก: ${digits} หลัก | จำนวนชุดตัวเลข: ${numberSet} จำนวน | การยืม: ${borrowText}</div>
        <div class="info">ชื่อ: _________________________ วันที่: _____________</div>
    </div>
    
    <div class="controls">
        <button class="btn" onclick="window.print()">🖨️ พิมพ์ PDF</button>
        <button class="btn btn-secondary" onclick="shareAsPDF()">📤 แชร์ PDF</button>
        <button class="btn btn-secondary" onclick="window.close()">❌ ปิดหน้าต่าง</button>
    </div>
    
    <div class="problems-grid">
        ${problems.map((problem, index) => {
          const minuendStr = problem.minuend.toString();
          const subtrahend1Str = problem.subtrahend1.toString();
          const subtrahend2Str = problem.subtrahend2 ? problem.subtrahend2.toString() : '';
          
          // Calculate the maximum width needed
          const maxLength = numberSet === 2 
            ? Math.max(minuendStr.length, subtrahend1Str.length + 1)
            : Math.max(minuendStr.length, subtrahend1Str.length + 1, subtrahend2Str.length + 1);
          
          // Generate minuend row
          const minuendRow = Array.from({ length: maxLength }, (_, i) => {
            const digitPos = maxLength - 1 - i;
            const minuendDigitIndex = minuendStr.length - 1 - digitPos;
            return minuendDigitIndex >= 0 ? minuendStr[minuendDigitIndex] : '';
          });
          
          // Generate first subtrahend row
          const subtrahend1Row = Array.from({ length: maxLength }, (_, i) => {
            if (i === 0) return '−';
            const digitPos = maxLength - 1 - i;
            const subtrahendDigitIndex = subtrahend1Str.length - 1 - digitPos;
            return subtrahendDigitIndex >= 0 ? subtrahend1Str[subtrahendDigitIndex] : '';
          });
          
          // Generate second subtrahend row (for 3-number mode)
          const subtrahend2Row = numberSet === 3 ? Array.from({ length: maxLength }, (_, i) => {
            if (i === 0) return '−';
            const digitPos = maxLength - 1 - i;
            const subtrahendDigitIndex = subtrahend2Str.length - 1 - digitPos;
            return subtrahendDigitIndex >= 0 ? subtrahend2Str[subtrahendDigitIndex] : '';
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
                    <div class="problem-row">
                        ${minuendRow.map(digit => `<div class="digit-cell">${digit}</div>`).join('')}
                    </div>
                    <div class="problem-row">
                        ${subtrahend1Row.map(digit => `<div class="digit-cell">${digit}</div>`).join('')}
                    </div>
                    ${numberSet === 3 ? `
                    <div class="problem-row">
                        ${subtrahend2Row.map(digit => `<div class="digit-cell">${digit}</div>`).join('')}
                    </div>
                    ` : ''}
                    <div class="horizontal-line" style="width: ${maxLength * 24}px;"></div>
                    <div class="answer-row">
                        ${answerBoxes.join('')}
                    </div>
                </div>
            </div>
          `;
        }).join('')}
    </div>
    
    <script>
        function shareAsPDF() {
            // Create filename with current date and settings
            const now = new Date();
            const dateStr = now.toISOString().slice(0, 10);
            const filename = 'ใบงานการลบ_' + dateStr + '.pdf';
            
            // Use browser's print dialog to save as PDF
            if (navigator.share) {
                // If Web Share API is supported
                window.print();
                setTimeout(() => {
                    alert('กรุณาเลือก "Save as PDF" ในหน้าต่างการพิมพ์ แล้วแชร์ไฟล์ที่ได้');
                }, 1000);
            } else {
                // Fallback: open print dialog
                window.print();
                setTimeout(() => {
                    alert('กรุณาเลือก "Save as PDF" ในหน้าต่างการพิมพ์เพื่อบันทึกเป็นไฟล์ PDF');
                }, 1000);
            }
        }
        
        // Auto focus for better UX
        window.addEventListener('load', function() {
            document.body.focus();
        });
    </script>
</body>
</html>
    `;
  };

  // Initialize on component mount
  useEffect(() => {
    generateNewSet();
  }, []);

  // Auto-generate new set when parameters change
  useEffect(() => {
    if (problems.length > 0) { // Only generate if not initial load
      generateNewSet();
    }
  }, [count, level, digits, borrow, numberSet]);

  return (
    <div className="min-h-screen p-4">
      {/* Header */}
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-start mb-6">
          <h1 className="text-3xl font-bold text-[hsl(var(--text-primary))]">
            การลบที่ผลลัพธ์ไม่เกิน 1,000
          </h1>
          <div className="flex gap-4 items-center">
            <div className="timer-display">
              เวลา: {formatTime(elapsedMs)}
            </div>
            <button
              onClick={() => setShowStatsModal(true)}
              className="btn-pastel-secondary text-sm"
            >
              ดูผล
            </button>
            <button
              onClick={openPrintWindow}
              className="btn-pastel-primary text-sm"
            >
              พิมพ์ PDF
            </button>
          </div>
        </div>

        {/* Control Panel */}
        <div className="problem-card mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-6">
            {/* จำนวนข้อ */}
            <div>
              <label className="block text-sm font-medium text-[hsl(var(--text-primary))] mb-2">
                จำนวนข้อ
              </label>
              <div className="segmented-group bg-[hsl(210_100%_95%)]">
                {[10, 15, 20, 30].map(num => (
                  <button
                    key={num}
                    onClick={() => setCount(num)}
                    className={`segmented-btn ${count === num ? 'active bg-[hsl(210_100%_88%)] text-[hsl(210_100%_25%)]' : 'text-[hsl(var(--text-secondary))]'}`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>

            {/* ระดับ */}
            <div>
              <label className="block text-sm font-medium text-[hsl(var(--text-primary))] mb-2">
                ระดับ
              </label>
              <div className="segmented-group bg-[hsl(280_100%_95%)]">
                {[
                  { key: 'easy', label: 'ง่าย' },
                  { key: 'medium', label: 'ปานกลาง' },
                  { key: 'hard', label: 'ยาก' }
                ].map(item => (
                  <button
                    key={item.key}
                    onClick={() => setLevel(item.key)}
                    className={`segmented-btn ${level === item.key ? 'active bg-[hsl(280_100%_88%)] text-[hsl(280_100%_25%)]' : 'text-[hsl(var(--text-secondary))]'}`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* จำนวนหลัก */}
            <div>
              <label className="block text-sm font-medium text-[hsl(var(--text-primary))] mb-2">
                จำนวนหลัก
              </label>
              <div className="segmented-group bg-[hsl(210_100%_95%)]">
                {[
                  { key: 1, label: '1 หลัก' },
                  { key: 2, label: '2 หลัก' },
                  { key: 3, label: '3 หลัก' }
                ].map(item => (
                  <button
                    key={item.key}
                    onClick={() => setDigits(item.key)}
                    className={`segmented-btn ${digits === item.key ? 'active bg-[hsl(210_100%_88%)] text-[hsl(210_100%_25%)]' : 'text-[hsl(var(--text-secondary))]'}`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* จำนวนชุดตัวเลข */}
            <div>
              <label className="block text-sm font-medium text-[hsl(var(--text-primary))] mb-2">
                จำนวนชุดตัวเลข
              </label>
              <div className="segmented-group bg-[hsl(120_60%_95%)]">
                {[
                  { key: 2, label: '2 จำนวน' },
                  { key: 3, label: '3 จำนวน' }
                ].map(item => (
                  <button
                    key={item.key}
                    onClick={() => setNumberSet(item.key)}
                    className={`segmented-btn ${numberSet === item.key ? 'active bg-[hsl(120_60%_88%)] text-[hsl(120_60%_25%)]' : 'text-[hsl(var(--text-secondary))]'}`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* การยืม */}
            <div>
              <label className="block text-sm font-medium text-[hsl(var(--text-primary))] mb-2">
                การยืม
              </label>
              <div className="segmented-group bg-[hsl(0_70%_95%)]">
                {[
                  { key: 'none', label: 'ไม่มี' },
                  { key: 'allow', label: 'มี' }
                ].map(item => (
                  <button
                    key={item.key}
                    onClick={() => setBorrow(item.key)}
                    className={`segmented-btn ${borrow === item.key ? 'active bg-[hsl(0_70%_88%)] text-[hsl(0_70%_25%)]' : 'text-[hsl(var(--text-secondary))]'}`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            <button onClick={generateNewSet} className="btn-pastel-primary">
              สุ่มชุดใหม่
            </button>
            <button onClick={checkAnswers} className="btn-pastel-success">
              ตรวจคำตอบ
            </button>
            <button onClick={showAllAnswers} className="btn-pastel-danger">
              เฉลยทั้งหมด
            </button>
          </div>
        </div>

        {/* Problems Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
          {problems.map((problem, problemIndex) => {
            // Cycle through different card colors
            const cardColors = [
              'bg-[hsl(48_100%_92%)]',     // yellow
              'bg-[hsl(210_100%_92%)]',    // blue  
              'bg-[hsl(330_100%_92%)]',    // pink
              'bg-[hsl(120_60%_92%)]',     // green
              'bg-[hsl(280_100%_92%)]',    // purple
              'bg-[hsl(30_100%_92%)]',     // orange
              'bg-[hsl(180_100%_92%)]',    // cyan
              'bg-[hsl(80_100%_92%)]'      // lime
            ];
            const cardColor = cardColors[problemIndex % cardColors.length];
            
            return (
            <div 
              key={problemIndex} 
              className={`problem-card ${cardColor} border border-[hsl(var(--problem-border))] shadow-[var(--shadow-card)] rounded-2xl p-6`}
            >
              <div className="text-left mb-4">
                <span className="text-lg font-semibold text-[hsl(var(--text-primary))]">
                  ⭐ ข้อ {problemIndex + 1}
                </span>
              </div>
              
              {/* Vertical Subtraction Display */}
              <div className="font-mono text-center">
                {(() => {
                  const minuendStr = problem.minuend.toString();
                  const subtrahend1Str = problem.subtrahend1.toString();
                  const subtrahend2Str = problem.subtrahend2 ? problem.subtrahend2.toString() : '';
                  
                  // Calculate the maximum width needed
                  const maxLength = numberSet === 2 
                    ? Math.max(minuendStr.length, subtrahend1Str.length + 1)
                    : Math.max(minuendStr.length, subtrahend1Str.length + 1, subtrahend2Str.length + 1);
                  
                  return (
                    <>
                      {/* Minuend row */}
                      <div className="flex justify-center mb-1">
                        {Array.from({ length: maxLength }, (_, index) => {
                          const digitPos = maxLength - 1 - index;
                          const minuendDigitIndex = minuendStr.length - 1 - digitPos;
                          const digit = minuendDigitIndex >= 0 ? minuendStr[minuendDigitIndex] : '';
                          return (
                            <div key={index} className="w-8 h-8 flex items-center justify-center text-xl font-bold text-[hsl(var(--text-math))]">
                              {digit}
                            </div>
                          );
                        })}
                      </div>
                      
                      {/* First subtrahend row */}
                      <div className="flex justify-center mb-1">
                        <div className="w-8 h-8 flex items-center justify-center text-xl font-bold text-[hsl(var(--text-math))]">
                          −
                        </div>
                        {Array.from({ length: maxLength - 1 }, (_, index) => {
                          const digitPos = maxLength - 2 - index;
                          const subtrahendDigitIndex = subtrahend1Str.length - 1 - digitPos;
                          const digit = subtrahendDigitIndex >= 0 ? subtrahend1Str[subtrahendDigitIndex] : '';
                          return (
                            <div key={index} className="w-8 h-8 flex items-center justify-center text-xl font-bold text-[hsl(var(--text-math))]">
                              {digit}
                            </div>
                          );
                        })}
                      </div>
                      
                      {/* Second subtrahend row (for 3-number mode) */}
                      {numberSet === 3 && (
                        <div className="flex justify-center mb-1">
                          <div className="w-8 h-8 flex items-center justify-center text-xl font-bold text-[hsl(var(--text-math))]">
                            −
                          </div>
                          {Array.from({ length: maxLength - 1 }, (_, index) => {
                            const digitPos = maxLength - 2 - index;
                            const subtrahendDigitIndex = subtrahend2Str.length - 1 - digitPos;
                            const digit = subtrahendDigitIndex >= 0 ? subtrahend2Str[subtrahendDigitIndex] : '';
                            return (
                              <div key={index} className="w-8 h-8 flex items-center justify-center text-xl font-bold text-[hsl(var(--text-math))]">
                                {digit}
                              </div>
                            );
                          })}
                        </div>
                      )}
                      
                      {/* Horizontal line */}
                      <div className="flex justify-center mb-2">
                        <div style={{ width: `${maxLength * 2}rem` }}>
                          <hr className="border-t-2 border-[hsl(var(--text-math))]" />
                        </div>
                      </div>
                      
                      {/* Answer inputs */}
                      <div className="flex justify-center">
                        {Array.from({ length: maxLength }, (_, index) => {
                          const digitPos = maxLength - 1 - index;
                          const resultDigitIndex = problem.resultDigits.length - 1 - digitPos;
                          
                          if (resultDigitIndex < 0) {
                            return <div key={index} className="w-8 h-12"></div>;
                          }
                          
                          const inputValue = answers[problemIndex]?.[resultDigitIndex] || '';
                          const resultClass = results[problemIndex] === 'pending' ? '' :
                                            (parseInt(inputValue) === problem.resultDigits[resultDigitIndex] ? 'correct' : 'incorrect');
                          
                          return (
                            <input
                              key={index}
                              ref={(el) => {
                                if (!inputRefs.current[problemIndex]) {
                                  inputRefs.current[problemIndex] = [];
                                }
                                inputRefs.current[problemIndex][resultDigitIndex] = el;
                              }}
                              type="text"
                              maxLength={1}
                              value={inputValue}
                              onChange={(e) => handleInputChange(problemIndex, resultDigitIndex, e.target.value)}
                              onKeyDown={(e) => handleKeyDown(problemIndex, resultDigitIndex, e)}
                              onPaste={(e) => handlePaste(problemIndex, resultDigitIndex, e)}
                              className={`math-input ${resultClass}`}
                              disabled={showAnswers}
                            />
                          );
                        })}
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
            );
          })}
        </div>

        {/* Bottom Timer and Check Button */}
        <div className="flex justify-between items-center">
          <div></div>
          <button onClick={checkAnswers} className="btn-pastel-success text-lg px-8 py-3">
            ตรวจคำตอบ
          </button>
          <div className="timer-display">
            เวลา: {formatTime(elapsedMs)}
          </div>
        </div>
      </div>

      {/* Result Modal */}
      {showResultModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="problem-card max-w-md w-full">
            <h2 className="text-2xl font-bold text-center text-[hsl(var(--text-primary))] mb-4">
              ผลการตรวจ
            </h2>
            <div className="text-center space-y-2">
              <p className="text-xl">
                ถูก: <span className="font-bold text-[hsl(var(--btn-success-text))]">
                  {results.filter(r => r === 'correct').length}
                </span> / {count} ข้อ
              </p>
              <p className="text-lg">
                เวลาที่ใช้: <span className="font-mono">{formatTime(elapsedMs)}</span>
              </p>
              <p className="text-lg">
                ความถูกต้อง: <span className="font-bold">
                  {Math.round((results.filter(r => r === 'correct').length / count) * 100)}%
                </span>
              </p>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowResultModal(false)}
                className="btn-pastel-primary flex-1"
              >
                ปิด
              </button>
              <button
                onClick={() => {
                  setShowResultModal(false);
                  generateNewSet();
                }}
                className="btn-pastel-success flex-1"
              >
                เริ่มใหม่
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Statistics Modal */}
      {showStatsModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="problem-card max-w-4xl w-full max-h-[80vh] overflow-auto">
            <h2 className="text-2xl font-bold text-center text-[hsl(var(--text-primary))] mb-4">
              สถิติการทำ 10 ครั้งล่าสุด
            </h2>
            {statistics.length === 0 ? (
              <p className="text-center text-[hsl(var(--text-secondary))]">ยังไม่มีข้อมูลสถิติ</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[hsl(var(--problem-border))]">
                      <th className="text-left p-2">วันที่</th>
                      <th className="text-center p-2">ข้อ</th>
                      <th className="text-center p-2">ระดับ</th>
                      <th className="text-center p-2">หลัก</th>
                      <th className="text-center p-2">การยืม</th>
                      <th className="text-center p-2">ถูก/ทั้งหมด</th>
                      <th className="text-center p-2">%</th>
                      <th className="text-center p-2">เวลา</th>
                    </tr>
                  </thead>
                  <tbody>
                    {statistics.map((stat, index) => (
                      <tr key={index} className="border-b border-[hsl(var(--problem-border))]">
                        <td className="p-2">
                          {new Date(stat.timestamp).toLocaleDateString('th-TH')}
                        </td>
                        <td className="text-center p-2">{stat.count}</td>
                        <td className="text-center p-2">
                          {stat.level === 'easy' ? 'ง่าย' : 
                           stat.level === 'medium' ? 'ปานกลาง' : 'ยาก'}
                        </td>
                        <td className="text-center p-2">{stat.digits}</td>
                        <td className="text-center p-2">
                          {stat.borrow === 'none' ? 'ไม่มี' : 'มี'}
                        </td>
                        <td className="text-center p-2">{stat.correct}/{stat.total}</td>
                        <td className="text-center p-2">
                          {Math.round((stat.correct / stat.total) * 100)}%
                        </td>
                        <td className="text-center p-2 font-mono">
                          {formatTime(stat.durationMs)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className="mt-6 text-center">
              <button
                onClick={() => setShowStatsModal(false)}
                className="btn-pastel-primary"
              >
                ปิด
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubtractionApp;