import React, { useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { QrCode, Download, Printer, Settings, RefreshCw, CheckCircle } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import logoIcon from '../../assets/logo2.png';
import logoFull from '../../assets/bombay-logo-2.png';

export default function QrGenerator() {
  const { token } = useAuth();
  const { addToast } = useToast();

  const [qrTarget, setQrTarget] = useState('menu'); // 'home' or 'menu'
  const [headerType, setHeaderType] = useState('logo'); // 'logo' or 'text'
  const [accentColor, setAccentColor] = useState('#691F1A'); // Bombay Chowpati Maroon
  const [logoOption, setLogoOption] = useState(true);
  const [customText, setCustomText] = useState('Scan to Order Fresh Chat');
  const [posterSize, setPosterSize] = useState('A6'); // 'A6', 'sticker'

  const printAreaRef = useRef(null);

  // Generate the target URL
  const siteUrl = window.location.origin;
  const targetUrl = qrTarget === 'menu'
    ? `${siteUrl}/menu`
    : `${siteUrl}`;

  // QR Code image source URL (using goqr.me API for clean high-res output)
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=${encodeURIComponent(targetUrl)}&margin=1`;

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    
    const siteUrl = window.location.origin;
    const absoluteLogoIcon = siteUrl + logoIcon;
    const absoluteLogoFull = siteUrl + logoFull;
    
    const headerHtml = headerType === 'logo' 
      ? `<img src="${absoluteLogoFull}" class="logo-header" />`
      : `<div class="brand-name">Bombay Chowpati</div><div class="brand-sub">Chat Bhandar</div>`;

    const centerLogoHtml = logoOption 
      ? `<div class="logo-overlay"><img src="${absoluteLogoIcon}" style="width: 100%; height: 100%; object-fit: contain; border-radius: 50%;" /></div>` 
      : '';

    printWindow.document.write(`
      <html>
        <head>
          <title>${qrTarget === 'menu' ? 'Online Menu' : 'Website Home'} QR Poster</title>
          <style>
            @media print {
              body { margin: 0; padding: 0; background: #fff; }
              @page { margin: 0; }
            }
            body {
              font-family: 'Outfit', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100vh;
              background-color: #fff;
              margin: 0;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .poster-card {
              width: ${posterSize === 'A6' ? '105mm' : '80mm'};
              height: ${posterSize === 'A6' ? '148mm' : '80mm'};
              border: ${posterSize === 'A6' ? '8px' : '4px'} double ${accentColor};
              border-radius: 20px;
              padding: ${posterSize === 'A6' ? '20px' : '10px'};
              box-sizing: border-box;
              text-align: center;
              display: flex;
              flex-direction: column;
              justify-content: space-between;
              align-items: center;
              background: #FFFDF9 !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .logo-header {
              height: ${posterSize === 'A6' ? '48px' : '32px'};
              width: auto;
              object-fit: contain;
              margin: ${posterSize === 'A6' ? '5px 0 10px 0' : '2px 0 4px 0'};
            }
            .brand-name {
              font-size: ${posterSize === 'A6' ? '24px' : '15px'};
              font-weight: 900;
              color: #1a0a09;
              margin: ${posterSize === 'A6' ? '5px 0 2px 0' : '2px 0 0 0'};
              text-transform: uppercase;
              letter-spacing: 1px;
              line-height: 1.1;
            }
            .brand-sub {
              font-size: ${posterSize === 'A6' ? '12px' : '9px'};
              font-weight: 800;
              color: ${accentColor};
              margin: 0 0 ${posterSize === 'A6' ? '10px 0' : '4px 0'};
              text-transform: uppercase;
              letter-spacing: 2px;
            }
            .qr-wrapper {
              position: relative;
              background: #fff;
              border: ${posterSize === 'A6' ? '3px' : '2px'} solid ${accentColor};
              border-radius: 12px;
              padding: ${posterSize === 'A6' ? '10px' : '6px'};
              box-shadow: 0 4px 10px rgba(0,0,0,0.05);
            }
            .qr-img {
              width: ${posterSize === 'A6' ? '265px' : '160px'};
              height: ${posterSize === 'A6' ? '265px' : '160px'};
              display: block;
            }
            .logo-overlay {
              position: absolute;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%);
              width: ${posterSize === 'A6' ? '44px' : '30px'};
              height: ${posterSize === 'A6' ? '44px' : '30px'};
              background: white;
              border: 2px solid ${accentColor};
              border-radius: 50%;
              padding: 3px;
              box-sizing: border-box;
            }
            .instructions {
              font-size: ${posterSize === 'A6' ? '11px' : '9px'};
              font-weight: 800;
              color: #333;
              margin: ${posterSize === 'A6' ? '10px 0 5px 0' : '4px 0 2px 0'};
              line-height: 1.1;
              text-transform: uppercase;
              letter-spacing: 1px;
            }
            .badge-btn {
              background: ${accentColor};
              color: white;
              font-size: ${posterSize === 'A6' ? '10px' : '8px'};
              font-weight: 900;
              padding: ${posterSize === 'A6' ? '6px 18px' : '4px 12px'};
              border-radius: 50px;
              margin-top: ${posterSize === 'A6' ? '5px' : '2px'};
              text-transform: uppercase;
              letter-spacing: 2px;
              display: inline-block;
            }
          </style>
        </head>
        <body>
          <div class="poster-card">
            ${headerHtml}
            <div class="qr-wrapper">
              <img src="${qrCodeUrl}" class="qr-img" />
              ${centerLogoHtml}
            </div>
            <div class="instructions-wrapper">
              <div class="instructions">${customText}</div>
              <div class="badge-btn">${qrTarget === 'menu' ? 'Online Menu' : 'Website Home'}</div>
            </div>
          </div>
          <script>
            window.onload = function() {
              setTimeout(() => {
                window.print();
                window.close();
              }, 400);
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
    addToast('Print window opened.', 'success');
  };

  const handleDownload = () => {
    addToast('Assembling branded poster...', 'info');

    // Create a high-res canvas (scaled 2x for printing quality)
    const scale = 2;
    const canvas = document.createElement('canvas');
    const width = (posterSize === 'A6' ? 396 : 302) * scale;
    const height = (posterSize === 'A6' ? 559 : 302) * scale;
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');

    // Helper to load image asynchronously
    const loadImage = (src) => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        let targetSrc = src;
        if (!src.startsWith('http') && !src.startsWith('data:')) {
          targetSrc = window.location.origin + src;
        } else {
          img.crossOrigin = 'anonymous';
        }
        img.src = targetSrc;
        img.onload = () => resolve(img);
        img.onerror = (e) => reject(e);
      });
    };

    // Draw card background
    ctx.fillStyle = '#FFFDF9';
    ctx.fillRect(0, 0, width, height);

    // Draw double border
    const borderPadding = 12 * scale;
    const borderOffset = 4 * scale;
    ctx.strokeStyle = accentColor;
    
    // Outer border
    ctx.lineWidth = (posterSize === 'A6' ? 8 : 4) * scale;
    ctx.strokeRect(borderPadding, borderPadding, width - borderPadding * 2, height - borderPadding * 2);
    // Inner border
    ctx.lineWidth = (posterSize === 'A6' ? 3 : 2) * scale;
    ctx.strokeRect(
      borderPadding + borderOffset, 
      borderPadding + borderOffset, 
      width - (borderPadding + borderOffset) * 2, 
      height - (borderPadding + borderOffset) * 2
    );

    const loadAllAssetsAndDraw = async () => {
      try {
        // Draw Header Branding
        if (headerType === 'logo') {
          try {
            const logoImg = await loadImage(logoFull);
            const logoH = (posterSize === 'A6' ? 48 : 32) * scale;
            const logoW = logoImg.width * (logoH / logoImg.height);
            ctx.drawImage(logoImg, (width - logoW) / 2, borderPadding + 20 * scale, logoW, logoH);
          } catch (e) {
            // Fallback to text if logo fails to load
            ctx.fillStyle = '#1a0a09';
            ctx.font = `black ${posterSize === 'A6' ? 24 : 15}px Georgia, serif`;
            ctx.textAlign = 'center';
            ctx.fillText('BOMBAY CHOWPATI', width / 2, borderPadding + 40 * scale);
          }
        } else {
          ctx.fillStyle = '#1a0a09';
          ctx.textAlign = 'center';
          ctx.font = `900 ${24 * scale}px Outfit, sans-serif`;
          ctx.fillText('BOMBAY CHOWPATI', width / 2, borderPadding + 36 * scale);

          ctx.fillStyle = accentColor;
          ctx.font = `800 ${11 * scale}px Outfit, sans-serif`;
          ctx.fillText('CHAT BHANDAR', width / 2, borderPadding + 52 * scale);
        }

        // Draw QR Code
        const qrSize = (posterSize === 'A6' ? 265 : 160) * scale;
        const qrX = (width - qrSize) / 2;
        const qrY = (height - qrSize) / 2 - (posterSize === 'A6' ? 10 * scale : 5 * scale);
        
        const qrImg = await loadImage(qrCodeUrl);
        
        // Draw QR Wrapper box
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = 'rgba(0,0,0,0.05)';
        ctx.shadowBlur = 8 * scale;
        ctx.fillRect(qrX - 8 * scale, qrY - 8 * scale, qrSize + 16 * scale, qrSize + 16 * scale);
        ctx.shadowBlur = 0; // reset shadow
        
        ctx.strokeStyle = accentColor;
        ctx.lineWidth = (posterSize === 'A6' ? 3 : 2) * scale;
        ctx.strokeRect(qrX - 8 * scale, qrY - 8 * scale, qrSize + 16 * scale, qrSize + 16 * scale);

        // Draw QR Code image
        ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);

        // Draw QR Center logo icon
        if (logoOption) {
          try {
            const centerLogo = await loadImage(logoIcon);
            const logoSize = (posterSize === 'A6' ? 44 : 30) * scale;
            const logoX = qrX + (qrSize - logoSize) / 2;
            const logoY = qrY + (qrSize - logoSize) / 2;

            // Draw white circle wrapper
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(logoX + logoSize / 2, logoY + logoSize / 2, logoSize / 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.lineWidth = 1.5 * scale;
            ctx.strokeStyle = accentColor;
            ctx.stroke();

            // Draw center logo
            ctx.drawImage(centerLogo, logoX + 3 * scale, logoY + 3 * scale, logoSize - 6 * scale, logoSize - 6 * scale);
          } catch (e) {
            console.warn('Center logo omitted due to load error');
          }
        }

        // Draw Footer Custom text
        ctx.fillStyle = '#333333';
        ctx.textAlign = 'center';
        ctx.font = `800 ${11 * scale}px Outfit, sans-serif`;
        const textY = height - borderPadding - (posterSize === 'A6' ? 55 * scale : 40 * scale);
        ctx.fillText(customText.toUpperCase(), width / 2, textY);

        // Draw Footer Badge Target Label
        const badgeText = qrTarget === 'menu' ? 'ONLINE MENU' : 'WEBSITE HOME';
        ctx.font = `900 ${10 * scale}px Outfit, sans-serif`;
        const textWidth = ctx.measureText(badgeText).width;
        
        const badgeW = textWidth + 24 * scale;
        const badgeH = 24 * scale;
        const badgeX = (width - badgeW) / 2;
        const badgeY = height - borderPadding - (posterSize === 'A6' ? 40 * scale : 26 * scale);

        ctx.fillStyle = accentColor;
        // Rounded rectangle path for badge
        const r = badgeH / 2;
        ctx.beginPath();
        ctx.moveTo(badgeX + r, badgeY);
        ctx.lineTo(badgeX + badgeW - r, badgeY);
        ctx.quadraticCurveTo(badgeX + badgeW, badgeY, badgeX + badgeW, badgeY + r);
        ctx.lineTo(badgeX + badgeW, badgeY + badgeH - r);
        ctx.quadraticCurveTo(badgeX + badgeW, badgeY + badgeH, badgeX + badgeW - r, badgeY + badgeH);
        ctx.lineTo(badgeX + r, badgeY + badgeH);
        ctx.quadraticCurveTo(badgeX, badgeY + badgeH, badgeX, badgeY + badgeH - r);
        ctx.lineTo(badgeX, badgeY + r);
        ctx.quadraticCurveTo(badgeX, badgeY, badgeX + r, badgeY);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.fillText(badgeText, width / 2, badgeY + 16 * scale);

        // Export and Trigger download
        const dataUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = `BombayChowpati-${qrTarget === 'menu' ? 'Menu' : 'Home'}-${posterSize}-Poster.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        addToast('Branded poster downloaded successfully!', 'success');
      } catch (err) {
        console.error(err);
        addToast('Failed to assemble poster image asset.', 'error');
      }
    };

    loadAllAssetsAndDraw();
  };

  return (
    <div className="space-y-6 sm:space-y-8 pb-12">
      <PageHeader 
        title="QR Code Generator" 
        description="Design, preview, and print branded QR tables card flyers for guest ordering."
        icon={QrCode}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Design Controls (5 Cols) */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-gray-150 p-6 space-y-6 shadow-xs">
          <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
            <Settings className="w-5 h-5 text-gray-500" />
            <h3 className="font-serif font-black text-base text-gray-900">Customizer</h3>
          </div>

          <div className="space-y-4 text-xs font-semibold text-gray-700">
            {/* Destination Selector */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-black uppercase text-gray-400 tracking-wider">
                Scan Target Destination
              </label>
              <select
                value={qrTarget}
                onChange={(e) => setQrTarget(e.target.value)}
                className="w-full bg-[#FFF9EE]/30 border border-gray-200 rounded-xl px-4 py-2.5 text-xs text-gray-800 focus:outline-none focus:border-[#F8A324] cursor-pointer"
              >
                <option value="menu">Online Menu Page (/menu)</option>
                <option value="home">Website Home Page (/)</option>
              </select>
            </div>

            {/* Banner Text */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-black uppercase text-gray-400 tracking-wider">
                Call-To-Action Text
              </label>
              <input
                type="text"
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                placeholder="e.g. Scan to Order Fresh Chaat"
                className="w-full bg-[#FFF9EE]/30 border border-gray-200 rounded-xl px-4 py-2.5 text-xs text-gray-800 focus:outline-none focus:border-[#F8A324]"
              />
            </div>

            {/* Poster Layout Size */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-black uppercase text-gray-400 tracking-wider">
                Poster Dimensions
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setPosterSize('A6')}
                  className={`py-2 px-3 rounded-xl border text-center transition-all cursor-pointer ${
                    posterSize === 'A6' 
                      ? 'border-[#691F1A] bg-[#691F1A]/5 text-[#691F1A] font-bold' 
                      : 'border-gray-250 bg-white hover:bg-gray-50'
                  }`}
                >
                  A6 Standing Poster
                </button>
                <button
                  onClick={() => setPosterSize('sticker')}
                  className={`py-2 px-3 rounded-xl border text-center transition-all cursor-pointer ${
                    posterSize === 'sticker' 
                      ? 'border-[#691F1A] bg-[#691F1A]/5 text-[#691F1A] font-bold' 
                      : 'border-gray-250 bg-white hover:bg-gray-50'
                  }`}
                >
                  Square Sticker Card
                </button>
              </div>
            </div>

            {/* Accent Theme Colors */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-black uppercase text-gray-400 tracking-wider">
                Theme Color
              </label>
              <div className="flex gap-2.5 items-center">
                <input
                  type="color"
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  className="w-10 h-10 rounded-lg cursor-pointer border border-gray-200"
                />
                <span className="font-mono text-gray-500 uppercase">{accentColor}</span>
              </div>
            </div>

            {/* Header Style Selector */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-black uppercase text-gray-400 tracking-wider">
                Header Branding Style
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setHeaderType('logo')}
                  className={`py-2 px-3 rounded-xl border text-center transition-all cursor-pointer ${
                    headerType === 'logo' 
                      ? 'border-[#691F1A] bg-[#691F1A]/5 text-[#691F1A] font-bold' 
                      : 'border-gray-250 bg-white hover:bg-gray-50'
                  }`}
                >
                  Brand Logo Banner
                </button>
                <button
                  onClick={() => setHeaderType('text')}
                  className={`py-2 px-3 rounded-xl border text-center transition-all cursor-pointer ${
                    headerType === 'text' 
                      ? 'border-[#691F1A] bg-[#691F1A]/5 text-[#691F1A] font-bold' 
                      : 'border-gray-250 bg-white hover:bg-gray-50'
                  }`}
                >
                  Plain Typography
                </button>
              </div>
            </div>

            {/* Logo Overlay */}
            <div className="flex items-center justify-between py-2 border-t border-gray-50">
              <div>
                <label className="block text-[11px] font-black uppercase text-gray-400 tracking-wider">
                  Brand Logo Overlay
                </label>
                <span className="text-[10px] text-gray-400 block font-normal mt-0.5">Embed logo in the center of the QR Code</span>
              </div>
              <input
                type="checkbox"
                checked={logoOption}
                onChange={(e) => setLogoOption(e.target.checked)}
                className="w-4 h-4 text-[#F8A324] border-gray-300 rounded focus:ring-[#F8A324] cursor-pointer"
              />
            </div>

            {/* Print & Download Triggers */}
            <div className="grid grid-cols-2 gap-3 pt-4 border-t border-gray-100">
              <button
                onClick={handlePrint}
                className="flex items-center justify-center gap-2 bg-[#691F1A] hover:bg-[#551915] text-[#F8A324] font-black py-3 px-4 rounded-xl transition-all cursor-pointer shadow-md text-xs uppercase"
              >
                <Printer className="w-4 h-4" />
                <span>Print Poster</span>
              </button>
              <button
                onClick={handleDownload}
                className="flex items-center justify-center gap-2 bg-white border border-[#F8A324]/30 hover:bg-[#FFF9EE]/30 text-gray-700 font-extrabold py-3 px-4 rounded-xl transition-all cursor-pointer shadow-xs text-xs uppercase"
              >
                <Download className="w-4 h-4 text-[#F8A324]" />
                <span>Download PNG</span>
              </button>
            </div>

            {/* Scan URL Indicator */}
            <div className="bg-amber-50/50 border border-amber-200/50 p-3.5 rounded-2xl space-y-1">
              <span className="text-[10px] text-amber-700 font-bold uppercase tracking-wider block">Target Scan URL:</span>
              <code className="text-[10px] text-gray-700 break-all select-all font-mono font-medium block">
                {targetUrl}
              </code>
            </div>

          </div>
        </div>

        {/* Right Column: Preview Area (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col items-center justify-center space-y-4">
          <span className="text-[10px] font-extrabold text-[#691F1A] uppercase tracking-widest block">Live Print Preview</span>
          
          {/* Branded Poster Preview Card */}
          <div className="bg-white border border-gray-150 rounded-3xl p-8 shadow-xs flex items-center justify-center">
            <div ref={printAreaRef}>
              <div 
                className="bg-[#FFFDF9] flex flex-col justify-between items-center transition-all shadow-inner"
                style={{ 
                  width: posterSize === 'A6' ? '105mm' : '80mm', 
                  height: posterSize === 'A6' ? '148mm' : '80mm',
                  padding: posterSize === 'A6' ? '20px' : '10px',
                  borderColor: accentColor,
                  borderWidth: posterSize === 'A6' ? '8px' : '4px',
                  borderStyle: 'double',
                  borderRadius: '20px',
                  boxSizing: 'border-box'
                }}
              >
                {/* Header branding */}
                <div className="text-center w-full flex justify-center">
                  {headerType === 'logo' ? (
                    <img 
                      src={logoFull} 
                      alt="Bombay Chowpati Logo" 
                      style={{ 
                        height: posterSize === 'A6' ? '48px' : '32px',
                        width: 'auto',
                        objectFit: 'contain',
                        margin: posterSize === 'A6' ? '5px 0 10px 0' : '2px 0 4px 0'
                      }}
                    />
                  ) : (
                    <div className="text-center">
                      <div 
                        className="font-serif font-black text-gray-900 tracking-tight uppercase" 
                        style={{ 
                          fontSize: posterSize === 'A6' ? '24px' : '15px',
                          margin: posterSize === 'A6' ? '5px 0 2px 0' : '2px 0 0 0',
                          lineHeight: '1.1'
                        }}
                      >
                        Bombay Chowpati
                      </div>
                      <div 
                        className="font-black uppercase tracking-widest text-[9px] sm:text-xs" 
                        style={{ 
                          color: accentColor, 
                          fontSize: posterSize === 'A6' ? '12px' : '9px',
                          margin: posterSize === 'A6' ? '0 0 10px 0' : '0 0 4px 0',
                          letterSpacing: '2px'
                        }}
                      >
                        Chat Bhandar
                      </div>
                    </div>
                  )}
                </div>

                {/* QR Wrapper */}
                <div 
                  className="relative bg-white rounded-xl shadow-xs" 
                  style={{ 
                    border: `${posterSize === 'A6' ? '3px' : '2px'} solid ${accentColor}`,
                    padding: posterSize === 'A6' ? '10px' : '6px'
                  }}
                >
                  <img 
                    src={qrCodeUrl} 
                    alt="Scan Table QR Code" 
                    className="object-contain"
                    style={{ 
                      width: posterSize === 'A6' ? '265px' : '160px',
                      height: posterSize === 'A6' ? '265px' : '160px'
                    }}
                  />
                  {logoOption && (
                    <div 
                      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-full border-2 flex items-center justify-center" 
                      style={{ 
                        borderColor: accentColor,
                        padding: '3px',
                        width: posterSize === 'A6' ? '44px' : '30px',
                        height: posterSize === 'A6' ? '44px' : '30px'
                      }}
                    >
                      <img 
                        src={logoIcon} 
                        alt="Overlay Logo" 
                        style={{ 
                          width: '100%',
                          height: '100%'
                        }}
                        className="rounded-full object-contain"
                      />
                    </div>
                  )}
                </div>

                {/* Footer instructions */}
                <div className="text-center flex flex-col items-center">
                  <p 
                    className="font-extrabold text-gray-800 leading-tight uppercase tracking-wider" 
                    style={{ 
                      fontSize: posterSize === 'A6' ? '11px' : '9px',
                      margin: posterSize === 'A6' ? '10px 0 5px 0' : '4px 0 2px 0' 
                    }}
                  >
                    {customText}
                  </p>
                  <div 
                    className="text-white font-black rounded-full uppercase tracking-widest" 
                    style={{ 
                      backgroundColor: accentColor,
                      fontSize: posterSize === 'A6' ? '10px' : '8px',
                      padding: posterSize === 'A6' ? '6px 18px' : '4px 12px',
                      marginTop: posterSize === 'A6' ? '5px' : '2px'
                    }}
                  >
                    {qrTarget === 'menu' ? 'Online Menu' : 'Website Home'}
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
