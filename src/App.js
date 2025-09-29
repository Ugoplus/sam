import React, { useState, useRef, useEffect } from 'react';
import { Send, Upload, FileText, BarChart3, Download, X, CheckCircle, AlertCircle, Calendar, TrendingUp, Menu, Home, MessageSquare, DollarSign } from 'lucide-react';
import { BarChart, Bar, PieChart as RePieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const COLORS = ['#25D366', '#128C7E', '#075E54', '#34B7F1', '#DCF8C6', '#FFA726'];

// Sample data with 2026 compliance
const SAMPLE_RECORDS = [
  { id: '1', type: 'expense', category: 'Transport', amount: 15000, description: 'Uber for client meetings', date: '2025-09-05', vatExempt: false, vatAmount: 1125, ref: 'TXN001' },
  { id: '2', type: 'expense', category: 'Office Rent', amount: 250000, description: 'Monthly rent - Ikeja office', date: '2025-09-01', vatExempt: false, vatAmount: 18750, ref: 'TXN002' },
  { id: '3', type: 'expense', category: 'Medical Supplies', amount: 45000, description: 'First aid kit and medicines', date: '2025-09-10', vatExempt: true, vatAmount: 0, ref: 'TXN003' },
  { id: '4', type: 'expense', category: 'Equipment', amount: 180000, description: 'HP Laptop for business', date: '2025-09-15', vatExempt: false, vatAmount: 13500, ref: 'TXN004' },
  { id: '5', type: 'expense', category: 'Fuel', amount: 50000, description: 'Petrol for generator', date: '2025-09-18', vatExempt: false, vatAmount: 3750, ref: 'TXN005' },
  { id: '6', type: 'expense', category: 'Education Materials', amount: 30000, description: 'Training books and courses', date: '2025-09-20', vatExempt: true, vatAmount: 0, ref: 'TXN006' },
  { id: '7', type: 'income', category: 'Consulting', amount: 400000, description: 'Web design project payment', date: '2025-09-12', vatExempt: false, vatAmount: 30000, ref: 'TXN007' },
  { id: '8', type: 'expense', category: 'Electricity', amount: 75000, description: 'NEPA bill - office', date: '2025-09-25', vatExempt: true, vatAmount: 0, ref: 'TXN008' },
  { id: '9', type: 'expense', category: 'Salaries', amount: 320000, description: 'Staff salary - September', date: '2025-09-30', vatExempt: false, vatAmount: 0, ref: 'TXN009' },
  { id: '10', type: 'income', category: 'Sales', amount: 550000, description: 'Product sales - September', date: '2025-09-28', vatExempt: false, vatAmount: 41250, ref: 'TXN010' },
];

const CATEGORIES = {
  expense: ['Transport', 'Office Rent', 'Equipment', 'Fuel', 'Salaries', 'Medical Supplies', 'Education Materials', 'Electricity', 'Food Items', 'Other'],
  income: ['Sales', 'Consulting', 'Freelance', 'Salary', 'Investment', 'Other']
};

const VAT_EXEMPT_CATEGORIES = ['Medical Supplies', 'Education Materials', 'Electricity', 'Food Items'];

function formatNaira(amount) {
  return `₦${amount.toLocaleString('en-NG')}`;
}

function getMonthFromDate(dateString) {
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const date = new Date(dateString);
  return months[date.getMonth()];
}

export default function WhatsAppTaxBot() {
  const [activeTab, setActiveTab] = useState('chat');
  const [messages, setMessages] = useState([
    { id: 1, sender: 'bot', text: '👋 Welcome to NRS TaxBot 2026!\n\nI go help you manage your tax records for the new 2026 tax laws.\n\nYou fit:\n📝 Log expenses & income\n📸 Upload receipts\n📊 See summary\n📄 Generate NRS report\n\nType "HELP" anytime!', time: '09:00' }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [records, setRecords] = useState(SAMPLE_RECORDS);
  const [userProfile, setUserProfile] = useState({
    name: 'Chinedu Okafor',
    tin: '12345678-0001',
    phone: '+234 803 XXX XXXX',
    businessType: 'Freelance Designer'
  });
  const [conversationState, setConversationState] = useState('idle');
  const [tempRecord, setTempRecord] = useState({});
  const chatEndRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const addBotMessage = (text, delay = 1000) => {
    setTimeout(() => {
      const time = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
      setMessages(prev => [...prev, { id: Date.now(), sender: 'bot', text, time }]);
    }, delay);
  };

  const addUserMessage = (text) => {
    const time = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
    setMessages(prev => [...prev, { id: Date.now(), sender: 'user', text, time }]);
  };

  const processMessage = (message) => {
    const msg = message.toLowerCase().trim();
    
    // Commands
    if (msg === 'help') {
      addBotMessage(`🔧 COMMANDS:\n\n📝 LOG - Add new record\n📊 SUMMARY - See all records\n📄 PDF - Generate NRS report\n💰 EXEMPTION - Check if you qualify\n📅 MONTHLY - This month's summary\n🔄 RESET - Start over\n\nOr just tell me naturally:\n"I spend ₦5000 for fuel"\n"I receive ₦50000 for web design"`);
      return;
    }
    
    if (msg === 'summary') {
      showSummary();
      return;
    }
    
    if (msg === 'pdf') {
      generatePDF();
      return;
    }
    
    if (msg === 'exemption') {
      checkExemption();
      return;
    }
    
    if (msg === 'monthly') {
      showMonthlySummary();
      return;
    }
    
    if (msg === 'reset') {
      setConversationState('idle');
      setTempRecord({});
      addBotMessage('✅ Reset! Ready for new record.');
      return;
    }

    // Natural language processing
    if (conversationState === 'idle') {
      if (msg.includes('spend') || msg.includes('pay') || msg.includes('buy') || msg.includes('chop')) {
        startExpenseFlow(message);
      } else if (msg.includes('receive') || msg.includes('earn') || msg.includes('collect') || msg.includes('income')) {
        startIncomeFlow(message);
      } else {
        addBotMessage('I no understand oo. 😅\n\nYou wan:\n1️⃣ Log expense (type: I spend...)\n2️⃣ Log income (type: I receive...)\n3️⃣ See summary (type: SUMMARY)\n\nOr type HELP for commands');
      }
    } else if (conversationState === 'awaiting_category') {
      handleCategoryResponse(message);
    } else if (conversationState === 'awaiting_description') {
      handleDescriptionResponse(message);
    } else if (conversationState === 'awaiting_confirmation') {
      handleConfirmation(message);
    }
  };

  const startExpenseFlow = (message) => {
    const amount = extractAmount(message);
    if (amount) {
      setTempRecord({ type: 'expense', amount });
      setConversationState('awaiting_category');
      addBotMessage(`Okay, ₦${amount.toLocaleString()} expense noted!\n\nWetin be the category?\n\n🚗 Transport\n🏢 Office Rent\n💻 Equipment\n⛽ Fuel\n💰 Salaries\n🏥 Medical Supplies\n📚 Education Materials\n⚡ Electricity\n🍽️ Food Items\n📦 Other\n\nJust type the name (e.g., "Transport")`);
    } else {
      addBotMessage('I no see the amount oo. Try again like: "I spend ₦5000 for fuel"');
    }
  };

  const startIncomeFlow = (message) => {
    const amount = extractAmount(message);
    if (amount) {
      setTempRecord({ type: 'income', amount });
      setConversationState('awaiting_category');
      addBotMessage(`Nice! ₦${amount.toLocaleString()} income recorded!\n\nWhich type?\n\n💼 Sales\n🎨 Consulting\n✍️ Freelance\n💵 Salary\n📈 Investment\n📦 Other\n\nType the category name`);
    } else {
      addBotMessage('Amount missing oo. Try: "I receive ₦50000 for consulting work"');
    }
  };

  const handleCategoryResponse = (message) => {
    const category = findCategory(message, tempRecord.type);
    if (category) {
      const isVATExempt = VAT_EXEMPT_CATEGORIES.includes(category);
      const vatAmount = isVATExempt ? 0 : Math.round(tempRecord.amount * 0.075);
      
      setTempRecord(prev => ({ ...prev, category, vatExempt: isVATExempt, vatAmount }));
      setConversationState('awaiting_description');
      
      let vatInfo = isVATExempt 
        ? '\n\n✅ 2026 Update: This category is VAT-EXEMPT (0%)!'
        : `\n\n💡 VAT (7.5%): ₦${vatAmount.toLocaleString()} - You fit recover this!`;
      
      addBotMessage(`${category} - Noted!${vatInfo}\n\nGive me small description (e.g., "Fuel for generator", "Client meeting transport")`);
    } else {
      addBotMessage('I no understand that category. Please pick from the list I send you.');
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
      ref
    };
    
    setTempRecord(newRecord);
    setConversationState('awaiting_confirmation');
    
    const exemptionInfo = calculateExemptionStatus([...records, newRecord]);
    
    addBotMessage(
      `📋 CONFIRM YOUR RECORD:\n\n` +
      `${newRecord.type === 'income' ? '💰 Income' : '💸 Expense'}\n` +
      `Category: ${newRecord.category}\n` +
      `Amount: ${formatNaira(newRecord.amount)}\n` +
      `${newRecord.vatExempt ? 'VAT: EXEMPT (0%)' : `VAT (7.5%): ${formatNaira(newRecord.vatAmount)}`}\n` +
      `Description: ${newRecord.description}\n` +
      `Date: ${new Date().toLocaleDateString('en-NG')}\n` +
      `Ref: ${newRecord.ref}\n\n` +
      `${exemptionInfo}\n\n` +
      `Type YES to save or NO to cancel`
    );
  };

  const handleConfirmation = (message) => {
    const msg = message.toLowerCase();
    if (msg === 'yes' || msg === 'confirm' || msg === 'ok' || msg === 'save') {
      const newRecord = { ...tempRecord };
      setRecords(prev => [...prev, newRecord]);
      setConversationState('idle');
      setTempRecord({});
      
      addBotMessage(
        `✅ SAVED!\n\n` +
        `Ref: ${newRecord.ref}\n` +
        `${formatNaira(newRecord.amount)} logged successfully!\n\n` +
        `Type:\n` +
        `📊 SUMMARY - See all records\n` +
        `📄 PDF - Generate report\n` +
        `Or add another record!`
      );
    } else {
      setConversationState('idle');
      setTempRecord({});
      addBotMessage('❌ Cancelled. No wahala! Type anything to start again.');
    }
  };

  const extractAmount = (text) => {
    const match = text.match(/₦?[\d,]+/);
    if (match) {
      return parseInt(match[0].replace(/[₦,]/g, ''));
    }
    return null;
  };

  const findCategory = (text, type) => {
    const lowerText = text.toLowerCase();
    const categories = CATEGORIES[type];
    
    for (const cat of categories) {
      if (lowerText.includes(cat.toLowerCase())) {
        return cat;
      }
    }
    
    if (lowerText.includes('trans') || lowerText.includes('uber') || lowerText.includes('keke')) return 'Transport';
    if (lowerText.includes('rent') || lowerText.includes('office')) return 'Office Rent';
    if (lowerText.includes('laptop') || lowerText.includes('computer') || lowerText.includes('phone')) return 'Equipment';
    if (lowerText.includes('fuel') || lowerText.includes('petrol') || lowerText.includes('diesel')) return 'Fuel';
    if (lowerText.includes('salary') || lowerText.includes('staff') || lowerText.includes('worker')) return 'Salaries';
    if (lowerText.includes('medical') || lowerText.includes('hospital') || lowerText.includes('drug')) return 'Medical Supplies';
    if (lowerText.includes('book') || lowerText.includes('course') || lowerText.includes('training')) return 'Education Materials';
    if (lowerText.includes('light') || lowerText.includes('nepa') || lowerText.includes('electricity')) return 'Electricity';
    if (lowerText.includes('food') || lowerText.includes('chop')) return 'Food Items';
    
    return null;
  };

  const calculateExemptionStatus = (recordsList) => {
    const yearlyRevenue = recordsList
      .filter(r => r.type === 'income')
      .reduce((sum, r) => sum + r.amount, 0);
    
    const isExempt = yearlyRevenue < 100000000;
    const percentage = ((yearlyRevenue / 100000000) * 100).toFixed(1);
    
    if (isExempt) {
      return `🎉 2026 SMALL BUSINESS EXEMPTION: You still qualify!\nYour revenue: ${formatNaira(yearlyRevenue)} (${percentage}% of ₦100M limit)`;
    } else {
      return `⚠️ You've exceeded ₦100M threshold. Standard tax applies.`;
    }
  };

  const showSummary = () => {
    const totalIncome = records.filter(r => r.type === 'income').reduce((sum, r) => sum + r.amount, 0);
    const totalExpenses = records.filter(r => r.type === 'expense').reduce((sum, r) => sum + r.amount, 0);
    const netProfit = totalIncome - totalExpenses;
    const vatRecoverable = records.filter(r => r.type === 'expense' && !r.vatExempt).reduce((sum, r) => sum + r.vatAmount, 0);
    const isExempt = totalIncome < 100000000;
    
    addBotMessage(
      `📊 YOUR TAX SUMMARY (2026)\n\n` +
      `💰 Total Income: ${formatNaira(totalIncome)}\n` +
      `💸 Total Expenses: ${formatNaira(totalExpenses)}\n` +
      `📈 Net Profit: ${formatNaira(netProfit)}\n\n` +
      `🎯 2026 TAX STATUS:\n` +
      `${isExempt ? '✅ Small Business EXEMPT' : '❌ Standard Tax Applies'}\n` +
      `${isExempt ? `(Revenue < ₦100M)` : `(Revenue ≥ ₦100M)`}\n\n` +
      `💡 VAT Recoverable: ${formatNaira(vatRecoverable)}\n` +
      `(Input VAT you can claim back!)\n\n` +
      `📝 Total Records: ${records.length}\n\n` +
      `Type PDF to download full NRS report!`
    );
  };

  const showMonthlySummary = () => {
    const currentMonth = new Date().toLocaleString('default', { month: 'long' });
    const monthRecords = records.filter(r => getMonthFromDate(r.date) === currentMonth);
    
    const monthIncome = monthRecords.filter(r => r.type === 'income').reduce((sum, r) => sum + r.amount, 0);
    const monthExpenses = monthRecords.filter(r => r.type === 'expense').reduce((sum, r) => sum + r.amount, 0);
    
    addBotMessage(
      `📅 ${currentMonth.toUpperCase()} 2025\n\n` +
      `💰 Income: ${formatNaira(monthIncome)}\n` +
      `💸 Expenses: ${formatNaira(monthExpenses)}\n` +
      `📊 Net: ${formatNaira(monthIncome - monthExpenses)}\n` +
      `📝 Records: ${monthRecords.length}\n\n` +
      `💡 2026 Reminder: Monthly filing due by 15th of next month!`
    );
  };

  const checkExemption = () => {
    const totalRevenue = records.filter(r => r.type === 'income').reduce((sum, r) => sum + r.amount, 0);
    const isExempt = totalRevenue < 100000000;
    const remaining = 100000000 - totalRevenue;
    const percentage = ((totalRevenue / 100000000) * 100).toFixed(1);
    
    addBotMessage(
      `🎯 2026 SMALL BUSINESS EXEMPTION CHECK\n\n` +
      `Your Revenue: ${formatNaira(totalRevenue)}\n` +
      `Exemption Limit: ₦100,000,000\n` +
      `Status: ${isExempt ? '✅ EXEMPT' : '❌ NOT EXEMPT'}\n\n` +
      `${isExempt 
        ? `You dey use ${percentage}% of limit\nRemaining: ${formatNaira(remaining)}\n\n🎉 You no go pay:\n✓ Companies Income Tax\n✓ Capital Gains Tax\n✓ Development Levy` 
        : `You don pass the limit!\nYou go pay standard tax rates.`
      }`
    );
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    
    // Header
    doc.setFillColor(37, 211, 102);
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.text('NIGERIA REVENUE SERVICE (NRS)', 105, 15, { align: 'center' });
    doc.setFontSize(14);
    doc.text('Personal Income Tax Record - 2026 Compliant', 105, 25, { align: 'center' });
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleDateString('en-NG')}`, 105, 32, { align: 'center' });
    
    // User Info
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(11);
    doc.text(`Taxpayer: ${userProfile.name}`, 20, 50);
    doc.text(`TIN: ${userProfile.tin}`, 20, 57);
    doc.text(`Business: ${userProfile.businessType}`, 20, 64);
    doc.text(`Phone: ${userProfile.phone}`, 20, 71);
    
    // 2026 Compliance Box
    doc.setFillColor(220, 237, 200);
    doc.roundedRect(20, 78, 170, 32, 3, 3, 'F');
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('✓ 2026 TAX REFORM COMPLIANT', 25, 86);
    doc.setFont(undefined, 'normal');
    doc.setFontSize(10);
    
    const totalRevenue = records.filter(r => r.type === 'income').reduce((sum, r) => sum + r.amount, 0);
    const isExempt = totalRevenue < 100000000;
    
    doc.text(`• Small Business Status: ${isExempt ? 'EXEMPT (Revenue < ₦100M)' : 'NOT EXEMPT'}`, 25, 93);
    doc.text(`• VAT Recovery: Calculated on all eligible expenses`, 25, 99);
    doc.text(`• Monthly Filing: Ready for NRS submission`, 25, 105);
    
    // Summary
    const totalIncome = records.filter(r => r.type === 'income').reduce((sum, r) => sum + r.amount, 0);
    const totalExpenses = records.filter(r => r.type === 'expense').reduce((sum, r) => sum + r.amount, 0);
    const netProfit = totalIncome - totalExpenses;
    const vatRecoverable = records.filter(r => r.type === 'expense' && !r.vatExempt).reduce((sum, r) => sum + r.vatAmount, 0);
    const devLevy = isExempt ? 0 : netProfit * 0.04;
    
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('FINANCIAL SUMMARY', 20, 120);
    doc.setFont(undefined, 'normal');
    doc.setFontSize(10);
    
    const summaryData = [
      ['Total Income', formatNaira(totalIncome)],
      ['Total Expenses', formatNaira(totalExpenses)],
      ['Net Profit', formatNaira(netProfit)],
      ['VAT Recoverable (Input VAT)', formatNaira(vatRecoverable)],
      ['Development Levy (4%)', formatNaira(devLevy)],
      ['Estimated Tax Liability', isExempt ? '₦0 (EXEMPT)' : formatNaira(devLevy)]
    ];
    
    doc.autoTable({
      startY: 125,
      head: [['Item', 'Amount']],
      body: summaryData,
      theme: 'striped',
      headStyles: { fillColor: [37, 211, 102] }
    });
    
    // Records table
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('DETAILED RECORDS', 20, doc.lastAutoTable.finalY + 15);
    
    const recordsData = records.map(r => [
      new Date(r.date).toLocaleDateString('en-NG'),
      r.type === 'income' ? '💰 Income' : '💸 Expense',
      r.category,
      r.description.substring(0, 30),
      formatNaira(r.amount),
      r.vatExempt ? '0% (Exempt)' : `7.5% (₦${r.vatAmount.toLocaleString()})`
    ]);
    
    doc.autoTable({
      startY: doc.lastAutoTable.finalY + 20,
      head: [['Date', 'Type', 'Category', 'Description', 'Amount', 'VAT Status']],
      body: recordsData,
      theme: 'grid',
      headStyles: { fillColor: [37, 211, 102] },
      styles: { fontSize: 8 }
    });
    
    // Footer
    const finalY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text('This report is compliant with Nigeria Tax Act 2025, effective January 2026', 105, finalY, { align: 'center' });
    doc.text('Generated by NRS TaxBot - WhatsApp Tax Management System', 105, finalY + 5, { align: 'center' });
    doc.text(`Reference: ${userProfile.tin}-${new Date().getFullYear()}-${Date.now()}`, 105, finalY + 10, { align: 'center' });
    
    doc.save(`NRS_Tax_Report_${userProfile.tin}_${new Date().toISOString().split('T')[0]}.pdf`);
    
    addBotMessage('✅ PDF Generated!\n\nYour 2026-compliant NRS tax report don download. You fit submit am to NRS or use am for bank loan application!\n\n📄 File saved successfully!');
  };

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;
    
    addUserMessage(inputMessage);
    processMessage(inputMessage);
    setInputMessage('');
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      addUserMessage(`📸 [Receipt uploaded: ${file.name}]`);
      addBotMessage('📸 Receipt received!\n\nI dey process the image... (In production, OCR go extract the details)\n\nFor this demo, make you type the details manually. Type: "I spend ₦5000 for fuel"');
    }
  };

  // Calculate dashboard stats
  const totalIncome = records.filter(r => r.type === 'income').reduce((sum, r) => sum + r.amount, 0);
  const totalExpenses = records.filter(r => r.type === 'expense').reduce((sum, r) => sum + r.amount, 0);
  const netProfit = totalIncome - totalExpenses;
  const vatRecoverable = records.filter(r => r.type === 'expense' && !r.vatExempt).reduce((sum, r) => sum + r.vatAmount, 0);
  const isExempt = totalIncome < 100000000;

  // Chart data
  const categoryData = {};
  records.filter(r => r.type === 'expense').forEach(r => {
    categoryData[r.category] = (categoryData[r.category] || 0) + r.amount;
  });
  
  const pieData = Object.entries(categoryData).map(([name, value]) => ({ name, value }));
  
  const monthlyData = {};
  records.forEach(r => {
    const month = getMonthFromDate(r.date);
    if (!monthlyData[month]) {
      monthlyData[month] = { month, income: 0, expenses: 0 };
    }
    if (r.type === 'income') {
      monthlyData[month].income += r.amount;
    } else {
      monthlyData[month].expenses += r.amount;
    }
  });
  
  const barData = Object.values(monthlyData);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="bg-gradient-to-r from-green-600 to-green-500 text-white p-4 shadow-lg">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-xl font-bold">🇳🇬 NRS TaxBot 2026</h1>
          <p className="text-sm opacity-90">YCloud WhatsApp Tax Management</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-6xl mx-auto flex">
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex-1 py-3 px-4 font-medium text-sm flex items-center justify-center gap-2 ${
              activeTab === 'chat' ? 'text-green-600 border-b-2 border-green-600' : 'text-gray-500'
            }`}
          >
            <MessageSquare size={18} />
            WhatsApp Chat
          </button>
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex-1 py-3 px-4 font-medium text-sm flex items-center justify-center gap-2 ${
              activeTab === 'dashboard' ? 'text-green-600 border-b-2 border-green-600' : 'text-gray-500'
            }`}
          >
            <BarChart3 size={18} />
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab('records')}
            className={`flex-1 py-3 px-4 font-medium text-sm flex items-center justify-center gap-2 ${
              activeTab === 'records' ? 'text-green-600 border-b-2 border-green-600' : 'text-gray-500'
            }`}
          >
            <FileText size={18} />
            Records
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto">
        {/* WhatsApp Chat Tab */}
        {activeTab === 'chat' && (
          <div className="h-[calc(100vh-140px)] flex flex-col bg-[#E5DDD5]">
            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-3 shadow ${
                      msg.sender === 'user'
                        ? 'bg-[#DCF8C6] text-gray-800'
                        : 'bg-white text-gray-800'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-line">{msg.text}</p>
                    <p className="text-xs text-gray-500 mt-1 text-right">{msg.time}</p>
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            {/* Input Area */}
            <div className="bg-white border-t p-3">
              <div className="flex items-center gap-2 max-w-4xl mx-auto">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 text-gray-500 hover:text-green-600 transition"
                >
                  <Upload size={24} />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileUpload}
                />
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <button
                  onClick={handleSendMessage}
                  className="bg-green-500 text-white p-2 rounded-full hover:bg-green-600 transition"
                >
                  <Send size={20} />
                </button>
              </div>
              <p className="text-xs text-center text-gray-500 mt-2">
                💡 Try: "I spend ₦5000 for fuel" or "SUMMARY" or "PDF"
              </p>
            </div>
          </div>
        )}

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="p-4 space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Total Income</p>
                    <p className="text-2xl font-bold text-green-600">{formatNaira(totalIncome)}</p>
                  </div>
                  <TrendingUp className="text-green-500" size={32} />
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Total Expenses</p>
                    <p className="text-2xl font-bold text-red-600">{formatNaira(totalExpenses)}</p>
                  </div>
                  <DollarSign className="text-red-500" size={32} />
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Net Profit</p>
                    <p className={`text-2xl font-bold ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatNaira(netProfit)}
                    </p>
                  </div>
                  <BarChart3 className={netProfit >= 0 ? 'text-green-500' : 'text-red-500'} size={32} />
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Total Records</p>
                    <p className="text-2xl font-bold text-blue-600">{records.length}</p>
                  </div>
                  <FileText className="text-blue-500" size={32} />
                </div>
              </div>
            </div>

            {/* 2026 Compliance Alert */}
            <div className={`rounded-lg p-4 ${isExempt ? 'bg-green-50 border-2 border-green-300' : 'bg-yellow-50 border-2 border-yellow-300'}`}>
              <div className="flex items-start gap-3">
                {isExempt ? <CheckCircle className="text-green-600 flex-shrink-0" size={24} /> : <AlertCircle className="text-yellow-600 flex-shrink-0" size={24} />}
                <div className="flex-1">
                  <h3 className="font-bold text-lg mb-1">
                    {isExempt ? '✅ 2026 Small Business Exemption: QUALIFIED' : '⚠️ Standard Tax Applies'}
                  </h3>
                  <p className="text-sm mb-2">
                    {isExempt 
                      ? `Your annual revenue (${formatNaira(totalIncome)}) is below ₦100M threshold. You are EXEMPT from Companies Income Tax, Capital Gains Tax, and Development Levy!`
                      : `Your annual revenue (${formatNaira(totalIncome)}) exceeds ₦100M. Standard tax rates apply.`
                    }
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-3">
                    <div className="bg-white rounded p-2">
                      <p className="text-xs text-gray-600">VAT Recoverable</p>
                      <p className="font-bold text-green-600">{formatNaira(vatRecoverable)}</p>
                    </div>
                    <div className="bg-white rounded p-2">
                      <p className="text-xs text-gray-600">Development Levy (4%)</p>
                      <p className="font-bold">{isExempt ? '₦0 (Exempt)' : formatNaira(netProfit * 0.04)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Pie Chart */}
              <div className="bg-white rounded-lg shadow p-4">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <PieIcon size={20} className="text-green-600" />
                  Expenses by Category
                </h3>
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

              {/* Bar Chart */}
              <div className="bg-white rounded-lg shadow p-4">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <BarChart3 size={20} className="text-green-600" />
                  Monthly Income vs Expenses
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={barData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatNaira(value)} />
                    <Legend />
                    <Bar dataKey="income" fill="#25D366" name="Income" />
                    <Bar dataKey="expenses" fill="#FF6B6B" name="Expenses" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={generatePDF}
                className="flex-1 bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700 transition flex items-center justify-center gap-2"
              >
                <Download size={20} />
                Download NRS Report (PDF)
              </button>
            </div>
          </div>
        )}

        {/* Records Tab */}
        {activeTab === 'records' && (
          <div className="p-4">
            <div className="bg-white rounded-lg shadow">
              <div className="p-4 border-b">
                <h2 className="text-xl font-bold">All Tax Records</h2>
                <p className="text-sm text-gray-500">Manage your income and expense records</p>
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
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">VAT Status</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Ref</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {records.map((record) => (
                      <tr key={record.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {new Date(record.date).toLocaleDateString('en-NG')}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            record.type === 'income' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {record.type === 'income' ? '💰 Income' : '💸 Expense'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">{record.category}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{record.description}</td>
                        <td className="px-4 py-3 text-sm text-right font-medium">{formatNaira(record.amount)}</td>
                        <td className="px-4 py-3 text-sm text-center">
                          {record.vatExempt ? (
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                              0% (Exempt)
                            </span>
                          ) : (
                            <span className="text-gray-600 text-xs">
                              7.5% ({formatNaira(record.vatAmount)})
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-center text-gray-500">{record.ref}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {records.length === 0 && (
                <div className="p-12 text-center text-gray-500">
                  <FileText size={48} className="mx-auto mb-4 opacity-50" />
                  <p>No records yet. Start chatting in the WhatsApp tab!</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="bg-gray-800 text-white p-6 mt-8">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-sm mb-2">🇳🇬 Nigeria Revenue Service (NRS) Compliant - 2026 Tax Reform</p>
          <p className="text-xs text-gray-400">
            Powered by YCloud WhatsApp Business API | Built for Nigerian entrepreneurs, freelancers & small businesses
          </p>
          <p className="text-xs text-gray-400 mt-2">
            ✓ Small Business Exemption Tracking | ✓ VAT Recovery Calculator | ✓ Monthly Filing Ready
          </p>
        </div>
      </div>
    </div>
  );
}