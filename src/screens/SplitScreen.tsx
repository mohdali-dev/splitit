import { useEffect, useState } from 'react';
import { storage } from '../services/storage';
import { Expense, Settlement } from '../models/types';
import { CheckCircle2, AlertCircle, ArrowRight, MessageCircle, Share2, Loader2 } from 'lucide-react';
import { formatCurrency, getCurrencySymbol } from '../lib/currency';
import { motion, AnimatePresence } from 'motion/react';
import IndividualBalance from '../components/IndividualBalance';
import SettleUpModal from '../components/SettleUpModal';
import SettlementHistory from '../components/SettlementHistory';

// Off-screen canvas generator to render a premium, warm cream paper receipt card
const generateReceiptBlob = async (
  groupName: string,
  total: number,
  perPerson: number,
  transactions: { from: string; to: string; amount: number }[]
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const baseHeight = 340;
    const rowHeight = 44;
    const footerHeight = 80;
    const contentHeight = baseHeight + (transactions.length > 0 ? transactions.length * rowHeight : 60) + footerHeight;
    const width = 460;
    
    // Scale for crisp high-end display rendering
    const scale = 2;
    const canvas = document.createElement('canvas');
    canvas.width = width * scale;
    canvas.height = contentHeight * scale;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      reject(new Error('Canvas rendering context 2D not supported'));
      return;
    }
    
    ctx.scale(scale, scale);
    ctx.imageSmoothingEnabled = true;

    // Real active theme options for dark-mode adaptation if needed, but receipt remains clean cream
    const isDarkTheme = document.documentElement.classList.contains('dark');

    // Read the exact dynamic theme colors configured for the group/app in real-time
    const rootStyle = getComputedStyle(document.documentElement);
    const primaryColor = rootStyle.getPropertyValue('--app-primary').trim() || '#4A5D4E';
    const accentColor = rootStyle.getPropertyValue('--app-accent').trim() || '#BC6C25';

    // Premium high-end solid paint colors matching Natural Tones
    const colors = {
      bg: isDarkTheme ? '#1A1A18' : '#FAF8F5',       // Warm cream background
      paper: isDarkTheme ? '#242421' : '#FFFFFF',    // Pristine high-contrast paper card
      textDark: isDarkTheme ? '#FAF8F5' : '#2C2B29', // Premium deep charcoal gray
      textMuted: isDarkTheme ? '#A3A196' : '#73706B',// Balanced silt gray for subtitles
      primary: primaryColor,                         // Original dynamic primary "it" color from active style
      accent: accentColor,                           // Original dynamic accent "." color from active style
      border: isDarkTheme ? '#3D3D3A' : '#EBE8DF',   // Ultra light divider outline
      lineDash: isDarkTheme ? '#4A4A46' : '#D9C5B2'  // Silt gray line-dash separator
    };

    // Fill canvas background
    ctx.fillStyle = colors.bg;
    ctx.fillRect(0, 0, width, contentHeight);

    // Draw receipt block card
    const margin = 20;
    const rWidth = width - margin * 2;
    const rHeight = contentHeight - margin * 2;
    const rx = margin;
    const ry = margin;
    const radius = 24;

    ctx.save();
    ctx.shadowColor = isDarkTheme ? 'rgba(0, 0, 0, 0.35)' : 'rgba(44, 43, 41, 0.04)';
    ctx.shadowBlur = 14;
    ctx.shadowOffsetY = 8;
    
    ctx.fillStyle = colors.paper;
    ctx.beginPath();
    if (typeof (ctx as any).roundRect === 'function') {
      (ctx as any).roundRect(rx, ry, rWidth, rHeight, radius);
    } else {
      ctx.moveTo(rx + radius, ry);
      ctx.lineTo(rx + rWidth - radius, ry);
      ctx.quadraticCurveTo(rx + rWidth, ry, rx + rWidth, ry + radius);
      ctx.lineTo(rx + rWidth, ry + rHeight - radius);
      ctx.quadraticCurveTo(rx + rWidth, ry + rHeight, rx + rWidth - radius, ry + rHeight);
      ctx.lineTo(rx + radius, ry + rHeight);
      ctx.quadraticCurveTo(rx, ry + rHeight, rx, ry + rHeight - radius);
      ctx.lineTo(rx, ry + radius);
      ctx.quadraticCurveTo(rx, ry, rx + radius, ry);
      ctx.closePath();
    }
    ctx.fill();
    ctx.restore();

    // Soft elegant card border stroke
    ctx.lineWidth = 1;
    ctx.strokeStyle = colors.border;
    ctx.stroke();

    // Custom helper to draw beautifully tracked-out / letter-spaced text
    const drawLetterSpaced = (text: string, x: number, y: number, spacing: number) => {
      let totalWidth = 0;
      for (let i = 0; i < text.length; i++) {
        totalWidth += ctx.measureText(text[i]).width + (i < text.length - 1 ? spacing : 0);
      }
      
      let currentX = x - totalWidth / 2;
      for (let i = 0; i < text.length; i++) {
        ctx.fillText(text[i], currentX, y);
        currentX += ctx.measureText(text[i]).width + spacing;
      }
    };

    // Original Brand Logo: Splitit. (Capital S, italic bold sans-serif, matching the app's real logo header exactly)
    ctx.font = 'italic bold 28px sans-serif';
    const splitWidth = ctx.measureText('Split').width;
    const itWidth = ctx.measureText('it').width;
    const dotWidth = ctx.measureText('.').width;
    const totalLogoWidth = splitWidth + itWidth + dotWidth;
    
    const startX = (width - totalLogoWidth) / 2;
    const logoY = ry + 42;
    
    ctx.textAlign = 'left';
    ctx.fillStyle = colors.textDark;
    ctx.fillText('Split', startX, logoY);
    
    ctx.fillStyle = colors.primary;
    ctx.fillText('it', startX + splitWidth, logoY);
    
    ctx.fillStyle = colors.accent;
    ctx.fillText('.', startX + splitWidth + itWidth, logoY);

    // Exact Motto: "The way to share expenses" (small, tracked-out, dark grey font)
    ctx.font = '500 10.5px sans-serif';
    ctx.fillStyle = colors.textMuted;
    drawLetterSpaced('THE WAY TO SHARE EXPENSES', width / 2, ry + 62, 1.8);

    // Active space name & date beneath the branding
    ctx.textAlign = 'center';
    ctx.font = '600 13px sans-serif';
    ctx.fillStyle = colors.textDark;
    ctx.fillText(groupName, width / 2, ry + 96);

    const today = new Date();
    const formattedDate = today.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).toUpperCase();
    ctx.font = '500 9.5px monospace';
    ctx.fillStyle = colors.textMuted;
    ctx.fillText(formattedDate, width / 2, ry + 114);

    // Distinct Total Group Expense block section highlighting total amount clearly
    const blockY = ry + 134;
    const blockHeight = 90;
    ctx.fillStyle = isDarkTheme ? '#2D2D29' : '#FAF8F5';
    ctx.beginPath();
    if (typeof (ctx as any).roundRect === 'function') {
      (ctx as any).roundRect(rx + 24, blockY, rWidth - 48, blockHeight, 14);
    } else {
      ctx.rect(rx + 24, blockY, rWidth - 48, blockHeight);
    }
    ctx.fill();

    ctx.font = 'bold 8.5px monospace';
    ctx.fillStyle = colors.textMuted;
    ctx.fillText('TOTAL GROUP EXPENSE', width / 2, blockY + 28);

    ctx.font = 'bold 30px sans-serif';
    ctx.fillStyle = colors.textDark;
    ctx.fillText(formatCurrency(total, true), width / 2, blockY + 64);

    // Per Person Share value
    ctx.font = '500 11.5px sans-serif';
    ctx.fillStyle = colors.textMuted;
    ctx.fillText(`Per Person share: ${formatCurrency(perPerson, true)}`, width / 2, blockY + blockHeight + 22);

    // Divider line before settlement items
    ctx.save();
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = colors.lineDash;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(rx + 24, blockY + blockHeight + 42);
    ctx.lineTo(rx + rWidth - 24, blockY + blockHeight + 42);
    ctx.stroke();
    ctx.restore();

    // Settlement instructions header
    const directiveY = blockY + blockHeight + 66;
    ctx.font = 'bold 8.5px monospace';
    ctx.fillStyle = colors.textMuted;
    ctx.fillText('SETTLEMENT DIRECTIVES', width / 2, directiveY);

    // Render individual rows with clean dot-leaders
    let currentY = directiveY + 34;
    
    if (transactions.length === 0) {
      ctx.font = 'italic 12.5px sans-serif';
      ctx.fillStyle = colors.textMuted;
      ctx.fillText('Everyone is perfectly settled up!', width / 2, currentY + 12);
    } else {
      transactions.forEach((t) => {
        const leftX = rx + 24;
        const rightX = rx + rWidth - 24;
        
        ctx.textAlign = 'left';
        
        ctx.font = '600 13px sans-serif';
        ctx.fillStyle = colors.textDark;
        const mainText = `${t.from} ➔ ${t.to}`;
        ctx.fillText(mainText, leftX, currentY);
        const textWidth = ctx.measureText(mainText).width;

        // Draw amount aligned on the right
        ctx.textAlign = 'right';
        ctx.font = 'bold 13px sans-serif';
        ctx.fillStyle = colors.textDark;
        const amountText = formatCurrency(t.amount, true);
        ctx.fillText(amountText, rightX, currentY);
        const amountWidth = ctx.measureText(amountText).width;

        // Precise Dot Leaders dynamically sized
        ctx.save();
        ctx.setLineDash([1.5, 4.5]);
        ctx.strokeStyle = colors.lineDash;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(leftX + textWidth + 8, currentY - 3.5);
        ctx.lineTo(rightX - amountWidth - 8, currentY - 3.5);
        ctx.stroke();
        ctx.restore();

        currentY += rowHeight;
      });
    }

    // Single subtle border divider line above footing tagline
    const footerY = contentHeight - margin - 45;
    ctx.save();
    ctx.strokeStyle = colors.border;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(rx + 24, footerY);
    ctx.lineTo(rx + rWidth - 24, footerY);
    ctx.stroke();
    ctx.restore();

    // Pristine clean footer metadata tagline with zero barcodes
    ctx.font = '500 9px monospace';
    ctx.fillStyle = colors.textMuted;
    ctx.textAlign = 'center';
    ctx.fillText('Locally computed. Zero-cloud privacy.', width / 2, footerY + 22);

    // Export output as a high-quality JPEG
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error('toBlob returned null for JPEG image'));
      }
    }, 'image/jpeg', 0.95);
  });
};

export default function SplitScreen({ refreshTrigger }: { refreshTrigger: number }) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [roommates, setRoommates] = useState<string[]>([]);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [localTrigger, setLocalTrigger] = useState(0);
  const [newSettleModalOpen, setNewSettleModalOpen] = useState(false);
  const [newSettleParams, setNewSettleParams] = useState<{ debtorId: string; creditorId: string; amount: number }>({
    debtorId: '',
    creditorId: '',
    amount: 0
  });
  const [activeTab, setActiveTab] = useState<'settle' | 'balances' | 'history'>('settle');
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => {
        setToastMessage(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  useEffect(() => {
    setExpenses(storage.getExpenses());
    setRoommates(storage.getRoommates());
    setSettlements(storage.getSettlements());
  }, [refreshTrigger, localTrigger]);

  const total = expenses.reduce((sum, e) => sum + e.amount, 0);
  const perPerson = roommates.length > 0 ? Math.round(total / roommates.length) : 0;

  const balances = roommates.map(person => {
    let paid = 0;
    let owed = 0;

    expenses.forEach(e => {
      if (e.paidBy === person) paid += e.amount;
      const participants = e.participants && e.participants.length > 0 ? e.participants : roommates;
      if (participants.includes(person)) {
        owed += e.amount / participants.length;
      }
    });
    
    let settlementAdjustments = 0;
    if (total > 0) {
      settlements.forEach(s => {
        if (s.from === person) settlementAdjustments += s.amount;
        if (s.to === person) settlementAdjustments -= s.amount;
      });
    }

    const balance = total > 0 ? Math.round(paid - owed + settlementAdjustments) : 0;
    return { person, paid: Math.round(paid), balance };
  });

  // Calculate who owes whom
  const transactions: { from: string; to: string; amount: number }[] = [];
  const creditors = balances.filter(b => b.balance > 0).map(b => ({ ...b }));
  const debtors = balances.filter(b => b.balance < 0).map(b => ({ person: b.person, owe: -b.balance }));

  let i = 0;
  let j = 0;

  while (i < creditors.length && j < debtors.length) {
    const creditor = creditors[i];
    const debtor = debtors[j];
    
    const amount = Math.min(creditor.balance, debtor.owe);
    
    if (amount > 0) {
      transactions.push({
        from: debtor.person,
        to: creditor.person,
        amount: amount
      });
    }
    
    creditor.balance -= amount;
    debtor.owe -= amount;
    
    if (creditor.balance <= 0) i++;
    if (debtor.owe <= 0) j++;
  }

  const hasGhostData = transactions.some(t => t.amount > total + 5) || (total === 0 && settlements.length > 0);

  useEffect(() => {
    if (hasGhostData) {
      storage.clearSettlements();
      setSettlements([]);
    }
  }, [hasGhostData]);

  const generateShareMessage = () => {
    const group = storage.getActiveGroup();
    const groupName = group ? group.name : 'My Group';
    
    let msg = `==========================\n`;
    msg += `📊  *Splitit.*  ::  _${groupName}_\n`;
    msg += `==========================\n\n`;
    msg += `💰 *Total Expense:*  ${formatCurrency(total, true)}\n`;
    msg += `👥 *Per Person share:*  ${formatCurrency(perPerson, true)}\n\n`;
    msg += `✨ *Settlement Summary:*\n`;
    
    transactions.forEach(t => {
      msg += `• *${t.from}* pays *${t.to}* ➔ *${formatCurrency(t.amount, true)}*\n`;
    });
    
    msg += `\n📱 _Settled easily via Splitit._`;
    return msg;
  };

  const handleCreateAndShareReceipt = async () => {
    setIsGenerating(true);
    try {
      const group = storage.getActiveGroup();
      const groupName = group ? group.name : 'My Space';
      
      const blob = await generateReceiptBlob(groupName, total, perPerson, transactions);
      const fileName = `splitit-${groupName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-receipt.jpg`;
      const file = new File([blob], fileName, { type: 'image/jpeg' });

      const textDesc = `🏠 Splitit. receipt for "${groupName}"\n💰 Total: ${formatCurrency(total, true)}\n👥 Per Person: ${formatCurrency(perPerson, true)}\n\nSee the beautiful receipt card attached!`;

      // 1. Try Native Web Share API first
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: `Splitit. - ${groupName}`,
            text: textDesc
          });
          setToastMessage('Receipt shared successfully!');
          setIsGenerating(false);
          return;
        } catch (err) {
          if ((err as Error).name === 'AbortError') {
            setIsGenerating(false);
            return;
          }
        }
      }

      // 2. Fallback Mechanism (Direct Download & clipboard COPY + WhatsApp fallback)
      // Save Receipt Image
      const imageUrl = URL.createObjectURL(blob);
      const downloadLink = document.createElement('a');
      downloadLink.href = imageUrl;
      downloadLink.download = fileName;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      URL.revokeObjectURL(imageUrl);

      // Copy text statement to user keyboard clipboard
      const textMsg = generateShareMessage();
      try {
        await navigator.clipboard.writeText(textMsg);
        setToastMessage('Saved receipt image & copied details!');
      } catch {
        setToastMessage('Saved receipt image to device!');
      }

      // Redirect to WhatsApp Web/App as secondary helpers
      setTimeout(() => {
        window.open(`https://wa.me/?text=${encodeURIComponent(textMsg)}`, '_blank');
      }, 1500);

    } catch (err) {
      console.error('Error generating receipt summary:', err);
      setToastMessage('Error building receipt card.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleShareIndividualToWhatsApp = (payer: string, recipient: string, amount: number) => {
    const message = `Hey ${payer}, you owe ${recipient} ${formatCurrency(amount, true)} in our Splitit. group. Please settle up when you can!`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <div className="p-4 flex flex-col gap-5 pb-20">
      <h2 className="font-serif text-2xl italic text-app-primary px-1">Split Summary</h2>

      <div className="bg-app-primary rounded-[32px] p-8 text-app-text-inv shadow-md flex justify-between items-center relative overflow-hidden transition-colors">
        <div className="absolute top-0 left-0 w-32 h-32 bg-white/5 rounded-full -translate-x-1/2 -translate-y-1/2"></div>
        <div className="relative z-10">
           <p className="text-[10px] tracking-widest uppercase text-app-border font-bold">Total Expense</p>
           <p className="text-3xl font-serif text-app-text-inv mt-1">{formatCurrency(total)}</p>
        </div>
        <div className="relative z-10 text-right">
           <p className="text-[10px] tracking-widest uppercase text-app-border font-bold">Per Person</p>
           <p className="text-2xl font-serif text-app-text-inv mt-1">{formatCurrency(perPerson)}</p>
        </div>
      </div>

      {/* Segmented Control / Tab Switcher */}
      <div className="flex p-1 bg-app-card rounded-full border border-app-border-light relative overflow-hidden shadow-xs">
        <button
          onClick={() => setActiveTab('settle')}
          className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-full transition-all duration-250 cursor-pointer ${
            activeTab === 'settle'
              ? 'bg-app-primary text-app-text-inv shadow-sm'
              : 'text-app-muted hover:text-app-text'
          }`}
        >
          Settle Up
        </button>
        <button
          onClick={() => setActiveTab('balances')}
          className={`flex-1 py-1 px-2 text-xs font-bold uppercase tracking-wider rounded-full transition-all duration-250 cursor-pointer ${
            activeTab === 'balances'
              ? 'bg-app-primary text-app-text-inv shadow-sm'
              : 'text-app-muted hover:text-app-text'
          }`}
        >
          Balances
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-full transition-all duration-250 cursor-pointer ${
            activeTab === 'history'
              ? 'bg-app-primary text-app-text-inv shadow-sm'
              : 'text-app-muted hover:text-app-text'
          }`}
        >
          History
        </button>
      </div>

      {/* Tab Contents */}
      <div className="flex flex-col gap-2 min-h-[150px]">
        {activeTab === 'settle' && (
          <div className="flex flex-col gap-3">
            {transactions.length > 0 ? (
              <div className="bg-app-card rounded-[24px] shadow-sm border border-app-border-light overflow-hidden transition-colors">
                {transactions.map((t, idx) => (
                  <div key={idx} className="flex flex-col p-5 border-b border-app-border-light last:border-0 hover:bg-app-hover transition-colors gap-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-app-text">{t.from}</span>
                        <ArrowRight size={16} className="text-app-muted" />
                        <span className="font-bold text-app-primary">{t.to}</span>
                      </div>
                      <div className="font-bold text-app-accent text-lg">
                        {formatCurrency(t.amount)}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => {
                          setNewSettleParams({ debtorId: t.from, creditorId: t.to, amount: t.amount });
                          setNewSettleModalOpen(true);
                        }}
                        className="flex-1 py-2.5 bg-app-panel text-app-primary font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-app-border hover:text-white transition-colors cursor-pointer">
                        Settle Up
                      </button>
                      <button 
                        onClick={() => handleShareIndividualToWhatsApp(t.from, t.to, t.amount)}
                        className="w-10 h-10 bg-app-panel text-app-primary rounded-xl flex items-center justify-center hover:bg-app-border hover:text-white transition-colors cursor-pointer"
                        title="Send WhatsApp Reminder"
                      >
                        <MessageCircle size={18} />
                      </button>
                    </div>
                  </div>
                ))}
                
                <div className="p-4 bg-app-card">
                  <button 
                    onClick={handleCreateAndShareReceipt}
                    disabled={isGenerating}
                    className="w-full py-3.5 bg-app-panel text-app-primary font-bold text-sm uppercase tracking-wider rounded-xl hover:bg-app-border hover:text-white transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="animate-spin" size={18} />
                        Generating Receipt...
                      </>
                    ) : (
                      <>
                        <Share2 size={18} />
                        Share Split Receipt
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-10 px-6 bg-app-card rounded-[24px] border border-app-border-light text-app-muted flex flex-col items-center gap-3 select-none">
                <CheckCircle2 size={40} className="text-emerald-500" />
                <div className="flex flex-col">
                  <span className="font-bold text-sm text-app-text">Everyone is Settled Up!</span>
                  <p className="text-[11px] text-app-muted/80 mt-1 max-w-[200px] leading-relaxed">No outstanding balances or payments left in this space.</p>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'balances' && (
          <IndividualBalance
            refreshTrigger={refreshTrigger + localTrigger}
            onSettleCompleted={() => setLocalTrigger(prev => prev + 1)}
          />
        )}

        {activeTab === 'history' && (
          <SettlementHistory
            refreshTrigger={refreshTrigger + localTrigger}
            onHistoryCleared={() => setLocalTrigger(prev => prev + 1)}
          />
        )}
      </div>

      <SettleUpModal
        isOpen={newSettleModalOpen}
        onClose={() => setNewSettleModalOpen(false)}
        debtorId={newSettleParams.debtorId}
        creditorId={newSettleParams.creditorId}
        amount={newSettleParams.amount}
        onSettleCompleted={() => setLocalTrigger(prev => prev + 1)}
      />

      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 15, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 15, x: '-50%' }}
            className="fixed bottom-24 left-1/2 bg-app-primary text-app-text-inv px-5 py-3 rounded-2xl shadow-xl z-[100] text-center text-xs font-bold uppercase tracking-wider flex items-center gap-2 whitespace-nowrap border border-white/10"
          >
            <CheckCircle2 size={15} className="text-emerald-400" />
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
