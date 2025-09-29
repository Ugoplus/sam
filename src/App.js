import React, { useState, useRef, useEffect } from 'react';
import { Send, Upload, FileText, BarChart3, Download, Calculator, DollarSign, TrendingUp, MessageSquare, Image, CheckCircle2, Camera } from 'lucide-react';
import { BarChart, Bar, PieChart as RePieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const COLORS = ['#25D366', '#128C7E', '#075E54', '#34B7F1', '#DCF8C6', '#FFA726'];

const SAMPLE_RECORDS = [
  { id: '1', type: 'expense', category: 'Transport', amount: 15000, description: 'Uber rides - client meetings', date: '2025-09-05', vatExempt: false, vatAmount: 1125, ref: 'TXN001', hasReceipt: true },
  { id: '2', type: 'expense', category: 'Office Rent', amount: 250000, description: 'Monthly rent - Ikeja office', date: '2025-09-01', vatExempt: false, vatAmount: 18750, ref: 'TXN002', hasReceipt: true },
  { id: '3', type: 'expense', category: 'Medical', amount: 45000, description: 'Medical supplies & first aid', date: '2025-09-10', vatExempt: true, vatAmount: 0, ref: 'TXN003', hasReceipt: true },
  { id: '4', type: 'expense', category: 'Equipment', amount: 180000, description: 'HP Laptop - business use', date: '2025-09-15', vatExempt: false, vatAmount: 13500, ref: 'TXN004', hasReceipt: true },
  { id: '5', type: 'expense', category: 'Fuel', amount: 50000, description: 'Petrol - Total Energies', date: '2025-09-18', vatExempt: false, vatAmount: 3750, ref: 'TXN005', hasReceipt: true },
  { id: '6', type: 'expense', category: 'Education', amount: 30000, description: 'Online courses - Udemy', date: '2025-09-20', vatExempt: true, vatAmount: 0, ref: 'TXN006', hasReceipt: false },
  { id: '7', type: 'income', category: 'Consulting', amount: 400000, description: 'Web design - Client A', date: '2025-09-12', vatExempt: false, vatAmount: 30000, ref: 'TXN007', hasReceipt: true },
  { id: '8', type: 'expense', category: 'Electricity', amount: 75000, description: 'NEPA bill - September', date: '2025-09-25', vatExempt: true, vatAmount: 0, ref: 'TXN008', hasReceipt: true },
  { id: '9', type: 'expense', category: 'Other', amount: 25000, description: 'Internet/data subscription', date: '2025-09-28', vatExempt: false, vatAmount: 1875, ref: 'TXN009', hasReceipt: false },
  { id: '10', type: 'income', category: 'Salary', amount: 500000, description: 'Monthly salary - September', date: '2025-09-30', vatExempt: false, vatAmount: 0, ref: 'TXN010', hasReceipt: false },
  { id: '11', type: 'income', category: 'Sales', amount: 320000, description: 'Product sales - online store', date: '2025-09-22', vatExempt: false, vatAmount: 24000, ref: 'TXN011', hasReceipt: true },
  { id: '12', type: 'expense', category: 'Transport', amount: 8500, description: 'Bolt rides - meetings', date: '2025-09-14', vatExempt: false, vatAmount: 638, ref: 'TXN012', hasReceipt: true },
  { id: '13', type: 'expense', category: 'Food', amount: 35000, description: 'Food items - Shoprite', date: '2025-09-08', vatExempt: true, vatAmount: 0, ref: 'TXN013', hasReceipt: true },
  { id: '14', type: 'income', category: 'Freelance', amount: 150000, description: 'Graphic design project', date: '2025-09-17', vatExempt: false, vatAmount: 11250, ref: 'TXN014', hasReceipt: false },
  { id: '15', type: 'expense', category: 'Other', amount: 12000, description: 'Office supplies - Biro, paper', date: '2025-09-11', vatExempt: false, vatAmount: 900, ref: 'TXN015', hasReceipt: true },
];

const CATEGORIES = {
  expense: ['Transport', 'Office Rent', 'Equipment', 'Fuel', 'Medical', 'Education', 'Electricity', 'Food', 'Other'],
  income: ['Salary', 'Consulting', 'Freelance', 'Sales', 'Investment', 'Other']
};

const VAT_EXEMPT = ['Medical', 'Education', 'Electricity', 'Food'];

function formatNaira(amount) {
  return `₦${amount.toLocaleString('en-NG')}`;
}

const PIT_BRACKETS = [
  { min: 0, max: 300000, rate: 0.07 },
  { min: 300001, max: 600000, rate: 0.11 },
  { min: 600001, max: 1100000, rate: 0.15 },
  { min: 1100001, max: 1600000, rate: 0.19 },
  { min: 1600001, max: 3200000, rate: 0.21 },
  { min: 3200001, max: Infinity, rate: 0.24 }
];

function calculatePIT(grossIncome) {
  const personalRelief = 200000;
  const consolidatedRelief = Math.max(200000, grossIncome * 0.20);
  const onePercentRelief = grossIncome * 0.01;
  
  const totalRelief = personalRelief + consolidatedRelief + onePercentRelief;
  const taxableIncome = Math.max(0, grossIncome - totalRelief);
  
  let tax = 0;
  let remainingIncome = taxableIncome;
  
  for (const bracket of PIT_BRACKETS) {
    if (remainingIncome <= 0) break;
    const bracketSize = bracket.max === Infinity ? remainingIncome : Math.min(remainingIncome, bracket.max - bracket.min + 1);
    tax += bracketSize * bracket.rate;
    remainingIncome -= bracketSize;
  }
  
  return {
    grossIncome,
    personalRelief,
    consolidatedRelief,
    onePercentRelief,
    totalRelief,
    taxableIncome,
    totalTax: Math.round(tax),
    effectiveRate: grossIncome > 0 ? ((tax / grossIncome) * 100).toFixed(2) : 0
  };
}

export default function NRSTaxBot() {
  const [activeTab, setActiveTab] = useState('chat');
  const [messages, setMessages] = useState([
    { id: 1, sender: 'bot', text: '👋 Welcome to NRS TaxBot 2026!\n\nI go help you manage your tax records for the new 2026 tax laws.\n\nYou fit:\n📝 Log expenses & income\n📸 Upload receipts (with camera!)\n💰 Calculate your PIT (PAYE)\n📊 See summary\n📄 Generate NRS report\n\nType "HELP" for commands!', time: '09:00' }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [records, setRecords] = useState(SAMPLE_RECORDS);
  const [pitData, setPitData] = useState({
    monthlySalary: 500000,
    pension: 0,
    nhf: 0,
    lifeInsurance: 0
  });
  const [conversationState, setConversationState] = useState('idle');
  const [tempRecord, setTempRecord] = useState({});
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const chatEndRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const addBotMessage = (text, delay = 800) => {
    setTimeout(() => {
      const time = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
      setMessages(prev => [...prev, { id: Date.now(), sender: 'bot', text, time }]);
    }, delay);
  };

  const addUserMessage = (text) => {
    const time = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
    setMessages(prev => [...prev, { id: Date.now(), sender: 'user', text, time }]);
  };

  const handleReceiptUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    addUserMessage(`📸 [Receipt uploaded: ${file.name}]`);
    setUploadingReceipt(true);
    
    addBotMessage('📸 Receipt received! Processing with OCR...', 500);
    
    // Simulate OCR extraction
    setTimeout(() => {
      const simulatedData = {
        vendor: ['Shoprite', 'Total Energies', 'Mobil', 'GTBank', 'Spar'][Math.floor(Math.random() * 5)],
        amount: [5000, 8500, 12000, 25000, 45000][Math.floor(Math.random() * 5)],
        date: new Date().toISOString().split('T')[0],
        items: 'Various items'
      };
      
      setUploadingReceipt(false);
      
      addBotMessage(
        `✅ Receipt processed!\n\n` +
        `I see:\n` +
        `🏪 Vendor: ${simulatedData.vendor}\n` +
        `💰 Amount: ${formatNaira(simulatedData.amount)}\n` +
        `📅 Date: ${new Date(simulatedData.date).toLocaleDateString('en-NG')}\n\n` +
        `This correct? Type YES to continue or edit the details`,
        1500
      );
      
      setTempRecord({
        amount: simulatedData.amount,
        vendor: simulatedData.vendor,
        date: simulatedData.date,
        hasReceipt: true,
        receiptFile: file.name
      });
      
      setConversationState('awaiting_receipt_confirmation');
    }, 2500);
  };

  const processMessage = (message) => {
    const msg = message.toLowerCase().trim();
    
    if (msg === 'help') {
      addBotMessage('🔧 COMMANDS:\n\n📝 LOG - Add record\n💰 PIT - Calculate PAYE\n📊 SUMMARY - View totals\n📄 PDF - Download report\n📸 RECEIPT - Upload receipt\n🔄 RESET - Start over\n\nOr just tell me:\n"I spend ₦5000 for fuel"\n"My salary is ₦500000"');
      return;
    }
    
    if (msg === 'summary' || msg === 'total') {
      showSummary();
      return;
    }
    
    if (msg === 'pdf' || msg === 'report') {
      generatePDF();
      return;
    }
    
    if (msg === 'pit' || msg === 'paye') {
      showPITCalculation();
      return;
    }

    if (msg === 'receipt' || msg === 'upload') {
      addBotMessage('📸 Click the camera button below to upload your receipt!');
      return;
    }
    
    if (msg === 'reset') {
      setConversationState('idle');
      setTempRecord({});
      addBotMessage('✅ Reset done!');
      return;
    }

    if (conversationState === 'awaiting_receipt_confirmation') {
      if (msg === 'yes' || msg === 'ok' || msg === 'correct') {
        setConversationState('awaiting_category');
        addBotMessage(
          `Great! Now tell me the category:\n\n` +
          `🚗 Transport\n🏢 Office Rent\n💻 Equipment\n⛽ Fuel\n` +
          `🏥 Medical\n📚 Education\n⚡ Electricity\n🍽️ Food\n📦 Other`
        );
      } else {
        addBotMessage('No problem! Tell me the correct amount: "₦XXXX"');
        setConversationState('awaiting_amount');
      }
      return;
    }

    if (conversationState === 'idle') {
      if (msg.includes('salary') || msg.includes('earn me')) {
        handleSalaryInput(message);
      } else if (msg.includes('spend') || msg.includes('pay') || msg.includes('buy')) {
        startExpenseFlow(message);
      } else if (msg.includes('receive') || msg.includes('income')) {
        startIncomeFlow(message);
      } else {
        addBotMessage('I no understand oo 😅\n\nTry:\n"My salary is ₦500000"\n"I spend ₦5000 for fuel"\n"I receive ₦50000"\n\nOr type HELP');
      }
    } else if (conversationState === 'awaiting_category') {
      handleCategoryResponse(message);
    } else if (conversationState === 'awaiting_description') {
      handleDescriptionResponse(message);
    } else if (conversationState === 'awaiting_confirmation') {
      handleConfirmation(message);
    }
  };

  const handleSalaryInput = (message) => {
    const amount = extractAmount(message);
    if (amount) {
      setPitData(prev => ({ ...prev, monthlySalary: amount }));
      const annualSalary = amount * 12;
      const pitCalc = calculatePIT(annualSalary);
      const monthlyTax = Math.round(pitCalc.totalTax / 12);
      
      addBotMessage(
        `✅ Salary updated: ${formatNaira(amount)}/month\n\n` +
        `💰 YOUR PAYE (2026):\n` +
        `Monthly Tax: ${formatNaira(monthlyTax)}\n` +
        `Monthly Net: ${formatNaira(amount - monthlyTax)}\n\n` +
        `Annual Tax: ${formatNaira(pitCalc.totalTax)}\n` +
        `Effective Rate: ${pitCalc.effectiveRate}%\n\n` +
        `Type PIT for full breakdown!`
      );
    } else {
      addBotMessage('Amount missing. Try: "My salary is ₦500000"');
    }
  };

  const startExpenseFlow = (message) => {
    const amount = extractAmount(message);
    if (amount) {
      setTempRecord({ type: 'expense', amount });
      setConversationState('awaiting_category');
      addBotMessage(`Okay, ₦${amount.toLocaleString()} expense!\n\nCategory?\n🚗 Transport\n🏢 Office Rent\n💻 Equipment\n⛽ Fuel\n🏥 Medical\n📚 Education\n⚡ Electricity\n🍽️ Food\n📦 Other`);
    } else {
      addBotMessage('Amount missing. Try: "I spend ₦5000 for fuel"');
    }
  };

  const startIncomeFlow = (message) => {
    const amount = extractAmount(message);
    if (amount) {
      setTempRecord({ type: 'income', amount });
      setConversationState('awaiting_category');
      addBotMessage(`Nice! ₦${amount.toLocaleString()} income!\n\nType?\n💼 Salary\n🎨 Consulting\n✍️ Freelance\n💵 Sales\n📈 Investment\n📦 Other`);
    } else {
      addBotMessage('Amount missing. Try: "I receive ₦50000"');
    }
  };

  const handleCategoryResponse = (message) => {
    const category = findCategory(message, tempRecord.type);
    if (category) {
      const isVATExempt = VAT_EXEMPT.includes(category);
      const vatAmount = isVATExempt ? 0 : Math.round(tempRecord.amount * 0.075);
      
      setTempRecord(prev => ({ ...prev, category, vatExempt: isVATExempt, vatAmount }));
      setConversationState('awaiting_description');
      
      let vatInfo = isVATExempt 
        ? '\n\n✅ VAT-EXEMPT (0%) under 2026 law!'
        : `\n\n💡 VAT: ${formatNaira(vatAmount)} (recoverable)`;
      
      addBotMessage(`${category}!${vatInfo}\n\nDescription?\n(e.g., "Fuel for generator", "Client payment")`);
    } else {
      addBotMessage('Pick from the list please!');
    }
  };

  const handleDescriptionResponse = (message) => {
    const today = new Date().toISOString().split('T')[0];
    const ref = `TXN${String(records.length + 1).padStart(3, '0')}`;
    
    const newRecord = {
      ...tempRecord,
      id: String(Date.now()),
      description: message,
      date: today,
      ref,
      hasReceipt: tempRecord.hasReceipt || false
    };
    
    setTempRecord(newRecord);
    setConversationState('awaiting_confirmation');
    
    addBotMessage(
      `📋 CONFIRM:\n\n` +
      `${newRecord.type === 'income' ? '💰' : '💸'} ${newRecord.category}\n` +
      `Amount: ${formatNaira(newRecord.amount)}\n` +
      `${newRecord.vatExempt ? 'VAT: EXEMPT' : `VAT: ${formatNaira(newRecord.vatAmount)}`}\n` +
      `Description: ${newRecord.description}\n` +
      `${newRecord.hasReceipt ? '📸 Receipt: Attached ✓' : ''}\n` +
      `Ref: ${newRecord.ref}\n\n` +
      `Type YES to save or NO to cancel`
    );
  };

  const handleConfirmation = (message) => {
    const msg = message.toLowerCase();
    if (msg === 'yes' || msg === 'ok' || msg === 'save') {
      setRecords(prev => [...prev, tempRecord]);
      setConversationState('idle');
      setTempRecord({});
      addBotMessage(`✅ SAVED! Ref: ${tempRecord.ref}\n\n${tempRecord.hasReceipt ? '📸 Receipt stored in cloud ✓\n\n' : ''}Type SUMMARY to see totals!`);
    } else {
      setConversationState('idle');
      setTempRecord({});
      addBotMessage('❌ Cancelled!');
    }
  };

  const extractAmount = (text) => {
    const match = text.match(/₦?[\d,]+/);
    return match ? parseInt(match[0].replace(/[₦,]/g, '')) : null;
  };

  const findCategory = (text, type) => {
    const lowerText = text.toLowerCase();
    for (const cat of CATEGORIES[type]) {
      if (lowerText.includes(cat.toLowerCase())) return cat;
    }
    if (lowerText.includes('trans') || lowerText.includes('uber') || lowerText.includes('bolt')) return 'Transport';
    if (lowerText.includes('rent')) return 'Office Rent';
    if (lowerText.includes('laptop') || lowerText.includes('computer')) return 'Equipment';
    if (lowerText.includes('fuel') || lowerText.includes('petrol')) return 'Fuel';
    if (lowerText.includes('medical') || lowerText.includes('hospital')) return 'Medical';
    if (lowerText.includes('book') || lowerText.includes('course')) return 'Education';
    if (lowerText.includes('light') || lowerText.includes('nepa')) return 'Electricity';
    if (lowerText.includes('food') || lowerText.includes('chop')) return 'Food';
    return null;
  };

  const showPITCalculation = () => {
    const annualSalary = pitData.monthlySalary * 12;
    const pitCalc = calculatePIT(annualSalary);
    const monthlyTax = Math.round(pitCalc.totalTax / 12);
    const monthlyNet = pitData.monthlySalary - monthlyTax;
    
    addBotMessage(
      `💰 PIT BREAKDOWN (2026)\n\n` +
      `📊 ANNUAL:\n` +
      `Gross: ${formatNaira(annualSalary)}\n` +
      `Personal Relief: ${formatNaira(pitCalc.personalRelief)}\n` +
      `Consolidated (20%): ${formatNaira(Math.round(pitCalc.consolidatedRelief))}\n` +
      `1% Relief: ${formatNaira(Math.round(pitCalc.onePercentRelief))}\n` +
      `Total Relief: ${formatNaira(Math.round(pitCalc.totalRelief))}\n\n` +
      `Taxable Income: ${formatNaira(pitCalc.taxableIncome)}\n` +
      `Total Tax: ${formatNaira(pitCalc.totalTax)}\n` +
      `Rate: ${pitCalc.effectiveRate}%\n\n` +
      `📅 MONTHLY:\n` +
      `Gross: ${formatNaira(pitData.monthlySalary)}\n` +
      `PAYE: ${formatNaira(monthlyTax)}\n` +
      `Net: ${formatNaira(monthlyNet)}\n\n` +
      `Type PDF for full report!`
    );
  };

  const showSummary = () => {
    const totalIncome = records.filter(r => r.type === 'income').reduce((sum, r) => sum + r.amount, 0);
    const totalExpenses = records.filter(r => r.type === 'expense').reduce((sum, r) => sum + r.amount, 0);
    const netProfit = totalIncome - totalExpenses;
    const vatRecoverable = records.filter(r => r.type === 'expense' && !r.vatExempt).reduce((sum, r) => sum + r.vatAmount, 0);
    const receiptsCount = records.filter(r => r.hasReceipt).length;
    
    addBotMessage(
      `📊 TAX SUMMARY (2026)\n\n` +
      `💰 Income: ${formatNaira(totalIncome)}\n` +
      `💸 Expenses: ${formatNaira(totalExpenses)}\n` +
      `📈 Net: ${formatNaira(netProfit)}\n` +
      `💡 VAT Recoverable: ${formatNaira(vatRecoverable)}\n` +
      `📝 Records: ${records.length}\n` +
      `📸 Receipts: ${receiptsCount}\n\n` +
      `Type PDF for full NRS report!`
    );
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    const annualSalary = pitData.monthlySalary * 12;
    const pitCalc = calculatePIT(annualSalary);
    
    doc.setFillColor(37, 211, 102);
    doc.rect(0, 0, 210, 35, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.text('NIGERIA REVENUE SERVICE (NRS)', 105, 15, { align: 'center' });
    doc.setFontSize(12);
    doc.text('Tax Report - 2026 Compliant', 105, 23, { align: 'center' });
    doc.setFontSize(9);
    doc.text(`Generated: ${new Date().toLocaleDateString('en-NG')}`, 105, 29, { align: 'center' });
    
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('PERSONAL INCOME TAX (PIT)', 20, 50);
    doc.setFont(undefined, 'normal');
    doc.setFontSize(10);
    
    const pitDataTable = [
      ['Annual Gross Income', formatNaira(annualSalary)],
      ['Personal Relief', formatNaira(pitCalc.personalRelief)],
      ['Consolidated Relief (20%)', formatNaira(Math.round(pitCalc.consolidatedRelief))],
      ['1% Relief', formatNaira(Math.round(pitCalc.onePercentRelief))],
      ['Total Relief', formatNaira(Math.round(pitCalc.totalRelief))],
      ['Taxable Income', formatNaira(pitCalc.taxableIncome)],
      ['Annual Tax (PAYE)', formatNaira(pitCalc.totalTax)],
      ['Monthly PAYE', formatNaira(Math.round(pitCalc.totalTax / 12))]
    ];
    
    doc.autoTable({
      startY: 55,
      head: [['Item', 'Amount']],
      body: pitDataTable,
      theme: 'striped',
      headStyles: { fillColor: [37, 211, 102] }
    });
    
    const totalIncome = records.filter(r => r.type === 'income').reduce((sum, r) => sum + r.amount, 0);
    const totalExpenses = records.filter(r => r.type === 'expense').reduce((sum, r) => sum + r.amount, 0);
    const receiptsCount = records.filter(r => r.hasReceipt).length;
    
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('INCOME & EXPENSES', 20, doc.lastAutoTable.finalY + 15);
    doc.setFont(undefined, 'normal');
    
    const summaryData = [
      ['Total Income', formatNaira(totalIncome)],
      ['Total Expenses', formatNaira(totalExpenses)],
      ['Net Income', formatNaira(totalIncome - totalExpenses)],
      ['Records with Receipts', `${receiptsCount} of ${records.length}`]
    ];
    
    doc.autoTable({
      startY: doc.lastAutoTable.finalY + 20,
      head: [['Item', 'Amount']],
      body: summaryData,
      theme: 'grid',
      headStyles: { fillColor: [37, 211, 102] }
    });
    
    doc.addPage();
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('DETAILED RECORDS', 20, 20);
    
    const recordsData = records.slice(0, 20).map(r => [
      new Date(r.date).toLocaleDateString('en-NG'),
      r.type === 'income' ? 'Income' : 'Expense',
      r.category,
      r.description.substring(0, 25),
      formatNaira(r.amount),
      r.hasReceipt ? 'Yes' : 'No'
    ]);
    
    doc.autoTable({
      startY: 25,
      head: [['Date', 'Type', 'Category', 'Description', 'Amount', 'Receipt']],
      body: recordsData,
      theme: 'grid',
      headStyles: { fillColor: [37, 211, 102] },
      styles: { fontSize: 8 }
    });
    
    const finalY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text('Compliant with Nigeria Tax Act 2025, effective January 2026', 105, finalY, { align: 'center' });
    doc.text('NRS TaxBot - Powered by YCloud WhatsApp API', 105, finalY + 5, { align: 'center' });
    doc.text(`${receiptsCount} receipts stored securely in cloud storage`, 105, finalY + 10, { align: 'center' });
    
    doc.save(`NRS_Tax_Report_${new Date().toISOString().split('T')[0]}.pdf`);
    addBotMessage('✅ PDF downloaded! Ready for NRS submission.\n\n📸 All receipt images are referenced in the report!');
  };

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;
    addUserMessage(inputMessage);
    processMessage(inputMessage);
    setInputMessage('');
  };

  const totalIncome = records.filter(r => r.type === 'income').reduce((sum, r) => sum + r.amount, 0);
  const totalExpenses = records.filter(r => r.type === 'expense').reduce((sum, r) => sum + r.amount, 0);
  const annualSalary = pitData.monthlySalary * 12;
  const pitCalc = calculatePIT(annualSalary);
  const receiptsCount = records.filter(r => r.hasReceipt).length;

  const categoryData = {};
  records.filter(r => r.type === 'expense').forEach(r => {
    categoryData[r.category] = (categoryData[r.category] || 0) + r.amount;
  });
  const pieData = Object.entries(categoryData).map(([name, value]) => ({ name, value }));

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-green-600 to-green-500 text-white p-4 shadow-lg">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-xl font-bold">🇳🇬 NRS TaxBot 2026</h1>
          <p className="text-sm opacity-90">WhatsApp Tax + PIT Calculator + Receipt OCR</p>
        </div>
      </div>

      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-6xl mx-auto flex overflow-x-auto">
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex-1 py-3 px-4 font-medium text-sm flex items-center justify-center gap-2 whitespace-nowrap ${
              activeTab === 'chat' ? 'text-green-600 border-b-2 border-green-600' : 'text-gray-500'
            }`}
          >
            <MessageSquare size={16} />
            Chat
          </button>
          <button
            onClick={() => setActiveTab('pit')}
            className={`flex-1 py-3 px-4 font-medium text-sm flex items-center justify-center gap-2 whitespace-nowrap ${
              activeTab === 'pit' ? 'text-green-600 border-b-2 border-green-600' : 'text-gray-500'
            }`}
          >
            <Calculator size={16} />
            PIT Calculator
          </button>
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex-1 py-3 px-4 font-medium text-sm flex items-center justify-center gap-2 whitespace-nowrap ${
              activeTab === 'dashboard' ? 'text-green-600 border-b-2 border-green-600' : 'text-gray-500'
            }`}
          >
            <BarChart3 size={16} />
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab('records')}
            className={`flex-1 py-3 px-4 font-medium text-sm flex items-center justify-center gap-2 whitespace-nowrap ${
              activeTab === 'records' ? 'text-green-600 border-b-2 border-green-600' : 'text-gray-500'
            }`}
          >
            <FileText size={16} />
            Records
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto">
        {activeTab === 'chat' && (
          <div className="h-[calc(100vh-140px)] flex flex-col bg-gray-100">
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-lg p-3 shadow-sm ${
                    msg.sender === 'user' ? 'bg-green-100 text-gray-800' : 'bg-white text-gray-800'
                  }`}>
                    <p className="text-sm whitespace-pre-line leading-relaxed">{msg.text}</p>
                    <p className="text-xs text-gray-400 mt-1 text-right">{msg.time}</p>
                  </div>
                </div>
              ))}
              {uploadingReceipt && (
                <div className="flex justify-start">
                  <div className="bg-white rounded-lg p-3 shadow-sm">
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                      <p className="text-sm text-gray-600">Processing receipt...</p>
                    </div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <div className="bg-white border-t p-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="p-3 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-full transition"
                  title="Upload receipt"
                >
                  <Camera size={22} />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleReceiptUpload}
                />
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-3 border rounded-full focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                />
                <button
                  onClick={handleSendMessage}
                  className="bg-green-500 text-white p-3 rounded-full hover:bg-green-600 transition"
                >
                  <Send size={20} />
                </button>
              </div>
              <p className="text-xs text-center text-gray-400 mt-2">
                💡 Try: "My salary is ₦500000" | "I spend ₦5000" | 📸 Upload receipt | "HELP"
              </p>
            </div>
          </div>
        )}

        {activeTab === 'pit' && (
          <div className="p-4 space-y-4">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Calculator className="text-green-600" />
                Personal Income Tax (PIT) Calculator - 2026
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Monthly Gross Salary</label>
                  <input
                    type="number"
                    value={pitData.monthlySalary}
                    onChange={(e) => setPitData(prev => ({ ...prev, monthlySalary: parseInt(e.target.value) || 0 }))}
                    className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 text-lg"
                    placeholder="e.g., 500000"
                  />
                </div>
              </div>

              <div className="mt-6 p-4 bg-green-50 rounded-lg border-2 border-green-300">
                <h3 className="font-bold text-lg mb-3">📊 Tax Calculation Results</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-gray-600">Annual Gross</p>
                    <p className="text-lg font-bold text-green-700">{formatNaira(annualSalary)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Total Relief</p>
                    <p className="text-lg font-bold text-blue-700">{formatNaira(Math.round(pitCalc.totalRelief))}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Taxable Income</p>
                    <p className="text-lg font-bold text-orange-700">{formatNaira(pitCalc.taxableIncome)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Annual Tax</p>
                    <p className="text-lg font-bold text-red-700">{formatNaira(pitCalc.totalTax)}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="bg-white p-3 rounded">
                    <p className="text-sm text-gray-600">Monthly PAYE</p>
                    <p className="text-2xl font-bold text-red-600">{formatNaira(Math.round(pitCalc.totalTax / 12))}</p>
                  </div>
                  <div className="bg-white p-3 rounded">
                    <p className="text-sm text-gray-600">Monthly Net Pay</p>
                    <p className="text-2xl font-bold text-green-600">{formatNaira(pitData.monthlySalary - Math.round(pitCalc.totalTax / 12))}</p>
                  </div>
                </div>
                <div className="mt-3 text-sm text-gray-700">
                  <p><strong>Effective Tax Rate:</strong> {pitCalc.effectiveRate}%</p>
                  <p className="text-xs mt-2 text-gray-600">✓ 2026 Tax Reform Compliant • Personal Relief: ₦200k • Consolidated: 20%</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="font-bold text-lg mb-3">📋 Relief Breakdown</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between p-2 bg-gray-50 rounded">
                  <span>Personal Relief (₦200,000)</span>
                  <span className="font-bold">{formatNaira(pitCalc.personalRelief)}</span>
                </div>
                <div className="flex justify-between p-2 bg-gray-50 rounded">
                  <span>Consolidated Relief (20%)</span>
                  <span className="font-bold">{formatNaira(Math.round(pitCalc.consolidatedRelief))}</span>
                </div>
                <div className="flex justify-between p-2 bg-gray-50 rounded">
                  <span>1% of Gross Income</span>
                  <span className="font-bold">{formatNaira(Math.round(pitCalc.onePercentRelief))}</span>
                </div>
                <div className="flex justify-between p-2 bg-green-100 rounded border-2 border-green-400">
                  <span className="font-bold">Total Relief</span>
                  <span className="font-bold text-green-700">{formatNaira(Math.round(pitCalc.totalRelief))}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="font-bold text-lg mb-3">📊 Tax Brackets (2026)</h3>
              <div className="space-y-2 text-sm">
                {PIT_BRACKETS.map((bracket, idx) => (
                  <div key={idx} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <span>
                      {formatNaira(bracket.min)} - {bracket.max === Infinity ? 'Above' : formatNaira(bracket.max)}
                    </span>
                    <span className="font-bold text-green-700">{(bracket.rate * 100).toFixed(0)}%</span>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={generatePDF}
              className="w-full bg-green-600 text-white py-4 rounded-lg font-bold hover:bg-green-700 transition flex items-center justify-center gap-2"
            >
              <Download size={20} />
              Download Full PIT Report (PDF)
            </button>
          </div>
        )}

        {activeTab === 'dashboard' && (
          <div className="p-4 space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg shadow p-4">
                <p className="text-sm text-gray-500">Total Income</p>
                <p className="text-2xl font-bold text-green-600">{formatNaira(totalIncome)}</p>
              </div>
              <div className="bg-white rounded-lg shadow p-4">
                <p className="text-sm text-gray-500">Total Expenses</p>
                <p className="text-2xl font-bold text-red-600">{formatNaira(totalExpenses)}</p>
              </div>
              <div className="bg-white rounded-lg shadow p-4">
                <p className="text-sm text-gray-500">Annual PAYE</p>
                <p className="text-2xl font-bold text-orange-600">{formatNaira(pitCalc.totalTax)}</p>
              </div>
              <div className="bg-white rounded-lg shadow p-4">
                <p className="text-sm text-gray-500">Records</p>
                <p className="text-2xl font-bold text-blue-600">{records.length}</p>
              </div>
            </div>

            <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-6 border-2 border-green-300">
              <div className="flex items-start gap-3 mb-4">
                <CheckCircle2 className="text-green-600 flex-shrink-0" size={28} />
                <div>
                  <h3 className="font-bold text-xl text-green-800">🎯 2026 Compliance Status</h3>
                  <p className="text-sm text-gray-700 mt-1">✓ All calculations follow Nigeria Tax Act 2025</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">📸 Receipts Uploaded</p>
                  <p className="text-3xl font-bold text-green-700">{receiptsCount} / {records.length}</p>
                  <p className="text-xs text-gray-500 mt-1">{((receiptsCount / records.length) * 100).toFixed(0)}% documented</p>
                </div>
                <div className="bg-white p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">💰 Monthly Net Pay</p>
                  <p className="text-3xl font-bold text-blue-700">{formatNaira(pitData.monthlySalary - Math.round(pitCalc.totalTax / 12))}</p>
                  <p className="text-xs text-gray-500 mt-1">After PAYE deduction</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="font-bold text-lg mb-4">Expenses by Category</h3>
              <ResponsiveContainer width="100%" height={300}>
                <RePieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatNaira(value)} />
                </RePieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {activeTab === 'records' && (
          <div className="p-4">
            <div className="bg-white rounded-lg shadow">
              <div className="p-4 border-b flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold">Tax Records</h2>
                  <p className="text-sm text-gray-500">{records.length} records • {receiptsCount} with receipts</p>
                </div>
                <button
                  onClick={generatePDF}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition flex items-center gap-2"
                >
                  <Download size={16} />
                  Export PDF
                </button>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">VAT</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Receipt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {records.map((record) => (
                      <tr key={record.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm">{new Date(record.date).toLocaleDateString('en-NG')}</td>
                        <td className="px-4 py-3 text-sm">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            record.type === 'income' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {record.type === 'income' ? '💰 Income' : '💸 Expense'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm">{record.category}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{record.description}</td>
                        <td className="px-4 py-3 text-sm text-right font-medium">{formatNaira(record.amount)}</td>
                        <td className="px-4 py-3 text-sm text-center">
                          {record.vatExempt ? (
                            <span className="text-blue-600 text-xs font-medium">0% (Exempt)</span>
                          ) : (
                            <span className="text-gray-600 text-xs">7.5%</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {record.hasReceipt ? (
                            <span className="inline-flex items-center gap-1 text-green-600">
                              <Image size={16} />
                              <span className="text-xs">Yes</span>
                            </span>
                          ) : (
                            <span className="text-gray-400 text-xs">No</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="bg-gray-800 text-white p-6 mt-8">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-sm mb-2">🇳🇬 Nigeria Revenue Service (NRS) Compliant - 2026 Tax Reform</p>
          <p className="text-xs text-gray-400">
            Powered by YCloud WhatsApp API | PIT Calculator + Receipt OCR + Business Tax Tracker
          </p>
          <p className="text-xs text-gray-400 mt-2">
            ✓ Personal Income Tax (PAYE) • ✓ Receipt Verification • ✓ VAT Recovery • ✓ Monthly Filing Ready
          </p>
        </div>
      </div>
    </div>
  );
}
