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

  // Load statistics from localStorage and generate initial problems
  useEffect(() => {
    const savedStats = localStorage.getItem('addition-stats');
    if (savedStats) {
      setStatistics(JSON.parse(savedStats));
    }
    
    // Generate initial problems when component mounts
    const initialProblems = generateAdditionProblems(10, 'easy', 1, 'none', 2);
    setProblems(initialProblems);
    setAnswers(new Array(10).fill(null).map(() => []));
    setCarryInputs(new Array(10).fill(null).map(() => []));
    setResults(new Array(10).fill('pending'));
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
    console.log('Generating problems with:', { count, level, digits, carry, numberSet });
    
    const problems = [];
    const maxAttempts = count * 10; // Prevent infinite loops
    let attempts = 0;

    // Define digit sets based on international mathematical standards
    const getDigitSet = (level: string) => {
      switch(level) {
        case 'easy': return [1, 2, 3, 4, 5]; // ง่าย: ตัวเลขเล็ก 1-5
        case 'medium': return [1, 2, 3, 4, 5, 6, 7]; // ปานกลาง: ตัวเลขกลาง 1-7
        case 'hard': return [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]; // ยาก: ตัวเลขทั้งหมด 0-9
        default: return [1, 2, 3, 4, 5, 6, 7, 8, 9];
      }
    };

    const digitSet = getDigitSet(level);
    console.log('Digit set for level', level, ':', digitSet);

    // Helper function to generate a number with specific digit constraints
    const generateNumberWithDigitSet = (numDigits: number, allowedDigits: number[]) => {
      let result = '';
      for (let i = 0; i < numDigits; i++) {
        if (i === 0) {
          // First digit cannot be 0
          const nonZeroDigits = allowedDigits.filter(d => d !== 0);
          if (nonZeroDigits.length > 0) {
            result += nonZeroDigits[Math.floor(Math.random() * nonZeroDigits.length)];
          } else {
            result += '1'; // fallback
          }
        } else {
          // Other digits can include 0
          result += allowedDigits[Math.floor(Math.random() * allowedDigits.length)];
        }
      }
      return parseInt(result);
    };

    while (problems.length < count && attempts < maxAttempts) {
      attempts++;
      
      let addend1, addend2, addend3;
      
      if (numberSet === 2) {
        // Regular A + B = ? problem  
        addend1 = generateNumberWithDigitSet(digits, digitSet);
        
        if (carry === 'none') {
          // Ensure no carrying by adjusting addend2
          const addend1Str = addend1.toString().padStart(digits, '0');
          const addend2Digits = [];
          
          for (let i = 0; i < digits; i++) {
            const digit1 = parseInt(addend1Str[i]);
            const availableDigits = digitSet.filter(d => {
              const sum = digit1 + d;
              return sum <= 9; // No carry
            });
            
            if (i === 0) {
              // First digit cannot be 0
              const nonZeroAvailable = availableDigits.filter(d => d !== 0);
              if (nonZeroAvailable.length > 0) {
                addend2Digits.push(nonZeroAvailable[Math.floor(Math.random() * nonZeroAvailable.length)]);
              } else {
                break; // Skip this problem
              }
            } else {
              // Other digits can be 0
              if (availableDigits.length > 0) {
                addend2Digits.push(availableDigits[Math.floor(Math.random() * availableDigits.length)]);
              } else {
                break; // Skip this problem
              }
            }
          }
          
          if (addend2Digits.length === digits) {
            addend2 = parseInt(addend2Digits.join(''));
          } else {
            continue; // Skip this iteration
          }
        } else {
          // Allow carrying - generate second addend with digit set
          addend2 = generateNumberWithDigitSet(digits, digitSet);
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
        if (carry === 'none') {
          // For 3-number problems without carry, we need special logic
          addend1 = generateNumberWithDigitSet(digits, digitSet);
          const addend1Str = addend1.toString().padStart(digits, '0');
          const addend2Digits = [];
          const addend3Digits = [];
          
          let validProblem = true;
          for (let i = 0; i < digits; i++) {
            const digit1 = parseInt(addend1Str[i]);
            
            // Find valid combinations for digit2 and digit3 where digit1 + digit2 + digit3 <= 9
            const validCombinations = [];
            for (const d2 of digitSet) {
              for (const d3 of digitSet) {
                const sum = digit1 + d2 + d3;
                if (sum <= 9) {
                  // Check first digit constraint
                  if (i === 0) {
                    if (d2 !== 0 && d3 !== 0) {
                      validCombinations.push([d2, d3]);
                    }
                  } else {
                    validCombinations.push([d2, d3]);
                  }
                }
              }
            }
            
            if (validCombinations.length > 0) {
              const randomCombo = validCombinations[Math.floor(Math.random() * validCombinations.length)];
              addend2Digits.push(randomCombo[0]);
              addend3Digits.push(randomCombo[1]);
            } else {
              validProblem = false;
              break;
            }
          }
          
          if (validProblem && addend2Digits.length === digits && addend3Digits.length === digits) {
            addend2 = parseInt(addend2Digits.join(''));
            addend3 = parseInt(addend3Digits.join(''));
          } else {
            continue; // Skip this iteration
          }
        } else {
          // Allow carrying - generate all addends with digit set
          addend1 = generateNumberWithDigitSet(digits, digitSet);
          addend2 = generateNumberWithDigitSet(digits, digitSet);
          addend3 = generateNumberWithDigitSet(digits, digitSet);
        }
        
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

    console.log('Generated', problems.length, 'problems out of', count, 'requested');
    console.log('Problems:', problems);
    return problems;
  };

  // Initialize new problem set with specific parameters
  const generateNewSetWithParams = (newCount?: number, newLevel?: string, newDigits?: number, newCarry?: string, newNumberSet?: number) => {
    const currentCount = newCount ?? count;
    const currentLevel = newLevel ?? level;
    const currentDigits = newDigits ?? digits;
    const currentCarry = newCarry ?? carry;
    const currentNumberSet = newNumberSet ?? numberSet;
    
    const newProblems = generateAdditionProblems(currentCount, currentLevel, currentDigits, currentCarry, currentNumberSet);
    setProblems(newProblems);
    setAnswers(new Array(currentCount).fill(null).map(() => []));
    setCarryInputs(new Array(currentCount).fill(null).map(() => []));
    setResults(new Array(currentCount).fill('pending'));
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

  // Initialize new problem set
  const generateNewSet = () => {
    generateNewSetWithParams();
  };

  // Get answer box count based on mathematical principles
  const getAnswerBoxCount = (digits: number) => {
    switch(digits) {
      case 1: return 2; // 1 digit problem can result in 2 digits max
      case 2: return 3; // 2 digit problem can result in 3 digits max  
      case 3: return 4; // 3 digit problem can result in 4 digits max
      default: return digits + 1;
    }
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
      const answerBoxCount = getAnswerBoxCount(digits);
      if (value !== '' && digitIndex < answerBoxCount - 1) {
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
      const answerBoxCount = getAnswerBoxCount(digits);
      const isLastDigit = digitIndex === answerBoxCount - 1;
      
      if (isLastProblem && isLastDigit) {
        checkAnswers();
      }
    }
  };

  // Handle paste
  const handlePaste = (problemIndex: number, digitIndex: number, e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text');
    const digitsArray = pastedText.replace(/\D/g, '').split('');
    
    const newAnswers = [...answers];
    if (!newAnswers[problemIndex]) {
      newAnswers[problemIndex] = [];
    }

    digitsArray.forEach((digit, index) => {
      const targetIndex = digitIndex + index;
      const answerBoxCount = getAnswerBoxCount(digits);
      if (targetIndex < answerBoxCount) {
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
      const answerBoxCount = getAnswerBoxCount(digits);
      
      // Convert user answer to number, handling leading zeros
      const userAnswerStr = userAnswer.join('').replace(/^0+/, '') || '0';
      const userAnswerNum = parseInt(userAnswerStr);
      
      // Check if the answer matches the correct result
      return userAnswerNum === problem.result ? 'correct' : 'incorrect';
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
    const answerBoxCount = getAnswerBoxCount(digits);
    const correctAnswers = problems.map(problem => {
      const result = problem.result.toString();
      const answerArray = new Array(answerBoxCount).fill('');
      // Fill from right to left
      for (let i = 0; i < result.length; i++) {
        answerArray[answerBoxCount - 1 - i] = result[result.length - 1 - i];
      }
      return answerArray;
    });
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
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6 bg-white rounded-lg p-4 shadow-sm">
          <h1 className="text-2xl font-bold text-gray-800">
            การบวกที่ผลลัพธ์ไม่เกิน 1,000
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-lg font-mono">
              เวลา: {formatTime(elapsedMs)}
            </span>
            <button
              onClick={() => setShowStatsModal(true)}
              className="bg-purple-100 text-purple-700 px-4 py-2 rounded-lg font-medium hover:bg-purple-200 transition-colors"
            >
              ดูผล
            </button>
            <button
              onClick={openPrintWindow}
              disabled={problems.length === 0}
              className="bg-blue-100 text-blue-700 px-4 py-2 rounded-lg font-medium hover:bg-blue-200 transition-colors disabled:bg-gray-200 disabled:text-gray-500"
            >
              พิมพ์ PDF
            </button>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="grid grid-cols-5 gap-8">
            {/* จำนวนข้อ */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                จำนวนข้อ
              </label>
              <div className="space-y-2">
                {[10, 15, 20, 30].map((num) => (
                  <button
                    key={num}
                    onClick={() => { 
                      setCount(num); 
                      generateNewSetWithParams(num, level, digits, carry, numberSet);
                    }}
                    className={`w-full px-3 py-2 rounded-lg font-medium transition-all ${
                      count === num
                        ? 'bg-blue-200 text-blue-800 shadow-sm'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
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
              <div className="space-y-2">
                <button
                  onClick={() => { 
                    setLevel('easy'); 
                    generateNewSetWithParams(count, 'easy', digits, carry, numberSet);
                  }}
                  className={`w-full px-3 py-2 rounded-lg font-medium transition-all ${
                    level === 'easy'
                      ? 'bg-purple-200 text-purple-800 shadow-sm'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  ง่าย
                </button>
                <button
                  onClick={() => { 
                    setLevel('medium'); 
                    generateNewSetWithParams(count, 'medium', digits, carry, numberSet);
                  }}
                  className={`w-full px-3 py-2 rounded-lg font-medium transition-all ${
                    level === 'medium'
                      ? 'bg-purple-200 text-purple-800 shadow-sm'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  ปานกลาง
                </button>
                <button
                  onClick={() => { 
                    setLevel('hard'); 
                    generateNewSetWithParams(count, 'hard', digits, carry, numberSet);
                  }}
                  className={`w-full px-3 py-2 rounded-lg font-medium transition-all ${
                    level === 'hard'
                      ? 'bg-purple-200 text-purple-800 shadow-sm'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
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
              <div className="space-y-2">
                {[1, 2, 3].map((num) => (
                  <button
                    key={num}
                    onClick={() => { 
                      setDigits(num); 
                      generateNewSetWithParams(count, level, num, carry, numberSet);
                    }}
                    className={`w-full px-3 py-2 rounded-lg font-medium transition-all ${
                      digits === num
                        ? 'bg-blue-200 text-blue-800 shadow-sm'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {num} หลัก
                  </button>
                ))}
              </div>
            </div>

            {/* จำนวนชุดตัวเลข */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                จำนวนชุดตัวเลข
              </label>
              <div className="space-y-2">
                <button
                  onClick={() => { 
                    setNumberSet(2); 
                    generateNewSetWithParams(count, level, digits, carry, 2);
                  }}
                  className={`w-full px-3 py-2 rounded-lg font-medium transition-all ${
                    numberSet === 2
                      ? 'bg-green-200 text-green-800 shadow-sm'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  2 จำนวน
                </button>
                <button
                  onClick={() => { 
                    setNumberSet(3); 
                    generateNewSetWithParams(count, level, digits, carry, 3);
                  }}
                  className={`w-full px-3 py-2 rounded-lg font-medium transition-all ${
                    numberSet === 3
                      ? 'bg-green-200 text-green-800 shadow-sm'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  3 จำนวน
                </button>
              </div>
            </div>

            {/* การทด */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                การทด
              </label>
              <div className="space-y-2">
                <button
                  onClick={() => { 
                    setCarry('none'); 
                    generateNewSetWithParams(count, level, digits, 'none', numberSet);
                  }}
                  className={`w-full px-3 py-2 rounded-lg font-medium transition-all ${
                    carry === 'none'
                      ? 'bg-red-200 text-red-800 shadow-sm'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  ไม่มี
                </button>
                <button
                  onClick={() => { 
                    setCarry('with'); 
                    generateNewSetWithParams(count, level, digits, 'with', numberSet);
                  }}
                  className={`w-full px-3 py-2 rounded-lg font-medium transition-all ${
                    carry === 'with'
                      ? 'bg-red-200 text-red-800 shadow-sm'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  มี
                </button>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex gap-3 justify-center">
            <button
              onClick={generateNewSet}
              className="bg-blue-400 hover:bg-blue-500 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              สุ่มชุดใหม่
            </button>
            
            <button
              onClick={checkAnswers}
              disabled={!startedAt || !!finishedAt}
              className="bg-green-400 hover:bg-green-500 disabled:bg-gray-300 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              ตรวจคำตอบ
            </button>
            
            <button
              onClick={showAllAnswers}
              className="bg-red-400 hover:bg-red-500 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              เฉลยทั้งหมด
            </button>
          </div>

        </div>

        {/* Problems Grid */}
        {problems.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {problems.map((problem, problemIndex) => {
              const addend1Str = problem.addend1.toString();
              const addend2Str = problem.addend2.toString();
              const addend3Str = problem.addend3 ? problem.addend3.toString() : '';
              
              // Calculate the maximum width needed - based on mathematical principles
              const answerBoxCount = getAnswerBoxCount(digits);
              const maxLength = Math.max(
                addend1Str.length, 
                addend2Str.length + 1,
                numberSet === 3 ? addend3Str.length + 1 : 0,
                answerBoxCount
              );

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
                    <h3 className="text-lg font-bold text-gray-800 mb-4 text-left">
                      ⭐ ข้อ {problemIndex + 1}
                      {results[problemIndex] === 'correct' && <span className="text-green-600 ml-2">✅</span>}
                      {results[problemIndex] === 'incorrect' && <span className="text-red-600 ml-2">❌</span>}
                    </h3>
                    
                    <div className="font-mono text-xl space-y-1">
                       {/* Carry Row */}
                       <div className="flex justify-center items-center h-8">
                         {Array.from({ length: answerBoxCount }, (_, i) => {
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
                         {Array.from({ length: answerBoxCount }, (_, i) => {
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
                               value={(answers[problemIndex] as string[])?.[i as number] || ''}
                               onChange={(e) => handleInputChange(Number(problemIndex), Number(i), e.target.value)}
                                onKeyDown={(e) => handleKeyDown(Number(problemIndex), Number(i), e)}
                                onPaste={(e) => handlePaste(Number(problemIndex), Number(i), e)}
                               ref={(el) => {
                                 if (!inputRefs.current[problemIndex]) {
                                   inputRefs.current[problemIndex] = [];
                                 }
                                 inputRefs.current[problemIndex][i] = el;
                               }}
                             />
                           );
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